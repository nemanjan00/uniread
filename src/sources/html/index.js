const fs = require("fs");
const path = require("path");

const markup = require("../markup");

module.exports = (filename) => {
	const book = {
		_html: undefined,

		_init: () => {
			return fs.promises.readFile(filename, "utf8").then((html) => {
				book._html = html;

				return book;
			});
		},

		getTitle: () => {
			const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(book._html);

			if(title){
				const text = markup.toText(title[1]).trim();

				if(text !== ""){
					return text;
				}
			}

			return filename;
		},

		getChapters: () => {
			return Promise.resolve(markup.chapters(book._html, path.basename(filename)));
		}
	};

	return book._init();
};
