// Reads a book from a stream rather than a file, so text can be piped in
module.exports = (stream, title) => {
	return new Promise((resolve, reject) => {
		const chunks = [];

		stream.on("data", (chunk) => chunks.push(chunk));
		stream.on("error", reject);

		stream.on("end", () => {
			const text = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");

			resolve({
				getTitle: () => title,
				getChapters: () => Promise.resolve([{
					id: 1,
					title: title,
					content: text
				}])
			});
		});
	});
};
