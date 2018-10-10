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
		const data = fs.readFileSync(filename);

		const type = fileType(data);

		if(type !== null && engines[type.ext] !== undefined){
			return engines[type.ext];
		}

		// `file-type` does not detect plaintext files
		if(filename.endsWith(".txt")) {
			return engines.text;
		}

		return false;
	},
	detectEngine: (filename) => {
		let engine = module.exports._detectEngine(filename);

		if(engine){
			return engine(filename);
		}

		return Promise.reject("Engine not found");
	}
};

