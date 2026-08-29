#!/usr/bin/env node

const updateNotifier = require("update-notifier");
const pkg = require("../package.json");

const fs = require("fs");

const uniread = require("../");

const cli = uniread.interfaces.cli;
const recent = uniread.interfaces.recent;
const spritz = uniread.methods.spritz;

const library = uniread.library.open();

const open = (file) => {
	return spritz.getBook(file);
};

const read = (file) => {
	open(file).then((book) => {
		cli(book, {
			file: file,
			library: library,
			open: open
		});
	}).catch(() => {
		console.log("Book format not supported");
		process.exit(1);
	});
};

const run = () => {
	// No book given: pick up whatever was read last
	if(process.argv.length < 3){
		return recent(library).then((file) => {
			if(file === undefined){
				console.log("No recent books. Run: uniread <book>");
				process.exit(0);
			}

			read(file);
		});
	}

	const file = process.argv[process.argv.length - 1];

	if(!fs.existsSync(file)){
		console.log("File does not exist");
		process.exit(1);
	}

	read(file);
};

// The version check runs in the background, so this only reports what a
// previous run already found
const notifier = updateNotifier({pkg: pkg});

notifier.notify({defer: false, isGlobal: true});

if(notifier.update){
	// Leave the notice on screen before the reader takes over
	setTimeout(run, 2000);
} else {
	run();
}
