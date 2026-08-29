const fs = require("fs");

module.exports = (filename) => {
	const book = {
		_book: undefined,
		_init: () => {
			return new Promise((resolve, reject) => {
				fs.readFile(filename, function (err, data) {
					if(err){
						return reject(err);
					}

					book._book = data.toString();

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
