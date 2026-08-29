const fileType = require("file-type");
const fs = require("fs");
const path = require("path");

const engines = {
	epub: require("./epub"),
	html: require("./html"),
	markdown: require("./markdown"),
	pdf: require("./pdf"),
	text: require("./text")
};

// `file-type` works on magic bytes, which plain text formats do not have
const extensions = {
	".htm": engines.html,
	".html": engines.html,
	".markdown": engines.markdown,
	".md": engines.markdown,
	".text": engines.text,
	".txt": engines.text,
	".xhtml": engines.html
};

module.exports = {
	engines: engines,
	extensions: extensions,
	_detectEngine: (filename) => {
		return fs.promises.readFile(filename).then((data) => {
			return fileType.fromBuffer(data);
		}).then((type) => {
			if(type && engines[type.ext] !== undefined){
				return engines[type.ext];
			}

			const extension = extensions[path.extname(filename).toLowerCase()];

			if(extension !== undefined){
				return extension;
			}

			return false;
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
