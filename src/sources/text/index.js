const fs = require("fs");

module.exports = (filename) => {
	const book = {
		_book: undefined,
		_init: () => {
			return new Promise((resolve) => {
				fs.readFile(filename, function (err, data) {
					let text = data.toString();
					book._book = text;
					resolve(book);
				});
			});
		},
		getTitle: () => {
			return filename;
		},
		getChapters: () => {
			return new Promise((resolve) => {
				let chapters = [{
					id: 1,
					title: "Content not supported in text files.",
					content: book._book
				}];

				resolve(chapters);
			});
		}
	};

	return book._init(filename);
};
