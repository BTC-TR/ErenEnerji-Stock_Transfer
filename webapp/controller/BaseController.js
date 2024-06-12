sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library"
], function (
    Controller,
    UIComponent,
    MobileLibrary
) {
    "use strict";
    
    var URLHelper = MobileLibrary.URLHelper;
    
    return Controller.extend("com.eren.stocktrans.controller.BaseController", {
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },
        getModel: function (modelName) {
            return this.getView().getModel(modelName);
        },
        setModel: function (model, modelName) {
            return this.getView().setModel(model, modelName);
        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        onShareEmailPress: function () {
            var objectModel = this.getModel("objectView") || this.getModel("worklistView");
            URLHelper.triggerEmail(
                null,
                objectModel.getProperty("/shareSendEmailSubject"),
                objectModel.getProperty("/shareSendEmailMessage")
            );
        },
        readMultiData: function (entitySet, filters, service) {
            return new Promise(function (resolve, reject) {
                const options = {
                    filters: filters,
                    success: resolve,
                    error: reject
                };
                service.read(entitySet, options);
            });
        },
        onCallFunction: function (functionName, method, service, parameters) {
            return new Promise(function (resolve, reject) {
                const settings = {
                    method: method,
                    urlParameters: parameters,
                    success: resolve,
                    error: reject
                };
                service.callFunction(functionName, settings);
            });
        }
    });
});
