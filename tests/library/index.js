const expect = require("chai").expect;

const fs = require("fs");
const os = require("os");
const path = require("path");

const libraryModule = require("../../src/library");
const picker = require("../../src/interfaces/cli/picker");

describe("Library", function() {
	let store;
	let library;

	beforeEach(function() {
		store = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uniread-")), "library.json");

		library = libraryModule.create(store);
	});

	afterEach(function() {
		fs.rmSync(path.dirname(store), {recursive: true, force: true});
	});

	describe("Reading a missing or broken library", function() {
		it("Starts empty when there is no library file", function() {
			expect(library.list()).to.deep.equal([]);
			expect(library.get("./index.js")).to.equal(undefined);
			expect(library.position("./index.js")).to.equal(0);
		});

		it("Starts empty when the library file is corrupt", function() {
			fs.mkdirSync(path.dirname(store), {recursive: true});
			fs.writeFileSync(store, "not json at all");

			expect(library.list()).to.deep.equal([]);
		});

		it("Starts empty when the library file is not a list", function() {
			fs.mkdirSync(path.dirname(store), {recursive: true});
			fs.writeFileSync(store, "{\"file\": \"a\"}");

			expect(library.list()).to.deep.equal([]);
		});
	});

	describe("Saving progress", function() {
		it("Creates the library directory on first save", function() {
			library.save("./index.js", {title: "Title", position: 3, total: 10});

			expect(fs.existsSync(store)).to.equal(true);
		});

		it("Stores an absolute path so relative lookups still match", function() {
			library.save("./index.js", {title: "Title", position: 3, total: 10});

			const entry = library.get("./index.js");

			expect(entry.file).to.equal(path.resolve("./index.js"));
			expect(entry.title).to.equal("Title");
			expect(entry.position).to.equal(3);
			expect(entry.total).to.equal(10);
			expect(entry.opened).to.be.a("number");
		});

		it("Keeps one entry per book, holding the newest progress", function() {
			library.save("./index.js", {title: "Title", position: 3, total: 10});
			library.save("./index.js", {title: "Title", position: 7, total: 10});

			expect(library.list()).to.have.lengthOf(1);
			expect(library.get("./index.js").position).to.equal(7);
		});

		it("Lists the most recently read book first", function() {
			library.save("./index.js", {title: "One", position: 1, total: 10, opened: 1000});
			library.save("./package.json", {title: "Two", position: 1, total: 10, opened: 2000});
			library.save("./README.md", {title: "Three", position: 1, total: 10, opened: 1500});

			expect(library.list().map((entry) => entry.title)).to.deep.equal(["Two", "Three", "One"]);
		});

		it("Caps the library at MAX_ENTRIES books", function() {
			for(let i = 0; i < libraryModule.MAX_ENTRIES + 10; i++){
				library.save("./book-" + i + ".txt", {title: "Book", position: 0, total: 10});
			}

			expect(library.list()).to.have.lengthOf(libraryModule.MAX_ENTRIES);
		});
	});

	describe("Resuming", function() {
		it("Resumes where the book was left off", function() {
			library.save("./index.js", {title: "Title", position: 42, total: 100});

			expect(library.position("./index.js", 100)).to.equal(42);
		});

		it("Restarts an unknown book", function() {
			expect(library.position("./index.js", 100)).to.equal(0);
		});

		it("Restarts when the saved position no longer fits the book", function() {
			library.save("./index.js", {title: "Title", position: 42, total: 100});

			expect(library.position("./index.js", 10)).to.equal(0);
		});

		it("Restarts on a negative or non numeric position", function() {
			library.save("./index.js", {title: "Title", position: -1, total: 100});
			expect(library.position("./index.js", 100)).to.equal(0);

			library.save("./index.js", {title: "Title", position: "nope", total: 100});
			expect(library.position("./index.js", 100)).to.equal(0);
		});
	});

	describe("Forgetting books", function() {
		it("Removes a single book", function() {
			library.save("./index.js", {title: "Title", position: 1, total: 10});
			library.remove("./index.js");

			expect(library.list()).to.deep.equal([]);
		});

		it("Prunes books that no longer exist on disk", function() {
			library.save("./index.js", {title: "Kept", position: 1, total: 10});
			library.save("./gone-for-good.epub", {title: "Gone", position: 1, total: 10});

			const entries = library.prune();

			expect(entries.map((entry) => entry.title)).to.deep.equal(["Kept"]);
			expect(library.list()).to.have.lengthOf(1);
		});
	});

	describe("Default location", function() {
		it("Lives under the XDG data directory", function() {
			expect(libraryModule.defaultPath).to.be.a("string");
			expect(libraryModule.defaultPath.endsWith(path.join("uniread", "library.json"))).to.equal(true);
			expect(libraryModule.open().path).to.equal(libraryModule.defaultPath);
		});
	});

	describe("Recent book labels", function() {
		it("Shows how far through a book the reader is", function() {
			expect(picker.percent({position: 25, total: 100})).to.equal(25);
			expect(picker.label({title: "Title", position: 25, total: 100})).to.equal("Title (25%)");
		});

		it("Falls back to the file name when a book has no title", function() {
			expect(picker.label({file: "/books/a.epub", position: 0, total: 10})).to.equal("/books/a.epub (0%)");
		});

		it("Does not divide by a zero length book", function() {
			expect(picker.percent({position: 0, total: 0})).to.equal(0);
		});
	});
});
