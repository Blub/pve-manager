/*jslint confusion: true */
Ext.define('PVE.lxc.RessourceView', {
    extend: 'PVE.grid.ObjectGrid',
    alias: ['widget.pveLxcRessourceView'],

    renderKey: function(key, metaData, rec, rowIndex, colIndex, store) {
	var me = this;
	var rows = me.rows;
	var rowdef = rows[key] || {};

	metaData.tdAttr = "valign=middle";

	if (rowdef.tdCls) {
	    metaData.tdCls = rowdef.tdCls;
	    if (rowdef.tdCls == 'pve-itype-icon-storage') {
		var value = me.getObjectValue(key, '', true);
	    }
	}
	return rowdef.header || key;
    },

    initComponent : function() {
	var me = this;
	var i, confid;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) { 
	    throw "no node name specified";
	}

	var vmid = me.pveSelNode.data.vmid;
	if (!vmid) {
	    throw "no VM ID specified";
	}

	var caps = Ext.state.Manager.get('GuiCap');

	var rows = {
	    memory: {
		header: gettext('Memory'),
		editor: caps.vms['VM.Config.Memory'] ? 'PVE.lxc.MemoryEdit' : undefined,
		never_delete: true,
		defaultValue: 512,
		tdCls: 'pve-itype-icon-memory',
		renderer: function(value) {
		    return PVE.Utils.format_size(value*1024*1024);
		}
	    },
	    swap: {
		header: gettext('Swap'),
		editor: caps.vms['VM.Config.Memory'] ? 'PVE.lxc.MemoryEdit' : undefined,
		never_delete: true,
		defaultValue: 512,
		tdCls: 'pve-itype-icon-swap',
		renderer: function(value) {
		    return PVE.Utils.format_size(value*1024*1024);
		}
	    },
	    cpulimit: {
		header: gettext('CPU limit'),
		never_delete: true,
		editor: caps.vms['VM.Config.CPU'] ? 'PVE.lxc.CPUEdit' : undefined,
		defaultValue: 1,
		tdCls: 'pve-itype-icon-processor',
		renderer: function(value) {
		    if (value) { return value; };
		    return gettext('unlimited');
		}
	    },
	    cpuunits: {
		header: gettext('CPU units'),
		never_delete: true,
		editor: caps.vms['VM.Config.CPU'] ? 'PVE.lxc.CPUEdit' : undefined,
		defaultValue: 1024,
		tdCls: 'pve-itype-icon-processor'
	    },
	    rootfs: {
		header: gettext('Root Disk'),
		defaultValue: PVE.Utils.noneText,
		tdCls: 'pve-itype-icon-storage'
	    }
	};

	for (i = 0; i < 10; i++) {
	    confid = "mp" + i;
	    rows[confid] = {
		group: 1,
		tdCls: 'pve-itype-icon-storage',
		header: gettext('Mount Point') + ' (' + confid +')',
	    };
	}

	var reload = function() {
	    me.rstore.load();
	};

	var baseurl = 'nodes/' + nodename + '/lxc/' + vmid + '/config';

	var sm = Ext.create('Ext.selection.RowModel', {});

	var run_editor = function() {
	    var rec = sm.getSelection()[0];
	    if (!rec) {
		return;
	    }

	    var rowdef = rows[rec.data.key];
	    if (!rowdef.editor) {
		return;
	    }

	    var editor = rowdef.editor;

	    var win = Ext.create(editor, {
		pveSelNode: me.pveSelNode,
		confid: rec.data.key,
		url: '/api2/extjs/' + baseurl
	    });

	    win.show();
	    win.on('destroy', reload);
	};

	var run_resize = function() {
	    var rec = sm.getSelection()[0];
	    if (!rec) {
		return;
	    }

	    var win = Ext.create('PVE.window.MPResize', {
		disk: rec.data.key,
		nodename: nodename,
		vmid: vmid
	    });

	    win.show();

	    win.on('destroy', reload);
	};

	var edit_btn = new PVE.button.Button({
	    text: gettext('Edit'),
	    selModel: sm,
	    disabled: true,
	    enableFn: function(rec) {
		if (!rec) {
		    return false;
		}
		var rowdef = rows[rec.data.key];
		return !!rowdef.editor;
	    },
	    handler: run_editor
	});

	var resize_btn = new PVE.button.Button({
	    text: gettext('Resize disk'),
	    selModel: sm,
	    disabled: true,
	    handler: run_resize
	});

	var set_button_status = function() {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];

	    if (!rec) {
		edit_btn.disable();
		resize_btn.disable();
		return;
	    }
	    var key = rec.data.key;
	    var value = rec.data.value;
	    var rowdef = rows[key];

	    var isDisk = (rowdef.tdCls == 'pve-itype-icon-storage');

	    edit_btn.setDisabled(rec.data['delete'] || !rowdef.editor);

	    resize_btn.setDisabled(!isDisk);

	};
	
	Ext.applyIf(me, {
	    url: '/api2/json/' + baseurl,
	    selModel: sm,
	    cwidth1: 170,
	    tbar: [ edit_btn,
		    resize_btn],
	    rows: rows,
	    listeners: {
		show: reload,
		itemdblclick: run_editor,
		selectionchange: set_button_status
	    }
	});

	me.callParent();
    }
});
