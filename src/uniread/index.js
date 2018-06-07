const sources = require("../sources/");
const textVersion = require("textversionjs");

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, "g"), replacement);
};

module.exports = {
	getBook: (file) => {
		return new Promise((resolve) => {
			sources.detectEngine(file).then((book) => {
				module.exports.transformBook(book).then((book) => {
					resolve(book);
				});
			});
		});
	},
	transformBook: (book) => {
		return new Promise((resolve) => {
			let title = book.getTitle();

			book.getChapters().then((chapters) => {
				chapters = chapters.map((chapter) => {
					chapter.content = textVersion(chapter.content);

					return chapter;
				});

				chapters = module.exports.transformChapters(chapters);

				chapters.title = title;

				resolve(chapters);
			});
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

			chapter.content = chapter.content
				.replaceAll("\r\n", "\n")
				.replaceAll("\t", " ")
				.replaceAll("\n", " ");

			chapter.content = chapter.content.split(" ");

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

module.exports.getBook("./books/Metamorphosis-jackson.epub").then((book) => {
	console.log(book);
});

