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
const markdown = require("../../src/sources/markdown");
const html = require("../../src/sources/html");

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

		it("Takes chapters from the document outline", function() {
			return pdf("./books/Metamorphosis-jackson.pdf").then((book) => {
				return book.getChapters();
			}).then((chapters) => {
				expect(chapters.length).to.be.above(1);
				expect(chapters.map((chapter) => chapter.title)).to.include("CHAPTER I");

				// Every chapter holds the pages between it and the next one
				chapters.forEach((chapter) => {
					expect(chapter.content).to.be.a("string");
				});
			});
		});

		it("Prefers the title from the document metadata", function() {
			return pdf("./books/Metamorphosis-jackson.pdf").then((book) => {
				expect(book.getTitle()).to.equal("Metamorphosis");
			});
		});
	});

	describe("markdown book engine", function() {
		let file;

		before(function() {
			file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uniread-")), "book.md");

			fs.writeFileSync(file, [
				"# The Book",
				"",
				"Front matter.",
				"",
				"## First",
				"",
				"Alpha *beta* [gamma](http://example.com).",
				"",
				"## Second",
				"",
				"Delta epsilon."
			].join("\n"));
		});

		after(function() {
			fs.rmSync(path.dirname(file), {recursive: true, force: true});
		});

		it("Decodes markdown into uniread format", function(done) {
			validateBookFormat(markdown, file, done);
		});

		it("Takes the title from the first heading", function() {
			return markdown(file).then((book) => {
				expect(book.getTitle()).to.equal("The Book");
			});
		});

		it("Splits chapters on headings", function() {
			return markdown(file).then((book) => {
				return book.getChapters();
			}).then((chapters) => {
				expect(chapters.map((chapter) => chapter.title)).to.deep.equal(["The Book", "First", "Second"]);
			});
		});

		it("Strips markup, links and emphasis from the text", function() {
			return markdown(file).then((book) => {
				return book.getChapters();
			}).then((chapters) => {
				const content = chapters[1].content;

				expect(content).to.include("gamma");
				expect(content).to.not.include("http://example.com");
				expect(content).to.not.include("*");
			});
		});

		it("Falls back to one chapter when there are no headings", function() {
			const plain = path.join(path.dirname(file), "plain.md");

			fs.writeFileSync(plain, "Just a paragraph.");

			return markdown(plain).then((book) => {
				expect(book.getTitle()).to.equal(plain);

				return book.getChapters();
			}).then((chapters) => {
				expect(chapters).to.have.lengthOf(1);
				expect(chapters[0].title).to.equal("plain.md");
			});
		});
	});

	describe("html book engine", function() {
		let file;

		before(function() {
			file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uniread-")), "book.html");

			fs.writeFileSync(file, "<html><head><title>A Test Book</title></head><body>" +
				"<p>Front matter.</p><h1>First</h1><p>Alpha.</p><h2>Second</h2><p>Beta.</p>" +
				"</body></html>");
		});

		after(function() {
			fs.rmSync(path.dirname(file), {recursive: true, force: true});
		});

		it("Decodes html into uniread format", function(done) {
			validateBookFormat(html, file, done);
		});

		it("Takes the title from the title tag", function() {
			return html(file).then((book) => {
				expect(book.getTitle()).to.equal("A Test Book");
			});
		});

		it("Keeps whatever comes before the first heading", function() {
			return html(file).then((book) => {
				return book.getChapters();
			}).then((chapters) => {
				expect(chapters.map((chapter) => chapter.title)).to.deep.equal(["Beginning", "First", "Second"]);
				expect(chapters[0].content).to.include("Front matter");
			});
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

		it("Detects text formats by extension", function() {
			return Promise.all([
				expect(sources._detectEngine("./README.md")).to.eventually.equal(sources.engines.markdown),
				expect(sources._detectEngine("./package.json")).to.eventually.equal(false),
				expect(sources._detectEngine("./notes.txt")).to.be.rejected
			]);
		});

		it("Matches extensions regardless of case", function() {
			expect(sources.extensions[".md"]).to.equal(sources.engines.markdown);
			expect(sources.extensions[".html"]).to.equal(sources.engines.html);
			expect(sources.extensions[".txt"]).to.equal(sources.engines.text);
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

