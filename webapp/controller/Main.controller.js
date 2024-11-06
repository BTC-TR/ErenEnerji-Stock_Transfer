sap.ui.define(["./BaseController",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/ui/core/Element"
], function (BaseController,Filter,FilterOperator,Element) {
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
            var that = this;


        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onPressItem: function (oEvent) {
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

        onRowsUpdated: function (oEvent) {
           /// debugger;

            let arrayList = []
            oEvent.getSource()?.getItems()?.forEach(oItem => {
                const object = oItem.getBindingContext().getObject();
                arrayList.push(object);
            });
            if(this.getView().getModel("viewModel").getProperty("/List")){
                //
            }else{
                this.getView().getModel("viewModel").setProperty("/List", arrayList);
            }
           

            //daha sonra,
            // Reswk değerlerini ve tekrar sayılarını hesaplamak için

            let tempArrayList = this.getView().getModel("viewModel").getProperty("/List");
            const reswkCount = tempArrayList.reduce((acc, item) => {
                const reswk = item.Reswk;
                if (reswk) {
                    acc[reswk] = (acc[reswk] || 0) + 1;  // Reswk varsa sayacı artır
                }
                return acc;
            }, {});
            
            // Yeni Filters array'i oluşturmak
            const Filters = {
                type: "Üretim Yeri",
                values: Object.entries(reswkCount).map(([text, data]) => ({
                    text,
                    data
                }))
            };
            let temparray = [];
            temparray.push(Filters);

             this.getView().getModel("viewModel").setProperty("/Filters", temparray );
            
        },


        _applyFilter: function (oFilter) {
            // Get the table (last thing in the VBox) and apply the filter
            var aVBoxItems = this.byId("idVBox").getItems(),
                oTable = this.getView().byId("idTable");

            oTable.getBinding("items").filter(oFilter);
        },

        handleFacetFilterReset: function (oEvent) {
            var oFacetFilter = Element.registry.get(oEvent.getParameter("id")),
                aFacetFilterLists = oFacetFilter.getLists();

            for (var i = 0; i < aFacetFilterLists.length; i++) {
                aFacetFilterLists[i].setSelectedKeys();
            }

            this._applyFilter([]);
        },

        handleListClose: function (oEvent) {
            // Get the Facet Filter lists and construct a (nested) filter for the binding
            var oFacetFilter = oEvent.getSource().getParent();

            this._filterModel(oFacetFilter);
        },

        handleConfirm: function (oEvent) {
            // Get the Facet Filter lists and construct a (nested) filter for the binding
            var oFacetFilter = oEvent.getSource();
            this._filterModel(oFacetFilter);
            //sap.m.MessageToast.show("confirm event fired");
        },

        _filterModel: function (oFacetFilter) {
            var mFacetFilterLists = oFacetFilter.getLists().filter(function (oList) {
                return oList.getSelectedItems().length;
            });

            if (mFacetFilterLists.length) {
                // Build the nested filter with ORs between the values of each group and
                // ANDs between each group
                var oFilter = new Filter(mFacetFilterLists.map(function (oList) {
                    return new Filter(oList.getSelectedItems().map(function (oItem) {
                        
                        return new Filter("Reswk", "EQ", oItem.getText());
                    }), false);
                }), true);
                this._applyFilter(oFilter);
            } else {
                this._applyFilter([]);
            }
        }
    });
});