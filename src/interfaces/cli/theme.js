// The Dracula palette. Terminals that only know sixteen colours are given the
// nearest shade by blessed, so the reader still looks right on a plain tty
const PALETTE = {
	background: "#282a36",
	currentLine: "#44475a",
	foreground: "#f8f8f2",
	comment: "#6272a4",
	cyan: "#8be9fd",
	green: "#50fa7b",
	orange: "#ffb86c",
	pink: "#ff79c6",
	purple: "#bd93f9",
	red: "#ff5555",
	yellow: "#f1fa8c"
};

// Every box in the reader is drawn the same way
const box = {
	fg: PALETTE.foreground,
	bg: PALETTE.background,
	border: {
		fg: PALETTE.comment,
		bg: PALETTE.background
	},
	label: {
		fg: PALETTE.purple,
		bg: PALETTE.background
	}
};

const list = Object.assign({}, box, {
	selected: {
		fg: PALETTE.background,
		bg: PALETTE.purple
	},
	item: {
		fg: PALETTE.foreground,
		bg: PALETTE.background
	}
});

module.exports = {
	PALETTE: PALETTE,
	screen: {
		fg: PALETTE.foreground,
		bg: PALETTE.background
	},
	box: box,
	list: list,
	help: Object.assign({}, box, {
		label: {
			fg: PALETTE.comment,
			bg: PALETTE.background
		}
	})
};
