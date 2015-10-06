'use strict';

// CommonJS
var $ = require('../../selector.js');

describe('Selectors', function () {

    function injectFragment (htmlStr) {
        var fragment = document.createElement('section');
        fragment.id = 'fragment';
        fragment.innerHTML = htmlStr;
        document.body.insertBefore(fragment, document.body.childNodes[0]);
    }

    afterEach(function() {
        var fragment = document.getElementById('fragment');
        if(fragment) {
            document.body.removeChild(fragment);
        }
        // console.log(window.document.body);
    });

    it('should select elements by tag', function () {
        expect($('p').length).toBe(0);
        expect($('div').length).toBe(0);

        injectFragment('<div>Hello!</div><p>...</p>');

        expect($('p').length).toBe(1);
        expect($('div').length).toBe(1);
    });

    it('should select elements by ID', function () {
        injectFragment('<div id="some_id"></div><p id="some-id"></p><p id="someid"></p>');

        expect($('#some_id').length).toBe(1);
        expect($('#some-id').length).toBe(1);
        expect($('#someid').length).toBe(1);
    });

    it('should select elements by class', function () {
        injectFragment('<div class="so-me_class"></div><div class="another so-me_class "></div><div class="so-me_class another"></div>');

        expect($('.so-me_class').length).toBe(3);
        expect($('.another').length).toBe(2);
    });

    it('should select elements by attribute', function () {
        injectFragment('<div class="so-me_class"><input disabled="disabled" type="text"></div>');

        expect($('[disabled]').length).toBe(1);
        expect($('[type=text]').length).toBe(1);
        expect($('[type="text"]').length).toBe(1);
        expect($('[type=\'text\']').length).toBe(1);
        expect($('[class="so-me_class"]').length).toBe(1);
    });

    it('should select elements by mixed selectors', function () {
        injectFragment('<div id="some-id" class="so-me_class another-class"><input id="some-other-id" disabled="disabled" type="text"></div>');

        expect($('input[disabled]').length).toBe(1);
        expect($('div[disabled]').length).toBe(0);
        expect($('input[disabled=disabled]').length).toBe(1);
        expect($('input#some-other-id[disabled=disabled]').length).toBe(1);
        expect($('input#some-other-id[disabled=false]').length).toBe(0);

        expect($('div#some-id').length).toBe(1);
        expect($('input#some-id').length).toBe(0);
        expect($('div#some-other-id').length).toBe(0);

        expect($('#some-id.so-me_class').length).toBe(1);
        expect($('.so-me_class#some-id').length).toBe(1);
        expect($('div.so-me_class#some-id').length).toBe(1);
        expect($('div.so-me_class').length).toBe(1);
    });

    it('should select elements by nested selectors', function () {
        injectFragment('<div id="some-id" class="so-me_class another-class"><input id="some-other-id" disabled="disabled" type="text"></div>');

        expect($('div#some-id input').length).toBe(1);
        expect($('#some-id input[type="text"]').length).toBe(1);
        expect($('body div input').length).toBe(1);
        expect($('html body div input').length).toBe(1);
        expect($('body .so-me_class [disabled]').length).toBe(1);
        expect($('body .so-me_class [enabled]').length).toBe(0);
    });

    it('should pass some more tests', function () {
        injectFragment('<div></div>\
            <div id="some_id" class="some_class some_other_class"></div>\
            <img id="some_other_id" class="some_class some_other_class"></img>\
            <input type="text">');

        expect($("div").length).toBe(2);
        expect($("img.some_class").length).toBe(1);
        expect($("#some_id").length).toBe(1);
        expect($(".some_class").length).toBe(2);
        expect($("input#some_id").length).toBe(0);
        expect($("div#some_id.some_class").length).toBe(1);
        expect($("div.some_class#some_id").length).toBe(1);
    });

});
