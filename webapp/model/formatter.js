sap.ui.define([
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/Core"],
    function (NumberFormat, Core) {
        "use strict";

        return {
            numberUnit: function (value) {
                if (!value) {
                    return "";
                }
                return parseFloat(value).toFixed(3);
            },
            TotalQty: function (value) {
                var options = {
                    minFractionDigits: 2,
                    maxFractionDigits: 4
                };
                var formatter = NumberFormat.getFloatInstance(options);
                if (!value || value === "0") {
                    return "";
                }
                return formatter.format(value);
            },

            formatQuantity: function (quantity) {
                if (!quantity) return "";

                // Core üzerinden viewModel'e erişim
                const unit = Core.getModel("viewModel").getProperty("/Meins");

                // Eğer "ADT" veya "PC" ise, yalnızca tam sayı göster
                if (unit === "ADT" || unit === "PC") {
                    return parseInt(quantity, 10).toLocaleString('tr-TR');
                }
                // Diğer durumlarda iki ondalık basamak göster
                return parseFloat(quantity).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            },

            formatQuantityWithMeins: function (quantity, meins) {
                if (!quantity) return "";
            
                // Eğer "ADT" veya "PC" ise, yalnızca tam sayı göster
                if (meins === "ADT" || meins === "PC") {
                    return `${parseInt(quantity, 10).toLocaleString('tr-TR')} ${meins}`;
                }
            
                // Diğer durumlarda iki ondalık basamak göster
                return `${parseFloat(quantity).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })} ${meins}`;
            },
            changeNumber: function (iNumber) {
                return iNumber.replaceAll(".", "").replace(",", ".");
            },

            visiblePrevious: function (currentPage) {

                if (currentPage === 1) {
                    return false;
                } else {
                    return true;
                }
            },

            visibleNext: function (currentPage, totalCount) {


                if (currentPage) {
                    let pageSize = 20;

                    let viewModel = this.getModel("viewModel");
                    let filteredData = viewModel.getProperty("/FilteredData");
                    if (filteredData.length > 0) {
                        totalCount = filteredData.length;
                    }

                    if ((currentPage * pageSize) < totalCount) {
                        return true;
                    } else { return false; }

                }
            },
            showedNumbers:function(start,end){
                if(!start || !end){
                    return "";
                }

                return this.getResourceBundle().getText("pageNumberText", [start,end]) ;
            }
        };
    });
