sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/m/Text",
    "sap/m/TextArea"
], function (
    BaseController,
    JSONModel,
    formatter,
    Filter,
    FilterOperator,
    MessageBox,
    Fragment,
    Dialog,
    Button,
    Label,
    MobileLibrary,
    MessageToast,
    Text,
    TextArea
) {
    "use strict";

    return BaseController.extend("com.eren.stocktrans.controller.Detail", {
        formatter: formatter,
        onInit: function () {
            this.getRouter().getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
        },
        onValueHelpHlgort: function (event) {

            let value = event.getSource().getValue();
            this.inputId = event.getSource().getId();
            if (!this._valueHelpKlgort) {
                this._valueHelpKlgort = sap.ui.xmlfragment("com.eren.stocktrans.fragment.valueHelp.WareHouseAddress", this);
                this.getView().addDependent(this._valueHelpKlgort);
            }
            this._valueHelpKlgort.open(value);
        },


        onSearchHlgort: function (event) {
            let value = event.getParameter("value");
            let filter = new Filter({
                filters: [new Filter("Lgpla", FilterOperator.Contains, value.toUpperCase())],
                and: false
            });
            event.getSource().getBinding("items").filter(filter);
        },
        onCloseHlgort: function (event) {
            let selectedItem = event.getParameter("selectedItem");
            let viewModel = this.getModel("viewModel");
            if (selectedItem) {
                let input = this.byId(this.inputId);
                input.setValue(selectedItem.getTitle());
                viewModel.setProperty("/GenericHlgort", selectedItem.getTitle());
                viewModel.setProperty("/Hlgort", selectedItem.getTitle());
                viewModel.setProperty("/valueStateHlgort", "Success");
                // this.getView().byId("_IDGenInput3").focus();
                jQuery.sap.delayedCall(100, this, function () {
                    this.getView().byId("_IDGenInput3").focus();
                });
            }
            event.getSource().getBinding("items").filter([]);
        },
        onLgplaCheck: async function (event, manuelValue) {
            let viewModel = this.getModel("viewModel");

            let value = "";
            if(manuelValue){
                value = manuelValue;
                this.getView().byId("_IDGenInput1").setValue(value);
                
            }else{
                value  = event.getSource().getValue();
            }
           
            let path = "/AddressControl";
            let service = this.getView().getModel("common_service");
            let method = "GET";
            let parameters = { Lgnum: "ER01", Lgpla: value };
            service.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
            this.onCallFunction(path, method, service, parameters).then(response => {
                if (response.Type === "E") {
                    viewModel.setProperty("/valueStateHlgort", "Error");
                    viewModel.setProperty("/Hlgort", "");
                } else {
                    viewModel.setProperty("/valueStateHlgort", "Success");
                    jQuery.sap.delayedCall(200, this, function () {
                        this.getView().byId("_IDGenInput3").focus();
                    });
                    //  this.getView().byId("_IDGenInput3").focus();
                }
            }).catch(error => {
                // Handle error
            }).finally(() => {
                // Finalize
            });
        },
        onQuantityLiveChange: function (oEvent) {
            let sValue = oEvent.getParameter("value");

            let oViewModel = this.getView().getModel("viewModel"),
                sMeins = oViewModel.getProperty("/Meins"),
                sFilteredValue;


            if (sMeins === 'ADT' || sMeins === 'PC') {
                // Sadece sayıları kabul et (0-9)
                sFilteredValue = sValue.replace(/[^0-9]/g, "");
            }
            else {
                // Sayı ve yalnızca bir virgül dışında karakterleri temizle, ve sadece 1 tane virgül.
                sFilteredValue = sValue.replace(/[^0-9,]/g, "");
                sFilteredValue = sFilteredValue.replace(/(,.*),/g, "$1");
            }


            // Eğer girdi filtrelendi ise, değeri Input alanına geri yaz
            if (sValue !== sFilteredValue) {
                oEvent.getSource().setValue(sFilteredValue);
            }
        },

        onHlgortInputLiveChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oEvent.getParameter("value").toUpperCase();
            oInput.setValue(sValue);
        },
        onChangeBarcode: async function (event) {
            let value = event.getSource().getValue();
            let reslo = this.getModel("viewModel").getProperty("/SelectedObject/Reslo");
            let viewModel = this.getModel("viewModel");
            let successCallback = response => {
                if (response.Type === "E") {
                    viewModel.setProperty("/Barcode", "");
                    viewModel.setProperty("/Charg", "");
                    viewModel.setProperty("/Matnr", response.Matnr);
                    viewModel.setProperty("/Maktx", response.Maktx);
                    viewModel.setProperty("/Meins", response.Meins);
                    MessageBox.error(response.Message);
                } else {
                    viewModel.setProperty("/Matnr", response.Matnr);
                    viewModel.setProperty("/Maktx", response.Maktx);
                    viewModel.setProperty("/Meins", response.Meins);
                    jQuery.sap.delayedCall(100, this, function () {
                        this.getView().byId("idQuantity").focus();
                    });
                }
            };
            let errorCallback = error => {
                let errorMessage = JSON.parse(error.responseText).error.message.value;
                MessageBox.error(errorMessage);
                viewModel.setProperty("/Barcode", "");
                viewModel.setProperty("/Matnr", "");
                viewModel.setProperty("/Maktx", "");
                viewModel.setProperty("/Quantity", "");
                this.getView().byId("idQuantity").setValue("");
                viewModel.setProperty("/Unit", "");
                viewModel.setProperty("/Charg", "");
            };
            let finalizeCallback = () => {
                viewModel.setProperty("/busy", false);
                viewModel.refresh(true);
            };
            await this._getBarcodeDetail(value, reslo).then(successCallback).catch(errorCallback).finally(finalizeCallback);
        },
        onStockQuery: async function () {
            let oCrossAppNavigator = sap.ushell.Container.getService(
                "CrossApplicationNavigation"
            ), // get a handle on the global XAppNav service
                hash =
                    (oCrossAppNavigator &&
                        oCrossAppNavigator.hrefForExternal({
                            target: {
                                semanticObject: "Material",
                                action: "Query",
                            },
                        })) ||
                    ""; // generate the Hash to display a Supplier
            oCrossAppNavigator.toExternal({
                target: {
                    shellHash: hash,
                },
            }); // navigate to Supplier application
        },

        onChangeQuantity: async function () {
            let oViewModel = this.getModel("viewModel");
            let oSnsNo = oViewModel.getProperty("/SelectedObject/SnsNo");
            let oEbelp = oViewModel.getProperty("/SelectedObject/Ebelp");
            let oMaterialType = oViewModel.getProperty("/Matnr");
            let oCharg = oViewModel.getProperty("/Charg");
            let oWarehouse = oViewModel.getProperty("/Hlgort");
            //let oQuantity = oViewModel.getProperty("/Quantity");
            let oQuantity = this.getView().byId("idQuantity").getValue();
            let oLgnum = oViewModel.getProperty("/Lgnum");
            let successCallback = response => {
                if (response.Type === "S") {
                    MessageToast.show(response.Message);
                } else {
                    MessageBox.error(response.Message);
                }
            };
            let errorCallback = error => {
                let errorMessage = JSON.parse(error.responseText).error.message.value;
                MessageBox.error(errorMessage);
                oViewModel.setProperty("/Meins", "");
                oViewModel.setProperty("/Barcode", "");
                oViewModel.setProperty("/Matnr", "");
                oViewModel.setProperty("/Maktx", "");
                oViewModel.setProperty("/Quantity", "");
                this.getView().byId("idQuantity").setValue("");
                oViewModel.setProperty("/Unit", "");
                oViewModel.setProperty("/Charg", "");
            };
            let finalizeCallback = () => {
                this._SNSDetail();
                oViewModel.setProperty("/busy", false);
                oViewModel.refresh(true);
            };

            if (oQuantity) {
                await this._addSnsItem(oSnsNo, oEbelp, oMaterialType, oCharg, oWarehouse,
                    formatter.changeNumber(oQuantity), oLgnum).then(successCallback).catch(errorCallback).finally(finalizeCallback);
            }

        },
        onClear: async function () {
            let viewModel = this.getModel("viewModel");
            sap.ui.getCore().getMessageManager().removeAllMessages();
            viewModel.setProperty("/Hlgort", "");
            viewModel.setProperty("/valueStateHlgort", "None");
            viewModel.setProperty("/Barcode", "");
            viewModel.setProperty("/Klgort", "");
            viewModel.setProperty("/Matnr", "");
            viewModel.setProperty("/Maktx", "");
            viewModel.setProperty("/Charg", "");
            viewModel.setProperty("/Quantity", "");
            this.getView().byId("idQuantity").setValue("");
            viewModel.setProperty("/StockInfo", "");
            viewModel.setProperty("/Unit", "");
            viewModel.setProperty("/Meins", "");
            jQuery.sap.delayedCall(500, this, function () {
                this.getView().byId("_IDGenInput1").focus();
            });
        },
        onPressDeleteItem: async function (oEvent) {

            let DialogType = MobileLibrary.DialogType,
                ButtonType = MobileLibrary.ButtonType;

            let oSelectedItems = this.getView()
                .byId("idDetailTable")
                .getSelectedItems().length;
            if (oSelectedItems !== 1) {
                MessageBox.error(this.getResourceBundle().getText("errorItem"));
                return;
            }

            if (!this.oApproveDialog) {
                this.oApproveDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Mesaj Kutusu",
                    content: new Text({
                        text: this.getResourceBundle().getText("deleteItemQues")
                    }),
                    beginButton: new Button({
                        type: ButtonType.Emphasized,
                        text: "Sil",
                        press: function () {
                            this._confirmDelete();
                            this.oApproveDialog.close();
                        }.bind(this),
                    }),
                    endButton: new Button({
                        text: "Geri",
                        press: function () {
                            this.oApproveDialog.close();
                        }.bind(this),
                    }),
                });
            }

            this.oApproveDialog.open();

        },
        onPressItem: async function (oEvent) {
            let oObject = oEvent.getSource().getBindingContext("viewModel").getObject();
            this.getRouter().navTo("itemDetail", {
                SNS: oObject.SnsNo,
                Kalem: oObject.Ebelp
            });
        },
        onSave: async function () {
            let oResourceBundle = this.getResourceBundle(),
                oViewModel = this.getModel("viewModel"),
                fnSuccess = (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    if (oData.Type === "E") {
                        MessageBox.error(oData.Message);
                    } else {
                        MessageBox.success(oData.Message);
                        history.go(-1);
                    }
                },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();
                },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };
            this._saveData().then(fnSuccess).catch(fnError).finally(fnFinally);
        },
        _onObjectMatched: async function () {
            this.onClear();
            this._SNSDetail();
            jQuery.sap.delayedCall(100, this, function () {
                this.getView().byId("_IDGenInput1").focus();
            });
        },
        _getBarcodeDetail: async function (value, reslo) {
            let viewModel = this.getModel("viewModel");
            let parts = value.split("|");
            let matnr = "";
            let charg = "";
            let oSnsNo = viewModel.getProperty("/SelectedObject/SnsNo"),
                reswk = viewModel.getProperty("/SelectedObject/Reswk");
            if (parts.length === 2) {
                charg = parts[1];
            }
            matnr = parts[0];
            if (parts[0].length >= 10 && !value.includes("|")) {
                viewModel.setProperty("/Charg", value.substr(value.length - 10));
                matnr = "";
                charg = value.substr(value.length - 10);
            } else {
                viewModel.setProperty("/Charg", charg);
            }
            viewModel.setProperty("/Charg", charg);
            let path = "/BarcodeSet";
            let parameters = { IvMatnr: matnr, IvCharg: charg, IvReslo: reslo, IvEbeln: oSnsNo, IvReswk: reswk };
            let model = this.getModel();

            let requestPath = model.createKey(path, parameters);
            return new Promise((resolve, reject) => {
                const callbacks = { success: resolve, error: reject };
                model.read(requestPath, callbacks);
            });
        },
        _addSnsItem: async function (snsNo, ebelp, materialType, charg, warehouse, quantity, lgnum) {
            let oModel = this.getModel();
            let path = "/SnsSet";
            let parameters = {
                IvCharg: charg,
                IvEbeln: snsNo,
                IvEbelp: ebelp,
                IvLgnum: lgnum,
                IvLgpla: warehouse,
                IvMatnr: materialType,
                IvQuan: quantity
            };
            let requestPath = oModel.createKey(path, parameters);
            return new Promise((resolve, reject) => {
                const callbacks = { success: resolve, error: reject };
                oModel.read(requestPath, callbacks);
            });
        },
        _SNSDetail: async function () {

            let oViewModel = this.getModel("viewModel"),
                oSns = oViewModel.getProperty("/SelectedObject/SnsNo");

            if (oSns === undefined) {
                return this.getRouter().navTo("RouteMain", {});
            }

            let fnSuccess = (oData) => {
                oViewModel.setProperty("/SnsList", oData.results);
            },
                fnError = (err) => { },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };
            await this._SNSDetailData(oSns)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);

        },
        _SNSDetailData: async function (oSns) {

            let oModel = this.getModel(),
                sPath = "/ListSet",
                aFilters = [];
            aFilters.push(
                new sap.ui.model.Filter(
                    "SnsNo",
                    sap.ui.model.FilterOperator.EQ,
                    oSns
                )
            );

            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    filters: aFilters,
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.read(sPath, oParams);
            });

        },
        _confirmDelete: async function () {

            let oResourceBundle = this.getResourceBundle(),
                oViewModel = this.getModel("viewModel");
            let oEntry = this.getView().byId("idDetailTable").getSelectedItem().getBindingContext("viewModel").getObject();
            let oSnsNo = oEntry.SnsNo,
                oEbelp = oEntry.Ebelp,
                oMaterialType = oEntry.Matnr,
                oCharg = oEntry.SnsNo,
                oWarehouse = oEntry.SnsNo,
                oLgnum = oViewModel.getProperty("/Lgnum"),
                fnSuccess = (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    if (oData.Type === "E") {
                        MessageBox.error(oData.Message);
                    } else {
                        MessageBox.success(oData.Message);
                        history.go(-1);
                    }
                },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();
                },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };
            this._deleteItem(oSnsNo, oEbelp, oMaterialType, oCharg, oWarehouse, oLgnum).then(fnSuccess).catch(fnError).finally(fnFinally);
        },
        _deleteItem: async function (oSnsNo, oEbelp, oMaterialType, oCharg, oWarehouse, oLgnum) {
            let oViewModel = this.getModel("viewModel"),
                oModel = this.getModel();
            sap.ui.core.BusyIndicator.show(0);
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/SnsDeleteSet", {
                        IvCharg: oCharg,
                        IvEbeln: oSnsNo,
                        IvEbelp: oEbelp,
                        IvLgpla: oWarehouse,
                        IvLgnum: oLgnum,
                        IvMatnr: oMaterialType
                    });
                oModel.read(sPath, oParams);
            });
        },
        _saveData: async function () {
            let oViewModel = this.getModel("viewModel"),
                oModel = this.getModel();
            sap.ui.core.BusyIndicator.show(0);
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/SnsSaveSet", {
                        IvEbeln: oViewModel.getProperty("/SelectedObject/SnsNo")
                    });
                oModel.read(sPath, oParams);
            });
        },

        onPressMatnr: function (oEvent) {
            let selectedItem = oEvent.getSource().getParent().getBindingContext("viewModel").getObject(),
                IvEbeln = selectedItem.SnsNo,
                IvEbelp = selectedItem.Ebelp,
                IvMatnr = selectedItem.Matnr;


            var aFilters = [
                new Filter("IvEbeln", FilterOperator.EQ, IvEbeln),
                new Filter("IvEbelp", FilterOperator.EQ, IvEbelp)
            ];

            sap.ui.core.BusyIndicator.show();
            this.readMultiData("/WareHousesSet", aFilters, this.getView().getModel())
            .then(function (oData) {
                sap.ui.core.BusyIndicator.hide();
                this._openSelectionFragment(oData.results);
            }.bind(this))
            .catch(function (oError) {
                // Hata işlemleri
                sap.ui.core.BusyIndicator.hide();
            });


        },

        _openSelectionFragment: function (aData) {
            // Dialog zaten varsa aç
            if (this._oSelectDialog) {
                this._setFragmentData(aData);
                this._oSelectDialog.open();
                return;
            }
        
            // Dialog'u oluştur
            this._oSelectDialog = new sap.m.Dialog({
                title: "Adres Seçiniz",
                content: [
                    new sap.m.List({
                        id : this.createId("dataList"),
                        mode: "SingleSelectMaster",
                        items: {
                            path: "/data",
                            template: new sap.m.StandardListItem({
                                title: "{Lgpla}", 
                                info: {
                                    parts: [
                                        { path: "Quan" }, // Miktar
                                        { path: "Unit" }  // Birim
                                    ],
                                    formatter: this.formatter.formatQuantityWithMeins.bind(this)
                                },
                                infoState: "Success" 
                            })
                        }
                    })
                ],
                beginButton: new sap.m.Button({
                    text: "Seç",
                    press: this.onSelect.bind(this)
                }),
                endButton: new sap.m.Button({
                    text: "İptal",
                    press: this.onClose.bind(this)
                })
            });
        
            // Model'i bağla ve göster
            this.getView().addDependent(this._oSelectDialog);
            this._setFragmentData(aData);
            this._oSelectDialog.open();
        },
        
        _setFragmentData: function (aData) {
            // Dialog'a veri bağlama
            var oModel = new sap.ui.model.json.JSONModel({ data: aData });
            this._oSelectDialog.setModel(oModel);
        },
        
        onSelect: function () {
            // Seçilen öğeyi al
            var oList = this.byId("dataList");
            var oSelectedItem = oList.getSelectedItem();
        
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var oData = oContext.getObject();
                let selectedLgpla = oData.Lgpla;
                this._oSelectDialog.close();
                this.onLgplaCheck(null, selectedLgpla);
            } else {
                sap.m.MessageToast.show("Lütfen bir veri seçin.");
            }
        
            // Dialog'u kapat
           
        },
        
        onClose: function () {
            // Dialog'u kapat
            this._oSelectDialog.close();
        }


    });
});