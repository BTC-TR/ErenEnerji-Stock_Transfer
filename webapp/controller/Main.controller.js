sap.ui.define(["./BaseController"], function (BaseController) {
    "use strict";

    return BaseController.extend("com.eren.stocktransfer.controller.Main", {
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */

        onInit: function () {
            this.getRouter().getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onPressItem: function () {
            let oViewModel = this.getModel("viewModel"),
                oTable = this.getView().byId("idTable"),
                aSelectedContexts = oTable.getSelectedContexts();
            this.getRouter().navTo("detail", {
                SNS: aSelectedContexts[0].getObject().SnsNo
            });
            oViewModel.setProperty("/SelectedObject", aSelectedContexts[0].getObject());
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
        _onObjectMatched: async function () {
            let oViewModel = this.getModel("viewModel"),
                oTable = this.getView().byId("idTable");
            oTable.removeSelections(true);
        },
    });
});