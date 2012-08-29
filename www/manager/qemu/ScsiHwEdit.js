Ext.define('PVE.qemu.ScsiHwEdit', {
    extend: 'PVE.window.Edit',

    initComponent : function() {
	var me = this;

	Ext.applyIf(me, {
	    subject: gettext('SCSI Controller Type'),
	    items: {
		xtype: 'pveScsiHwSelector',
		name: 'scsihw',
		value: '',
		fieldLabel: gettext('Type')
	    }
	});

	me.callParent();

	me.load();
    }
});
