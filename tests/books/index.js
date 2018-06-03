/* global describe, it */

const expect = require("chai").expect;

const epub = require("../../src/sources/epub");
const pdf = require("./../src/sources/pdf");

const validateBookFormat = (engine, file) => {
	engine(file).then((book) => {
		expect(book.getTitle()).to.be.a("string");

		book.getChapters().then((chapters) => {
			expect(chapters.length).to.equal(8);

			expect(chapters).to.be.a("array");

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
			validateBookFormat(epub, "./books/Metamorphosis-jackson.epub");
		});

		it("Decodes pdf book into uniread format", function() {
			validateBookFormat(pdf, "./books/Metamorphosis-jackson.pdf");
		});
	});
});

