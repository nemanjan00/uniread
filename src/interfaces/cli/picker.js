const blessed = require("blessed");

const percent = (entry) => {
	if(!entry.total){
		return 0;
	}

	return Math.round(entry.position / entry.total * 100);
};

const label = (entry) => {
	return (entry.title || entry.file) + " (" + percent(entry) + "%)";
};

// Renders a recent book list over `screen`, resolving with the chosen file, or
// with undefined when the user backs out
const choose = (screen, entries) => {
	return new Promise((resolve) => {
		if(entries.length === 0){
			return resolve(undefined);
		}

		const list = blessed.list({
			parent: screen,
			top: "center",
			left: "center",
			width: "80%",
			height: "50%",
			border: "line",
			label: "Recent books (enter to open, escape to cancel)",
			keys: true,
			vi: true,
			mouse: true,
			style: {
				selected: {
					bg: "red"
				}
			},
			items: entries.map(label)
		});

		const previousFocus = screen.focused;
		const previousGrab = screen.grabKeys;

		const close = (file) => {
			screen.grabKeys = previousGrab;

			list.destroy();

			if(previousFocus){
				previousFocus.focus();
			}

			screen.render();

			resolve(file);
		};

		list.key(["escape", "q", "C-c"], () => close(undefined));

		list.on("select", (item, index) => close(entries[index].file));

		// Keep the reader's global keys from firing while the list is up
		screen.grabKeys = true;

		list.focus();
		screen.render();
	});
};

module.exports = {
	percent: percent,
	label: label,
	choose: choose
};
