#!/usr/bin/env node

const updateNotifier = require("update-notifier");
const pkg = require("../package.json");

const fs = require("fs");

const uniread = require("../");

const cli = uniread.interfaces.cli;
const recent = uniread.interfaces.recent;
const spritz = uniread.methods.spritz;
const stream = uniread.sources.stream;

const library = uniread.library.open();

const args = process.argv.slice(2).filter((argument) => !argument.startsWith("-"));

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

// Text piped in has taken over stdin, so the reader has to get its key presses
// straight from the terminal
const readStdin = () => {
	return stream(process.stdin, "Piped text").then((book) => {
		return spritz.transformBook(book);
	}).then((book) => {
		let input;

		try {
			input = fs.createReadStream("/dev/tty");
		} catch {
			// Without a terminal the reader still shows, it just cannot be
			// driven
		}

		cli(book, {
			open: open,
			input: input
		});
	}).catch(() => {
		console.log("Could not read the piped text");
		process.exit(1);
	});
};

const run = () => {
	if(args.length === 0){
		if(!process.stdin.isTTY){
			return readStdin();
		}

		// No book given: pick up whatever was read last
		return recent(library).then((file) => {
			if(file === undefined){
				console.log("No recent books. Run: uniread <book>");
				process.exit(0);
			}

			read(file);
		});
	}

	const file = args[args.length - 1];

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
