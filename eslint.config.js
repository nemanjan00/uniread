"use strict";

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
	{
		ignores: ["node_modules/**", "books/**", "coverage/**", ".nyc_output/**"]
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "commonjs",
			globals: globals.node
		},
		rules: {
			indent: ["error", "tab"],
			"linebreak-style": ["error", "unix"],
			quotes: ["error", "double"],
			semi: ["error", "always"],
			"no-console": 0
		}
	},
	{
		files: ["tests/**/*.js"],
		languageOptions: {
			globals: globals.mocha
		}
	}
];
