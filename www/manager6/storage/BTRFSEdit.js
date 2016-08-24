Ext.define('PVE.storage.BTRFSInputPanel', {
    extend: 'PVE.storage.DirInputPanel',

    onGetValues: function(values) {
	var me = this;

	if (me.create) {
	    values.type = 'btrfs';
	} else {
	    delete values.storage;
	}

	values.disable = values.enable ? 0 : 1;
	delete values.enable;

	return values;
    },
});

Ext.define('PVE.storage.BTRFSEdit', {
    extend: 'PVE.window.Edit',

    initComponent : function() {
	var me = this;

	me.create = !me.storageId;

	if (me.create) {
            me.url = '/api2/extjs/storage';
            me.method = 'POST';
        } else {
            me.url = '/api2/extjs/storage/' + me.storageId;
            me.method = 'PUT';
        }

	var ipanel = Ext.create('PVE.storage.BTRFSInputPanel', {
	    create: me.create,
	    storageId: me.storageId
	});

	Ext.apply(me, {
            subject: PVE.Utils.format_storage_type('btrfs'),
	    isAdd: true,
	    items: [ ipanel ]
	});

	me.callParent();

	if (!me.create) {
	    me.load({
		success:  function(response, options) {
		    var values = response.result.data;
		    var ctypes = values.content || '';

		    values.content = ctypes.split(',');

		    if (values.nodes) {
			values.nodes = values.nodes.split(',');
		    }
		    values.enable = values.disable ? 0 : 1;

		    ipanel.setValues(values);
		}
	    });
	}
    }
});
