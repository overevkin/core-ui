define([
	'comindware/core',
    'localizationMapEn',
    'localizationMapDe',
    'localizationMapRu',
    './ajaxMap.json',
    'demoPage/dataProvider'
], function(core, localizationMapEn, localizationMapDe, localizationMapRu, ajaxMap, dataProvider) {
    'use strict';

    var Application = new Marionette.Application();

    Application.addRegions({
        fadingRegion: '.js-fading-region',
        popupRegion: '.js-popup-region',
        headerRegion: '.js-header-region',
        contentRegion: '.js-content-region'
    });

    Application.ui = {
        fadingRegion: $('.js-fading-region'),
        popupRegion: $('.js-popup-region')
    };

    Application.addInitializer(function() {
        let isProduction = process.env.NODE_ENV === 'production'; // jshint ignore:line

        let langCode = 'en'; // could be: window.navigator.language.substring(0, 2).toLowerCase();
        let localizationMap = { en: localizationMapEn, de: localizationMapDe, ru: localizationMapRu }[langCode];

        core.initialize({
            ajaxService: {
                ajaxMap: ajaxMap
            },
            localizationService: {
                langCode: langCode,
                localizationMap: localizationMap,
                warningAsError: isProduction
            },
            windowService: {
                fadingRegion: Application.fadingRegion,
                popupRegion: Application.popupRegion,
                ui: Application.ui
            },
            userService: {
                dataProvider: dataProvider
            }
        });
    });

    return Application;
});
