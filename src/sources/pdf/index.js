const pdfJs = require("pdfjs-dist/legacy/build/pdf.js");
pdfJs.disableWorker = true;

const fs = require("fs");

module.exports = (filename) => {
	const book = {
		_book: undefined,

		_init: () => {
			return new Promise((resolve) => {
				fs.readFile(filename, function (err, data) {
					var data_array = new Uint8Array(data);
					pdfJs.getDocument(data_array).promise.then(function (pdf) {
						book._book = pdf;

						resolve(book);
					});
				});
			});
		},

		getTitle: () => {
			return filename;
		},
		getChapters: () => {
			return new Promise((resolve) => {
				book._readAllPages().then((content) => {
					let chapters = [{
						id: 1,
						title: "Content not supported in pdf files yet.",
						content: content.join(" ")
					}];

					resolve(chapters);
				});
			});
		},
		_readPage: (id) => {
			var promise = new Promise(function(resolve){
				book._book.getPage(id).then(function(page){
					page.getTextContent().then(function(page){
						page = page.items;

						page = page.map(function(item){
							return item.str;
						});

						page = page.join(" ");

						resolve(page);
					});
				});
			});

			return promise;
		},
		_readAllPages: () => {
			var promise = new Promise(function(resolve){
				var pages = [];

				for(var i = 0; i < book._book._pdfInfo.numPages; i++){
					pages.push(book._readPage(i + 1));
				}

				Promise.all(pages).then(function(pages){
					resolve(pages);
				});
			});

			return promise;
		}
	};

	return book._init(filename);
};

