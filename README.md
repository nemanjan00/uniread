# uniread

[![Node CI](https://github.com/nemanjan00/uniread/actions/workflows/nodejs.yml/badge.svg)](https://github.com/nemanjan00/uniread/actions/workflows/nodejs.yml)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fnemanjan00%2Funiread.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fnemanjan00%2Funiread?ref=badge_shield)
[![Backers on Open Collective](https://opencollective.com/uniread/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/uniread/sponsors/badge.svg)](#sponsors)
[![npm](https://img.shields.io/npm/dt/uniread.svg)](https://www.npmjs.com/package/uniread)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Uniread is [Spritz](http://spritzinc.com/) like CLI fast reading software.

![Screencast](https://github.com/nemanjan00/uniread/blob/master/screencast/spritz.gif?raw=true)

## Content

<!-- vim-markdown-toc GFM -->

* [Supported ebook types](#supported-ebook-types)
* [Installation / update](#installation--update)
* [Usage](#usage)
  * [Controls](#controls)
  * [Resuming and recent books](#resuming-and-recent-books)
* [Developers guide](#developers-guide)
  * [Yarn package manager](#yarn-package-manager)
  * [Getting sample books for testing](#getting-sample-books-for-testing)
  * [Coding Style](#coding-style)
    * [Linting](#linting)
  * [Testing](#testing)
* [Authors](#authors)
* [Contributors](#contributors)
* [Backers](#backers)
* [Sponsors](#sponsors)

<!-- vim-markdown-toc -->

## Supported ebook types

We try to support as much as possible of ebook formats. If you have any kind of requests, feel free to create feature request in [issues](https://github.com/nemanjan00/uniread/issues).

* epub (thanks to [julien-c/epub](https://github.com/julien-c/epub) library)
* text (thanks to [pzmarzly](https://github.com/pzmarzly) and PR [#25](https://github.com/nemanjan00/uniread/pull/25))
* pdf (thanks to [Mozilla pdf.js](https://github.com/mozilla/pdf.js) library)
* markdown, `.md` / `.markdown` (thanks to [marked](https://github.com/markedjs/marked) library)
* html, `.html` / `.htm` / `.xhtml`
* mobi, `.mobi` / `.prc` / `.azw`
* docx (thanks to [mammoth](https://github.com/mwilliamson/mammoth.js) library)
* fb2, FictionBook

Where a format says how it is divided up, uniread follows it: epub uses its
spine, pdf its bookmarks, fb2 its sections, and markdown, html, docx and mobi
their top two heading levels. Everything else is read as a single chapter.

Anything else that reads like text is treated as plain text, so a file with no
extension or an unfamiliar one still opens.

Mobi books using HUFF/CDIC compression, and any DRM protected book, cannot be
read.

## Installation / update

```bash
sudo npm install -g uniread
```

## Usage

```bash
uniread ~/Books/somebook.epub
```

Run it without a book to pick one from your recently read books:

```bash
uniread
```

### Controls

| Key | Action |
| --- | --- |
| `space` | Pause / resume |
| `j` / `k` (or arrows) | Next / previous chapter |
| `+` / `-` | Speed up / slow down |
| `h` / `l` (or arrows) | Rewind / forward one word |
| `ctrl+k` | Open a recently read book |
| `q` / `escape` | Quit |

### Resuming and recent books

Uniread remembers where you left off in every book you open. Reopening a book
picks up from that word, and `ctrl+k` switches to another recent book without
leaving the reader — each book keeps its own position.

Progress is written while you read, when you pause, and when you quit. The
library lives at `$XDG_DATA_HOME/uniread/library.json` (by default
`~/.local/share/uniread/library.json`) and holds the last 50 books. Delete
that file to forget everything; books that have since been moved or deleted
are dropped from the list automatically.

## Developers guide

### Yarn package manager

For this project development, we are using faster, [yarn](https://yarnpkg.com/lang/en/) package manager.

To install it, run:

```bash
sudo npm install -g yarn
```

After that, you need to install dependencies, using:

```bash
yarn
```

### Getting sample books for testing

Books source: https://pressbooks.com/sample-books/

To download books, run

```bash
yarn get-books
```

### Coding Style

Coding style of this project is defined inside `.editorconfig` and to use it, download [Editor Config plugin](https://editorconfig.org/) for your text editor.

#### Linting

For linting, we are using eslint (configured in `eslint.config.js`) and to run
it, you can just use:

```bash
yarn lint
```

To let eslint fix what it can:

```bash
yarn lint-fix
```

### Testing

To run tests, we use mocha.

To run it, simply:

```
yarn test
```

## Authors

* [Nemanja Nedeljković](https://github.com/nemanjan00)

Also, huge thanks to [these](https://github.com/nemanjan00/uniread/graphs/contributors) people.

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].

<a href="https://github.com/nemanjan00/uniread/graphs/contributors"><img src="https://opencollective.com/uniread/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/uniread#backer)]

<a href="https://opencollective.com/uniread#backers" target="_blank"><img src="https://opencollective.com/uniread/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/uniread#sponsor)]

<a href="https://opencollective.com/uniread/sponsor/0/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/1/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/2/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/3/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/4/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/5/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/6/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/7/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/8/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/uniread/sponsor/9/website" target="_blank"><img src="https://opencollective.com/uniread/sponsor/9/avatar.svg"></a>
