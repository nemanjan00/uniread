// TODO: Do tests

const sources = require("../../sources/");
const textVersion = require("textversionjs");

const textVersionConfig = {
	linkProcess: (_, linkText) => linkText,
	imgProcess: (_, alt) => alt,
	headingStyle: "hashify"
};

module.exports = {
	getBook: (file) => {
		return sources.detectEngine(file).then((book) => {
			return module.exports.transformBook(book);
		});
	},
	transformBook: (book) => {
		let title = book.getTitle();

		return book.getChapters().then((chapters) => {
			chapters = chapters.map((chapter) => {
				chapter.content = textVersion(chapter.content, textVersionConfig);

				return chapter;
			});

			let book = module.exports.transformChapters(chapters);

			book.title = title;

			return book;
		});
	},
	transformChapters: (chapters) => {
		const text = [];
		const links = [];

		chapters.forEach((chapter) => {
			links.push({
				name: chapter.title,
				word: text.length
			});

			chapter.content = chapter.content.split(/\s+/).filter((word) => word !== "");

			chapter.content.forEach((word) => {
				text.push(word);
			});
		});

		let book = {
			text: text,
			links: links
		};

		return book;
	}
};
