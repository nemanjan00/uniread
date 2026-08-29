const dateformat = require("dateformat");

const blessed = require("blessed");

// Only the grid, never the package index: that pulls in the markdown widget
// and with it marked-terminal, which fails to parse on older node
const Grid = require("blessed-contrib/lib/layout/grid");

const picker = require("./picker");
const timing = require("./timing");
const style = require("./style");

// Words between progress writes, so resuming stays accurate without
// hammering the disk on every tick
const SAVE_EVERY = 50;

// `options` is optional: {file, library, open} enables resume and the recent
// book picker, and `open` is what loads another book (file => Promise<book>)
module.exports = (book, options) => {
	options = options || {};

	const player = {
		_speed: 250,
		_book: undefined,
		_current: 0,

		// Blank the screen between words, so each one is read rather than
		// half remembered from the pixels the last one left behind
		_flash: true,

		// Colour, emphasis and quotation marks taken from the words
		// themselves
		_styled: true,
		_styles: [],

		_file: options.file,
		_library: options.library,
		_open: options.open,
		_saved: 0,

		// Set while the chapter list is following playback, so its "select
		// item" event is not mistaken for the reader picking a chapter
		_following: false,

		_screen: undefined,
		_text: undefined,
		_grid: undefined,
		_chapterList: undefined,

		_tick: undefined,

		_chapter: -1,

		_report: () => {
			return "Speed: " + player._speed + "ms / " + (Math.round(60 * 1000 / player._speed)) + " WPM\nProgress: " + player._current + "/" + player._book.text.length + "\nTime left: " + player._niceTime() + "\nFlash: " + (player._flash ? "on" : "off") + "  Style: " + (player._styled ? "on" : "off");
		},

		_niceTime: () => {
			let wordsPerSeconds = (1 / player._speed * 1000);

			let timeLeft = Math.round((player._book.text.length - player._current)/wordsPerSeconds);

			timeLeft = new Date(timeLeft *1000);

			let response = dateformat(timeLeft, "UTC:hh:MM:ss");

			if(timeLeft < 3600 * 1000){
				response = response.replace("12", "00");
			}

			return response;
		},

		_init: (book) => {
			const screenOptions = {debug: true};

			// A book arriving on stdin leaves nothing there to read keys from
			if(options.input){
				screenOptions.input = options.input;
			}

			player._screen = blessed.screen(screenOptions);

			var grid = new Grid({rows: 12, cols: 12, screen: player._screen});

			player._textBox = grid.set(0, 6, 2, 6, blessed.box, {
				label: "Book"
			});

			book.links = book.links.filter((chapter) => chapter.name !== undefined);

			let chapters = book.links.map(link => link.name);

			player._book = book;
			player._styles = style.styles(book.text);
			player._current = player._resumeAt(book);
			player._saved = player._current;

			player._reportBox = grid.set(2, 6, 2, 6, blessed.box, {
				label: "Info"
			});

			player._reportText = blessed.text({
				label: player._report()
			});

			player._reportBox.append(player._reportText);

			player._chapterList = grid.set(0, 0, 11, 6, blessed.list, {
				style: {
					selected: {
						bg: "red"
					}
				},
				label: "Chapters",
				items: chapters,
				mouse: true
			});

			let help = grid.set(11, 0, 1, 12, blessed.text, {
				style: {
					selected: {
						bg: "red"
					}
				},
				label: "help",
			});

			help.append(blessed.text({label: "space pause | j/k chapter | -/+ speed | h/l word | f flash | s style | C-k recent | q escape "}));

			player._text = blessed.text({
				label: "Book",

				// So the word can carry colour and emphasis
				tags: true
			});

			player._textBox.append(player._text);

			player._screen.key(["escape", "q", "C-c"], function() {
				player._persist();

				return process.exit(0);
			});

			player._screen.key(["C-k"], function() {
				player._pickRecent();
			});

			player._screen.key(["f"], function() {
				player._flash = !player._flash;

				player._draw();
			});

			player._screen.key(["s"], function() {
				player._styled = !player._styled;

				player._draw();
			});

			player._screen.key(["space"], function() {
				player.togglePlay();

				player._draw();
			});

			player._screen.key(["j", "down"], function() {
				player._chapterList.down();

				player._draw();
			});

			player._screen.key(["k", "up"], function() {
				player._chapterList.up();

				player._draw();
			});

			player._screen.key(["-"], function() {
				player._speed += 10;

				player._draw();
			});

			player._screen.key(["+", "="], function() {
				if(player._speed > 10){
					player._speed -= 10;
				}

				player._draw();
			});

			player._screen.key(["h", "left"], function() {
				if(player._current > 0){
					player._current--;
				}

				player._draw();
			});

			player._screen.key(["l", "right"], function() {
				if(player._current < player._book.text.length - 1){
					player._current++;
				}

				player._draw();
			});

			player._screen.render();

			player._chapterList.on("select item", (element, key) => {
				if(player._following){
					return;
				}

				player._current = player._book.links[key].word;

				player._draw();
			});

			// Starting stopped gives the reader a moment to find the word
			if(options.paused){
				player._draw();
			} else {
				player.togglePlay();
			}
		},

		// Where this book was left off, if the library knows about it
		_resumeAt: (book) => {
			if(!player._library || !player._file){
				return 0;
			}

			return player._library.position(player._file, book.text.length);
		},

		_persist: () => {
			if(!player._library || !player._file){
				return;
			}

			player._saved = player._current;

			try {
				player._library.save(player._file, {
					title: player._book.title || player._file,
					position: player._current,
					total: player._book.text.length
				});
			} catch (error) {
				// Losing progress must never take the reader down
				player._screen.debug("Could not save progress: " + error.message);
			}
		},

		_pickRecent: () => {
			if(!player._library || !player._open){
				return;
			}

			const playing = player._tick !== undefined;

			if(playing){
				player.togglePlay();
			}

			player._persist();

			picker.choose(player._screen, player._library.list()).then((file) => {
				if(file === undefined || file === player._file){
					if(playing){
						player.togglePlay();
					}

					return;
				}

				player._loadFile(file);
			});
		},

		_loadFile: (file) => {
			player._text.setLabel("Loading...");
			player._screen.render();

			player._open(file).then((book) => {
				player._file = file;

				player._swapBook(book);
			}).catch((error) => {
				player._screen.debug("Could not open " + file + ": " + error.message);

				player._text.setLabel("Could not open book");
				player._screen.render();
			});
		},

		_swapBook: (book) => {
			book.links = book.links.filter((chapter) => chapter.name !== undefined);

			player._book = book;
			player._styles = style.styles(book.text);
			player._current = player._resumeAt(book);
			player._saved = player._current;
			player._saved = player._current;
			player._chapter = -1;

			player._chapterList.setItems(book.links.map((link) => link.name));

			player._draw();

			if(player._tick === undefined){
				player.togglePlay();
			}
		},

		// Moves the chapter list without it looking like a chapter jump
		_follow: (index) => {
			player._following = true;

			player._chapterList.select(index);

			player._following = false;
		},

		_draw: () => {
			player._reportText.setLabel(player._report());

			player._text.setLabel(player._focusText(player._book.text[player._current], player._styleAt(player._current)));
			player._screen.render();
		},

		_atEnd: () => {
			return player._current >= player._book.text.length;
		},

		// Shows the word at _current, then schedules the next one. With
		// flashing on, the screen is blanked for the last stretch of the
		// word's time rather than the next word replacing it in place
		_tickFunction: () => {
			if(player._atEnd()){
				player._tick = undefined;

				return;
			}

			const word = player._book.text[player._current];

			player._screen.debug(word);

			player._followChapter();

			player._draw();

			player._current++;

			if(Math.abs(player._current - player._saved) >= SAVE_EVERY){
				player._persist();
			}

			const hold = timing.hold(word, player._speed);
			const gap = timing.gap(player._speed, player._flash);

			// Nothing follows the last word, so leave it on screen
			if(gap === 0 || player._atEnd()){
				player._tick = setTimeout(player._tickFunction, hold);

				return;
			}

			player._tick = setTimeout(() => {
				player._blank();

				player._tick = setTimeout(player._tickFunction, gap);
			}, Math.max(hold - gap, 1));
		},

		_followChapter: () => {
			let currentChapter = -1;

			player._book.links.some((link, key) => {
				currentChapter = key - 1;

				return link.word > player._current + 1;
			});

			if(currentChapter !== player._chapter){
				player._chapter = currentChapter;

				player._follow(currentChapter);
			}
		},

		_blank: () => {
			player._text.setLabel(player._focusText(""));
			player._screen.render();
		},

		_styleAt: (key) => {
			return player._styled ? player._styles[key] : undefined;
		},

		_focusText: (text, wordStyle) => {
			text = text || "";

			let length = Math.ceil((7 - text.length) / 2);

			// Markup would throw the centring out, so the word is padded
			// after it is decorated, never before
			text = style.decorate(text, wordStyle);

			for(let i = length; i > 0; i--){
				text = " " + text;
			}

			return text+"\n   ^";
		},

		togglePlay: () => {
			if(player._tick !== undefined){
				clearTimeout(player._tick);
				player._tick = undefined;

				player._persist();
			} else if(!player._atEnd()){
				player._tickFunction();
			}
		}
	};

	return player._init(book);
};
