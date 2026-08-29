// PalmDOC (LZ77 variant) decompression, as used by uncompressed and
// compression type 2 mobi books

const NONE = 1;
const PALMDOC = 2;
const HUFF_CDIC = 17480;

const decompress = (data) => {
	const out = [];

	let i = 0;

	while(i < data.length){
		const byte = data[i];

		i += 1;

		if(byte === 0){
			out.push(0);
		} else if(byte <= 8){
			// Literal run
			for(let n = 0; n < byte && i < data.length; n++){
				out.push(data[i]);

				i += 1;
			}
		} else if(byte <= 0x7f){
			out.push(byte);
		} else if(byte <= 0xbf){
			// Back reference into what has been written already
			const pair = (byte << 8) | data[i];

			i += 1;

			const distance = (pair >> 3) & 0x07ff;
			const length = (pair & 7) + 3;

			if(distance === 0 || distance > out.length){
				break;
			}

			for(let n = 0; n < length; n++){
				out.push(out[out.length - distance]);
			}
		} else {
			// A space plus one character
			out.push(0x20);
			out.push(byte ^ 0x80);
		}
	}

	return Buffer.from(out);
};

module.exports = {
	NONE: NONE,
	PALMDOC: PALMDOC,
	HUFF_CDIC: HUFF_CDIC,
	decompress: decompress
};
