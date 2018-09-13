sap.ui.define([
    "opensap/manageproducts/ManageProducts/controller/BaseController", 
    "sap/ui/core/routing/History",
], function (BaseController, History) {
    "use strict";
    return BaseController.extend("opensap.manageproducts.ManageProducts.Add.controller", {

        onInit: function () {   
            this.getRouter().getRoute("add").attachPatternMatched(this._onObjectMatched, this);
        }, 

        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        }        
    });

});