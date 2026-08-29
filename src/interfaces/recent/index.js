const blessed = require("blessed");

const picker = require("../cli/picker");

// Standalone recent book picker, for `uniread` with no arguments. Resolves
// with the chosen file, or undefined when there is nothing to pick
module.exports = (library) => {
	const entries = library.prune();

	if(entries.length === 0){
		return Promise.resolve(undefined);
	}

	const screen = blessed.screen({});

	screen.key(["C-c"], () => process.exit(0));

	return picker.choose(screen, entries).then((file) => {
		screen.destroy();

		return file;
	});
};
