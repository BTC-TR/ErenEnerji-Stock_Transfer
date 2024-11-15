sap.ui.define(["./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Element",
    'sap/ui/core/Fragment',
    'sap/ui/Device',
    'sap/ui/model/Sorter'
], function (BaseController, Filter, FilterOperator, Element, Fragment,Device, Sorter) {
    "use strict";

    return BaseController.extend("com.eren.stocktrans.controller.Main", {
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

            this.getAllData();

        },

        onRowsUpdated: function (oEvent) {

            // let arrayList = []
            // oEvent.getSource()?.getItems()?.forEach(oItem => {
            //     const object = oItem.getBindingContext().getObject();
            //     arrayList.push(object);
            // });
            // if (this.getView().getModel("viewModel").getProperty("/List")) {
                
            // } else {
            //     this.getView().getModel("viewModel").setProperty("/List", arrayList);
            // }

            // daha sonra,
            // Reswk değerlerini ve tekrar sayılarını hesaplamak için

            // let tempArrayList = this.getView().getModel("viewModel").getProperty("/List");
            // const reswkCount = tempArrayList.reduce((acc, item) => {
            //     const reswk = item.Reswk;
            //     if (reswk) {
            //         acc[reswk] = (acc[reswk] || 0) + 1;  // Reswk varsa sayacı artır
            //     }
            //     return acc;
            // }, {});

            // Yeni Filters array'i oluşturmak
            // const Filters = {
            //     type: "Üretim Yeri",
            //     values: Object.entries(reswkCount).map(([text, data]) => ({
            //         text,
            //         data
            //     }))
            // };
            // let temparray = [];
            // temparray.push(Filters);

            // this.getView().getModel("viewModel").setProperty("/Filters", temparray);

        },


        _applyFilter: function (oFilter) {
            // Get the table (last thing in the VBox) and apply the filter
            var oTable = this.getView().byId("idTable");

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
        },


        getAllData: async function () {
            
            let oViewModel = this.getModel("viewModel");

                let fnSuccess = (oData) => {
                    oViewModel.setProperty("/tableListForFilter", oData.results);
                },
                fnError = (err) => { },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };
            await this._getAllData()
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);

                this._updateFilters();

        },

        _getAllData: async function () {

            let oModel = this.getView().getModel(),
                sPath = "/ListSet",
                aFilters = [];

            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    filters: aFilters,
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.read(sPath, oParams);
            });

        },

        _updateFilters: function () {
            let oViewModel = this.getView().getModel("viewModel");
        
            // /tableListForFilter içerisindeki veriyi al
            let tableData = oViewModel.getProperty("/tableListForFilter");
        
            if (!tableData) {
                console.warn("Filter oluşturmak için veri bulunamadı.");
                return;
            }
        
            // Reswk değerlerini ve tekrar sayılarını hesapla
            const reswkCount = tableData.reduce((acc, item) => {
                const reswk = item.Reswk;
                if (reswk) {
                    acc[reswk] = (acc[reswk] || 0) + 1; // Reswk varsa sayacı artır
                }
                return acc;
            }, {});
        
            // Yeni Filters array'i oluştur
            const Filters = {
                type: "Üretim Yeri",
                values: Object.entries(reswkCount).map(([text, data]) => ({
                    text, // Reswk değeri
                    data  // Reswk tekrar sayısı
                }))
            };
        
            // Filters modeline yükle
            oViewModel.setProperty("/Filters", [Filters]);
        }
    });
});