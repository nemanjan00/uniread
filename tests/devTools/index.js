/* global describe, it */

const expect = require("chai").expect;

const child_process = require("child_process");
const fs = require("fs");

describe("Development tools", function() {
	describe("Sample book downloader", function() {
		it("Downloads sample books", function() {
			child_process.execFileSync("./devScripts/getBooks.sh");

			expect(fs.existsSync("./books/Metamorphosis-jackson.pdf")).to.equal(true);
			expect(fs.existsSync("./books/Metamorphosis-jackson.epub")).to.equal(true);
			expect(fs.existsSync("./books/Metamorphosis-jackson.mobi")).to.equal(true);
		});
	});
});

