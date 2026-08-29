const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

const expect = chai.expect;

const spritz = require("../../src/methods/spritz");

const fakeBook = (title, chapters) => {
	return {
		getTitle: () => title,
		getChapters: () => Promise.resolve(chapters)
	};
};

describe("Uniread book engine", function() {
	describe("transformChapters", function() {
		it("Flattens chapters into a single word stream", function() {
			const book = spritz.transformChapters([
				{id: 1, title: "One", content: "a b c"},
				{id: 2, title: "Two", content: "d e"}
			]);

			expect(book.text).to.deep.equal(["a", "b", "c", "d", "e"]);
		});

		it("Points every link at the first word of its chapter", function() {
			const book = spritz.transformChapters([
				{id: 1, title: "One", content: "a b c"},
				{id: 2, title: "Two", content: "d e"}
			]);

			expect(book.links).to.deep.equal([
				{name: "One", word: 0},
				{name: "Two", word: 3}
			]);

			book.links.forEach((link) => {
				expect(book.text[link.word]).to.be.a("string");
			});
		});

		it("Splits on every kind of whitespace", function() {
			const book = spritz.transformChapters([
				{id: 1, title: "One", content: "a\r\nb\tc\nd e"}
			]);

			expect(book.text).to.deep.equal(["a", "b", "c", "d", "e"]);
		});

		it("Produces no empty words from repeated or surrounding whitespace", function() {
			const book = spritz.transformChapters([
				{id: 1, title: "One", content: "  a \n\n  b  \t "}
			]);

			expect(book.text).to.deep.equal(["a", "b"]);
		});

		it("Handles an empty chapter without shifting later links", function() {
			const book = spritz.transformChapters([
				{id: 1, title: "Empty", content: ""},
				{id: 2, title: "Two", content: "a b"}
			]);

			expect(book.text).to.deep.equal(["a", "b"]);
			expect(book.links[1].word).to.equal(0);
		});

		it("Does not leak a String.prototype.replaceAll patch", function() {
			spritz.transformChapters([{id: 1, title: "One", content: "a b"}]);

			// Native replaceAll treats its first argument literally, a regex
			// based monkey patch would not
			expect("a.b".replaceAll(".", "-")).to.equal("a-b");
		});
	});

	describe("transformBook", function() {
		it("Resolves with the flattened book and its title", function() {
			const promise = spritz.transformBook(fakeBook("Title", [
				{id: 1, title: "One", content: "a b"}
			]));

			expect(promise).to.be.a("promise");

			return promise.then((book) => {
				expect(book.title).to.equal("Title");
				expect(book.text).to.deep.equal(["a", "b"]);
				expect(book.links).to.deep.equal([{name: "One", word: 0}]);
			});
		});

		it("Strips markup from chapter content", function() {
			return spritz.transformBook(fakeBook("Title", [
				{id: 1, title: "One", content: "<p>hello <b>world</b></p>"}
			])).then((book) => {
				expect(book.text).to.include("hello");
				expect(book.text).to.include("world");
				expect(book.text.join(" ")).to.not.include("<b>");
			});
		});

		it("Rejects when the source fails to read chapters", function() {
			const broken = {
				getTitle: () => "Title",
				getChapters: () => Promise.reject(new Error("boom"))
			};

			return expect(spritz.transformBook(broken)).to.be.rejectedWith("boom");
		});
	});

	describe("getBook", function() {
		it("Rejects for an unsupported format", function() {
			return expect(spritz.getBook("./index.js")).to.be.rejected;
		});

		it("Rejects for a missing file", function() {
			return expect(spritz.getBook("./does-not-exist.epub")).to.be.rejected;
		});
	});
});
