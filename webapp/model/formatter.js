sap.ui.define([
        "sap/ui/core/format/NumberFormat",
        "sap/ui/core/Core"], 
        function (NumberFormat,Core) {
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

        formatQuantity: function(quantity) {
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
        
        changeNumber: function (iNumber) {
			return iNumber.replaceAll(".", "").replace(",", ".");
		}
    };
});
