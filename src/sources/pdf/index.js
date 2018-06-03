module.exports = (filename) => {
	const book = {
		_init: (filename) => {
			return new Promise((resolve) => {
				resolve(book);
			});
		},

		getTitle: () => {
			return "";
		},
		getChapters: () => {
			return new Promise((resolve) => {
				resolve(123);	
			});
		}
	};

	return book._init(filename);
};

