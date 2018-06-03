# uniread

[![Build Status](https://travis-ci.org/nemanjan00/uniread.svg?branch=master)](https://travis-ci.org/nemanjan00/uniread)

Uniread is [Spritz](http://spritzinc.com/) like CLI fast reading software.

## Content

<!-- vim-markdown-toc GFM -->

* [Supported ebook types](#supported-ebook-types)
* [Developers guide](#developers-guide)
	* [Yarn package manager](#yarn-package-manager)
	* [Getting sample books for testing](#getting-sample-books-for-testing)
	* [Coding Style](#coding-style)
		* [Linting](#linting)
* [Authors](#authors)

<!-- vim-markdown-toc -->

## Supported ebook types

We try to support as much as possible of ebook formats. If you have any kind of requests, feel free to create feature request in [issues](https://github.com/nemanjan00/uniread/issues).

 * epub (thanks to [julien-c/epub](https://github.com/julien-c/epub) library)

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

Coding style of this project is defined inside ``.editorconfig`` and to use it, download [Editor Config plugin](https://editorconfig.org/) for your text editor. 

#### Linting

For linting, we are using eslinter and to run it, you can just use: 

```bash
yarn lint
```

## Authors

 * [Nemanja Nedeljković](https://github.com/nemanjan00)

