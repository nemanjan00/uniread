#!/usr/bin/env node

const updateNotifier = require("update-notifier");
const pkg = require("../package.json");

const fs = require("fs");

const uniread = require("../").uniread;
const spritz = require("../").spritz;

let timeout = false;

const run = () => {
	let file = process.argv[process.argv.length - 1];

	if(!fs.existsSync(file)){
		console.log("File does not exist");
		process.exit(1);
	}

	uniread.getBook(file).then((book) => {
		spritz(book);
	}).catch(() => {
		console.log("Book format not supported. ");
		process.exit(1);
	});
};

setTimeout(() => {
	if(!timeout){
		timeout = true;
		run();
	}
}, 2000);

const notifier = updateNotifier({
	pkg: pkg,
	callback: (error, response) => {
		if(!timeout){
			timeout = true;
			if(error){
				run();
			}

			if(response.type == "latest"){
				run();
			} else {
				notifier.update = response;

				notifier.notify({defer: false, isGlobal: true});

				setTimeout(run, 2000);
			}
		}
	}
});

