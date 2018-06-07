#!/usr/bin/env node

const updateNotifier = require("update-notifier");
const pkg = require("../package.json");

const uniread = require("../").uniread;
const spritz = require("../").spritz;

const run = () => {
	uniread.getBook(process.argv[process.argv.length - 1]).then((book) => {
		spritz(book);
	});
};

const notifier = updateNotifier({
	pkg: pkg,
	callback: (error, response) => {
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
});

