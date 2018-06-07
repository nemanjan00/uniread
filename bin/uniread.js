#!/usr/bin/env node

const uniread = require("../").uniread;
const spritz = require("../").spritz;

uniread.getBook(process.argv[process.argv.length - 1]).then((book) => {
	spritz(book);
});


