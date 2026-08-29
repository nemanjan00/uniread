const fs = require("fs");
const path = require("path");

const markup = require("../markup");
const palmdoc = require("./palmdoc");

// Palm database container, as described by the MOBI format documentation
const PALM_HEADER = 78;
const RECORD_INFO = 8;

const encodingOf = (code) => {
	// 65001 is utf-8, everything else in the wild is cp1252, which latin1 is
	// close enough to for reading
	return code === 65001 ? "utf8" : "latin1";
};

// Records carry trailing bookkeeping bytes that are not part of the text
const trailingSize = (record) => {
	let end = record.length;

	let bitpos = 0;
	let result = 0;

	while(true){
		const byte = record[end - 1];

		result |= (byte & 0x7f) << bitpos;

		bitpos += 7;
		end -= 1;

		if((byte & 0x80) !== 0 || bitpos >= 28 || end === 0){
			return result;
		}
	}
};

const trimTrailing = (record, flags) => {
	let trimmed = record;

	// Every set bit above the first marks one trailing entry
	for(let bit = 1; bit < 16; bit++){
		if((flags & (1 << bit)) === 0){
			continue;
		}

		const size = trailingSize(trimmed);

		if(size <= 0 || size > trimmed.length){
			break;
		}

		trimmed = trimmed.slice(0, trimmed.length - size);
	}

	// The lowest bit marks a multibyte character split across records
	if((flags & 1) !== 0 && trimmed.length > 0){
		const overlap = (trimmed[trimmed.length - 1] & 3) + 1;

		trimmed = trimmed.slice(0, Math.max(trimmed.length - overlap, 0));
	}

	return trimmed;
};

module.exports = (filename) => {
	const book = {
		_html: undefined,
		_title: undefined,

		_init: () => {
			return fs.promises.readFile(filename).then((data) => {
				book._parse(data);

				return book;
			});
		},

		_parse: (data) => {
			if(data.length < PALM_HEADER || data.toString("latin1", 60, 68) !== "BOOKMOBI"){
				throw new Error("Not a mobi book");
			}

			const records = book._records(data);
			const header = records[0];

			const compression = header.readUInt16BE(0);

			if(header.readUInt16BE(12) !== 0){
				throw new Error("This mobi book is encrypted");
			}

			if(compression === palmdoc.HUFF_CDIC){
				throw new Error("This mobi book uses HUFF/CDIC compression, which is not supported");
			}

			if(compression !== palmdoc.NONE && compression !== palmdoc.PALMDOC){
				throw new Error("Unknown mobi compression");
			}

			const textRecords = header.readUInt16BE(8);
			const headerLength = header.readUInt32BE(20);
			const encoding = encodingOf(header.readUInt32BE(28));

			// Only present on the longer header revisions
			const flags = headerLength >= 0xe4 ? header.readUInt16BE(242) : 0;

			book._title = book._readTitle(header, encoding);

			const text = [];

			for(let i = 1; i <= textRecords && i < records.length; i++){
				const record = trimTrailing(records[i], flags);

				text.push(compression === palmdoc.PALMDOC ? palmdoc.decompress(record) : record);
			}

			book._html = Buffer.concat(text).toString(encoding);
		},

		// Palm databases index their records by absolute offset
		_records: (data) => {
			const count = data.readUInt16BE(76);
			const offsets = [];

			for(let i = 0; i < count; i++){
				offsets.push(data.readUInt32BE(PALM_HEADER + i * RECORD_INFO));
			}

			return offsets.map((offset, key) => {
				const end = key + 1 < offsets.length ? offsets[key + 1] : data.length;

				return data.slice(offset, end);
			});
		},

		_readTitle: (header, encoding) => {
			const offset = header.readUInt32BE(84);
			const length = header.readUInt32BE(88);

			if(length === 0 || offset + length > header.length){
				return undefined;
			}

			const title = header.toString(encoding, offset, offset + length).trim();

			return title === "" ? undefined : title;
		},

		getTitle: () => {
			return book._title || filename;
		},

		getChapters: () => {
			return Promise.resolve(markup.chapters(book._html, path.basename(filename)));
		}
	};

	return book._init();
};
