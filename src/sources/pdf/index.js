const fs = require("fs");

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

						resolve(book);
					}).catch(reject);
				});
			});
		},

		getTitle: () => {
			return filename;
		},
		getChapters: () => {
			return book._readAllPages().then((content) => {
				return [{
					id: 1,
					title: "Content not supported in pdf files yet.",
					content: content.join(" ")
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
