/**
 * Developer: Stepan Burguchev
 * Date: 10/13/2014
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

/* global define, require, Handlebars, Backbone, Marionette, $, _, Localizer */

define(['core/libApi', 'text!./templates/textEditor.html', './base/BaseItemEditorView', 'core/services/LocalizationService', 'core/utils/utilsApi'],
    function (lib, template, BaseItemEditorView, LocalizationService, utilsApi) {
        'use strict';

        var changeMode = {
            blur: 'change',
            keydown: 'keydown',
            input: 'input'
        };

        var defaultOptions = {
            changeMode: 'blur',
            emptyPlaceholder: LocalizationService.get('CORE.FORM.EDITORS.TEXTEDITOR.PLACEHOLDER'),
            maxLength: null,
            mask: null,
            maskPlaceholder: '_',
            maskOptions: {}
        };

        /**
         * @name TextEditorView
         * @memberof module:core.form.editors
         * @class Однострочный текстовый редактор. Поддерживаемый тип данных: <code>String</code>.
         * @extends module:core.form.editors.base.BaseEditorView
         * @param {Object} options Объект опций. Также поддерживаются все опции базового класса
         * {@link module:core.form.editors.base.BaseEditorView BaseEditorView}.
         * @param {Number|null} [options.maxLength=null] Максимальное количество символов. Если <code>null</code>, не ограничено.
         * @param {String} [options.changeMode='blur'] Определяет момент обновления значения редактора:<ul>
         *     <li><code>'keydown'</code> - при нажатии клавиши.</li>
         *     <li><code>'blur'</code> - при потери фокуса.</li></ul>
         * @param {String} [options.emptyPlaceholder='Field is empty'] Текст placeholder.
         * @param {String} [options.mask=null] Если установлено, строка используется как опция <code>mask</code> плагина
         * [jquery.inputmask](https://github.com/RobinHerbots/jquery.inputmask).
         * @param {String} [options.maskPlaceholder='_'] При установленной опции <code>mask</code>, используется как опция placeholder плагина.
         * @param {Object} [options.maskOptions={}] При установленной опции <code>mask</code>, используется для передачи дополнительных опций плагина.
         * */
        Backbone.Form.editors.Text = BaseItemEditorView.extend(/** @lends module:core.form.editors.TextEditorView.prototype */{
            initialize: function (options) {
                options = options || {};
                if (options.schema) {
                    _.extend(this.options, defaultOptions, _.pick(options.schema, _.keys(defaultOptions)));
                } else {
                    _.extend(this.options, defaultOptions, _.pick(options || {}, _.keys(defaultOptions)));
                }

                this.placeholder = this.options.emptyPlaceholder;
            },

            onShow: function() {
                if (this.options.mask) {
                    this.ui.input.inputmask(_.extend({
                        mask: this.options.mask,
                        placeholder: this.options.maskPlaceholder,
                        autoUnmask: true
                    }, this.options.maskOptions || {}));
                }
            },

            focusElement: '.js-input',

            ui: {
                input: '.js-input'
            },

            className: 'l-field',

            template: Handlebars.compile(template),

            templateHelpers: function () {
                return this.options;
            },

            events: {
                'keyup @ui.input': '__keyup',
                'change @ui.input': '__change',
                'input @ui.input': '__change'
            },

            __keyup: function () {
                if (this.options.changeMode === changeMode.keydown) {
                    this.__value(this.ui.input.val(), false, true);
                }

                this.trigger('keyup', this);
            },
            
            __change: function () {
                this.__value(this.ui.input.val(), false, true);
            },

            setValue: function (value) {
                this.__value(value, true, false);
            },

            setPermissions: function (enabled, readonly) {
                BaseItemEditorView.prototype.setPermissions.call(this, enabled, readonly);
                this.setPlaceholder();
            },

            setPlaceholder: function () {
                if (!this.getEnabled() || this.getReadonly()) {
                    this.placeholder = '';
                } else {
                    this.placeholder = this.options.emptyPlaceholder;
                }

                this.ui.input.prop('placeholder', this.placeholder);
            },

            __setEnabled: function (enabled) {
                BaseItemEditorView.prototype.__setEnabled.call(this, enabled);
                this.ui.input.prop('disabled', !enabled);
            },

            __setReadonly: function (readonly) {
                BaseItemEditorView.prototype.__setReadonly.call(this, readonly);
                if (this.getEnabled()) {
                    this.ui.input.prop('readonly', readonly);
                }
            },

            onRender: function () {
                this.ui.input.val(this.getValue() || '');
                
                // Keyboard shortcuts listener
                if (this.keyListener) {
                    this.keyListener.reset();
                }
                this.keyListener = new lib.keypress.Listener(this.ui.input[0]);
            },

            /**
             * Позволяет добавить callback-функцию на ввод определенной клавиши или комбинации клавиш. Использует метод simple_combo плагина
             * [Keypress](https://dmauro.github.io/Keypress/).
             * @param {String} key Комбинация клавиш или несколько комбинаций, разделенных запятыми.
             * Полный список с названиями клавиш указан в исходном файле плагина:
             * [keypress.coffee](https://github.com/dmauro/Keypress/blob/master/keypress.coffee#L750-912).
             * @param {String} callback Callback-функция, вызываемая по срабатыванию комбо.
             * */
            addKeyboardListener: function (key, callback) {
                if (!this.keyListener) {
                    utilsApi.helpers.throwInvalidOperationError('You must apply keyboard listener after \'render\' event has happened.');
                }
                var keys = key.split(',');
                _.each(keys, function (k) {
                    this.keyListener.simple_combo(k, callback);
                }, this);
            },

            __value: function (value, updateUi, triggerChange) {
                if (this.value === value) {
                    return;
                }
                this.value = value;
                if (updateUi) {
                    this.ui.input.val(value);
                }
                if (triggerChange) {
                    this.__triggerChange();
                }
            },

            /**
             * Focuses the editor's input and selects all the text in it.
             * */
            select: function () {
                this.ui.input.select();
            },

            deselect: function () {
                this.ui.input.deselect();
            }
        });

        return Backbone.Form.editors.Text;
    });