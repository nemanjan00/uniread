const expect = require("chai").expect;

const timing = require("../../src/interfaces/cli/timing");

describe("Reader timing", function() {
	describe("How long a word is held", function() {
		it("Holds a plain word for one interval", function() {
			expect(timing.hold("word", 250)).to.equal(250);
		});

		it("Holds a word that ends a clause for two", function() {
			[",", ".", "?", "!", ";", ":"].forEach((mark) => {
				expect(timing.hold("word" + mark, 250)).to.equal(500);
			});
		});

		it("Copes with a missing word", function() {
			expect(timing.hold(undefined, 250)).to.equal(250);
			expect(timing.hold("", 250)).to.equal(250);
		});
	});

	describe("The blank between words", function() {
		it("Is nothing at all when flashing is off", function() {
			expect(timing.gap(250, false)).to.equal(0);
		});

		it("Scales with the reading speed", function() {
			expect(timing.gap(200, true)).to.be.below(timing.gap(400, true));
		});

		it("Never outlasts the word it follows", function() {
			[10, 50, 100, 250, 500, 1000].forEach((speed) => {
				expect(timing.gap(speed, true)).to.be.below(timing.hold("word", speed));
			});
		});

		it("Stays visible but brief at any speed", function() {
			expect(timing.gap(10, true)).to.be.at.least(1);
			expect(timing.gap(5000, true)).to.equal(timing.GAP_LIMIT);
		});
	});
});
