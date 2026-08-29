const fs = require("fs");
const path = require("path");

// Loaded on demand: pdf.js is large and warns about optional native canvas
// polyfills it will never need here, so books in other formats should not pay
// for it
let pdfJs;

const load = () => {
	if(!pdfJs){
		pdfJs = require("pdfjs-dist/legacy/build/pdf.js");
		pdfJs.disableWorker = true;
	}

	return pdfJs;
};

module.exports = (filename) => {
	const book = {
		_book: undefined,
		_title: undefined,

		_init: () => {
			return new Promise((resolve, reject) => {
				fs.readFile(filename, function (err, data) {
					if(err){
						return reject(err);
					}

					// `isEvalSupported` is the documented mitigation for
					// CVE-2024-4367, arbitrary code execution from a crafted
					// font. Nothing here needs eval to pull text out
					load().getDocument({
						data: new Uint8Array(data),
						isEvalSupported: false
					}).promise.then(function (pdf) {
						book._book = pdf;

						return book._readTitle();
					}).then(function(){
						resolve(book);
					}).catch(reject);
				});
			});
		},

		_readTitle: () => {
			return book._book.getMetadata().then((metadata) => {
				const title = metadata.info && metadata.info.Title;

				if(typeof title === "string" && title.trim() !== ""){
					book._title = title.trim();
				}
			}).catch(() => {
				// A pdf without readable metadata still has a file name
			});
		},

		getTitle: () => {
			return book._title || filename;
		},

		getChapters: () => {
			return book._getBookmarks().then((bookmarks) => {
				if(bookmarks.length === 0){
					return book._wholeDocument();
				}

				return book._chaptersFromBookmarks(bookmarks);
			});
		},

		// Flattened outline entries, in page order, as {title, page}
		_getBookmarks: () => {
			return book._book.getOutline().then((outline) => {
				if(!outline || outline.length === 0){
					return [];
				}

				return Promise.all(book._flattenOutline(outline).map((item) => {
					return book._pageOf(item.dest).then((page) => {
						if(page === undefined){
							return undefined;
						}

						return {title: item.title, page: page};
					});
				}));
			}).then((bookmarks) => {
				return bookmarks
					.filter((bookmark) => bookmark !== undefined)
					.sort((a, b) => a.page - b.page);
			}).catch(() => {
				// A broken outline is no reason to refuse the book
				return [];
			});
		},

		// Nested bookmarks become a flat list, indented by depth
		_flattenOutline: (outline, depth) => {
			depth = depth || 0;

			return outline.reduce((items, item) => {
				const title = (typeof item.title === "string" ? item.title : "").trim();

				items.push({
					title: "  ".repeat(depth) + (title === "" ? "Untitled" : title),
					dest: item.dest
				});

				if(item.items && item.items.length > 0){
					items.push.apply(items, book._flattenOutline(item.items, depth + 1));
				}

				return items;
			}, []);
		},

		// Zero based page index a bookmark destination points at
		_pageOf: (dest) => {
			return Promise.resolve().then(() => {
				if(typeof dest === "string"){
					return book._book.getDestination(dest);
				}

				return dest;
			}).then((destination) => {
				if(!Array.isArray(destination) || destination.length === 0){
					return undefined;
				}

				const reference = destination[0];

				// Destinations name their page either by reference or, in
				// older documents, by index
				if(typeof reference === "number"){
					return reference;
				}

				return book._book.getPageIndex(reference);
			}).catch(() => {
				return undefined;
			});
		},

		_chaptersFromBookmarks: (bookmarks) => {
			return book._readAllPages().then((pages) => {
				const chapters = [];

				// Anything before the first bookmark is still part of the book
				if(bookmarks[0].page > 0){
					chapters.push({
						id: chapters.length + 1,
						title: "Beginning",
						page: 0
					});
				}

				bookmarks.forEach((bookmark) => {
					chapters.push({
						id: chapters.length + 1,
						title: bookmark.title,
						page: bookmark.page
					});
				});

				return chapters.map((chapter, key) => {
					const next = chapters[key + 1];
					const end = next ? next.page : pages.length;

					return {
						id: chapter.id,
						title: chapter.title,
						content: pages.slice(chapter.page, Math.max(end, chapter.page + 1)).join(" ")
					};
				});
			});
		},

		_wholeDocument: () => {
			return book._readAllPages().then((pages) => {
				return [{
					id: 1,
					title: path.basename(filename),
					content: pages.join(" ")
				}];
			});
		},

		_readPage: (id) => {
			return book._book.getPage(id).then(function(page){
				return page.getTextContent();
			}).then(function(content){
				return content.items.map(function(item){
					return item.str;
				}).join(" ");
			});
		},

		_readAllPages: () => {
			const pages = [];

			for(let i = 0; i < book._book.numPages; i++){
				pages.push(book._readPage(i + 1));
			}

			return Promise.all(pages);
		}
	};

	return book._init(filename);
};
