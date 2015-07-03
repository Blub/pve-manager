Ext.define('PVE.form.VMIDSelector', {
    extend: 'Ext.form.field.Number',
    alias: 'widget.pveVMIDSelector',

    allowBlank: false,
  
    minValue: 100,

    maxValue: 999999999,

    validateExists: undefined,

    loadNextFreeVMID: false,

    initComponent: function() {
        var me = this;

	Ext.applyIf(me, {
	    fieldLabel: 'VM ID',
	    listeners: {
		'change': function(field, newValue, oldValue) {
		    if (!Ext.isDefined(me.validateExists)) {
			return;
		    }
		    PVE.Utils.API2Request({
			params: { vmid: newValue },
			url: '/cluster/nextid',
			method: 'GET',
			success: function(response, opts) {
			    if (me.validateExists === true) {
				me.markInvalid(gettext('This VM ID does not exists'));
			    }
			},
			failure: function(response, opts) {
			    if (me.validateExists === false) {
				me.markInvalid(gettext('This VM ID is already in use'));
			    }
			}
		    });
		}
	    }
	});

        me.callParent();

	if (me.loadNextFreeVMID) {
	    PVE.Utils.API2Request({
		url: '/cluster/nextid',
		method: 'GET',
		success: function(response, opts) {
		    me.setRawValue(response.result.data);
		}
	    });
	}
    }
});
