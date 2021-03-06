/**
 * Developer: Grigory Kuznetsov
 * Date: 17.08.2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import '../../../libApi';
import GridItemViewBehavior from '../../../list/views/behaviors/GridItemViewBehavior';

let NativeGridItemViewBehavior = GridItemViewBehavior.extend({
    initialize: function (options, view)
    {
        GridItemViewBehavior.prototype.initialize.apply(this, arguments);

        this.paddingLeft = view.options.paddingLeft;
        this.paddingRight = view.options.paddingRight;
        this.padding = options.padding;
        this.listenTo(view.options.gridEventAggregator, 'columnStartDrag', this.__onColumnStartDrag);
        this.listenTo(view.options.gridEventAggregator, 'columnStoptDrag', this.__onColumnStopDrag);
        this.listenTo(view.options.gridEventAggregator, 'singleColumnResize', this.__onSingleColumnResize);
        this.view.setFitToView = this.setFitToView.bind(this);
    },

    __onColumnStartDrag: function (sender, index) {
        var cells = this.__getCellElements();
        this.columnsWidth = [];
        cells.each(function (i, el) {
            this.columnsWidth.push(this.__getElementOuterWidth(el));
        }.bind(this));
        this.initialFullWidth = this.$el.parent().width();
    },

    __onColumnStopDrag: function () {
        delete this.draggedColumn;
    },

    onShow: function () {
        this.__setInitialWidth(true);
    },

    setFitToView: function () {
        this.__setInitialWidth();
    },

    __setInitialWidth: function () {
        var $cells = this.__getCellElements(),
            fullWidth = this.paddingLeft + this.paddingRight;

        for (var i = 0; i < $cells.length; i++) {
            var $cell = $($cells[i]),
                cellWidth = this.columns[i].width;

            $cell.outerWidth(cellWidth);
            fullWidth += cellWidth;
        }

        this.$el.width(fullWidth);
        this.view.options.gridEventAggregator.trigger('afterColumnsResize', fullWidth);
    },

    __getElementOuterWidth: function (el) {
        return $(el)[0].getBoundingClientRect().width;
    },

    __onSingleColumnResize: function (sender, args) {
        var cells = _.toArray(this.__getCellElements()),
            $cell = $(cells[args.index]);

        $cell.outerWidth(this.columnsWidth[args.index] + args.delta);

        var fullWidth = 0;
        this.__getCellElements().each(function (i, el) {
            fullWidth += this.__getElementOuterWidth(el);
        }.bind(this));

        fullWidth += this.paddingLeft + this.paddingRight;

        fullWidth = Math.ceil(fullWidth);
        this.$el.outerWidth(fullWidth);
        this.view.options.gridEventAggregator.trigger('afterColumnsResize', fullWidth);
    }
});

export default NativeGridItemViewBehavior;
