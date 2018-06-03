module.exports = (filename) => {
	const book = {
		_init: (filename) => {
			return new Promise((resolve) => {
				resolve(book);
			});
		},

		getTitle: () => {
			return "";
		}
	};

	return book._init(filename);
};

