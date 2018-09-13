sap.ui.define([
    "opensap/manageproducts/ManageProducts/controller/BaseController", 
    "sap/ui/core/routing/History", 
    "sap/m/MessageToast"
], function( BaseController, History, MessageToast ) {

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
            this.getModel().deleteCreatedEntry(this._oContext);

            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        onSave: function() {
            this.getModel().submitChanges();
        },

        onCancel: function() {
            this.onNavBack();
        },
        
        _onObjectMatched: function() {
            
            var oModel = this.getModel();
            oModel.metadataLoaded()
                .then(this._onMetadataLoaded.bind(this));
        },

        _onMetadataLoaded: function() {
            var oProperties = {
				ProductID: "" + parseInt(Math.random() * 1000000000, 10),
				TypeCode: "PR",
				TaxTarifCode: 1,
				CurrencyCode: "EUR",
				MeasureUnit: "EA"

            };

            var oContext = this.getModel().createEntry("/ProductSet", {
                properties: oProperties,
                success: this._onCreateSuccess.bind(this)
            });

            this.getView().setBindingContext(oContext);
        },

        _onCreateSuccess: function(oProduct) {

            // navigate to the new product's object view
            var sId = oProduct.ProductID;

            this.getRouter().navTo("object", {
                objectId: sId
            }, true);

			// unbind the view to not show this object again
			this.getView().unbindObject();

            // show success messge
            var sMessage = this.getResourceBundle().getText("newObjectCreated", [oProduct.Name]);

            MessageToast.show(sMessage, {
                closeOnBrowserNavigation: false
            });
        }
    });

});