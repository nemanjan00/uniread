const {EPub} = require("epub");

const markup = require("../markup");

module.exports = (filename) => {
	let book = {
		_epub: undefined,

		_init: (filename) => {
			book._epub = new EPub(filename);

			return book._epub.parse().then(() => {
				return book;
			});
		},
		_getChapter: (id) => {
			return book._epub.getChapter(id);
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
