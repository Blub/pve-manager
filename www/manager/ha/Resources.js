Ext.define('PVE.ha.ResourcesView', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pveHAResourcesView'],

    initComponent : function() {
	var me = this;

	var caps = Ext.state.Manager.get('GuiCap');

	var store = new Ext.data.Store({
	    model: 'pve-ha-resources',
	    proxy: {
                type: 'pve',
		url: "/api2/json/cluster/ha/resources"
	    },
	    sorters: { 
		property: 'sid', 
		order: 'DESC' 
	    }
	});
	
	var reload = function() {
	    store.load();
	};

	var render_error = function(dataIndex, value, metaData, record) {
	    var errors = record.data.errors;
	    if (errors) {
		var msg = errors[dataIndex];
		if (msg) {
		    metaData.tdCls = 'x-form-invalid-field';
		    var html = '<p>' +  Ext.htmlEncode(msg) + '</p>';
		    metaData.tdAttr = 'data-qwidth=600 data-qtitle="ERROR" data-qtip="' + 
			html.replace(/\"/g,'&quot;') + '"';
		}
	    }
	    return value;
	};

	var sm = Ext.create('Ext.selection.RowModel', {});

	var run_editor = function() {
	    var rec = sm.getSelection()[0];
	    var sid = rec.data.sid;
	    
	    var regex =  /^(\S+):(\S+)$/;
	    var res = regex.exec(sid);

	  if (res[1] !== 'vm' && res[1] !== 'ct') { return; };
	    
	    var vmid = res[2];
	    
            var win = Ext.create('PVE.ha.VMResourceEdit',{
                vmid: vmid
            });
            win.on('destroy', reload);
            win.show();
	};

	var remove_btn = new PVE.button.Button({
	    text: gettext('Remove'),
	    disabled: true,
	    selModel: sm,
	    handler: function(btn, event, rec) {
		var sid = rec.data.sid;

		PVE.Utils.API2Request({
		    url: '/cluster/ha/resources/' + sid,
		    method: 'DELETE',
		    waitMsgTarget: me,
		    callback: function() {
			reload();
		    },
		    failure: function (response, opts) {
			Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		    }
		});
	    }
	});
	
	var edit_btn = new PVE.button.Button({
	    text: gettext('Edit'),
	    disabled: true,
	    selModel: sm,
	    handler: run_editor
	});

	Ext.apply(me, {
	    store: store,
	    selModel: sm,
	    stateful: false,
	    viewConfig: {
		trackOver: false
	    },
	    tbar: [
		{
		    text: gettext('Add'),
		    disabled: !caps.nodes['Sys.Console'],
		    handler: function() {
			var win = Ext.create('PVE.ha.VMResourceEdit',{});
			win.on('destroy', reload);
			win.show();
		    }
		},
		edit_btn, remove_btn
	    ],

	    columns: [
		{
		    header: 'ID',
		    width: 100,
		    sortable: true,
		    dataIndex: 'sid'
		},
		{
		    header: gettext('State'),
		    width: 100,
		    sortable: true,
		    renderer: function(v) {
			return v ? v : 'enabled';
		    },
		    dataIndex: 'state'
		},
		{
		    header: gettext('Group'),
		    width: 200,
		    sortable: true,
		    renderer: function(value, metaData, record) {
			return render_error('group', value, metaData, record);
		    },
		    dataIndex: 'group'
		},
		{
		    header: gettext('Description'),
		    flex: 1,
		    dataIndex: 'comment'
		}
	    ],
	    listeners: {
		show: reload,
		beforeselect: function(grid, record, index, eOpts) {
		    if (!caps.nodes['Sys.Console']) {
			return false;
		    }
		},
		itemdblclick: run_editor
	    }
	});

	me.callParent();
    }
}, function() {

    Ext.define('pve-ha-resources', {
	extend: 'Ext.data.Model',
	fields: [ 
	  'sid', 'state', 'digest', 'errors', 'group', 'comment'
	],
	idProperty: 'sid'
    });

});
