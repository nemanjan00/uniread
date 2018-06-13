const pdfJs = require("pdfjs-dist");
pdfJs.disableWorker = true;

const fs = require("fs");

module.exports = (filename) => {
	const book = {
		_book: undefined,
		_init: () => {
			return new Promise((resolve) => {
				fs.readFile(filename, function (err, data) {
					var data_array = new Uint8Array(data);
					pdfJs.getDocument(data_array).then(function (pdf) {
						book._book = pdf;

						resolve(book);
					});
				});
			});
		},

		getTitle: () => {
			return "";
		},
		getChapters: () => {
			return new Promise((resolve) => {
				book._readAllPages().then((content) => {
					let chapters = [{
						id: 1,
						title: "Content not supported in pdf right now. ",
						content: content.join(" ")
					}];	

					resolve(chapters);
				});
			});
		},
		_readPage: function(id){
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
		_readAllPages: function(){
			var promise = new Promise(function(resolve){
				var pages = [];
				
				for(var i = 0; i < book._book.pdfInfo.numPages; i++){
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

