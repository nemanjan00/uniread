const fs = require("fs");
const path = require("path");

const marked = require("marked");

const markup = require("../markup");

module.exports = (filename) => {
	const book = {
		_markdown: undefined,
		_html: undefined,

		_init: () => {
			return fs.promises.readFile(filename, "utf8").then((markdown) => {
				book._markdown = markdown;

				// Going through html keeps one code path for headings, lists
				// and inline markup
				book._html = marked.parse(markdown, {async: false});

				return book;
			});
		},

		getTitle: () => {
			const heading = /^\s*#\s+(.+)$/m.exec(book._markdown);

			if(heading){
				return heading[1].trim();
			}

			return filename;
		},

		getChapters: () => {
			return Promise.resolve(markup.chapters(book._html, path.basename(filename)));
		}
	};

	return book._init();
};
