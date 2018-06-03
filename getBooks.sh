#!/bin/bash

pushd $(git rev-parse --show-toplevel)

echo "[*] Creating books folder in the root of project"

mkdir -p ./books

echo "[*] Downloading sample books for testing"

if [ -f ./books/Metamorphosis-jackson.pdf ]; then
	echo "[-] ./books/Metamorphosis-jackson.pdf already exists"
else
	wget --directory-prefix=./books https://s3-us-west-2.amazonaws.com/pressbooks-samplefiles/MetamorphosisJacksonTheme/Metamorphosis-jackson.pdf
fi

if [ -f ./books/Metamorphosis-jackson.mobi ]; then
	echo "[-] ./books/Metamorphosis-jackson.mobi already exists"
else
	wget --directory-prefix=./books https://s3-us-west-2.amazonaws.com/pressbooks-samplefiles/MetamorphosisJacksonTheme/Metamorphosis-jackson.mobi
fi

if [ -f ./books/Metamorphosis-jackson.epub ]; then
	echo "[-] ./books/Metamorphosis-jackson.epub already exists"
else
	wget --directory-prefix=./books https://s3-us-west-2.amazonaws.com/pressbooks-samplefiles/MetamorphosisJacksonTheme/Metamorphosis-jackson.epub
fi

popd

