Ext.define('PVE.node.Tasks', {
    extend: 'Ext.grid.GridPanel',

    alias: ['widget.pveNodeTasks'],

    vmidFilter: 0,

    initComponent : function() {
	var me = this;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) {
	    throw "no node name specified";
	}

	var store = Ext.create('Ext.data.Store', {
	    pageSize: 500,
	    buffered: true,
	    remoteFilter: true,
	    model: 'pve-tasks',
	    proxy: {
                type: 'pve',
		startParam: 'start',
		limitParam: 'limit',
                url: "/api2/json/nodes/" + nodename + "/tasks"
	    }
	});

	var userfilter = '';
	var filter_errors = 0;

	var updateProxyParams = function() {
	    var params = {
		errors: filter_errors
	    };
	    if (userfilter) {
		params.userfilter = userfilter;
	    }
	    if (me.vmidFilter) {
		params.vmid = me.vmidFilter;
	    }
	    store.proxy.extraParams = params;
	};

	updateProxyParams();

	// fixme: scroller update fails 
	// http://www.sencha.com/forum/showthread.php?133677-scroller-does-not-adjust-to-the-filtered-grid-data&p=602887
	var reload_task = new Ext.util.DelayedTask(function() {
	    updateProxyParams();
	    store.filter();
	});

	var run_task_viewer = function() {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];
	    if (!rec) {
		return;
	    }

	    var win = Ext.create('PVE.window.TaskViewer', { 
		upid: rec.data.upid
	    });
	    win.show();
	};

	var view_btn = new Ext.Button({
	    text: gettext('View'),
	    disabled: true,
	    handler: run_task_viewer
	});


	Ext.apply(me, {
	    store: store,
	    stateful: false,
	    verticalScrollerType: 'paginggridscroller',
	    loadMask: true,
	    invalidateScrollerOnRefresh: false,
	    viewConfig: {
		trackOver: false,
		stripeRows: false, // does not work with getRowClass()
 
		getRowClass: function(record, index) {
		    var status = record.get('status');

		    if (status && status != 'OK') {
			return "x-form-invalid-field";
		    }
		}
	    },
	    tbar: [
		view_btn, '->', gettext('User name') +':', ' ',
		{
		    xtype: 'textfield',
		    width: 200,
		    value: userfilter,
		    enableKeyEvents: true,
		    listeners: {
			keyup: function(field, e) {
			    userfilter = field.getValue();
			    reload_task.delay(500);
			}
		    }
		}, ' ', gettext('Only Errors') + ':', ' ',
		{
		    xtype: 'checkbox',
		    hideLabel: true,
		    checked: filter_errors,
		    listeners: {
			change: function(field, checked) {
			    filter_errors = checked ? 1 : 0;
			    reload_task.delay(10);
			}
		    }
		}, ' '
	    ],
	    sortableColumns: false,
	    columns: [
		{ 
		    header: gettext("Start Time"), 
		    dataIndex: 'starttime',
		    width: 100,
		    renderer: function(value) { 
			return Ext.Date.format(value, "M d H:i:s"); 
		    }
		},
		{ 
		    header: gettext("End Time"), 
		    dataIndex: 'endtime',
		    width: 100,
		    renderer: function(value, metaData, record) {
			return  Ext.Date.format(value,"M d H:i:s"); 
		    }
		},
		{ 
		    header: gettext("Node"), 
		    dataIndex: 'node',
		    width: 100
		},
		{ 
		    header: gettext("User name"), 
		    dataIndex: 'user',
		    width: 150
		},
		{ 
		    header: gettext("Description"), 
		    dataIndex: 'upid', 
		    flex: 1,
		    renderer: PVE.Utils.render_upid
		},
		{ 
		    header: gettext("Status"), 
		    dataIndex: 'status', 
		    width: 200,
		    renderer: function(value, metaData, record) { 
			if (value == 'OK') {
			    return 'OK';
			}
			// metaData.attr = 'style="color:red;"'; 
			return "ERROR: " + value;
		    }
		}
	    ],
	    listeners: {
		itemdblclick: run_task_viewer,
		selectionchange: function(v, selections) {
		    view_btn.setDisabled(!(selections && selections[0]));
		},
		show: function() { reload_task.delay(10); }
	    }
	});

	me.callParent();

	store.guaranteeRange(0, store.pageSize - 1);
    }
});

