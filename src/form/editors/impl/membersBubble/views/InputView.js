/**
 * Developer: Ksenia Kartvelishvili
 * Date: 21.04.2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import { Handlebars, keypress } from '../../../../../libApi';
import { helpers } from '../../../../../utils/utilsApi';
import LocalizationService from '../../../../../services/LocalizationService';
import template from '../templates/input.hbs';

const config = {
    TEXT_FETCH_DELAY: 100
};

const classes = {
    EMPTY: ' empty'
};

export default Marionette.ItemView.extend({
    initialize: function (options) {
        this.reqres = options.reqres;
        this.parent = options.parent;

        this.fetchDelayId = _.uniqueId('fetch-delay-id-');

        this.filterValue = '';
    },

    template: Handlebars.compile(template),

    tagName: 'li',

    className: 'bubbles__form',

    ui: {
        input: '.js-input'
    },

    focusElement: '.js-input',

    events: {
        'keyup @ui.input': '__search',
        'input @ui.input': '__search'
    },

    modelEvents: {
        'change:empty': '__updateInputPlaceholder'
    },

    onRender: function () {
        this.updateInput();
        this.__updateInputPlaceholder();
        this.__assignKeyboardShortcuts();
    },

    focus: function () {
        this.ui.input.focus();
    },

    __assignKeyboardShortcuts: function ()
    {
        if (this.keyListener) {
            this.keyListener.reset();
        }
        this.keyListener = new keypress.Listener(this.ui.input[0]);
        _.each(this.keyboardShortcuts, function (value, key)
        {
            var keys = key.split(',');
            _.each(keys, function (k) {
                this.keyListener.simple_combo(k, value.bind(this));
            }, this);
        }, this);
    },

    keyboardShortcuts: {
        'up': function () {
            this.reqres.request('input:up');
        },
        'down': function () {
            this.reqres.request('input:down');
        },
        'enter,num_enter': function () {
            this.reqres.request('member:select');
        },
        'backspace': function () {
            var value = this.__getFilterValue();
            if (value.length === 0) {
                if (!this.options.enabled) {
                    return;
                }
                this.reqres.request('bubble:delete:last');
            } else {
                this.updateInput(value.slice(0, value.length - 1));
            }
        }
    },

    __getFilterValue: function () {
        return this.ui.input.val().toLowerCase().trim() || '';
    },

    updateInput: function (value) {
        value = value || '';
        this.ui.input.val(value);
        this.__updateInputWidth(this.__calculateDesiredInputWidth(value));
    },

    __search: function() {
        var value = this.__getFilterValue();
        if (this.filterValue === value) {
            return;
        }
        this.__updateInputWidth(this.__calculateDesiredInputWidth(value || this.ui.input.attr('placeholder')));
        helpers.setUniqueTimeout(this.fetchDelayId, function () {
            this.filterValue = value;
            this.reqres.request('input:search', value);
        }.bind(this), config.TEXT_FETCH_DELAY);
    },

    __calculateDesiredInputWidth: function (value) {
        var div, parentWidth, style, styleBlock, styles, width, i;
        styleBlock = "position:absolute; left: -1000px; top: -1000px; display:none;";
        styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
        for (i = 0; i < styles.length; i++) {
            style = styles[i];
            styleBlock += style + ":" + this.ui.input.css(style) + ";";
        }
        div = $('<div />', {
            'style': styleBlock
        });
        div.text(value);
        $('body').append(div);
        width = div.width() + 25;
        div.remove();
        parentWidth = this.parent.outerWidth();
        if (parentWidth !== 0 && ( width > parentWidth - 10 )) {
            width = parentWidth - 10;
        }
        return width;
    },

    __updateInputWidth: function (width) {
        this.ui.input.css({'width': width + 'px'});
    },

    __updateInputPlaceholder: function () {
        var empty = this.model.get('empty');
        var placeholder = empty ? LocalizationService.get('CORE.FORM.EDITORS.BUBBLESELECT.NOTSET') : '';
        this.__updateInputWidth(this.__calculateDesiredInputWidth(placeholder));
        this.ui.input.attr({'placeholder': placeholder}).toggleClass(classes.EMPTY, empty);
    }
});
