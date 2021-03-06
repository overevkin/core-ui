/**
 * Developer: Grigory Kuznetsov
 * Date: 17.08.2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import template from '../../list/templates/list.hbs';
import { keypress, Handlebars } from '../../libApi';
import { helpers, htmlHelpers } from '../../utils/utilsApi';
import GridHeaderView from '../../list/views/GridHeaderView';
import GlobalEventService from '../../services/GlobalEventService';

let VisibleCollectionView = Marionette.CollectionView.extend({
    getChildView: function(child) {
        if (child.get('isLoadingRowModel'))
        {
            return this.getOption('loadingChildView');
        }

        var childViewSelector = this.getOption('childViewSelector');
        if (childViewSelector) {
            return childViewSelector(child);
        }

        var childView = this.getOption('childView');
        if (!childView) {
            helpers.throwInvalidOperationError('ListView: you must specify either \'childView\' or \'childViewSelector\' option.');
        }
        return childView;
    },

    setFitToView: function () {
        this.children.each(function (ch) {
            ch.setFitToView();
        });
    }
});

/**
 * Some description for initializer
 * @name ListView
 * @memberof module:core.nativeGrid.views
 * @class ListView
 * @description View контента списка
 * @extends Marionette.LayoutView
 * @param {Object} options Constructor options
 * @param {Backbone.View} options.childView view Строки списка
 * @param {Function} [options.childViewSelector] ?
 * @param {Backbone.View} options.emptyView View для отображения пустого списка (нет строк)
 * @param {Object} [options.emptyViewOptions] Опции для emptyView
 * @param {Backbone.View} options.loadingChildView View-лоадер, показывается при подгрузке строк
 * */
let ListView = Marionette.LayoutView.extend({
    initialize: function (options) {
        helpers.ensureOption(options, 'collection');

        this.__createReqres();

        this.childViewOptions = _.extend(options.childViewOptions || {}, {
            internalListViewReqres: this.internalReqres
        });

        options.childViewOptions && (this.childViewOptions = options.childViewOptions); // jshint ignore:line
        options.emptyView && (this.emptyView = options.emptyView); // jshint ignore:line
        options.emptyViewOptions && (this.emptyViewOptions = options.emptyViewOptions); // jshint ignore:line
        options.childView && (this.childView = options.childView); // jshint ignore:line
        options.childViewSelector && (this.childViewSelector = options.childViewSelector); // jshint ignore:line
        options.loadingChildView && (this.loadingChildView = options.loadingChildView);// jshint ignore:line

        this.state = {
            position: 0
        };

        _.bindAll(this, '__handleResize', '__handleResizeInternal');
        $(window).resize(this.__handleResize);
    },

    regions: {
        visibleCollectionRegion: '.visible-collection-view'
    },

    className: 'list',
    template: Handlebars.compile(template),

    onShow: function () {
        this.state.visibleHeight = this.$el.parent().height();
        // Updating viewportHeight and rendering subviews
        this.visibleCollectionView = new VisibleCollectionView({
            childView: this.childView,
            childViewSelector: this.childViewSelector,
            className: 'visible-collection',
            collection: this.collection,
            emptyView: this.emptyView,
            emptyViewOptions: this.emptyViewOptions,
            childViewOptions: this.childViewOptions,
            loadingChildView: this.loadingChildView
        });

        this.listenTo(this.visibleCollectionView, 'childview:click', function (child) {
            this.trigger('row:click', child.model);
        });

        this.listenTo(this.visibleCollectionView, 'childview:dblclick', function (child) {
            this.trigger('row:dblclick', child.model);
        });

        this.visibleCollectionRegion.show(this.visibleCollectionView);
    },

    onRender: function () {
        htmlHelpers.forbidSelection(this.el);
        this.__assignKeyboardShortcuts();
    },

    keyboardShortcuts: {
        'up': function (e) {
            this.__moveToNeighbor('top', e.shiftKey);
        },
        'down': function (e) {
            this.__moveToNeighbor('bottom', e.shiftKey);
        },
        'pageup': function (e) {
            this.__moveToNextPage('top', e.shiftKey);
        },
        'pagedown': function (e) {
            this.__moveToNextPage('bottom', e.shiftKey);
        },
        'home': function (e) {
            this.__selectByIndex(this.getSelectedViewIndex(), 0, e.shiftKey);
            this.__scrollToTop();
        },
        'end': function (e) {
            this.__selectByIndex(this.getSelectedViewIndex(), this.collection.length - 1, e.shiftKey);
            this.__scrollToBottom();
        }
    },

    __createReqres: function () {
        this.internalReqres = new Backbone.Wreqr.RequestResponse();
        this.internalReqres.setHandler('childViewEvent', this.__handleChildViewEvent, this);
    },

    __handleChildViewEvent: function (view, eventName, eventArguments) {
        this.trigger.apply(this, [ 'childview:' + eventName, view ].concat(eventArguments));
    },

    __scrollToTop: function () {
        var $parentEl = this.$el.parent();
        $parentEl.scrollTop(0);
    },

    __scrollToBottom : function () {
        var $parentEl = this.$el.parent();
        $parentEl.scrollTop(this.$el.height());
    },

    __scrollToNeighbor: function (index) {
        var view = this.visibleCollectionView.children.findByIndex(index),
            $parentEl = this.$el.parent(),
            currentScrollTop = $parentEl.scrollTop(),
            visibleHeight = this.state.visibleHeight,
            viewPositionTop = view.$el.position().top,
            viewHeight = view.$el.height(),
            viewBottomPos = viewPositionTop + viewHeight;

        if (viewBottomPos > visibleHeight) {
            $parentEl.scrollTop(currentScrollTop + viewHeight);
        } else if (viewPositionTop < 0) {
            $parentEl.scrollTop(currentScrollTop - viewHeight);
        }
    },

    __scrollToIndex: function (index, offset) {
        var view = this.visibleCollectionView.children.findByIndex(index),
            $parentEl = this.$el.parent(),
            currentScrollTop = $parentEl.scrollTop(),
            viewPositionTop = view.$el.position().top,
            newScrollPos = offset ? currentScrollTop + viewPositionTop + offset : currentScrollTop + viewPositionTop;

        $parentEl.scrollTop(newScrollPos);
    },

    __selectByIndex: function (currentIndex, nextIndex, shiftPressed) {
        var model = this.collection.at(nextIndex);
        var selectFn = this.collection.selectSmart || this.collection.select;
        if (selectFn) {
            selectFn.call(this.collection, model, false, shiftPressed);
        }
    },

    __moveToNeighbor: function (direction, shiftPressed) {
        var selectedIndex = this.getSelectedViewIndex(),
            nextIndex = selectedIndex;

        direction === 'top' ? nextIndex-- : nextIndex++; //jshint ignore: line

        if (nextIndex !== selectedIndex) {
            nextIndex = this.__normalizeCollectionIndex(nextIndex);
            this.__selectByIndex(selectedIndex, nextIndex, shiftPressed);
            this.__scrollToNeighbor(nextIndex);
        }
    },

    __moveToNextPage: function (direction, shiftPressed) {
        var selectedIndex = this.getSelectedViewIndex(),
            selectedView = this.visibleCollectionView.children.findByIndex(selectedIndex),
            selectedPositionTop = selectedView.$el.position().top,
            nextIndex = selectedIndex;

        if (direction === 'top') {
            nextIndex = this.__getTopIndex(selectedIndex);
        } else {
            nextIndex = this.__getBottomIndex(selectedIndex);
        }

        if (nextIndex !== selectedIndex) {
            nextIndex = this.__normalizeCollectionIndex(nextIndex);
            this.__selectByIndex(selectedIndex, nextIndex, shiftPressed);
            this.__scrollToIndex(nextIndex, -selectedPositionTop);
        }
    },

    getSelectedViewIndex: function () {
        var cid = this.collection.cursorCid;
        var index = 0;
        this.collection.find(function (x, i) {
            if (x.cid === cid) {
                index = i;
                return true;
            }
        });

        return index;
    },

    __getTopIndex: function (index) {
        var cHeight = 0,
            newIndex = index,
            childViews = this.visibleCollectionView.children.toArray();

        for (var i = index - 1; i >= 0; i--) {
            var newH = cHeight + childViews[i].$el.height();

            if (newH > this.state.visibleHeight) {
                break;
            } else {
                newIndex = i;
                cHeight = newH;
            }
        }

        return newIndex;
    },

    __getBottomIndex: function (index) {
        var cHeight = 0,
            newIndex = index,
            childViews = this.visibleCollectionView.children.toArray();

        for (var i = index + 1; i < childViews.length; i++) {
            var newH = cHeight + childViews[i].$el.height();

            if (newH > this.state.visibleHeight) {
                break;
            } else {
                newIndex = i;
                cHeight = newH;
            }
        }

        return newIndex;
    },

    // normalized the index so that it fits in range [0, this.collection.length - 1]
    __normalizeCollectionIndex: function (index) {
        return Math.max(0, Math.min(this.collection.length - 1, index));
    },

    __assignKeyboardShortcuts: function () {
        if (this.keyListener) {
            this.keyListener.reset();
        }
        this.keyListener = new keypress.Listener(this.el);
        _.each(this.keyboardShortcuts, function (value, key) //noinspection JSHint
        {
            if (typeof value === 'object') {
                this.keyListener.register_combo(_.extend({
                    'keys': key,
                    'this': this
                }, value));
            } else {
                this.keyListener.simple_combo(key, value.bind(this));
            }
        }, this);
    },

    getElementHeight: function () {
        var minHeight = 0;

        if (this.visibleCollectionView && this.visibleCollectionView.isEmpty()) {
            minHeight = this.visibleCollectionView.$el.find('.empty-view').height();
        } else {
            this.visibleCollectionView.children.forEach(function (view) {
                minHeight += view.$el.height();
            });
        }

        return minHeight;
    },

    setWidth: function (fullWidth) {
        this.$el.width(fullWidth);
    },

    setFitToView: function () {
        this.visibleCollectionView.setFitToView();
    },

    __handleResize: function () {
        this.__handleResizeInternal();
    },

    __handleResizeInternal: function () {
        this.state.visibleHeight = this.$el.parent().height();

        setTimeout(function () {
            var fullWidth = this.$el.parent().width(),
                currentWidth = this.$el.width();

            if (fullWidth > currentWidth) {
                this.$el.width(fullWidth);
            }
        }.bind(this), 200);
    }
});

export default ListView;
