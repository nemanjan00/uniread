const theme = require("./theme");

const dracula = theme.PALETTE;

// Words that name a colour are shown in it, in the shade the rest of the
// reader is drawn in. Colours the palette has no name for are given the
// nearest hex, which blessed accepts
const COLOURS = {
	red: dracula.red,
	green: dracula.green,
	blue: "#6272ff",
	yellow: dracula.yellow,
	cyan: dracula.cyan,
	magenta: dracula.pink,
	pink: dracula.pink,
	purple: dracula.purple,
	violet: dracula.purple,
	orange: dracula.orange,
	white: dracula.foreground,
	black: dracula.background,
	grey: dracula.comment,
	gray: dracula.comment,
	silver: dracula.comment,
	gold: dracula.yellow,
	beige: "#d7d7af",
	brown: "#875f00",
	indigo: "#5f00af",
	turquoise: dracula.cyan,
	teal: "#008080",
	navy: "#000087",
	olive: "#808000",
	maroon: "#800000",
	crimson: dracula.red,
	scarlet: dracula.red,
	lime: dracula.green
};

// A sentence ends on one of these; an exclamation mark makes the whole
// sentence emphatic
const ENDS_SENTENCE = /[.?!]/;
const EXCLAIMS = /!/;

// A word counts as a repeat if it turned up in the last few words or earlier
// in the same sentence. Repetition blindness makes the second one easy to miss
const REPEAT_WINDOW = 10;
const REPEAT_COLOUR = dracula.orange;

// Function words repeat constantly and carry no meaning to miss
const COMMON = [
	"the", "and", "but", "for", "nor", "yet", "was", "were", "are", "his",
	"her", "its", "their", "our", "your", "that", "this", "with", "from",
	"had", "has", "have", "not", "you", "she", "him", "they", "them", "who",
	"what", "when", "then", "than", "there", "here", "been", "into", "out",
	"all", "any", "one", "two", "own", "off", "own", "how", "why", "did"
].reduce((set, word) => {
	set[word] = true;

	return set;
}, {});

// Straight and typographic quotes. An apostrophe is left out on purpose, or
// every contraction would open a quotation
const OPENS_QUOTE = /["“«]/;
const CLOSES_QUOTE = /["”»]/;

const bare = (word) => {
	return word.replace(/[^A-Za-z]/g, "").toLowerCase();
};

const colourOf = (word) => {
	return COLOURS[bare(word)];
};

const isRepeat = (word, recent, sentence) => {
	if(word.length < 3 || COMMON[word]){
		return false;
	}

	return recent.indexOf(word) !== -1 || sentence.indexOf(word) !== -1;
};

// One style per word, worked out in a single pass over the book
const styles = (words) => {
	const result = words.map(() => ({}));

	let quoted = false;
	let sentence = [];
	let said = [];
	let recent = [];

	words.forEach((word, key) => {
		const opens = OPENS_QUOTE.test(word);
		const closes = CLOSES_QUOTE.test(word);

		// A word can both open and close, and a straight quote does both, so
		// the word itself always counts as quoted
		result[key].quoted = quoted || opens || closes;

		if(opens && !quoted){
			quoted = true;
		} else if(closes && quoted){
			quoted = false;
		}

		const colour = colourOf(word);

		if(colour){
			result[key].colour = colour;
		}

		const plain = bare(word);

		if(isRepeat(plain, recent, said)){
			result[key].repeated = true;
		}

		if(plain !== ""){
			said.push(plain);

			recent.push(plain);

			if(recent.length > REPEAT_WINDOW){
				recent.shift();
			}
		}

		sentence.push(key);

		if(ENDS_SENTENCE.test(word)){
			if(EXCLAIMS.test(word)){
				sentence.forEach((index) => {
					result[index].emphatic = true;
				});
			}

			sentence = [];
			said = [];
		}
	});

	return result;
};

// Wraps a word in blessed markup. Terminals reached through blessed have no
// italic, so a quotation is underlined instead
const decorate = (word, style) => {
	if(!style){
		return word;
	}

	let open = "";
	let close = "";

	// What the word says comes first; a repeat is only marked when the word
	// has no colour of its own
	const colour = style.colour || (style.repeated ? REPEAT_COLOUR : undefined);

	if(colour){
		open += "{" + colour + "-fg}";
		close = "{/" + colour + "-fg}" + close;
	}

	if(style.emphatic){
		open += "{bold}";
		close = "{/bold}" + close;
	}

	if(style.quoted){
		open += "{underline}";
		close = "{/underline}" + close;
	}

	return open + word + close;
};

module.exports = {
	COLOURS: COLOURS,
	REPEAT_COLOUR: REPEAT_COLOUR,
	REPEAT_WINDOW: REPEAT_WINDOW,
	styles: styles,
	decorate: decorate
};
