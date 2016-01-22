Ext.define('PVE.form.NetworkCardSelector', {
    extend: 'PVE.form.KVComboBox',
    alias: ['widget.PVE.form.NetworkCardSelector'],
  
    initComponent: function() {
	var me = this;

        me.data = [ 
	    ['e1000', 'Intel E1000'],
	    ['virtio', 'VirtIO (' + gettext('paravirtualized') + ')'],
	    ['rtl8139', 'Realtek RTL8139'],
	    ['vmxnet3', 'VMWare vmxnet3']
	];
 
	me.callParent();
    }
});
