const path = require("path");

const mammoth = require("mammoth");

const markup = require("../markup");

module.exports = (filename) => {
	const book = {
		_html: undefined,

		_init: () => {
			// mammoth maps the Heading 1 and Heading 2 styles onto h1 and h2,
			// which is exactly what the chapter splitter looks for. It hands
			// back its own promise implementation, so keep a native one at the
			// boundary
			return Promise.resolve(mammoth.convertToHtml({path: filename})).then((result) => {
				book._html = result.value;

				return book;
			});
		},

		getTitle: () => {
			const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(book._html);

			if(heading){
				const title = markup.toText(heading[1]).trim();

				if(title !== ""){
					return title;
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
