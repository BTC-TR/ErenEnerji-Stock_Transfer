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

], function (BaseController,
    JSONModel,
    Formatter,
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
    TextAreantroller) {
    "use strict";

    return BaseController.extend("com.eren.stocktransfer.controller.ItemDetail", {
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */

        onInit: async function () {
            this.getRouter().getRoute("itemDetail").attachPatternMatched(this._onObjectMatched, this);

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onBack: async function () {
            history.go(-1);
        },
        onPressDeleteItem: async function (oEvent) {

            let DialogType = MobileLibrary.DialogType,
                ButtonType = MobileLibrary.ButtonType;

            let oSelectedItems = this.getView()
                .byId("idItemDetailTable")
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

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
        _onObjectMatched: async function (oEvent) {

            let oTable = this.getView().byId("idItemDetailTable");
            oTable.removeSelections(true);

            let oArgs = oEvent.getParameter("arguments"),
                oEbeln = oArgs.SNS,
                oEbelp = oArgs.Kalem,
                oViewModel = this.getModel("viewModel"),
                fnSuccess = (oData) => {

                    oViewModel.setProperty("/ItemList", oData.results);
                    // let aData = [];
                    // if (oData.Type === "E") {
                    //     MessageBox.error(oData.Message);
                    //     oViewModel.setProperty("/ItemList", aData);
                    // }
                    // else {
                    //     aData.push(oData)
                    //     oViewModel.setProperty("/ItemList", aData);
                    // }
                },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();
                },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                    oViewModel.setProperty("/DetailSnsNo", oEbeln);
                    oViewModel.setProperty("/DetailEbelp", oEbelp);
                    sap.ui.core.BusyIndicator.hide();
                };
            this._getDetail(oEbeln, oEbelp).then(fnSuccess).catch(fnError).finally(fnFinally);
        },
        _getDetail: async function (oEbeln, oEbelp) {
            let oViewModel = this.getModel("viewModel"),
                oModel = this.getModel(),

                sPath = "/ItemDetailSet",
                aFilters = [];
            aFilters.push(
                new sap.ui.model.Filter(
                    "IvEbeln",
                    sap.ui.model.FilterOperator.EQ,
                    oEbeln
                )
            );
            aFilters.push(
                new sap.ui.model.Filter(
                    "IvEbelp",
                    sap.ui.model.FilterOperator.EQ,
                    oEbelp
                )
            );

            sap.ui.core.BusyIndicator.show(0);
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
            let oEntry = this.getView().byId("idItemDetailTable").getSelectedItem().getBindingContext("viewModel").getObject();
            let oGuid = oEntry.Guid,
               
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
            this._deleteItem(oGuid).then(fnSuccess).catch(fnError).finally(fnFinally);
        },
        _deleteItem: async function (oGuid) {
            let oViewModel = this.getModel("viewModel"),
                oModel = this.getModel();
            sap.ui.core.BusyIndicator.show(0);
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/SnsDeleteSet", {
                        IvGuid: oGuid,
                    });
                oModel.read(sPath, oParams);
            });
        }
    });
});