/* global describe, it */

const chai = require("chai");

const chaiAsPromised = require("chai-as-promised");
 
chai.use(chaiAsPromised);

const expect = chai.expect;

const epub = require("../../src/sources/epub");
//const pdf = require("../../src/sources/pdf");

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
	"./books/Metamorphosis-jackson.epub"
];

describe("Book engines", function() {
	describe("ePub book engine", function() {
		it("Decodes ePub book into uniread format", function(done) {
			validateBookFormat(epub, "./books/Metamorphosis-jackson.epub", done);
		});
	});


	//describe("pdf book engine", function() {
		//it("Decodes pdf book into uniread format", function(done) {
			//validateBookFormat(pdf, "./books/Metamorphosis-jackson.pdf", done);
		//});
	//});

	describe("Auto detection book engine", function() {
		it("Detects engine", function() {
			expect(sources._detectEngine("./books/Metamorphosis-jackson.epub")).to.equal(sources.engines.epub);
			expect(sources._detectEngine("./index.js")).to.equal(false);
			expect(sources._detectEngine("./books/Metamorphosis-jackson.mobi")).to.equal(false);
		});
	});

	describe("Auto detected engine testing", function() {
		it("Detects engine", function(done) {
			try {
				files.forEach((file) => {
					let engine = sources.detectEngine(file);

					expect(engine).to.be.a("promise");

					validateBookFormat(engine, file, done);
				});


				expect(sources.detectEngine("./index.js")).to.be.rejected;
				expect(sources.detectEngine("./books/Metamorphosis-jackson.mobi")).to.be.rejected;
			} catch (e) {
				done(e);
			}
		});
	});
});

