/**
 * Developer: Stepan Burguchev
 * Date: 7/6/2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import '../libApi';
import { helpers } from '../utils/utilsApi';
import LayerLayoutView from '../views/LayerLayoutView';

let self = {};

let classes = {
    HIDDEN: 'hidden'
};

let windowService = {
    initialize: function (options) {
        helpers.ensureOption(options, 'popupRegion');
        
        self.popupRegion = options.popupRegion;
        self.ui = options.ui;

        self.layerLayoutView = new LayerLayoutView();
        self.popupRegion.show(self.layerLayoutView);
    },

    showPopup: function (view) {
        this.__togglePopupRegion(false);
        self.layerLayoutView.showPopup(view);
    },

    closePopup: function () {
        self.layerLayoutView.closePopup();
        this.__togglePopupRegion(!self.layerLayoutView.faded);
    },

    fadeIn: function (options) {
        self.layerLayoutView.fadeIn(options);
    },

    fadeOut: function () {
        self.layerLayoutView.fadeOut();
    },

    __togglePopupRegion: function (hide) {
        self.ui.popupRegion.toggleClass(classes.HIDDEN, hide);
    }
};

_.extend(windowService, Backbone.Events);

export default windowService;
