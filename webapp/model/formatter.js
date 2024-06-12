sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
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
        }
    };
});
