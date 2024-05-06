sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        changeColorOfStockType: function (sValue) {


            if (!sValue) {
                return 'None';
            }
            let oReturn = "";
            switch (sValue) {
                case 'Tahditsiz Kullanılabilir Stok':
                    oReturn = 'Success';
                    break;
                case 'Kalite Kontrolündeki Stok':
                    oReturn = 'Warning';
                    break;
                default:
                    oReturn = 'Error';
                    break;
            }

            return oReturn;

        },
        

        setWareHouse: function (sLgort, sLgobe) {


            if (!sLgort || !sLgobe) {
                return '';
            }
                  return sLgort + "-" + sLgobe;

        },



    };

});