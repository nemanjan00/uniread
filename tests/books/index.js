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
const docx = require("../../src/sources/docx");
const fb2 = require("../../src/sources/fb2");
const mobi = require("../../src/sources/mobi");

const JSZip = require("jszip");

// A minimal Word document, built rather than committed as a binary
const writeDocx = (file) => {
	const document = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>" +
		"<w:p><w:pPr><w:pStyle w:val=\"Heading1\"/></w:pPr><w:r><w:t>The Book</w:t></w:r></w:p>" +
		"<w:p><w:r><w:t>Front matter.</w:t></w:r></w:p>" +
		"<w:p><w:pPr><w:pStyle w:val=\"Heading2\"/></w:pPr><w:r><w:t>First</w:t></w:r></w:p>" +
		"<w:p><w:r><w:t>Alpha beta gamma.</w:t></w:r></w:p>" +
		"<w:p><w:pPr><w:pStyle w:val=\"Heading2\"/></w:pPr><w:r><w:t>Second</w:t></w:r></w:p>" +
		"<w:p><w:r><w:t>Delta epsilon.</w:t></w:r></w:p>" +
		"</w:body></w:document>";

	const types = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
		"<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
		"<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
		"<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>" +
		"</Types>";

	const rels = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
		"<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>" +
		"</Relationships>";

	const zip = new JSZip();

	zip.file("[Content_Types].xml", types);
	zip.folder("_rels").file(".rels", rels);
	zip.folder("word").file("document.xml", document);

	return zip.generateAsync({type: "nodebuffer"}).then((buffer) => {
		fs.writeFileSync(file, buffer);
	});
};

const FB2 = [
	"<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
	"<FictionBook xmlns=\"http://www.gribuser.ru/xml/fictionbook/2.0\">",
	"<description><title-info><book-title>A Fiction Book</book-title></title-info></description>",
	"<body>",
	"<p>Loose opening line.</p>",
	"<section><title><p>First</p></title><p>Alpha beta gamma.</p><p>Delta.</p>",
	"<section><title><p>First, part two</p></title><p>Nested text.</p></section>",
	"</section>",
	"<section><title><p>Second</p></title><p>Epsilon zeta.</p></section>",
	"</body></FictionBook>"
].join("\n");

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
	"./books/Metamorphosis-jackson.pdf",
	"./books/Metamorphosis-jackson.mobi"
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

	describe("mobi book engine", function() {
		it("Decodes mobi book into uniread format", function(done) {
			validateBookFormat(mobi, "./books/Metamorphosis-jackson.mobi", done);
		});

		it("Decompresses the text and reads its title", function() {
			return mobi("./books/Metamorphosis-jackson.mobi").then((book) => {
				expect(book.getTitle()).to.equal("Metamorphosis");

				return book.getChapters();
			}).then((chapters) => {
				expect(chapters.map((chapter) => chapter.title)).to.include("CHAPTER I");

				const words = chapters.reduce((count, chapter) => {
					return count + chapter.content.split(/\s+/).filter((word) => word !== "").length;
				}, 0);

				// The same book as the epub and pdf samples, so the text
				// should be of the same order
				expect(words).to.be.above(20000);
			});
		});

		it("Rejects something that is not a mobi book", function() {
			return expect(mobi("./index.js")).to.be.rejectedWith("Not a mobi book");
		});
	});

	describe("docx book engine", function() {
		let file;

		before(function() {
			file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uniread-")), "book.docx");

			return writeDocx(file);
		});

		after(function() {
			fs.rmSync(path.dirname(file), {recursive: true, force: true});
		});

		it("Decodes docx into uniread format", function(done) {
			validateBookFormat(docx, file, done);
		});

		it("Splits chapters on heading styles", function() {
			return docx(file).then((book) => {
				expect(book.getTitle()).to.equal("The Book");

				return book.getChapters();
			}).then((chapters) => {
				expect(chapters.map((chapter) => chapter.title)).to.deep.equal(["The Book", "First", "Second"]);
				expect(chapters[1].content).to.include("Alpha beta gamma");
			});
		});
	});

	describe("fb2 book engine", function() {
		let file;

		before(function() {
			file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uniread-")), "book.fb2");

			fs.writeFileSync(file, FB2);
		});

		after(function() {
			fs.rmSync(path.dirname(file), {recursive: true, force: true});
		});

		it("Decodes fb2 into uniread format", function(done) {
			validateBookFormat(fb2, file, done);
		});

		it("Takes the title from the book description", function() {
			return fb2(file).then((book) => {
				expect(book.getTitle()).to.equal("A Fiction Book");
			});
		});

		it("Makes a chapter of every section, nested ones indented", function() {
			return fb2(file).then((book) => {
				return book.getChapters();
			}).then((chapters) => {
				expect(chapters.map((chapter) => chapter.title)).to.deep.equal([
					"Beginning",
					"First",
					"  First, part two",
					"Second"
				]);
			});
		});

		it("Does not repeat a nested section inside its parent", function() {
			return fb2(file).then((book) => {
				return book.getChapters();
			}).then((chapters) => {
				expect(chapters[1].content).to.equal("Alpha beta gamma. Delta.");
				expect(chapters[2].content).to.equal("Nested text.");
			});
		});

		it("Rejects a document that is not a FictionBook", function() {
			const other = path.join(path.dirname(file), "other.fb2");

			fs.writeFileSync(other, "<other><p>hello</p></other>");

			return expect(fb2(other)).to.be.rejectedWith("Not a FictionBook");
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
				expect(sources._detectEngine("./books/Metamorphosis-jackson.mobi")).to.eventually.equal(sources.engines.mobi)
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
			expect(sources.extensions[".fb2"]).to.equal(sources.engines.fb2);
			expect(sources.extensions[".docx"]).to.equal(sources.engines.docx);
			expect(sources.extensions[".mobi"]).to.equal(sources.engines.mobi);
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
			return expect(sources.detectEngine("./index.js")).to.be.rejected;
		});

		it("Rejects rather than throwing for a missing file", function() {
			return expect(sources.detectEngine("./does-not-exist.epub")).to.be.rejected;
		});
	});
});
