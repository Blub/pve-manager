Ext.define('PVE.qemu.KeyboardEdit', {
    extend: 'PVE.window.Edit',

    initComponent : function() {
	var me = this;

	Ext.applyIf(me, {
	    subject: gettext('Keyboard Layout'),
	    items: {
		xtype: 'VNCKeyboardSelector',
		name: 'keyboard',
		value: '',
		fieldLabel: gettext('Keyboard Layout')
	    }
	});

	me.callParent();

	me.load();
    }
});
