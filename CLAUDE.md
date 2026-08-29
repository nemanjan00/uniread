# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The project uses yarn, but npm works equally well — both lockfiles are kept in sync.

```bash
yarn                       # install
yarn get-books             # download sample books into ./books (tests need these)
yarn lint                  # eslint, check only
yarn lint-fix              # eslint --fix
yarn test                  # full mocha suite
yarn coverage              # nyc + mocha
yarn watch-cli             # nodemon on bin/uniread.js
```

Running a subset of tests — `tests/index.js` is the only entry point mocha is
pointed at, and it `require`s each suite, so target tests by name rather than by
file:

```bash
npx mocha --timeout 60000 tests/index.js --grep "Library"
npx mocha --timeout 60000 tests/index.js --grep "Resumes where the book"
```

The first suite (`tests/devTools`) shells out to `devScripts/getBooks.sh`, which
downloads sample books over the network; the ePub and pdf suites read those
files from `./books`. The long timeout exists for that download.

## Architecture

A Spritz-style speed reader: a book is flattened into one flat array of words,
and the terminal UI flashes them one at a time.

`index.js` → `src/index.js` exposes four namespaces, which is also the pipeline:

```
sources  →  methods/spritz  →  interfaces/cli
                                     ↕
                                  library
```

**`src/sources/`** — one directory per format (epub, pdf, mobi, docx, fb2,
markdown, html, text), each exporting `(filename) => Promise<book>`. Every
engine must satisfy the same contract:

- `getTitle() => string`
- `getChapters() => Promise<[{id, title, content}]>` where `content` is text

`src/sources/index.js` sniffs the format with `file-type` (async — it returns a
promise) and falls back to the `extensions` map, since the text formats have no
magic bytes. `detectEngine` must always reject rather than throw, including for
unreadable files. Adding a format means adding a directory, registering it in
`engines`, and adding any extensions it needs; the layers above need no changes.

Chapters come from whatever structure the format itself carries: the epub
spine, the pdf outline (resolved from bookmark destinations to page indices, so
chapter boundaries land on page edges), fb2 sections, and the top two heading
levels for everything that reduces to html. Text has none, so it returns a
single chapter. Anything before the first heading or bookmark becomes a
"Beginning" chapter rather than being dropped.

`src/sources/markup.js` holds the shared html-to-text conversion and the
heading splitter. Most sources reduce their format to html and hand it over —
markdown through `marked`, docx through `mammoth`, mobi after decompression —
so markup handling stays consistent across formats. Prefer that route when
adding a format.

Detection has a last resort: anything unrecognised whose bytes look like text
(`looksLikeText`) is read as plain text, so files with no extension still open.
`sources.stream` builds the same kind of book from a stream rather than a file.

`src/sources/mobi/` is the one hand-written parser, because no maintained
CommonJS mobi library exists: it walks the Palm database records, strips the
trailing bookkeeping bytes each record carries, and decompresses the PalmDOC
LZ77 stream in `palmdoc.js`. HUFF/CDIC compressed and DRM protected books are
detected and rejected with a specific message rather than producing rubbish.

Sources must hand back native promises — `mammoth` returns its own
implementation, so the docx source wraps it.

**`src/methods/spritz/`** — `transformChapters` is the core transform: it
concatenates every chapter's words into `book.text` and records `book.links` as
`{name, word}`, where `word` is the index in `text` where that chapter starts.
Everything downstream — chapter navigation, progress, resume — is an index into
that single array, so nothing above this layer knows about chapters as such.

**`src/interfaces/cli/`** — a blessed TUI built around a `player` object of
underscore-prefixed internals. Playback is a self-rescheduling `setTimeout`
(`_tickFunction`), not an interval, and with flashing on it schedules two
timers per word: one to blank the screen, one for the next word. All the
durations come from `timing.js`, and what a word looks like comes from
`style.js`; both are pure and unit-tested — put those decisions there rather
than inline. Every colour, the widget styles included, comes from `theme.js`
(the Dracula palette) — never hardcode one at a call site. Three details matter when editing it:

- `list.select()` emits `select item`, so the tick's chapter auto-follow goes
  through `_follow()`, which sets `_following` to make the handler ignore it.
  Without that guard, playback snaps back to the chapter start.
- The picker sets `screen.grabKeys` so the reader's global key bindings do not
  fire while the overlay is up.
- The word widget is built with `tags: true`, without which blessed prints the
  style markup literally. `_focusText` decorates before padding, so the markup
  is not counted when centring the word.
- Import the grid as `blessed-contrib/lib/layout/grid`, never the package
  index: that pulls in the markdown widget and with it `marked-terminal`,
  which crashed the reader on older node (issue #90).

`cli(book, options)` — `options` is optional. `{file, library, open}` enables
resume and the recent-book picker, `paused` starts the reader stopped, and
`input` is an alternative key source, used when a book arrives on stdin and
the reader has to take its keys from `/dev/tty` instead.

**`src/library/`** — `create(storePath)` returns the progress store; books are
keyed by absolute path. Reads are defensive by design: a missing, corrupt, or
non-array library file yields `[]` rather than an error, because losing progress
must never stop the reader. `position()` restarts a book whose saved index no
longer fits it.

**`bin/uniread.js`** — wires the pipeline together and decides between reading an
argument and opening the recent-books picker. `update-notifier` checks versions
in a background process, so nothing here should block startup on it.

## Constraints

- **CommonJS only.** Several dependencies (chai, dateformat, file-type,
  pdfjs-dist, update-notifier) are deliberately held below their latest majors
  because those releases are ESM-only. Do not bump them without converting the
  whole package to ESM.
- **pdf.js is lazy-loaded** inside `src/sources/pdf/`, and `getDocument` passes
  `isEvalSupported: false` — the mitigation for CVE-2024-4367 on pdfjs-dist 3.x.
  Keep both.
- **Tabs, double quotes, semicolons, unix line endings** — enforced by
  `eslint.config.js` (flat config) and `.editorconfig`. A husky pre-commit hook
  runs lint and tests.
