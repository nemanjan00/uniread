// Words that end a clause get twice as long, which is roughly where a reader
// wants to breathe
const PUNCTUATION = /[,.?!;:]/;

// The blank between two words, as a share of the time a word is on screen.
// Long enough for the eye to register that the word went away, short enough
// not to eat into reading time
const GAP_SHARE = 0.15;
const GAP_LIMIT = 60;

const hold = (word, speed) => {
	return (PUNCTUATION.test(word || "") ? 2 : 1) * speed;
};

// How long the screen stays empty before the next word. Zero when flashing is
// off, and always shorter than the word it follows
const gap = (speed, flash) => {
	if(!flash){
		return 0;
	}

	return Math.max(Math.min(Math.round(speed * GAP_SHARE), GAP_LIMIT), 1);
};

module.exports = {
	GAP_LIMIT: GAP_LIMIT,
	hold: hold,
	gap: gap
};
