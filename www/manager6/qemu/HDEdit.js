/*jslint confusion: true */
/* 'change' property is assigned a string and then a function */
Ext.define('PVE.qemu.HDInputPanel', {
    extend: 'PVE.panel.InputPanel',
    alias: 'widget.PVE.qemu.HDInputPanel',
    onlineHelp: 'qm_hard_disk',

    insideWizard: false,

    unused: false, // ADD usused disk imaged

    vmconfig: {}, // used to select usused disks

    controller: {

	xclass: 'Ext.app.ViewController',

	onControllerChange: function(field) {
	    var value = field.getValue();
	    this.lookup('iothread').setDisabled(!value.match(/^(virtio|scsi)/));
	},

	control: {
	    'field[name=controller]': {
		change: 'onControllerChange',
		afterrender: 'onControllerChange'
	    },
	    'field[name=hdstorage]': {
		change: function(f, value) {
		    if (!value) { // initial store loading fires an unwanted 'change'
			return;
		    }
		    var me = this.getView();
		    var rec = f.store.getById(value);
		    if (rec.data.type === 'iscsi') {
			me.hdfilesel.setStorage(value);
			me.hdfilesel.setDisabled(false);
			me.formatsel.setValue('raw');
			me.formatsel.setDisabled(true);
			me.hdfilesel.setVisible(true);
			me.hdsizesel.setDisabled(true);
			me.hdsizesel.setVisible(false);
		    } else if (rec.data.type === 'lvm' ||
			       rec.data.type === 'lvmthin' ||
			       rec.data.type === 'drbd' ||
			       rec.data.type === 'rbd' ||
			       rec.data.type === 'sheepdog' ||
			       rec.data.type === 'zfs' ||
			       rec.data.type === 'zfspool' ||
			       rec.data.type === 'btrfs') {
			me.hdfilesel.setDisabled(true);
			me.hdfilesel.setVisible(false);
			me.formatsel.setValue('raw');
			me.formatsel.setDisabled(true);
			me.hdsizesel.setDisabled(false);
			me.hdsizesel.setVisible(true);
		    } else {
			me.hdfilesel.setDisabled(true);
			me.hdfilesel.setVisible(false);
			me.formatsel.setValue('qcow2');
			me.formatsel.setDisabled(false);
			me.hdsizesel.setDisabled(false);
			me.hdsizesel.setVisible(true);
		    }
		}
	    }
	}
    },

    onGetValues: function(values) {
	var me = this;

	var confid = me.confid || (values.controller + values.deviceid);
	
	if (me.unused) {
	    me.drive.file = me.vmconfig[values.unusedId];
	    confid = values.controller + values.deviceid;
	} else if (me.isCreate) {
	    if (values.hdimage) {
		me.drive.file = values.hdimage;
	    } else {
		me.drive.file = values.hdstorage + ":" + values.disksize;
	    }
	    me.drive.format = values.diskformat;
	}
	
	if (values.nobackup) {
	    me.drive.backup = 'no';
	} else {
	    delete me.drive.backup;
	}

	if (values.discard) {
	    me.drive.discard = 'on';
	} else {
	    delete me.drive.discard;
	}

	if (values.iothread && confid.match(/^(virtio|scsi)\d+$/)) {
	    me.drive.iothread = 'on';
	} else {
	    delete me.drive.iothread;
	}

	if (values.cache) {
	    me.drive.cache = values.cache;
	} else {
	    delete me.drive.cache;
	}

	var params = {};
		
	params[confid] = PVE.Parser.printQemuDrive(me.drive);
	
	return params;	
    },

    setVMConfig: function(vmconfig) {
	var me = this;

	me.vmconfig = vmconfig;

	if (me.bussel) {
	    me.bussel.setVMConfig(vmconfig, true);
	}
	if (me.unusedDisks) {
	    var disklist = [];	    
	    Ext.Object.each(vmconfig, function(key, value) {
		if (key.match(/^unused\d+$/)) {
		    disklist.push([key, value]);
		}
	    });
	    me.unusedDisks.store.loadData(disklist);
	    me.unusedDisks.setValue(me.confid);
	}
    },

    setDrive: function(drive) {
	var me = this;

	me.drive = drive;

	var values = {};
	var match = drive.file.match(/^([^:]+):/);
	if (match) {
	    values.hdstorage = match[1];
	}

	values.hdimage = drive.file;
	values.nobackup = !PVE.Parser.parseBoolean(drive.backup, 1);
	values.diskformat = drive.format || 'raw';
	values.cache = drive.cache || '__default__';
	values.discard = (drive.discard === 'on');
	values.iothread = PVE.Parser.parseBoolean(drive.iothread);

	me.setValues(values);
    },

    setNodename: function(nodename) {
	var me = this;
	me.hdstoragesel.setNodename(nodename);
	me.hdfilesel.setStorage(undefined, nodename);
    },

    initComponent : function() {
	var me = this;

	me.drive = {};

	me.column1 = [];
	me.column2 = [];

	if (!me.confid || me.unused) {
	    me.bussel = Ext.create('PVE.form.ControllerSelector', {
		vmconfig: me.insideWizard ? {ide2: 'cdrom'} : {}
	    });
	    me.column1.push(me.bussel);
	}

	if (me.unused) {
	    me.unusedDisks = Ext.create('PVE.form.KVComboBox', {
		name: 'unusedId',	
		fieldLabel: gettext('Disk image'),
		matchFieldWidth: false,
		listConfig: {
		    width: 350
		},
		data: [],
		allowBlank: false
	    });
	    me.column1.push(me.unusedDisks);
	} else if (me.isCreate) {
	    me.formatsel = Ext.create('PVE.form.DiskFormatSelector', {
		name: 'diskformat',
		fieldLabel: gettext('Format'),
		value: 'qcow2',
		allowBlank: false
	    });

	    me.hdfilesel = Ext.create('PVE.form.FileSelector', {
		name: 'hdimage',
		nodename: me.nodename,
		storageContent: 'images',
		fieldLabel: gettext('Disk image'),
		disabled: true,
		hidden: true,
		allowBlank: false
	    });

	    me.hdsizesel = Ext.createWidget('numberfield', {
		name: 'disksize',
		minValue: 0.001,
		maxValue: 128*1024,
		decimalPrecision: 3,
		value: '32',
		fieldLabel: gettext('Disk size') + ' (GB)',
		allowBlank: false
	    });

	    me.hdstoragesel = Ext.create('PVE.form.StorageSelector', {
		name: 'hdstorage',
		nodename: me.nodename,
		fieldLabel: gettext('Storage'),
		storageContent: 'images',
		autoSelect: me.insideWizard,
		allowBlank: false
	    });
	    me.column1.push(me.hdstoragesel);
	    me.column1.push(me.hdfilesel);
	    me.column1.push(me.hdsizesel);
	    me.column1.push(me.formatsel);

	} else {
	    me.column1.push({
		xtype: 'textfield',
		disabled: true,
		submitValue: false,
		fieldLabel: gettext('Disk image'),
                name: 'hdimage'
	    });
	}

	me.column2.push({
	    xtype: 'CacheTypeSelector',
	    name: 'cache',
	    value: '__default__',
	    fieldLabel: gettext('Cache')
	});

	me.column2.push({
	    xtype: 'pvecheckbox',
	    fieldLabel: gettext('No backup'),
	    name: 'nobackup'
	});

	me.column2.push({
	    xtype: 'pvecheckbox',
	    fieldLabel: gettext('Discard'),
	    name: 'discard'
	});

	me.column2.push({
	    xtype: 'pvecheckbox',
	    disabled: me.insideWizard || (me.confid && !me.confid.match(/^(virtio|scsi)/)),
	    fieldLabel: gettext('IO thread'),
	    reference: 'iothread',
	    name: 'iothread'
	});

	me.callParent();
    }
});
/*jslint confusion: false */

Ext.define('PVE.qemu.HDEdit', {
    extend: 'PVE.window.Edit',

    isAdd: true,

    initComponent : function() {
	var me = this;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) { 
	    throw "no node name specified";	    
	}

	var unused = me.confid && me.confid.match(/^unused\d+$/);

	me.isCreate = me.confid ? unused : true;

	var ipanel = Ext.create('PVE.qemu.HDInputPanel', {
	    confid: me.confid,
	    nodename: nodename,
	    unused: unused,
	    isCreate: me.isCreate
	});

	var subject;
	if (unused) {
	    me.subject = gettext('Unused Disk');
	} else if (me.isCreate) {
            me.subject = gettext('Hard Disk');
	} else {
           me.subject = gettext('Hard Disk') + ' (' + me.confid + ')';
	}

	me.items = [ ipanel ];

	me.callParent();
	/*jslint confusion: true*/
	/* 'data' is assigned an empty array in same file, and here we
	 * use it like an object
	 */
	me.load({
	    success: function(response, options) {
		ipanel.setVMConfig(response.result.data);
		if (me.confid) {
		    var value = response.result.data[me.confid];
		    var drive = PVE.Parser.parseQemuDrive(me.confid, value);
		    if (!drive) {
			Ext.Msg.alert(gettext('Error'), 'Unable to parse drive options');
			me.close();
			return;
		    }
		    ipanel.setDrive(drive);
		    me.isValid(); // trigger validation
		}
	    }
	});
	/*jslint confusion: false*/
    }
});
