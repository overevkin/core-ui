/**
 * Developer: Stepan Burguchev
 * Date: 10/13/2014
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import { Handlebars, keypress } from '../../libApi';
import dropdown from '../../dropdown/dropdownApi';
import template from './templates/referenceEditor.hbs';
import BaseLayoutEditorView from './base/BaseLayoutEditorView';
import ReferenceButtonView from './impl/reference/views/ReferenceButtonView';
import ReferencePanelView from './impl/reference/views/ReferencePanelView';
import DefaultReferenceModel from './impl/reference/models/DefaultReferenceModel';
import ReferenceListItemView from './impl/reference/views/ReferenceListItemView';


const classes = {
};

const defaultOptions = {
    'controller': null,
    'showAddNewButton': false,
    'buttonView': ReferenceButtonView,
    'listItemView': ReferenceListItemView
};

/**
 * @name ReferenceEditorView
 * @memberof module:core.form.editors
 * @class Editor to select object in the format <code>{ id, text }</code>, using async fetch for 'options collection'.
 * @extends module:core.form.editors.base.BaseEditorView
 * @param {Object} options Options object. All the properties of {@link module:core.form.editors.base.BaseEditorView BaseEditorView} class are also supported.
 * @param {BaseReferenceEditorController} [options.controller=null] Data provider, instance
 * {@link module:core.form.editors.reference.controllers.BaseReferenceEditorController BaseReferenceEditorController}.
 * @param {Boolean} [options.showAddNewButton=false] responsible for displaying button, which providing to user adding new elements.
 * @param {Marionette.ItemView} [options.buttonView=ReferenceButtonView] view to display button (what we click on to show dropdown).
 * @param {Marionette.ItemView} [options.listItemView=ReferenceListItemView] view to display item in the dropdown list.
 * */
Backbone.Form.editors.Reference = BaseLayoutEditorView.extend(/** @lends module:core.form.editors.ReferenceEditorView.prototype */{
    initialize: function (options) {
        if (options.schema) {
            _.extend(this.options, defaultOptions, _.pick(options.schema, _.keys(defaultOptions)));
        } else {
            _.extend(this.options, defaultOptions, _.pick(options || {}, _.keys(defaultOptions)));
        }

        this.reqres = new Backbone.Wreqr.RequestResponse();
        this.controller = this.options.controller;
        this.value = this.__adjustValue(this.value);
        this.showAddNewButton = this.options.showAddNewButton;

        this.reqres.setHandler('panel:open', this.onPanelOpenRequest, this);
        this.reqres.setHandler('value:clear', this.onValueClear, this);
        this.reqres.setHandler('value:set', this.onValueSet, this);
        this.reqres.setHandler('value:navigate', this.onValueNavigate, this);
        this.reqres.setHandler('filter:text', this.onFilterText, this);
        this.reqres.setHandler('add:new:item',this.onAddNewItem, this );

        this.viewModel = new Backbone.Model({
            button: new Backbone.Model({
                value: this.getValue(),
                state: 'view',
                enabled: this.getEnabled(),
                readonly: this.getReadonly()

            }),
            panel: new Backbone.Model({
                value: this.getValue(),
                collection: this.controller.collection,
                totalCount: this.controller.totalCount || 0
            })
        });
    },

    focusElement: null,

    attributes: {
        tabindex: 0
    },

    regions: {
        dropdownRegion: '.js-dropdown-region'
    },

    className: 'editor editor_reference',

    template: Handlebars.compile(template),

    setValue: function (value) {
        value = this.__adjustValue(value);
        this.__value(value, false);
    },

    onRender: function () {
        // dropdown
        this.dropdownView = dropdown.factory.createDropdown({
            buttonView: this.options.buttonView,
            buttonViewOptions: {
                model: this.viewModel.get('button'),
                reqres: this.reqres
            },
            panelView: ReferencePanelView,
            panelViewOptions: {
                model: this.viewModel.get('panel'),
                reqres: this.reqres,
                showAddNewButton: this.showAddNewButton,
                listItemView: this.options.listItemView
            },
            panelPosition: 'down-over',
            autoOpen: false
        });
        this.listenTo(this.dropdownView, 'open', this.onFocus);
        this.listenTo(this.dropdownView, 'close', this.onBlur);
        this.dropdownRegion.show(this.dropdownView);

        // hotkeys
        if (this.keyListener) {
            this.keyListener.reset();
        }
        this.keyListener = new keypress.Listener(this.el);
        _.each('down,enter,num_enter'.split(','), function (key) {
            this.keyListener.simple_combo(key, function () {
                if (this.getEnabled() && !this.getReadonly()) {
                    this.dropdownView.open();
                }
            }.bind(this));
        }, this);
    },

    __adjustValue: function (value) {
        if (!value || !value.id) {
            return null;
        }
        if (value instanceof DefaultReferenceModel) {
            return value;
        }
        if (value instanceof Backbone.Model) {
            value = value.attributes;
        }

        return new DefaultReferenceModel(value);
    },

    __value: function (value, triggerChange) {
        if (this.value === value) {
            return;
        }
        this.value = value;
        this.viewModel.get('button').set('value', value);
        this.viewModel.get('panel').set('value', value);
        if (triggerChange) {
            this.__triggerChange();
        }
    },

    isEmptyValue: function () {
        let value = this.getValue();
        return !value || _.isEmpty(value);
    },

    onValueClear: function () {
        this.__value(null, true);
    },

    onValueSet: function (model) {
        this.__value(model, true);
        this.dropdownView.close();
        this.$el.focus();
    },

    onValueNavigate: function () {
       return this.controller.navigate(this.getValue());
    },

    onFilterText: function (options) {
        var deferred = $.Deferred();
        this.controller.fetch(options).then(function () {
            this.viewModel.get('panel').set('totalCount', this.controller.totalCount);
            deferred.resolve();
        }.bind(this));
        return deferred.promise();
    },

    onPanelOpenRequest: function () {
        if (this.getEnabled() && !this.getReadonly()) {
            this.dropdownView.open();
        }
    },

    onAddNewItem:function(){
        this.controller.addNewItem();
    },

    setReadonly: function (readonly) {
        BaseLayoutEditorView.prototype.__setReadonly.call(this, readonly);
        this.viewModel.get('button').set('readonly', this.getReadonly());
    },

    setEnabled: function (enabled) {
        BaseLayoutEditorView.prototype.__setEnabled.call(this, enabled);
        this.viewModel.get('button').set('enabled', this.getEnabled());
    },

    focus: function () {
        this.dropdownView.open();
    },

    blur: function () {
        this.dropdownView.close();
    }
});

export default Backbone.Form.editors.Reference;
