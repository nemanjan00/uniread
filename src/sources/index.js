const fileType = require("file-type");
const fs = require("fs");

const engines = {
	epub: require("./epub"),
	pdf: require("./pdf"),
	text: require("./text")
};

module.exports = {
	engines: engines,
	_detectEngine: (filename) => {
		return fs.promises.readFile(filename).then((data) => {
			return fileType.fromBuffer(data);
		}).then((type) => {
			if(type && engines[type.ext] !== undefined){
				return engines[type.ext];
			}

			// `file-type` does not detect plaintext files
			if(filename.endsWith(".txt")) {
				return engines.text;
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
