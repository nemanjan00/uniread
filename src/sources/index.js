const fileType = require("file-type");
const fs = require("fs");
const path = require("path");

const engines = {
	docx: require("./docx"),
	epub: require("./epub"),
	fb2: require("./fb2"),
	html: require("./html"),
	markdown: require("./markdown"),
	mobi: require("./mobi"),
	pdf: require("./pdf"),
	text: require("./text")
};

const stream = require("./stream");

// `file-type` works on magic bytes, which plain text formats do not have
const extensions = {
	".azw": engines.mobi,
	".docx": engines.docx,
	".fb2": engines.fb2,
	".htm": engines.html,
	".html": engines.html,
	".markdown": engines.markdown,
	".md": engines.markdown,
	".mobi": engines.mobi,
	".prc": engines.mobi,
	".text": engines.text,
	".txt": engines.text,
	".xhtml": engines.html
};

// Enough of the file to tell text from binary
const SAMPLE = 8192;

// Text formats have no magic bytes, so anything unrecognised that reads like
// text is treated as plain text rather than refused
const looksLikeText = (data) => {
	const sample = data.slice(0, SAMPLE);

	if(sample.length === 0){
		return false;
	}

	let control = 0;

	for(let i = 0; i < sample.length; i++){
		const byte = sample[i];

		// A null byte means binary, whatever else the file holds
		if(byte === 0){
			return false;
		}

		if(byte < 32 && byte !== 9 && byte !== 10 && byte !== 13){
			control += 1;
		}
	}

	return control / sample.length < 0.05;
};

module.exports = {
	engines: engines,
	extensions: extensions,
	looksLikeText: looksLikeText,
	stream: stream,
	_detectEngine: (filename) => {
		return fs.promises.readFile(filename).then((data) => {
			return fileType.fromBuffer(data).then((type) => {
				if(type && engines[type.ext] !== undefined){
					return engines[type.ext];
				}

				const extension = extensions[path.extname(filename).toLowerCase()];

				if(extension !== undefined){
					return extension;
				}

				if(looksLikeText(data)){
					return engines.text;
				}

				return false;
			});
		});
	},
	detectEngine: (filename) => {
		return module.exports._detectEngine(filename).then((engine) => {
			if(engine){
				return engine(filename);
			}

			return Promise.reject(new Error("Engine not found"));
		});
	}
};
