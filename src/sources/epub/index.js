const EPub = require("epub");

module.exports = (filename) => {
	let book = {
		_epub: undefined,

		_init: (filename) => {
			return new Promise((resolve) => {
				book._epub = new EPub(filename);

				book.epub.on("end", function(){
					resolve();
				});

				book._epub.parse();
			});
		}
	};

	return book._init(filename);
};

