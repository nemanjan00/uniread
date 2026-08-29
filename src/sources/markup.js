const htmlToText = require("html-to-text");

// Chapters are split on the top two heading levels, which is as close to a
// table of contents as a bare document gets
const HEADING = /<h([12])[^>]*>([\s\S]*?)<\/h\1>/gi;

const toText = (html) => {
	return htmlToText.convert(html, {
		selectors: [
			{selector: "a", options: {ignoreHref: true}},
			{selector: "img", format: "skip"},

			// Headings are read out like any other word, so shouting them
			// helps nobody
			{selector: "h1", options: {uppercase: false}},
			{selector: "h2", options: {uppercase: false}},
			{selector: "h3", options: {uppercase: false}},
			{selector: "h4", options: {uppercase: false}},
			{selector: "h5", options: {uppercase: false}},
			{selector: "h6", options: {uppercase: false}}
		]
	});
};

// [{title, content}] for a whole html document, `fallback` titling a document
// that has no headings to split on
const chapters = (html, fallback) => {
	const found = [];

	let match;

	HEADING.lastIndex = 0;

	while((match = HEADING.exec(html)) !== null){
		found.push({
			title: toText(match[2]).trim() || "Untitled",
			start: match.index
		});
	}

	if(found.length === 0){
		return [{
			id: 1,
			title: fallback,
			content: toText(html)
		}];
	}

	// Anything before the first heading is still part of the book
	if(found[0].start > 0 && toText(html.slice(0, found[0].start)).trim() !== ""){
		found.unshift({
			title: "Beginning",
			start: 0
		});
	}

	return found.map((chapter, key) => {
		const next = found[key + 1];

		return {
			id: key + 1,
			title: chapter.title,
			content: toText(html.slice(chapter.start, next ? next.start : html.length))
		};
	});
};

module.exports = {
	toText: toText,
	chapters: chapters
};
