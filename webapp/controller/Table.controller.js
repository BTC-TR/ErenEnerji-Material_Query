sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter",
    'sap/ui/core/Fragment',
    'sap/ui/Device',
    'sap/ui/model/Sorter'
], function (BaseController, JSONModel, History, Filter, FilterOperator, formatter, Fragment, Device, Sorter) {
    "use strict";

    return BaseController.extend("com.eren.materialquery.controller.Table", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            this._mViewSettingsDialogs = {};

//
            this.mGroupFunctions = {

                Lgpla: function (oContext) {
                    var name = oContext.getProperty("Lgpla");
                    return {
                        key: name,
                        text: name
                    };
                },
                Charg: function (oContext) {
                    var name = oContext.getProperty("Charg");
                    return {
                        key: name,
                        text: name
                    };
                }
            };

            this.getRouter().getRoute("table").attachPatternMatched(this._onObjectMatched, this);

        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onPressPrint: async function () {

            let oViewModel = this.getModel("viewModel"),
                oTable = this.byId("idDetailTable");

            if (oTable.getSelectedItem()) {


                let oMeins = oTable.getSelectedItem().getBindingContext("objectView").getObject().Unit,
                    oQuan = oTable.getSelectedItem().getBindingContext("objectView").getObject().Quan;

                oViewModel.setProperty("/InputQuan", oQuan);
                oViewModel.setProperty("/InputMeins", oMeins);


                // create value help dialog
                if (!this._dialogPrinters) {
                    this._dialogPrinters = sap.ui.xmlfragment(
                        "com.eren.materialquery.fragment.valueHelp.PrinterforMaterial",
                        this
                    );
                    this.getView().addDependent(this._dialogPrinters);
                }

                //-------------------------------------------------------------//
                // open value help dialog filtered by the input value
                this._dialogPrinters.open();

            }






        },

        onClosePrinters: function () {
            this._dialogPrinters.close();
            this._clearFragmentData();
        },

        onPrintProcess: async function () {

            let oTable = this.byId("idDetailTable"),

                oEntry = oTable.getSelectedItem().getBindingContext("objectView").getObject();

            let fnSuccess = (oData) => {
                sap.ui.core.BusyIndicator.hide();
                let oResourceBundle = this.getResourceBundle();
                sap.m.MessageToast.show(oResourceBundle.getText("infoPrinter"));
                this._clearFragmentData();
            },
                fnError = (err) => { },
                fnFinally = () => {

                    this._dialogPrinters.close();
                };
            await this._printDetail(oEntry)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);
        },




        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onObjectMatched: function (oEvent) {

        
            
            
        

            var oViewModel = new JSONModel({
                busy: true,
                delay: 0
            });

            this.setModel(oViewModel, "objectView");

            var sObjectId = oEvent.getParameter("arguments").id;
            this._bindView(sObjectId);

            this.getPrinters();
        },

      

        _bindView: function (sObjectPath) {
            let oViewModel = this.getModel("viewModel").getData();
            if (oViewModel.Table) {
                let table = oViewModel.Table.find(p => p.Lgort === sObjectPath);
                this.getView().getModel("objectView").setProperty("/header", table.Lgort + "-" + table.Lgobe);


                let temp = table.Table.map((value) => {
                    value.Quan = Number(value.Quan);
                });


                // for (let i = 0; i < table.Table.length; i++) {
                //     table.Table[i].Quan = Number(table.Table[i].Quan);
                // }

                this.getView().getModel("objectView").setProperty("/list", table.Table);
            }

        },

        onSearch: function (oEvent) {

            let table = this.getView().byId("idDetailTable"),
                oBinding = table.getBinding("items"),
                oFilter = [],
                inputValue = oEvent.getSource().getValue();
            if (inputValue !== "") {
                oFilter = new Filter([
                    new Filter("Lgort", FilterOperator.Contains, inputValue),
                    new Filter("Lgpla", FilterOperator.Contains, inputValue),
                    new Filter("Charg", FilterOperator.Contains, inputValue)
                ], false);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([oFilter]);
            }
        },

        onPressClear: function (oEvent) {
            if (History.getInstance().getPreviousHash() !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("main", {});
            }
        },

        getViewSettingsDialog: function (sDialogFragmentName) {
            var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

            if (!pDialog) {
                pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: sDialogFragmentName,
                    controller: this
                }).then(function (oDialog) {
                    if (Device.system.desktop) {
                        oDialog.addStyleClass("sapUiSizeCompact");
                    }
                    return oDialog;
                });
                this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
            }
            return pDialog;
        },


        handleSortButtonPressed: function () {
            this.getViewSettingsDialog("com.eren.materialquery.fragment.filters.SortDialogDetail")
                .then(function (oViewSettingsDialog) {
                    oViewSettingsDialog.open();
                });
        },

        handleSortDialogConfirm: function (oEvent) {
            var oTable = this.byId("idDetailTable"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                sPath,
                bDescending,
                aSorters = [];

            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));

            // apply the selected sort and group settings
            oBinding.sort(aSorters);
        },

        handleGroupButtonPressed: function () {
            this.getViewSettingsDialog("com.eren.materialquery.fragment.filters.GroupDialogDetail")
                .then(function (oViewSettingsDialog) {
                    oViewSettingsDialog.open();
                });
        },

        handleGroupDialogConfirm: function (oEvent) {
            var oTable = this.byId("idDetailTable"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                sPath,
                bDescending,
                vGroup,
                aGroups = [];

            if (mParams.groupItem) {
                sPath = mParams.groupItem.getKey();
                bDescending = mParams.groupDescending;
                vGroup = this.mGroupFunctions[sPath];
                aGroups.push(new Sorter(sPath, bDescending, vGroup));
                // apply the selected group settings
                oBinding.sort(aGroups);
            } else if (this.groupReset) {
                oBinding.sort();
                this.groupReset = false;
            }
        },
        resetGroupDialog: function (oEvent) {
            this.groupReset = true;
        },
        _printDetail: async function (oEntry) {

            let oModel = this.getModel(),
                oViewModel = this.getModel("viewModel");

            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/GetStickerSet", {
                        IvAdet: oViewModel.getProperty("/Total"),
                        IvCharg: oEntry.Charg,
                        IvDest: oViewModel.getProperty("/PrinterKey"),
                        IvMatnr: oViewModel.getProperty("/FormInfo/EvMatnr"),
                        IvMiktar: oViewModel.getProperty("/InputQuan"),
                        IvWerks : oEntry.Werks
                    });
                sap.ui.core.BusyIndicator.show(0);
                oModel.read(sPath, oParams);
            });
        },
        _clearFragmentData: function () {
            let oModel = this.getModel("viewModel");
            oModel.setProperty("/Total", "");

            if (!oModel.getProperty("/forceSelection")) {
                oModel.setProperty("/PrinterKey", "");
            }
        }
    });

});