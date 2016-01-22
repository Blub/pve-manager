Ext.define('PVE.form.BusTypeSelector', {
    extend: 'PVE.form.KVComboBox',
    alias: ['widget.PVE.form.BusTypeSelector'],
  
    noVirtIO: false,

    noScsi: false,

    initComponent: function() {
	var me = this;

	me.data = [['ide', 'IDE'], ['sata', 'SATA']];

	if (!me.noVirtIO) {
	    me.data.push(['virtio', 'VIRTIO']);
	}

	if (!me.noScsi) {
	    me.data.push(['scsi', 'SCSI']);
	}

	me.callParent();
    }
});
