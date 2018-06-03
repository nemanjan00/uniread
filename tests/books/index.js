/* global describe, it */

const expect = require("chai").expect;

const epub = require("../../src/sources/epub/index.js");

const validateBookFormat = (engine) => {
	engine("./books/Metamorphosis-jackson.epub").then((book) => {
		expect(book.getTitle()).to.equal("Metamorphosis");

		book.getChapters().then((chapters) => {
			expect(chapters.length).to.equal(8);

			chapters.forEach((chapter) => {
				expect(chapter.title).to.be.a("string");
				expect(chapter.content).to.be.a("string");
			});
		});
	});
};

describe("Book engines", function() {
	describe("ePub book engine", function() {
		it("Decodes ePub book into uniread format", function() {
			validateBookFormat(epub);
		});
	});
});

