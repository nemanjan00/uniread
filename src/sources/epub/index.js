const EPub = require("epub");

const markup = require("../markup");

module.exports = (filename) => {
	let book = {
		_epub: undefined,

		_init: (filename) => {
			return new Promise((resolve, reject) => {
				book._epub = new EPub(filename);

				book._epub.on("end", function(){
					resolve(book);
				});

				book._epub.on("error", reject);

				book._epub.parse();
			});
		},
		_getChapter: (id) => {
			return new Promise((resolve, reject) => {
				book._epub.getChapter(id, (error, content) => {
					if(error){
						return reject(error);
					}

					resolve(content);
				});
			});
		},

		getTitle: () => {
			return book._epub.metadata.title;
		},
		getChapters: () => {
			let chaptersContent = [];

			let chapters = book._epub.flow.map(function(chapter){
				let chapterResult = {
					id: chapter.id,
					title: chapter.title
				};

				chaptersContent.push(book._getChapter(chapter.id));

				return chapterResult;
			});

			return Promise.all(chaptersContent).then((contents) => {
				contents.forEach((content, key) => {
					chapters[key].content = markup.toText(content);
				});

				return chapters;
			});
		}
	};

	return book._init(filename);
};

