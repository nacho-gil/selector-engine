# Selector Engine Challenge

### Build Setup

To build the application you need to have [Node.js](http://nodejs.org/) and npm installed and then you can run the build script:
```
npm run build
```
This script installs all npm dependencies and then validates the source code and minifies `selector.js` file via Grunt.

After installing all npm dependencies, you may also run Jasmine unit tests through Karma by running the script:
```
npm run test
```
Tests are written using CommonJS style provided by karma-commonjs. `selector.js` supports both CommonJS and AMD styles.

You may also want to install [Grunt Command Line Interface](https://github.com/gruntjs/grunt-cli) as a global package to run `grunt` commands:
```
npm install -g grunt-cli
```
To build the application run:
```
grunt
```
To run unit tests:
```
grunt test
```

#### Bower module

There is a `bower.json` file ready in case the library wanted to be exported as a Bower module. There are no other Bower dependencies.

#### Additional comments

JavaScript selector engine that will return DOM elements given a CSS selector, where document.querySelectorAll is not used. The selector engine covers:

* ID selector
* Class name selector
* Tag name selector
* Attribute selector including name and optionally exact value like e.g. `[name="value"]`
* Nested selectors matching from right to left to optimise DOM access. like e.g. `html body[onload] input[type="text"]`
* Combination of all previous selectors

Nested selectors may be improved by implementing a caching mechanism for fast matching in case a given element already passed a selector.

As a improvement, `selector.js` could be split into separate sub-modules and then combined / AMD-bundled at build time, with the overhead of setup and potentially some more bytes added to the final, minified solution.

Note: native support for querySelectorAll can be enabled by uncommenting out the line 64 if-block.

#### Error Handling

At the moment, an error is thrown if the selector engine doesn't implement a given selector. It should look like:
```
SyntaxError: Unsupported Selector: "%SELECTOR%"
```