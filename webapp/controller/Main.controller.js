sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/Fragment',
    'sap/ui/Device',
    'sap/ui/model/Sorter',
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, Device, Sorter, MessageBox) {
    "use strict";
 
    return BaseController.extend("com.eren.materialquery.controller.Main", {
 
        formatter: formatter,
 
        /* =========================================================== */
        /* lifecycle methods teeestt                                       */
        /* =========================================================== */
 
        /**
         * Called when the worklist controller is instantiated.
         * @public test
         */
        onInit: async function () {
            this._mViewSettingsDialogs = {};
 
            this.mGroupFunctions = {
                Lgort: function (oContext) {
                    var name = oContext.getProperty("Lgort");
                    return {
                        key: name,
                        text: name
                    };
                },
                Lgpla: function (oContext) {
                    var name = oContext.getProperty("Lgpla");
                    return {
                        key: name,
                        text: name
                    };
                }
            };
           
            this.getRouter().getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);
 
        },
 
        _onObjectMatched: function () {
 
            this.getView().setModel(new JSONModel(), "wareHouseModel");

            jQuery.sap.delayedCall(200, this, function () {
                this.getView().byId("idBarcode").focus();
            });
 
        },
 
 
        onChangeBarcode: function () {
            const oViewModel = this.getModel("viewModel"),
                oBarcode = this.getView().byId("idBarcode").getValue().trim(),
                iBarcode = oBarcode.split("|");
              
            let sCharg = "",
                sMatnr = "";
 
            if (!oBarcode) {
                this._clearScreen();
                return;
            }

            //Eğer barkod | ile bölünüyorsa, 0. indis malzeme, 1. parti
            if (iBarcode.length === 2) {
                sCharg = iBarcode[1];                
            }
            sMatnr = iBarcode[0];
            
            if (iBarcode[0].length > 10 && oBarcode.includes("|") === false) {
                oViewModel.setProperty("/Charg", oBarcode.substr(oBarcode.length - 10));
                sMatnr = "";
                sCharg = oBarcode.substr(oBarcode.length - 10);
              }
              else {
                oViewModel.setProperty("/Charg", sCharg);
              }      
     
 
            oViewModel.setProperty("/Charg", sCharg);
            oViewModel.setProperty("/Matnr", sMatnr);
            let fnSuccess = (oData) => {
 
                oViewModel.setProperty("/FormInfo", oData);
 
                if (oData.ForMessageReturn.Type === "E") {
                    oViewModel.setProperty("/Table", []);
                    oViewModel.setProperty("/Charg", "");
                    return sap.m.MessageBox.error(oData.ForMessageReturn.Message);
                } else {
                    if (oData.IvCharg) {
                        oViewModel.setProperty("/Material", false);
                        oViewModel.setProperty("/Print", true);
                        oViewModel.setProperty("/Table", oData.ForBarcodeTable.results);
                    } else {
                        oViewModel.setProperty("/Material", true);
                        oViewModel.setProperty("/Print", false);
                        oViewModel.setProperty("/Table", this._groupedLgort(oData.ForBarcodeTable.results));
                    }
                }
 
                this._onSortFirstTime();
 
            },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();
                },
                fnFinally = () => {
                    sap.ui.core.BusyIndicator.hide();
                    //this.getView().byId("idDetailTable").removeSelections();
                    oViewModel.refresh(true);
                };
            this._readBarcode(sCharg, sMatnr).then(fnSuccess).catch(fnError).finally(fnFinally);
 
        },
 
        _readBarcode: async function (sCharg, sMatnr) {
 
            let oModel = this.getModel(),
                oDeepEntity = {
                    IvCharg: sCharg,
                    IvMatnr: sMatnr
                };
 
            oDeepEntity.ForMessageReturn = {};
            oDeepEntity.ForBarcodeTable = [];
 
            sap.ui.core.BusyIndicator.show(0);
 
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.create("/BarcodeQuerySet", oDeepEntity, oParams);
            });
 
        },
 
        handleValueHelpLgpla: async function (oEvent) {
            let oViewModel = this.getView().getModel("viewModel");
 
            this.getView()
                .getModel("common_service")
                .read("/LgplaSHSet", {
                    success: function (oData) {
                        oViewModel.setProperty("/LgplaList", oData.results);
                    },
                    error: function (oError) { },
                });
 
            // create value help dialog
            if (!this._valueHelpDialogLgpla) {
                this._valueHelpDialogLgpla = sap.ui.xmlfragment(
                    "com.eren.materialquery.fragment.valueHelp.Lgpla",
                    this
                );
                this.getView().addDependent(this._valueHelpDialogLgpla);
            }
 
            //-------------------------------------------------------------//
            // open value help dialog filtered by the input value
            this._valueHelpDialogLgpla.open();
        },
        handleValueHelpSearchLgpla: function (oEvent) {
            let sValue = oEvent.getParameter("value"),
                oFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Lgpla", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
            oEvent.getSource().getBinding("items").filter(oFilter);
        },
        handleValueHelpCloseLgpla: function (oEvent) {
            let oViewModel = this.getView().getModel("viewModel");
            let oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                oViewModel.setProperty("/LgplaSearch", oSelectedItem.getTitle());
                //lgpla seçildikten sonra, otomatik seçilsin.
                this.onLgplaCheck();
                
            }
            oEvent.getSource().getBinding("items").filter([]);
        },
        //Lgpla Search Help//
 
        onLgplaCheck: async function () {
 
            let //oLgpla = oEvent.getSource().getValue(),
                oViewModel = this.getModel("viewModel"),
                oLgpla = oViewModel.getProperty("/LgplaSearch");
 
            if (!oLgpla) {
                this._clearScreen();
                return;
            }
 
            oViewModel.setProperty("/Table", []);
            //this.getView().byId("idDetailTable").removeSelections();
            oViewModel.setProperty("/Material", false);
           
            let sEntity = "/AddressControl",
                oModel = this.getView().getModel("common_service"),
                sMethod = "GET",
                oURLParameters = {
                    Lgnum: "ER01",
                    Lgpla: oLgpla
                };
            oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
            this.onCallFunction(sEntity, sMethod, oModel, oURLParameters)
                .then((oData) => {
                    if (oData.Type === "E") {
                        MessageBox.error(oData.Message);
                        oViewModel.setProperty("/Table", []);
                    }
                    else {
                        this._onChangeAddress();
                    }
                })
                .catch(() => { })
                .finally((oResponse) => { });
        },
        _onChangeAddress: async function () {
 
            let sLgpla = this.getView().byId("idAddress").getValue().trim().toUpperCase(),
                oViewModel = this.getModel("viewModel"),
                sLgnum = "ER01";
 
            //this.getView().byId("idAddress").setValue(sLgpla);
 
 
 
            //this.getView().byId("_IDGenColumn1").setVisible(false);
            this.getView().byId("idBarcode").setEnabled(false);
            this.getView().byId("idBarcode").setValue("");
            oViewModel.setProperty("/Print", false);
            oViewModel.setProperty("/FormInfo", "");
 
            this.getModel("viewModel").setProperty("/FormInfo/Address", sLgpla);
            let fnSuccess = (oData) => {
 
 
                let temp = oData.ForLgplaTable.results.map((value) => {
                    value.Quan = Number(value.Quan);
                });
 
                oViewModel.setProperty("/Table", oData.ForLgplaTable.results);
                oViewModel.setProperty("/Print", true);
 
            },
                fnError = err => { },
                fnFinally = () => {
                    // oViewModel.setProperty("/busy", false);
                    oViewModel.refresh(true);
                    sap.ui.core.BusyIndicator.hide(0);
                    this._onSortFirstTime();
                };
            this._getAddressDetail(sLgnum, sLgpla)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);
 
        },
 
        _getBarcodeDetail: async function (oBarcode, oWerks) {
 
            let oModel = this.getModel("shelf_transfer");
 
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject
                },
                    sPath = oModel.createKey("/BarcodeSet", {
                        IvBarcode: oBarcode,
                        IvWerks: oWerks
                    });
                oModel.read(sPath, oParams);
            });
 
        },
        _getAddressDetail: async function (sLgnum, sLgpla) {
 
            let oModel = this.getModel(),
                oDeepEntity = {
                    IvLgnum: sLgnum,
                    IvLgpla: sLgpla
                };
 
            oDeepEntity.ForMessageReturnLg = {};
            oDeepEntity.ForLgplaTable = [];
 
            sap.ui.core.BusyIndicator.show(0);
 
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.create("/LgplaQuerySet", oDeepEntity, oParams);
            });
 
 
        },
        onPressList: function (oEvent) {
 
            let oTable = this.getView().byId("idDetailTable"),
                oViewModel = this.getModel("viewModel"),
                aSelectedContexts = oTable.getSelectedContexts(),
                aSelectedObject = aSelectedContexts[0].getObject();
 
            // if (aSelectedObject.Lgort !== aSelectedObject.Werks) {
            //     oViewModel.setProperty("/Print", true);
            //     return;
            // }
 
            oTable.removeSelections();
 
            this.getRouter().navTo("table", {
                id: aSelectedContexts[0].getObject().Lgort
            });
 
        },
 
        onSearch: function (oEvent) {
 
            let table = this.getView().byId("idDetailTable"),
                oBinding = table.getBinding("items"),
                oFilter = [],
                inputValue = oEvent.getSource().getValue();
            if (inputValue !== "") {
                oFilter = new Filter([
                    new Filter("Matnr", FilterOperator.Contains, inputValue),
                    new Filter("Lgpla", FilterOperator.Contains, inputValue),
                    new Filter("Lgobe", FilterOperator.Contains, inputValue),
                    new Filter("Lgort", FilterOperator.Contains, inputValue),
                    new Filter("Charg", FilterOperator.Contains, inputValue),
                    new Filter("StokTuru", FilterOperator.Contains, inputValue)
                ], false);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([oFilter]);
            }
        },
        onClosePrinters: function () {
            this._dialogPrinters.close();
            this._clearFragmentData();
 
        },
        onPressPrint: async function () {
            let oViewModel = this.getModel("viewModel"),
                oTable = this.byId("idDetailTable");
 
            if (oTable.getSelectedItem()) {
 
                let oMeins = oTable.getSelectedItem().getBindingContext("viewModel").getObject().Unit,
                    oQuan = oTable.getSelectedItem().getBindingContext("viewModel").getObject().Quan;
 
                oViewModel.setProperty("/InputQuan", oQuan);
                oViewModel.setProperty("/InputMeins", oMeins);
                // create value help dialog
                if (!this._dialogPrinters) {
                    this._dialogPrinters = sap.ui.xmlfragment(
                        "com.eren.materialquery.fragment.valueHelp.Printers",
                        this
                    );
                    this.getView().addDependent(this._dialogPrinters);
                }
 
                //-------------------------------------------------------------//
                // open value help dialog filtered by the input value
                this._dialogPrinters.open();
 
            }
        },
        onPrintProcess: async function () {
 
            let oTable = this.byId("idDetailTable"),
 
                oEntry = oTable.getSelectedItem().getBindingContext("viewModel").getObject();
 
            let oViewModel = this.getModel("viewModel"),
                fnSuccess = (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    let oResourceBundle = this.getResourceBundle();
                    sap.m.MessageToast.show(oResourceBundle.getText("infoPrinter"));
                    this._clearFragmentData();
                },
                fnError = (err) => { },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                    this._dialogPrinters.close();
                };
            await this._printDetail(oEntry)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);
        },
 
        onPressClear: function () {
            this._clearScreen();
        },
 
        _clearScreen: function () {
 
            let oViewModel = this.getView().getModel("viewModel");
 
            this.byId("idBarcode").setValue("");
 
            this.getView().byId("idBarcode").setEnabled(true);
            this.getView().byId("idAddress").setEnabled(true);
 
            oViewModel.setProperty("/", this._createInitialModel());
 
        },
 
        _createInitialModel: function () {
            return new JSONModel({
                // WareHouseInfo: {},
                FormInfo: {
                    Matnr: "",
                    Maktx: "",
                    Barcode: "",
                    Xchpf: true
                },
                Table: [],
                Charg: "",
                Material: false,
                Print: false,
                Lgnum: "ER01"
            });
        },
 
        _groupedLgort: function (oTable) {
 
            let groupedByLgort = oTable.reduce((acc, obj) => {
                const depo = obj.Lgort;
                acc[depo] = acc[depo] || [];
                acc[depo].push(obj);
                return acc;
            }, {});
 
            let allTable = [];
 
            for (let obj1 in groupedByLgort) {
 
                let object = {
                    "Lgort": obj1,
                    "Lgobe": groupedByLgort[obj1][0].Lgobe,
                    "Lgtyp": groupedByLgort[obj1][0].Lgtyp,
                    "Quan": 0,
                    "Unit": groupedByLgort[obj1][0].Unit,
                    //"StokTuru": groupedByLgort[obj1][0].StokTuru,
                    "Table": [],
                    "Werks": groupedByLgort[obj1][0].Werks
                },
                    toplam = 0;
 
                for (let obj2 of groupedByLgort[obj1]) {
                    toplam += parseFloat(obj2.Quan);
                }
                object.Quan = toplam;
                object.Table = groupedByLgort[obj1];
                allTable.push(object);
            }
            return allTable;
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
 
        onLgplaSearchSearchFieldLiveChange:function(oEvent){
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/Table", []);
            this.getView().byId("idBarcode").setValue("");

            if(oEvent.getSource().getValue() === ""){
                this.getView().byId("idBarcode").setEnabled(true)
            }
            
        },
 
        handleSortButtonPressed: function () {
            this.getViewSettingsDialog("com.eren.materialquery.fragment.filters.SortDialog")
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
            this.getViewSettingsDialog("com.eren.materialquery.fragment.filters.GroupDialog")
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
            let oAddress = this.getView().byId("idAddress").getValue();
            let oTable = this.getView().byId("idDetailTable"),
                aSelectedContexts = oTable.getSelectedContexts()[0];
 
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/GetStickerSet", {
                        IvAdet: oViewModel.getProperty("/Total"),
                        IvCharg: oEntry.Charg !== undefined ? oEntry.Charg : "",
                        IvDest: oViewModel.getProperty("/PrinterKey"),
                        IvMatnr: (oAddress) ? aSelectedContexts.getObject().Matnr : oViewModel.getData().FormInfo.EvMatnr,
                        IvMiktar: oViewModel.getProperty("/InputQuan"),
                    });
                sap.ui.core.BusyIndicator.show(0);
                oModel.read(sPath, oParams);
            });
        },
        _clearFragmentData: function () {
            let oModel = this.getModel("viewModel");
            oModel.setProperty("/Total", "");
            oModel.setProperty("/PrinterKey", "");
        },
 
        _onSortFirstTime: function () {
 
            let oViewModel = this.getView().getModel("viewModel").getData();
 
            var oTable = this.byId("idDetailTable"),
                oBinding = oTable.getBinding("items"),
                sPath,
                aSorters = [];
 
            sPath = oViewModel.LgplaSearch ? 'Matnr' : 'Lgpla';
            aSorters.push(new Sorter(sPath, false));
 
            // apply the selected sort and group settings
            oBinding.sort(aSorters);
 
        }
 
    });
});