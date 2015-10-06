/*!
 * Selector Engine
 *
 * Copyright (c) 2014
 * Licensed under the MIT license.
 */

(function() {
    'use strict';

    // The script is only meant to work in the browser so `this` should be `window` as opposed to `exports` for Node.js
    var window = this,
        // Cache and save some bytes in the minified script
        document = window.document,
        $,
        support = {},
        find = {},
        filter = {},
        initVars,
        selectorEngine,
        hasIdSelector,
        filterElements,
        isElementMatching,
        processSelector,
        processNestedSelectors,
        // TODO: Implement a selector cache to optimise DOM access. Should be cleared after each `$` call as DOM may change.
        // selectorCache,
        // Match a simple selector like an id, tag, class or attribute
        rSimpleSelector = /^(?:#([\w-]+)|([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:=['"]?([\w-]+)['"]?)?\])$/,
        rSelectors = {
            byId: /^#([\w-]+)/,
            byClass: /^\.([\w-]+)/,
            byTag: /^([\w-]+)/,
            byAttr: /^\[([\w-]+)(?:=['"]?([\w-]+)['"]?)?\]/
        },
        rNestedSelector = /^(\s+)/,
        trim = (function() {
            if (String.prototype.trim) {
                return function (string) {
                    return string.trim();
                };
            }
            // Polyfill for IE8
            return function (string) {
                return string.replace(/^\s+|\s+$/g, '');
            };
        }());

    /**
     * Main selector method that gets exposed to the public interface
     * @param  {String} selector
     * @return {Array} Array with the matching elements
     */
    $ = function (selector) {
        var elements = [],
            simpleSelector;

        // Basic check to fast return
        if (!selector || typeof selector !== 'string') {
            return elements;
        }

        // querySelectorAll not used in this challenge, otherwise uncomment following block:
        /*
        if(support.QSA) {
            return document.querySelectorAll(selector);
        } */

        // Remove white space
        selector = trim(selector);

        // Optimise special cases: unique class, id, tag or attribute
        simpleSelector = rSimpleSelector.exec(selector);

        if(simpleSelector) {
            if(simpleSelector[1]) {
                return find.byId(simpleSelector[1]);
            } else if(simpleSelector[2]) {
                return find.byTag(simpleSelector[2]);
            } else if(simpleSelector[3]) {
                return find.byClass(simpleSelector[3]);
            } else if(simpleSelector[4]) {
                // Simplified attribute selector version just passing the name and optionally exact value
                return find.byAttr(simpleSelector[4], undefined, simpleSelector[5]);
            }
        }

        // If it's not simple invoque selector engine
        elements = selectorEngine(selector, elements);

        return elements;
    };

    // Find element by id
    find.byId = function (id) {
        // There is no point passing a context as it has to be the document
        var element = document.getElementById(id);

        return element ? [element] : [];
    };
    // Find element by tag name and context
    find.byTag = function (tag, context) {
        // If the context is not a node element then use the document
        context = (context && context.nodeType === 1) ? context : document;
        return context.getElementsByTagName(tag);
    };
    // Find elements by attribute polyfill
    find.byAttr = function (attr, context, val) {
        var elements,
            results = [],
            value,
            i = 0,
            length,
            // element.getAttribute('class') doesn't seem to work on IE8...
            attrSupported = (attr === 'class' && !support.byClass) ? false : true;

        // If the context is not a node element then use the document
        context = (context && context.nodeType === 1) ? context : document;
        elements = context.getElementsByTagName('*');
        length = elements.length;
        for (; i < length; i++) {
            if (attrSupported) {
                value = elements[i].getAttribute(attr);
            } else {
                // Solution for IE8
                value = elements[i].getAttributeNode(attr);
                value = value.specified ? value.value : null;
            }
            if (value) {
                if ((val && val === value) || !val) {
                    results.push(elements[i]);
                }
            }
        }
        return results;
    };

    // Filters for a given context element
    filter.byId = function (id, context) {
        return context.getAttribute('id') === trim(id);
    };
    filter.byTag = function (tag, context) {
        return context.tagName.toLowerCase() === tag.toLowerCase();
    };
    // Filter performance could be improved using the element.classList object when supported
    filter.byClass = function (className, context) {
        var rClassPattern = new RegExp('(^|\\s)' + className + '(\\s|$)');
        return rClassPattern.test(context.className);
    };
    filter.byAttr = function (attr, context, val) {
        var value,
            // element.getAttribute('class') doesn't seem to work on IE8...
            attrSupported = (attr === 'class' && !support.byClass) ? false : true;

        if (attrSupported) {
            value = context.getAttribute(attr);
        } else {
            // Solution for IE8
            value = context.getAttributeNode(attr);
            value = value.specified ? value.value : null;
        }
        if (value !== null) {
            if ((val && val === value) || !val) {
                return true;
            }
        }
        return false;
    };

    // Initialise variables based on the browser support
    initVars = function () {
        support.byClass = document.getElementsByClassName ? true : false;
        // Detect querySelectorAll support, although not being used
        support.QSA = document.querySelectorAll ? true : false;

        // Return the appropriate method to improve performance
        if(support.byClass) {
            find.byClass = function (className, context) {
                context = (context && context.nodeType === 1) ? context : document;
                return context.getElementsByClassName(className);
            };
        } else {
            // Simplified getElementsByClassName Polyfill for IE8
            // https://gist.github.com/eikes/2299607
            find.byClass = function (className, context) {
                var elements,
                    results = [],
                    i = 0,
                    length,
                    rClassPattern = new RegExp('(^|\\s)' + className + '(\\s|$)');

                context = (context && context.nodeType === 1) ? context : document;
                elements = context.getElementsByTagName('*');
                length = elements.length;
                for (; i < length; i++) {
                    if (rClassPattern.test(elements[i].className)) {
                        results.push(elements[i]);
                    }
                }
                return results;
            };
        }
    };

    /**
     * Process a selector and return groups of nested selectors
     * @param  {String} selector
     * @return {Array} Groups of Arrays containing objects with processed selectors
     */
    processSelector = function (selector) {
        var groups = [],
            matches,
            selectorCopy = selector,
            match,
            found,
            type;

        // Loop through until all supported selectors are found
        while (selectorCopy) {

            match = rNestedSelector.exec(selectorCopy);
            // First round or nested selector group
            if (!found || match) {
                if (match) {
                    // Remove match from selector
                    selectorCopy = selectorCopy.slice(match[0].length);
                }
                matches = [];
                groups.push(matches);
            }

            found = false;
            for (type in rSelectors) {
                if (rSelectors.hasOwnProperty(type)) {
                    match = rSelectors[type].exec(selectorCopy);
                    if (match) {
                        found = true;
                        matches.push({
                            type: type,
                            name: match[1],
                            value: match[2]
                        });
                        // Remove match from selector
                        selectorCopy = selectorCopy.slice(match[0].length);
                    }
                }
            }
            // Exit if there is an unsupported selector to avoid an infinite loop
            if (!found) {
                break;
            }
        }
        if (selectorCopy.length) {
            throw new SyntaxError('Unsupported Selector: "' + selector + '"');
        }

        return groups;
    };

    /**
     * Check if any of the processed selectors is an ID selector
     * @param  {Array} selectors Array of objects with processed selectors
     * @return {Number|undefined} The array index or undefined if not found
     */
    hasIdSelector = function (selectors) {
        var i;
        for (i in selectors) {
            if(selectors[i].type === 'byId') {
                return i;
            }
        }
        return;
    };

    /**
     * Filter an array of elements by processed selectors
     * @param  {Array} elements
     * @param  {Array} [selectors] Array of objects with processed selectors
     * @return {Array} Returns array of elements passing all filters
     */
    filterElements = function (elements, selectors) {
        var elementsTemp = [],
            passesSelectors,
            i,
            j,
            elsLength,
            selLength;

        // We still need to iterate through to avoid returning an array of a NodeList
        if(!selectors) {
            selectors = [];
        }
        elsLength = elements.length;
        selLength = selectors.length;
        for (i = 0; i < elsLength; i++) {
            passesSelectors = true;
            for (j = 0; j < selLength; j++) {
                if(!filter[selectors[j].type](selectors[j].name, elements[i], selectors[j].value)) {
                    passesSelectors = false;
                    break;
                }
            }
            if(passesSelectors) {
                elementsTemp.push(elements[i]);
            }
        }
        return elementsTemp;
    };

    /**
     * Recursive method that checks if an individual element matches a number of nested selectors
     * @param  {Array} groups Selectors array
     * @param  {HTMLElement} element
     * @return {Boolean}
     */
    isElementMatching = function (groups, element) {
        var matches;

        if (groups.length) {
            matches = groups.pop();
            element = element.parentNode;
            while (element) {
                if(element.nodeType === 1 && filterElements([element], matches).length) {
                    // Call recursively
                    return isElementMatching(groups, element);
                }
                element = element.parentNode;
            }
            // If none of the element ancestors fulfils selector
            return false;
        }
        // There is no more groups to filter, which means that the element fulfils the selector
        return true;
    };

    /**
     * Check if some elements pass a nested selector and return the matching array of elements
     * TODO: Implement a caching mechanism for fast matching in case a given element already passed a selector
     * @param  {Array} groups
     * @param  {Array} elements
     * @return {Array}
     */
    processNestedSelectors = function (groups, elements) {
        var elementsTemp = [],
            i;

        for (i in elements) {
            if(isElementMatching(groups, elements[i])) {
                elementsTemp.push(elements[i]);
            }
        }
        return elementsTemp;
    };

    /**
     * Basic selector engine that works with a number of nested IDs, classes, tags and attributes combinations
     * @param  {String} selector
     * @param  {Array} [elements]
     * @return {Array} Elements that match the selector
     */
    selectorEngine = function (selector, elements) {
        var groups = processSelector(selector),
            matches,
            match,
            context,
            idIndex;

        elements = elements || [];

        if(groups.length) {
            // Right to left matching: get the deepest selector group first
            matches = groups.pop();

            idIndex = hasIdSelector(matches);
            // Optimise finding elements when there is an ID selector
            if(idIndex) {
                match = matches.splice(idIndex, 1)[0];
                context = find[match.type](match.name);
            } else {
                match = matches.shift();
                context = find[match.type](match.name, undefined, match.value);
            }
            // If no element found, return
            if(!context.length) {
                return elements;
            }
            // Filter by the remaining selectors
            elements = elements.concat(filterElements(context, matches));
        }

        // If no elements, return before testing nested selectors
        if(!elements.length) {
            return elements;
        }
        // Rudimentary method for nested selectors. NB. not optimised
        if(groups.length) {
            elements = processNestedSelectors(groups, elements);
        }

        return elements;
    };

    // Initialise environment specific variables / methods
    initVars();

    // AMD-friendly registration
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return $;
        });
    // Common-JS environments registration
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = $;
    // otherwise attach to the window object
    } else {
        window.$ = $;
    }
}).call(this);