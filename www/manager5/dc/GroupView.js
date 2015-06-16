Ext.define('PVE.dc.GroupView', {
    extend: 'Ext.grid.GridPanel',

    alias: ['widget.pveGroupView'],

    initComponent : function() {
	var me = this;

	var store = new Ext.data.Store({
	    model: 'pve-groups',
	    sorters: { 
		property: 'groupid', 
		order: 'DESC' 
	    }
	});

        var reload = function() {
            store.load();
        };

	var sm = Ext.create('Ext.selection.RowModel', {});

	var remove_btn = new PVE.button.Button({
	    text: gettext('Remove'),
	    disabled: true,
	    selModel: sm,
	    confirmMsg: function (rec) {
		return Ext.String.format(gettext('Are you sure you want to remove entry {0}'),
					 "'" + rec.data.groupid + "'");
	    },
	    handler: function(btn, event, rec) {
		PVE.Utils.API2Request({
		    url: '/access/groups/' + rec.data.groupid,
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

	var run_editor = function() {
	    var rec = sm.getSelection()[0];
	    if (!rec) {
		return;
	    }

            var win = Ext.create('PVE.dc.GroupEdit',{
                groupid: rec.data.groupid
            });
            win.on('destroy', reload);
            win.show();
	};

	var edit_btn = new PVE.button.Button({
	    text: gettext('Edit'),
	    disabled: true,
	    selModel: sm,
	    handler: run_editor
	});

	var tbar = [
            {
		text: gettext('Create'),
		handler: function() {
		    var win = Ext.create('PVE.dc.GroupEdit', {});
		    win.on('destroy', reload);
		    win.show();
		}
            },
	    edit_btn, remove_btn
        ];

	PVE.Utils.monStoreErrors(me, store);

	Ext.apply(me, {
	    store: store,
	    selModel: sm,
	    stateful: false,
	    tbar: tbar,
	    viewConfig: {
		trackOver: false
	    },
	    columns: [
		{
		    header: gettext('Name'),
		    width: 200,
		    sortable: true,
		    dataIndex: 'groupid'
		},
		{
		    header: gettext('Comment'),
		    sortable: false,
		    dataIndex: 'comment',
		    flex: 1
		}
	    ],
	    listeners: {
		show: reload,
		itemdblclick: run_editor
	    }
	});

	me.callParent();
    }
});
