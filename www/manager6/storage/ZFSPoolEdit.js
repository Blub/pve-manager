Ext.define('PVE.storage.ZFSPoolSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.pveZFSPoolSelector',

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    me.nodename = 'localhost';
	}

	var store = Ext.create('Ext.data.Store', {
	    autoLoad: {}, // true,
	    fields: [ 'pool', 'size', 'free' ],
	    proxy: {
		type: 'pve',
		url: '/api2/json/nodes/' + me.nodename + '/scan/zfs'
	    }
	});

	Ext.apply(me, {
	    store: store,
	    valueField: 'pool',
	    displayField: 'pool',
	    queryMode: 'local',
	    editable: false,
	    listConfig: {
		loadingText: gettext('Scanning...'),
		listeners: {
		    // hack: call setHeight to show scroll bars correctly
		    refresh: function(list) {
			var lh = PVE.Utils.gridLineHeigh();
			var count = store.getCount();
			list.setHeight(lh * ((count > 10) ? 10 : count));
		    }
		}
	    }
	});

	me.callParent();
    }
});

Ext.define('PVE.storage.ZFSPoolInputPanel', {
    extend: 'PVE.panel.InputPanel',

    onGetValues: function(values) {
	var me = this;

	if (me.create) {
	    values.type = 'zfspool';
	} else {
	    delete values.storage;
	}

	values.disable = values.enable ? 0 : 1;
	delete values.enable;

	return values;
    },

    initComponent : function() {
	var me = this;

	me.column1 = [
	    {
		xtype: me.create ? 'textfield' : 'displayfield',
		name: 'storage',
		height: 22, // hack: set same height as text fields
		value: me.storageId || '',
		fieldLabel: 'ID',
		vtype: 'StorageId',
		allowBlank: false
	    }
	];

	if (me.create) {
	    me.column1.push(Ext.create('PVE.storage.ZFSPoolSelector', {
		name: 'pool',
		fieldLabel: gettext('ZFS Pool'),
		allowBlank: false
	    }));
	} else {
	    me.column1.push(Ext.createWidget('displayfield', {
		height: 22, // hack: set same height as text fields
		name: 'pool',
		value: '',
		fieldLabel: gettext('ZFS Pool'),
		allowBlank: false
	    }));
	}

	me.column1.push(
	    {xtype: 'pveContentTypeSelector',
	     cts: ['images', 'rootdir'],
	     fieldLabel: gettext('Content'),
	     name: 'content',
	     value: ['images', 'rootdir'],
	     multiSelect: true,
	     allowBlank: false});

	me.column2 = [
	    {
		xtype: 'pvecheckbox',
		name: 'enable',
		checked: true,
		uncheckedValue: 0,
		fieldLabel: gettext('Enable')
	    },
	    {
		xtype: 'pvecheckbox',
		name: 'sparse',
		checked: false,
		uncheckedValue: 0,
		fieldLabel: gettext('Thin provision')
	    }	    
	];

	if (me.create || me.storageId !== 'local') {
	    me.column2.unshift({
		xtype: 'PVE.form.NodeSelector',
		name: 'nodes',
		fieldLabel: gettext('Nodes'),
		emptyText: gettext('All') + ' (' +
		    gettext('No restrictions') +')',
		multiSelect: true,
		autoSelect: false
	    });
	}

	me.callParent();
    }
});

Ext.define('PVE.storage.ZFSPoolEdit', {
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

	var ipanel = Ext.create('PVE.storage.ZFSPoolInputPanel', {
	    create: me.create,
	    storageId: me.storageId
	});

	Ext.apply(me, {
            subject: PVE.Utils.format_storage_type('ZFS Storage'),
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
