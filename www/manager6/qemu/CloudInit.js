/*jslint confusion: true */
Ext.define('PVE.qemu.CloudInit', {
    extend: 'PVE.grid.PendingObjectGrid',
    alias: ['widget.PVE.qemu.CloudInit'],

    initComponent : function() {
	var me = this;
	var i, confid;

	me.pveBusId = undefined;
	me.pveDiskInfo = undefined;
	me.pveDiskDeleted = 0;

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
	    hostname: {
		editor: caps.vms['VM.Config.Network'] ? 'PVE.qemu.DNSEdit' : undefined,
		never_delete: caps.vms['VM.Config.Network'] ? false : true,
		header: gettext('Hostname'),
		defaultValue: ''
	    },
	    searchdomain: {
		editor: caps.vms['VM.Config.Network'] ? 'PVE.qemu.DNSEdit' : undefined,
		never_delete: caps.vms['VM.Config.Network'] ? false : true,
		header: gettext('Searchdomain'),
		defaultValue: ''
	    },
	    nameserver: {
		editor: caps.vms['VM.Config.Network'] ? 'PVE.qemu.DNSEdit' : undefined,
		never_delete: caps.vms['VM.Config.Network'] ? false : true,
		header: gettext('Nameserver'),
		defaultValue: ''
	    },
	    sshkey: {
		editor: caps.vms['VM.Config.Network'] ? 'PVE.qemu.SSHKeyEdit' : undefined,
		never_delete: caps.vms['VM.Config.Network'] ? false : true,
		header: gettext('SSH Key'),
		renderer: function(value) {
		    value = decodeURIComponent(value);
		    if (value.length) {
			// First erase all quoted strings (eg. command="foo"
			var v = value.replace(/"(?:\\.|[^"\\])*"/g, '');
			// Now try to detect the comment:
			var res = v.match(/^\s*(\S+\s+)?(?:ssh-(?:dss|rsa|ed25519)|ecdsa-sha2-nistp\d+)\s+\S+\s+(.*?)\s*$/, '');
			if (res) {
			    value = Ext.String.htmlEncode(res[2]);
			    if (res[1]) {
				value += ' <span style="color:gray">(' + gettext('with options') + ')</span>';
			    }
			    return value;
			}
			// Most likely invalid at this point, so just stick to
			// the old value.
		    }
		    return Ext.String.htmlEncode(value);
		},
		defaultValue: ''
	    }
	};

	for (i = 0; i < 32; i++) {
	    var confid = "ipconfig" + i;
	    rows[confid] = {
	        tdCls: 'pve-itype-icon-network',
	        editor: caps.vms['VM.Config.Network'] ? 'PVE.qemu.IPConfigEdit' : undefined,
	        never_delete: caps.vms['VM.Config.Network'] ? false : true,
	        header: gettext('Network') + ' ' + i
	    };
	    rows["net" + i] = {
		never_delete: caps.vms['VM.Config.Network'] ? false : true,
		visible: false
	    };
	}

	// we also need to know whether there's a cloudinit image already available
	PVE.Utils.forEachBus(undefined, function(type, id) {
	    rows[type + id] = { visible: false };
	});

	var reload = function() {
	    me.rstore.load();
	};

	var baseurl = 'nodes/' + nodename + '/qemu/' + vmid + '/config';

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
	    var win;

	    if (Ext.isString(editor)) {
		win = Ext.create(editor, {
		    pveSelNode: me.pveSelNode,
		    confid: rec.data.key,
		    url: '/api2/extjs/' + baseurl
		});
	    } else {
		var config = Ext.apply({
		    pveSelNode: me.pveSelNode,
		    confid: rec.data.key,
		    url: '/api2/extjs/' + baseurl
		}, rowdef.editor);
		win = Ext.createWidget(rowdef.editor.xtype, config);
		win.load();
	    }

	    win.show();
	    win.on('destroy', reload);
	};

	var set_cloudinit_status = function(box, enabled) {
	    if (enabled) {
		var win = Ext.create('PVE.qemu.CloudInitCreator', {
		    url: '/api2/extjs/' + baseurl,
		    pveSelNode: me.pveSelNode,
		    pveBusId: me.pveBusId
		});
		win.on('destroy', reload);
		win.show();
	    } else {
		PVE.Utils.API2Request({
		    url: '/api2/extjs/' + baseurl,
		    waitMsgTarget: me,
		    method: 'PUT',
		    params: {
			'force': 1,
			'delete': me.pveBusId
		    },
		    callback: function() {
			reload();
		    },
		    failure: function (response, opts) {
			Ext.Msg.alert('Error', response.htmlStatus);
			box.setValue(true);
		    }
		});
	    }
	};

	var run_commit = function() {
	    var confid = me.pveBusId;
	    if (!Ext.isDefined(confid)) {
		Ext.Msg.alert('Error', "internal error: cannot commit");
		return;
	    }

	    var drive = PVE.Parser.parseVolume(confid, me.pveDiskInfo);
	    if (!drive) {
		Ext.Msg.alert('Error', "bad volume string: " + me.pveDiskInfo);
		return;
	    }

	    var eject_params = {};
	    var insert_params = {};
	    eject_params[confid] = 'none,media=cdrom';
	    insert_params[confid] = drive.storage + ':cloudinit';

	    var failure = function(response, opts) {
		Ext.Msg.alert('Error', response.htmlStatus);
	    };

	    PVE.Utils.API2Request({
		url: '/api2/extjs/' + baseurl,
		waitMsgTarget: me,
		method: 'PUT',
		params: eject_params,
		failure: failure,
		callback: function() {
		    PVE.Utils.API2Request({
			url: '/api2/extjs/' + baseurl,
			waitMsgTarget: me,
			method: 'PUT',
			params: insert_params,
			failure: failure,
			callback: reload
		    });
		},
	    });
	};

	var enable_cb = new PVE.form.Checkbox({
	    boxLabel: gettext('Enable'),
	    checked: false,
	    height: 22, // hack: set same height as text fields
	    listeners: {
		change: set_cloudinit_status
	    }
	});

	var commit_btn = new PVE.button.Button({
	    text: gettext('Commit Config'),
	    disabled: true,
	    handler: run_commit
	});

	var edit_btn = new PVE.button.Button({
	    text: gettext('Edit'),
	    selModel: sm,
	    disabled: true,
	    handler: run_editor
        });

	var revert_btn = new PVE.button.Button({
	    text: gettext('Revert'),
	    selModel: sm,
	    disabled: true,
	    handler: function(b, e, rec) {
		var rowdef = me.rows[rec.data.key] || {};
		var keys = rowdef.multiKey ||  [ rec.data.key ];
		var revert = keys.join(',');
		PVE.Utils.API2Request({
		    url: '/api2/extjs/' + baseurl,
		    waitMsgTarget: me,
		    method: 'PUT',
		    params: {
			'revert': revert
		    },
		    callback: function() {
			reload();
		    },
		    failure: function (response, opts) {
			Ext.Msg.alert('Error',response.htmlStatus);
		    }
		});
	    }
	});

	var set_button_status = function() {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];

	    if (!rec) {
		edit_btn.disable();
		revert_btn.disable();
		return;
	    }
	    var key = rec.data.key;
	    var value = rec.data.value;
	    var rowdef = rows[key];

	    var pending = rec.data['delete'] || me.hasPendingChanges(key);

	    edit_btn.setDisabled(rec.data['delete'] || !rowdef.editor);

	    revert_btn.setDisabled(!pending);
	};

	var update_data = function() {
	    var i;
	    me.pveBusId = undefined;
	    me.pveDiskInfo = undefined;
	    me.pveDiskDeleted = 0;
	    PVE.Utils.forEachBus(undefined, function(type, id) {
		var confid = type + id;
		var entry = me.rstore.getById(confid);
		if (!entry)
		    return; // continue
		if (entry.data.value.match(/vm-\d+-cloudinit/)) {
		    me.pveBusId = confid;
		    me.pveDiskInfo = entry.data.value;
		    me.pveDiskDeleted = entry.data['delete'];
		    return false; // break
		}
	    });
	    enable_cb.suspendEvents();
	    var enabled = Ext.isDefined(me.pveBusId) && !me.pveDiskDeleted;
	    enable_cb.setValue(enabled);
	    commit_btn.setDisabled(!enabled);
	    enable_cb.resumeEvents(false);

	    // add/remove arrays because .add/.remove recurses into the
	    // 'datachange' signal
	    var to_add = [];
	    var to_remove = [];
	    for (i = 0; i < 32; i++) {
		var cid = "ipconfig" + i;
		var nid = "net" + i;
		var dev = me.rstore.getById(nid);
		var conf = me.rstore.getById(cid);
		if (!dev) {
		    if (conf)
			to_remove.push(conf);
		    continue;
		}
		if (!conf) {
		    to_add.push({ key: cid, value: '' });
		    rows[cid].visible = true;
		} else
		    rows[conf.data.key].visible = !!dev;
	    }
	    if (to_remove.length)
		me.rstore.remove(to_remove);
	    if (to_add.length)
		me.rstore.add(to_add);
	};

	Ext.apply(me, {
	    url: '/api2/json/' + 'nodes/' + nodename + '/qemu/' + vmid + '/pending',
	    interval: 5000,
	    selModel: sm,
	    cwidth1: 170,
	    tbar: [ 
		enable_cb,
		commit_btn,
		edit_btn,
		revert_btn
	    ],
	    rows: rows,
	    listeners: {
		itemdblclick: run_editor,
		selectionchange: set_button_status
	    }
	});

	me.callParent();

	me.on('activate', me.rstore.startUpdate);
	me.on('hide', me.rstore.stopUpdate);
	me.on('destroy', me.rstore.stopUpdate);	

	me.rstore.on('datachanged', function() {
	    update_data();
	    set_button_status();
	});
    }
});

