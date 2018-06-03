const fileType = require("file-type");
const fs = require("fs");

const engines = {
	epub: require("./epub")
};
	

module.exports = {
	engines: engines,
	_detectEngine: (filename) => {
		const data = fs.readFileSync(filename);

		const type = fileType(data);

		if(!type){
			return false;
		}

		if(engines[type.ext] !== undefined){
			return engines[type.ext];
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

