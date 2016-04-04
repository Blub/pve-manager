Ext.define('PVE.qemu.SSHKeyInputPanel', {
    extend: 'PVE.panel.InputPanel',
    alias: 'widget.pveQemuSSHKeyInputPanel',

    insideWizard: false,

    onGetValues: function(values) {
	var me = this;
	if (values.sshkey) {
	    values.sshkey.trim();
	}
	if (!values.sshkey.length) {
	    values = { delete: 'sshkey' };
	} else {
	    values.sshkey = encodeURIComponent(values.sshkey);
	}
	return values;
    },

    addFromFile: function(file) {
	var me = this;
	var reader = new FileReader();
	reader.onload = function(evt) {
	    me.sshkey.setValue(evt.target.result);
	};
	reader.readAsText(file);
    },

    initComponent: function() {
	var me = this;

	me.sshkey = Ext.createWidget('textfield', {
	    name: 'sshkey',
	    value: '',
	    hideLabel: true
	});
	me.items = [ me.sshkey ];

	if (window.FileReader) {
	    me.file = Ext.create('Ext.form.field.FileButton', {
		name: 'file',
		text: gettext('Use a file'),
		listeners: {
		    change: function(btn, e, value) {
			e = e.event;
			Ext.Array.each(e.target.files, function(file) {
			    me.addFromFile(file);
			});
			btn.reset();
		    }
		}
	    });
	    me.items.push(me.file);
	}

	me.callParent();
    },

    afterRender: function() {
	var me = this;
	me.callParent();

	if (window.FileReader) {
	    // browser can read files, it's about time to sandbox it, FYI.
	    var cancel = function(ev) {
		ev = ev.event;
		if (ev.preventDefault) {
		    ev.preventDefault();
		}
	    };
	    me.sshkey.inputEl.on('dragover', cancel);
	    me.sshkey.inputEl.on('dragenter', cancel);
	    me.sshkey.inputEl.on('drop', function(ev) {
		ev = ev.event;
		if (ev.preventDefault) {
		    ev.preventDefault();
		}
		var files = ev.dataTransfer.files;
		Ext.Array.each(files, function(file) {
		    me.addFromFile(file);
		});
	    });
	} else {
	    // console.log("No FileReader support");
	}
    }
});

Ext.define('PVE.qemu.SSHKeyEdit', {
    extend: 'PVE.window.Edit',

    resizable: true,

    initComponent : function() {
	var me = this;

	var ipanel = Ext.create('PVE.qemu.SSHKeyInputPanel');

	Ext.apply(me, {
	    subject: gettext('SSH Keys'),
	    items: ipanel
	});

	me.callParent();

	if (!me.create) {
	    me.load({
		success: function(response, options) {
		    var data = response.result.data;
		    if (data.sshkey) {
			data.sshkey = decodeURIComponent(data.sshkey);
			ipanel.setValues(data);
		    }
		}
	    });
	}
    }
});
