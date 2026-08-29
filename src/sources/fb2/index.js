const fs = require("fs");
const path = require("path");

const xml2js = require("xml2js");

// FictionBook keeps its text in nested <section> elements, each optionally
// introduced by a <title>
module.exports = (filename) => {
	const book = {
		_root: undefined,

		_init: () => {
			return fs.promises.readFile(filename, "utf8").then((xml) => {
				return xml2js.parseStringPromise(xml, {
					explicitArray: true,
					explicitChildren: true,
					preserveChildrenOrder: true,
					charkey: "_",
					trim: true
				});
			}).then((parsed) => {
				if(!parsed || !parsed.FictionBook){
					throw new Error("Not a FictionBook document");
				}

				book._root = parsed.FictionBook;

				return book;
			});
		},

		getTitle: () => {
			const description = book._first(book._root, "description");
			const info = description && book._first(description, "title-info");
			const title = info && book._first(info, "book-title");

			const text = title ? book._text(title).trim() : "";

			return text === "" ? filename : text;
		},

		getChapters: () => {
			const body = book._first(book._root, "body");

			if(!body){
				return Promise.resolve([]);
			}

			const chapters = [];

			book._walk(body, 0, chapters);

			if(chapters.length === 0){
				return Promise.resolve([{
					id: 1,
					title: path.basename(filename),
					content: book._text(body)
				}]);
			}

			return Promise.resolve(chapters.map((chapter, key) => {
				return {
					id: key + 1,
					title: chapter.title,
					content: chapter.content
				};
			}));
		},

		// Each section becomes a chapter holding its own text; nested sections
		// follow as chapters of their own rather than being counted twice
		_walk: (node, depth, chapters) => {
			const sections = (node.section || []);

			if(node !== undefined && depth === 0){
				const loose = book._text(node, true).trim();

				if(loose !== ""){
					chapters.push({title: "Beginning", content: loose});
				}
			}

			sections.forEach((section) => {
				const title = book._text(book._first(section, "title") || {}).trim();

				chapters.push({
					title: "  ".repeat(depth) + (title === "" ? "Untitled" : title),
					content: book._text(section, true)
				});

				book._walk(section, depth + 1, chapters);
			});
		},

		_first: (node, name) => {
			return node && node[name] ? node[name][0] : undefined;
		},

		// All text below a node, optionally skipping nested sections and the
		// section's own title, which is reported separately
		_text: (node, skipSections) => {
			if(typeof node === "string"){
				return node;
			}

			if(!node || typeof node !== "object"){
				return "";
			}

			const parts = [];

			if(typeof node._ === "string"){
				parts.push(node._);
			}

			(node.$$ || []).forEach((child) => {
				if(skipSections && (child["#name"] === "section" || child["#name"] === "title")){
					return;
				}

				parts.push(book._text(child, false));
			});

			return parts.join(" ").replace(/\s+/g, " ").trim();
		}
	};

	return book._init();
};
