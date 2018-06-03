const EPub = require("epub");

module.exports = (filename) => {
	let book = {
		_epub: undefined,

		_init: (filename) => {
			return new Promise((resolve) => {
				book._epub = new EPub(filename);

				book._epub.on("end", function(){
					resolve(book);
				});

				book._epub.parse();
			});
		},
		_getChapter: (id) => {
			return new Promise((resolve) => {
				book._epub.getChapter(id, (error, content) => {
					resolve(content);
				});
			});
		},

		getTitle: () => {
			return book._epub.metadata.title;
		},
		getChapters: () => {
			return new Promise((resolve) => {
				let chaptersContent = [];

				let chapters = book._epub.flow.map(function(chapter){
					let chapterResult = {
						id: chapter.id,
						title: chapter.title 
					};

					chaptersContent.push(book._getChapter(chapter.id));

					return chapterResult;
				});

				Promise.all(chaptersContent).then((content) => {
					content.forEach((content, key) => {
						chapters[key].content = content;
					});

					resolve(chapters);
				});
			});
		}
	};

	return book._init(filename);
};

