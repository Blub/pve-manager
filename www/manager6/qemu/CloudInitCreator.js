Ext.define('PVE.qemu.CloudInitCreatePanel', {
    extend: 'PVE.panel.InputPanel',
    alias: 'widget.PVE.qemu.CloudInitCreatePanel',

    insideWizard: false,

    vmconfig: {},

    onGetValues: function(values) {
	var me = this;

	var confid = me.confid || (values.controller + values.deviceid);
	var params = {};

	params[confid] = values.cdstorage + ":cloudinit";

	return params;
    },

    setVMConfig: function(vmconfig) {
	var me = this;
	me.vmconfig = vmconfig;
	me.bussel.setVMConfig(vmconfig, true);
    },

    setNodename: function(nodename) {
	var me = this;
	me.cdstoragesel.setNodename(nodename);
    },

    initComponent : function() {
	var me = this;

	me.bussel = Ext.createWidget('PVE.form.ControllerSelector', {
	    noVirtIO: true
	});
	me.cdstoragesel = Ext.create('PVE.form.StorageSelector', {
	    name: 'cdstorage',
	    nodename: me.nodename,
	    fieldLabel: gettext('Storage'),
	    storageContent: 'images',
	    autoSelect: true,
	    allowBlank: false,
	});

	me.column1 = [me.bussel];
	me.column2 = [me.cdstoragesel];

	me.callParent();
    }
});

Ext.define('PVE.qemu.CloudInitCreator', {
    extend: 'PVE.window.Edit',

    initComponent : function() {
	/*jslint confusion: true */

	var me = this;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) { 
	    throw "no node name specified";	    
	}

	var ipanel = Ext.create('PVE.qemu.CloudInitCreatePanel', {
	    nodename: nodename
	});

	Ext.applyIf(me, {
	    subject: gettext('Config Drive'),
	    items: ipanel
	});

	me.callParent();

	me.load({
	    success: function(response, options) {
		me.vmconfig = response.result.data;
		ipanel.setVMConfig(me.vmconfig);
	    }
	});
    }
});
