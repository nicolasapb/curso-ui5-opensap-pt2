sap.ui.define([
		"opensap/manageproducts/ManageProducts/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("opensap.manageproducts.ManageProducts.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);