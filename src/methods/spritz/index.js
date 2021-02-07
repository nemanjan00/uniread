// TODO: Do tests

const sources = require("../../sources/");
const textVersion = require("textversionjs");

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, "g"), replacement);
};

const textVersionConfig = {
	linkProcess: (_, linkText) => linkText,
	imgProcess: (_, alt) => alt,
	headingStyle: "hashify"
};

module.exports = {
	getBook: (file) => {
		return new Promise((resolve, reject) => {
			sources.detectEngine(file).then((book) => {
				module.exports.transformBook(book).then((book) => {
					resolve(book);
				});
			}).catch((error) => {
				reject(error);
			});
		});
	},
	transformBook: (book) => {
		return new Promise((resolve) => {
			let title = book.getTitle();

			book.getChapters().then((chapters) => {
				chapters = chapters.map((chapter) => {
					chapter.content = textVersion(chapter.content, textVersionConfig);

					return chapter;
				});

				chapters = module.exports.transformChapters(chapters);

				chapters.title = title;

				resolve(chapters);
			});
		});
	},
	transformChapters: (chapters) => {
        const _text = [];
		const text = [];
		const links = [];

		chapters.forEach((chapter) => {
			links.push({
				name: chapter.title,
				word: _text.length
			});

			chapter.content = chapter.content
				.replaceAll("\r\n", "\n")
				.replaceAll("\t", " ")
				.replaceAll("\n", " ");

			chapter.content = chapter.content.split(" ");

			chapter.content.forEach((word) => {
				_text.push(word);
			});

            for (let counter = 0; counter < _text.length; counter += 5){
                text.push(_text.slice(counter, counter + 5).join(" "));
            };

		});

		let book = {
			text: text,
			links: links
		};

		return book;
	}
};

