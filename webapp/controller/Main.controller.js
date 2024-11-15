sap.ui.define(["./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Element",
    'sap/ui/core/Fragment',
    'sap/ui/Device',
    'sap/ui/model/Sorter'
], function (BaseController,
	Filter,
	FilterOperator,
	Element,
	Fragment,
	Device,
	Sorter) {
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
            this.currentPage = 1;
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

         
            this.pageSize = 20;       
            this.loadPageData();           
            

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

            let aAllData =  this.getView().getModel("viewModel").getProperty("/allData");
			let aFilteredData = [];
			if (oFilter.aFilters) {
				 aFilteredData = aAllData.filter(item => {
                return this._applyCustomFilter(oFilter, item);
            });
			}
			
            this.getView().getModel("viewModel").setProperty("/FilteredData", aFilteredData);
			this.currentPage = 1;
			this.updateTable();

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


        loadPageData: async function () {
                let oViewModel = this.getModel("viewModel");

                let fnSuccess = (oData) => {
                    //tüm datayı çek.
                    oViewModel.setProperty("/allData", oData.results);
                    oViewModel.setProperty("/totalCount", oData.results.length);
                    this.allData = oData.results; // Tüm veriyi sakla
                    this.updateTable();
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

        updateTable: function () {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            const oTableModel = this.getView().getModel("viewModel");
            let filteredData =  oTableModel.getProperty("/FilteredData");
            let pageData = [];
            
            if(filteredData.length > 0){
                pageData = filteredData.slice(start, end);
            }else{
                //eğer filtrelenmişse ekran, filtrenmiş data üzerinden slice yap
                pageData = this.allData.slice(start, end);
            }
            
            oTableModel.setProperty("/displayedData", pageData);        
            this.getView().getModel("viewModel").setProperty("/currentPage", this.currentPage);
            this.getView().getModel("viewModel").setProperty("/start", start+1);
            this.getView().getModel("viewModel").setProperty("/end", start + pageData.length);
        },
        

        onNextPage: function () {
            let viewModel =  this.getView().getModel("viewModel");
            let totalCount = viewModel.getProperty("/totalCount"),
                filteredData = viewModel.getProperty("/FilteredData")
            //eğer daha önce filtre kullanıldıysa, tüm data üzerinden değilde filtre üzreinden bir next olsun
    
            if(filteredData.length > 0){
                totalCount = filteredData.length;
            }
            
            if ((this.currentPage * this.pageSize) < totalCount) {
                this.currentPage++;
                this.updateTable();
            }
        },
        
        onPreviousPage: function () {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateTable();
            }
        },

        _getAllData: async function () {
            let oModel = this.getView().getModel(),
                sPath = "/ListSet",
                aFilters = [];

            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    filters: aFilters,
                    success: function (oData) {
                        fnResolve(oData);
                    },
                    error: function (oError) {
                        fnReject(oError); 
                    }
                };
        
                // Veriyi modelden oku
                oModel.read(sPath, oParams);
            });
        },

        _updateFilters: function () {
            let oViewModel = this.getView().getModel("viewModel");
        
            // /tableListForFilter içerisindeki veriyi al
            let tableData = oViewModel.getProperty("/allData");
        
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
        },
        _applyCustomFilter: function (oFilter, item) {
            if (!oFilter) {
                return true; // Eğer filtre yoksa, tüm öğeleri döndür
            }
        
            if (oFilter.aFilters) {
                // AND/OR için birden fazla filtre
                return oFilter.aFilters.every(subFilter => this._applyCustomFilter(subFilter, item));
            }
        
            const { sPath, sOperator, oValue1 } = oFilter;
            const value = item[sPath]; 
        
            switch (sOperator) {
                case "EQ": 
                    return value === oValue1;
                case "NE": 
                    return value !== oValue1;
                case "GT": 
                    return value > oValue1;
                case "GE": 
                    return value >= oValue1;
                case "LT": 
                    return value < oValue1;
                case "LE": 
                    return value <= oValue1;
                case "Contains": 
                    return value && value.includes(oValue1);
                default:
                    return true; 
            }
        }
    });
});