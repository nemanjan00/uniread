const expect = require("chai").expect;

const timing = require("../../src/interfaces/cli/timing");
const style = require("../../src/interfaces/cli/style");

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

describe("Reader styling", function() {
	const styleOf = (sentence, word) => {
		const words = sentence.split(" ");

		return style.styles(words)[words.indexOf(word)];
	};

	describe("Colour names", function() {
		it("Shows a colour word in its colour", function() {
			expect(styleOf("the sky was blue", "blue").colour).to.equal("blue");
			expect(styleOf("the grass was green", "green").colour).to.equal("green");
		});

		it("Looks past the punctuation stuck to a word", function() {
			expect(styleOf("it was red.", "red.").colour).to.equal("red");
			expect(styleOf("it was Yellow!", "Yellow!").colour).to.equal("yellow");
		});

		it("Gives a colour the terminal lacks the nearest shade", function() {
			expect(styleOf("the orange sun", "orange").colour).to.equal(style.COLOURS.orange);
			expect(style.COLOURS.orange).to.match(/^#[0-9a-f]{6}$/);
		});

		it("Leaves ordinary words alone", function() {
			expect(styleOf("the sky was clear", "clear").colour).to.equal(undefined);
		});
	});

	describe("Quotations", function() {
		it("Marks every word between the quotes", function() {
			const words = "she said \"that is red\" loudly".split(" ");
			const styles = style.styles(words);

			expect(styles.map((each) => each.quoted)).to.deep.equal([false, false, true, true, true, false]);
		});

		it("Handles typographic quotes", function() {
			const words = "she said \u201Cthat is red\u201D loudly".split(" ");
			const styles = style.styles(words);

			expect(styles.map((each) => each.quoted)).to.deep.equal([false, false, true, true, true, false]);
		});

		it("Does not open a quotation on an apostrophe", function() {
			const words = "it doesn't matter at all".split(" ");

			style.styles(words).forEach((each) => {
				expect(each.quoted).to.equal(false);
			});
		});
	});

	describe("Emphatic sentences", function() {
		it("Emphasises a whole sentence that ends in an exclamation", function() {
			const words = "it was calm. watch out! it was calm again.".split(" ");
			const styles = style.styles(words);

			expect(styles.map((each) => each.emphatic === true)).to.deep.equal([
				false, false, false,
				true, true,
				false, false, false, false
			]);
		});

		it("Leaves a trailing fragment unemphasised", function() {
			const words = "no ending here".split(" ");

			style.styles(words).forEach((each) => {
				expect(each.emphatic).to.equal(undefined);
			});
		});
	});

	describe("Repeated words", function() {
		const repeats = (sentence) => {
			const words = sentence.split(" ");

			return style.styles(words)
				.map((each, key) => (each.repeated ? words[key] : undefined))
				.filter((word) => word !== undefined);
		};

		it("Marks a word said again in the same sentence", function() {
			expect(repeats("the cat sat by the other cat")).to.deep.equal(["cat"]);
		});

		it("Marks a word said again a few words later", function() {
			expect(repeats("a dog barked. the dog left.")).to.deep.equal(["dog"]);
		});

		it("Forgets a word said long ago, in another sentence", function() {
			const far = "dog ran fast. alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu. dog barks.";

			expect(repeats(far)).to.deep.equal([]);
		});

		it("Ignores the words that always repeat", function() {
			expect(repeats("the man and the dog and the cat")).to.deep.equal([]);
		});

		it("Ignores very short words", function() {
			expect(repeats("it is it is")).to.deep.equal([]);
		});

		it("Gives a repeat its own colour, unless the word names one", function() {
			expect(style.decorate("dog", {repeated: true}))
				.to.equal("{" + style.REPEAT_COLOUR + "-fg}dog{/" + style.REPEAT_COLOUR + "-fg}");

			expect(style.decorate("red", {repeated: true, colour: "red"}))
				.to.equal("{red-fg}red{/red-fg}");
		});
	});

	describe("Turning it into markup", function() {
		it("Wraps a word in blessed tags", function() {
			expect(style.decorate("blue", {colour: "blue"})).to.equal("{blue-fg}blue{/blue-fg}");
			expect(style.decorate("out!", {emphatic: true})).to.equal("{bold}out!{/bold}");
			expect(style.decorate("said", {quoted: true})).to.equal("{underline}said{/underline}");
		});

		it("Nests the tags it needs together", function() {
			expect(style.decorate("red", {colour: "red", quoted: true, emphatic: true}))
				.to.equal("{red-fg}{bold}{underline}red{/underline}{/bold}{/red-fg}");
		});

		it("Leaves a word alone when there is nothing to say about it", function() {
			expect(style.decorate("word", undefined)).to.equal("word");
			expect(style.decorate("word", {})).to.equal("word");
		});
	});
});
