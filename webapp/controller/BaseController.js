sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library"
], function (Controller, UIComponent, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("com.eren.materialquery.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component //
         */
        getRouter : function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel : function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel : function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle : function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onShareEmailPress : function () {
            var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },
        readMultiData: function (sSet, aFilters, oModel) {
			return new Promise(function (fnSuccess, fnReject) {
				const mParameters = {
					filters: aFilters,
					success: fnSuccess,
					error: fnReject
				};
				oModel.read(sSet, mParameters);
			});
		},
        onCallFunction: function (sEntity, sMethod, oModel, oURLParameters) {
            return new Promise((fnResolve, fnReject) => {
                const mParameters = {
                    method: sMethod,
                    urlParameters: oURLParameters,
                    success: fnResolve,
                    error: fnReject
                };

                oModel.callFunction(sEntity, mParameters);
            });
        },

        getPrinters:function(){
            var oModel = this.getView().getModel();
            var oViewModel = this.getView().getModel("viewModel");
        
            oModel.read("/PrintListSet", {
                success: function (oData) {
                    var aPrintList = oData.results; 
                
                    var bForceSelection = aPrintList.length === 1;
                    oViewModel.setProperty("/forceSelection", bForceSelection);
                    
                },
                error: function () {
                    console.error("PrintListSet yüklenirken hata oluştu.");
                }
            });

        }
    });

});