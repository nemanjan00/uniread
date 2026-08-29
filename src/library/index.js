const fs = require("fs");
const os = require("os");
const path = require("path");

const MAX_ENTRIES = 50;

const dataHome = () => {
	return process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
};

const create = (storePath) => {
	const library = {
		path: storePath,

		_read: () => {
			let raw;

			try {
				raw = fs.readFileSync(library.path, "utf8");
			} catch {
				// No library yet, or it is unreadable
				return [];
			}

			let entries;

			try {
				entries = JSON.parse(raw);
			} catch {
				// A corrupt library should not stop the reader
				return [];
			}

			if(!Array.isArray(entries)){
				return [];
			}

			return entries.filter((entry) => entry && typeof entry.file === "string");
		},

		_write: (entries) => {
			fs.mkdirSync(path.dirname(library.path), {recursive: true});

			fs.writeFileSync(library.path, JSON.stringify(entries, undefined, "\t"));
		},

		// Most recently read first
		list: () => {
			return library._read().sort((a, b) => (b.opened || 0) - (a.opened || 0));
		},

		get: (file) => {
			const key = path.resolve(file);

			return library._read().find((entry) => entry.file === key);
		},

		// Where to resume `file`, clamped to a book of `total` words
		position: (file, total) => {
			const entry = library.get(file);

			if(!entry || typeof entry.position !== "number" || entry.position < 0){
				return 0;
			}

			if(total !== undefined && entry.position >= total){
				return 0;
			}

			return entry.position;
		},

		save: (file, progress) => {
			const key = path.resolve(file);

			const entries = library._read().filter((entry) => entry.file !== key);

			entries.unshift({
				file: key,
				title: progress.title,
				position: progress.position,
				total: progress.total,
				opened: progress.opened || Date.now()
			});

			library._write(entries.slice(0, MAX_ENTRIES));

			return entries[0];
		},

		remove: (file) => {
			const key = path.resolve(file);

			library._write(library._read().filter((entry) => entry.file !== key));
		},

		// Drops books that have since been deleted or moved
		prune: () => {
			library._write(library._read().filter((entry) => fs.existsSync(entry.file)));

			return library.list();
		}
	};

	return library;
};

module.exports = {
	MAX_ENTRIES: MAX_ENTRIES,
	create: create,
	defaultPath: path.join(dataHome(), "uniread", "library.json"),
	open: () => create(module.exports.defaultPath)
};
