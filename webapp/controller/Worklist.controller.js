/*global location history */
sap.ui.define([
	"opensap/manageproducts/ManageProducts/controller/BaseController", 
	"sap/ui/model/json/JSONModel", 
	"opensap/manageproducts/ManageProducts/model/formatter", 
	"sap/ui/model/Filter", 
	"sap/ui/model/FilterOperator", 
	"sap/m/MessageToast"
], function( BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast ) {

		"use strict";

		return BaseController.extend("opensap.manageproducts.ManageProducts.controller.Worklist", {

			formatter: formatter,

			_mFilters: {
				cheap: [new Filter("Price", FilterOperator.LE, 100)],
				moderate: [new Filter("Price", FilterOperator.BT, 101, 999)],
				expensive: [new Filter("Price", FilterOperator.GE, 1000)]
			},

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				// keeps the search state
				this._aTableSearchState = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay : 0,
					cheap: 0,
					moderate: 0,
					expensive: 0
				});
				this.setModel(oViewModel, "worklistView"); 
				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				
				var oModel = this.getModel();
				var oViewModel = this.getModel("worklistView");
				
					// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]); 
					jQuery.each(this._mFilters, function(sKey, oFilter){
						oModel.read("/ProductSet/$count", {
							filters: oFilter,
							success: function(oData) {
								var sPath = "/" + sKey.toLowerCase(); 
								oViewModel.setProperty(sPath, oData);
							}
						})
					});

				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},


			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var aTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(aTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},

			
			onQuickFilter: function(oEvent) {
				
				var oItems = this.byId("table").getBinding("items");
				var sKey = '';
				sKey = oEvent.getParameter("key");
				var aFilters = this._mFilters[sKey.toLowerCase()];

				// if (sKey === 'Cheap') {
				// 	aFilters.push(new Filter("Price", FilterOperator.LE, 100))
				// } else if (sKey === 'Moderate') {
				// 	aFilters.push(new Filter("Price", FilterOperator.BT, 101, 999))
				// } else if (sKey === 'Expensive') {
				// 	aFilters.push(new Filter("Price", FilterOperator.GE, 1000))
				// };
				

				oItems.filter(aFilters);
			},

			onShowDetailPopover: function(oEvent) {

				var oPopover = this._getPopover();
				oPopover.bindElement(oEvent.getSource().getBindingContext().getPath());

				var oOpener = oEvent.getParameter('domRef');

				oPopover.openBy(oOpener);
			},

			/**
			 * Event handler when the Add button gets pressed
			 * @public
			 */
			onAdd: function() {
				this.getRouter().navTo("add");
			},

			/**
			 * Event handler for the delete button. Will delete the product from the model.
			 * @public
			 */
			onDeleteProduct: function (oEvent) {
				var oColumnListItem = oEvent.getSource().getParent(),
					sProductName = oColumnListItem.getBindingContext().getProperty("Name"),
					sPath = oColumnListItem.getBindingContextPath();

				this.getModel().remove(sPath, {
					success: function () {
						MessageToast.show(this.getResourceBundle().getText("worklistDeleteProductSuccess", [sProductName]));
					}.bind(this),
					error: function () {
						MessageToast.show(this.getResourceBundle().getText("worklistDeleteProductError", [sProductName]));
					}.bind(this)
				});
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */
			_getPopover: function () {
				if (!this._oPopover) {
					this._oPopover = sap.ui.xmlfragment(
						'opensap.manageproducts.ManageProducts.view.DimensionPopover',
						this);
					this.getView().addDependent(this._oPopover);
				}

				return this._oPopover;
			},

			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject : function (oItem) {
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("ProductID")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {Filter[]} aTableSearchState An array of filters for the search
			 * @private
			 */
			_applySearch: function(aTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState.length !== 0) {
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			}

		});
	}
);