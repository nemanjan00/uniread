const chai = require("chai");

const chaiAsPromised = require("chai-as-promised");
 
chai.use(chaiAsPromised);

const expect = chai.expect;

const fs = require("fs");
const os = require("os");
const path = require("path");

const epub = require("../../src/sources/epub");
const pdf = require("../../src/sources/pdf");
const text = require("../../src/sources/text");

const sources = require("../../src/sources");

const validateBookFormat = (engine, file, done) => {
	let promise;
	if(engine instanceof Promise){
		promise = engine;
	} else {
		promise = engine(file);
	}

	expect(promise).to.be.a("promise");

	promise.then((book) => {
		try {
			expect(book.getTitle).to.be.a("function");

			expect(book.getTitle()).to.be.a("string");

			expect(book.getChapters).to.be.a("function");

			promise = book.getChapters();

			expect(promise).to.be.a("promise");
				
			promise.then((chapters) => {
				try {
					expect(chapters).to.be.a("array");

					chapters.forEach((chapter) => {
						expect(chapter).to.be.a("object");

						expect(chapter.title).to.be.a("string");
						expect(chapter.content).to.be.a("string");
					});

					done();
				} catch (e){
					done(e);
				}
			});
		} catch (e){
			done(e);
		}
	});
};

let files = [
	"./books/Metamorphosis-jackson.epub",
	"./books/Metamorphosis-jackson.pdf"
];

describe("Book engines", function() {
	describe("ePub book engine", function() {
		it("Decodes ePub book into uniread format", function(done) {
			validateBookFormat(epub, "./books/Metamorphosis-jackson.epub", done);
		});
	});


	describe("pdf book engine", function() {
		it("Decodes pdf book into uniread format", function(done) {
			validateBookFormat(pdf, "./books/Metamorphosis-jackson.pdf", done);
		});
	});

	describe("text book engine", function() {
		let file;

		before(function() {
			file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uniread-")), "book.txt");

			fs.writeFileSync(file, "Some plain text.");
		});

		after(function() {
			fs.rmSync(path.dirname(file), {recursive: true, force: true});
		});

		it("Decodes a text file into uniread format", function(done) {
			validateBookFormat(text, file, done);
		});

		it("Rejects a file it cannot read", function() {
			return expect(text("./does-not-exist.txt")).to.be.rejected;
		});
	});

	describe("Auto detection book engine", function() {
		it("Detects engine", function() {
			return Promise.all([
				expect(sources._detectEngine("./books/Metamorphosis-jackson.pdf")).to.eventually.equal(sources.engines.pdf),
				expect(sources._detectEngine("./books/Metamorphosis-jackson.epub")).to.eventually.equal(sources.engines.epub),
				expect(sources._detectEngine("./index.js")).to.eventually.equal(false),
				expect(sources._detectEngine("./books/Metamorphosis-jackson.mobi")).to.eventually.equal(false)
			]);
		});

		it("Detects plain text by extension", function() {
			return Promise.all([
				expect(sources._detectEngine("./README.md")).to.eventually.equal(false),
				expect(sources._detectEngine("./package.json")).to.eventually.equal(false),
				expect(sources._detectEngine("./notes.txt")).to.be.rejected
			]);
		});
	});

	describe("Auto detected engine testing", function() {
		files.forEach((file) => {
			it("Detects engine for" + file, function(done) {
				let engine = sources.detectEngine(file);

				expect(engine).to.be.a("promise");

				validateBookFormat(engine, file, done);
			});
		});

		it("Detects engine for invalid formats", function() {
			return Promise.all([
				expect(sources.detectEngine("./index.js")).to.be.rejected,
				expect(sources.detectEngine("./books/Metamorphosis-jackson.mobi")).to.be.rejected
			]);
		});

		it("Rejects rather than throwing for a missing file", function() {
			return expect(sources.detectEngine("./does-not-exist.epub")).to.be.rejected;
		});
	});
});

