/**
 * Developer: Stepan Burguchev
 * Date: 8/7/2014
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import '../libApi';
import serviceLocator from '../serviceLocator';

export default /** @lends module:core.utils.htmlHelpers */ {
    /**
     * Highlights fragments within a text with &lt;span class='highlight'&gt;&lt;/span&gt;.
     * @param {String} text Text to highlight.
     * @param {String} fragment highlighted fragment.
     * @param {Boolean} [escape=true] If true, <code>Handlebars.Utils.escapeExpression</code> will be applied to
     * the <code>text</code> before highlighting.
     * @return {String} Highlighted text
     * */
    highlightText: function (text, fragment, escape)
    {
        if (!text) {
            return '';
        }
        if (escape || escape === undefined) {
            text = Handlebars.Utils.escapeExpression(text);
        }

        var lowerText = text.toLowerCase();
        var startIndex = 0;
        var index;
        var output = '';
        while ((index = lowerText.indexOf(fragment, startIndex)) !== -1) {
            var index2 = index + fragment.length;
            output += text.substring(startIndex, index) + "<span class='highlight'>" + text.substring(index, index2) + '</span>';
            startIndex = index2;
        }

        if (startIndex < text.length) {
            output += text.substring(startIndex);
        }

        return output;
    },

    /**
     * Highlights mentions within a text with &lt;a href='...'&gt;&lt;/a&gt;.
     * @param {String} text Text to highlight.
     * @param {Boolean} [escape=true] If true, <code>Handlebars.Utils.escapeExpression</code> will be applied to
     * the <code>text</code> before highlighting.
     * @return {String} Highlighted text
     * */
    highlightMentions: function (text, escape)
    {
        if (!text) {
            return '';
        }
        if (escape || escape === undefined) {
            text = Handlebars.Utils.escapeExpression(text);
        }

        var membersByUserName = _.reduce(serviceLocator.cacheService.GetUsers(), function (memo, value) {
            if (value.Username) {
                //noinspection JSUnresolvedVariable
                memo[value.Username] = value;
            }
            return memo;
        }, {});
        var regex = /(\s|^)@([a-z0-9_\.]+)/gi;

        return text.replace(regex, function(fragment, whitespace, userName) {
            var member = membersByUserName[userName];
            if (member) {
                //noinspection JSUnresolvedVariable
                return whitespace + '<a href="' + member.link + '" title="' + (member.FullName || '') + '">@' + member.Username + '</a>';
            } else {
                return fragment;
            }
        });
    },

    /**
     * Highlights urls within a text with &lt;a href='...'&gt;&lt;/a&gt;.
     * @param {String} text Text to highlight.
     * @param {Boolean} [escape=true] If true, <code>Handlebars.Utils.escapeExpression</code> will be applied on to
     * the <code>text</code> before highlighting.
     * @return {String} Highlighted text
     * */
    highlightUrls: function (text, escape) {
        if (!text) {
            return '';
        }
        if (escape || escape === undefined) {
            text = Handlebars.Utils.escapeExpression(text);
        }

        var regex = /(?:ht|f)tp(?:s?):\/\/[^\s]*/gi;
        return  text.replace(regex, function(url){
            return '<a href="' + url + '">'+url+'</a>';
        });
    },

    /**
     * Checks if element is presented in visible DOM.
     * @param {Object} el DOM-element to check.
     * @return {Boolean} True if an element is presented in DOM.
     * */
    isElementInDom: function (el) {
        return document.body.contains(el);
    },

    /**
     * Use CSS for the same effect. IE8 is not supported anymore.
     * @deprecated
     */
    forbidSelection: function (el)
    {
        function stopAndPreventDefault(e) {
            if (e === undefined) {
                return false;
            }

            e.preventDefault();
            e.stopPropagation();
        }

        el.onselectstart = stopAndPreventDefault;
        el.ondragstart = stopAndPreventDefault;
    },

    /**
     * Use jQuery <code>.offset()</code>.
     * @deprecated
     */
    getDocumentPosition: function (el) {
        if (el instanceof window.jQuery) {
            el = el[0];
        }

        var left = 0;
        var top = 0;
        do {
            if (!isNaN(el.offsetLeft)) {
                left += el.offsetLeft;
            }
            if (!isNaN(el.offsetTop)) {
                top += el.offsetTop;
            }
            el = el.offsetParent;
        } while (el);
        return { x:left, y:top };
    }
};
