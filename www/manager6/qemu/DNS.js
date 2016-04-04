Ext.define('PVE.qemu.DNSInputPanel', {
    extend: 'PVE.panel.InputPanel',
    alias: 'widget.pveQemuDNSInputPanel',

    insideWizard: false,

    onGetValues: function(values) {
	var me = this;

	if (!values.searchdomain) {
	    if (me.insideWizard) {
		return {};
	    } else {
		return { "delete": "searchdomain,nameserver" };
	    }
	}
	var list = [];
	Ext.Array.each(['dns1', 'dns2', 'dns3'], function(fn) {
	    if (values[fn]) {
		list.push(values[fn]);
	    }
	    delete values[fn];
	});

	if (list.length) {
	    values.nameserver = list.join(' ');
	} else {
	    if (!me.insideWizard) {
		values['delete'] = 'nameserver';
	    }
	}
	return values;
    },

    initComponent : function() {
	var me = this;

	var items = [
	    {
		xtype: 'pvetextfield',
		name: 'hostname',
		skipEmptyText: true,
		fieldLabel: gettext('Hostname'),
		emptyText: gettext('use vm name'),
		allowBlank: true,
		listeners: {
		    change: function(f, value) {
			if (!me.rendered) {
			    return;
			}
			var field_ids = ['#dns1', '#dns2', '#dns3'];
			Ext.Array.each(field_ids, function(fn) {
			    var field = me.down(fn);
			    field.setDisabled(!value);
			    field.clearInvalid();
			});
		    }
		}
	    },
	    {
		xtype: 'pvetextfield',
		name: 'searchdomain',
		skipEmptyText: true,
		fieldLabel: gettext('DNS domain'),
		emptyText: gettext('use host settings'),
		allowBlank: true,
		listeners: {
		    change: function(f, value) {
			if (!value || !value.length) {
			    me.down('field[name=hostname]').setEmptyText('use vm name');
			} else {
			    me.down('field[name=hostname]').setEmptyText('vmname.searchdomain');
			}
			if (!me.rendered) {
			    return;
			}
			var field_ids = ['#dns1', '#dns2', '#dns3'];
			Ext.Array.each(field_ids, function(fn) {
			    var field = me.down(fn);
			    field.setDisabled(!value);
			    field.clearInvalid();
			});
		    }
		}
	    },
	    {
		xtype: 'pvetextfield',
		fieldLabel: gettext('DNS server') + " 1",
		vtype: 'IP64Address',
		allowBlank: true,
		disabled: true,
		name: 'dns1',
		itemId: 'dns1'
	    },
	    {
		xtype: 'pvetextfield',
		fieldLabel: gettext('DNS server') + " 2",
		vtype: 'IP64Address',
		skipEmptyText: true,
		disabled: true,
		name: 'dns2',
		itemId: 'dns2'
	    },
	    {
		xtype: 'pvetextfield',
		fieldLabel: gettext('DNS server') + " 3",
		vtype: 'IP64Address',
		skipEmptyText: true,
		disabled: true,
		name: 'dns3',
		itemId: 'dns3'
	    }
	];

	if (me.insideWizard) {
	    me.column1 = items;
	} else {
	    me.items = items;
	}

	me.callParent();
    }
});

Ext.define('PVE.qemu.DNSEdit', {
    extend: 'PVE.window.Edit',

    initComponent : function() {
	var me = this;

	var ipanel = Ext.create('PVE.qemu.DNSInputPanel');

	Ext.apply(me, {
	    subject: gettext('Resources'),
	    items: ipanel
	});

	me.callParent();

	if (!me.create) {
	    me.load({
		success: function(response, options) {
		    var values = response.result.data;

		    if (values.nameserver) {
			values.nameserver.replace(/[,;]/, ' ');
			values.nameserver.replace(/^\s+/, '');
			var nslist = values.nameserver.split(/\s+/);
			values.dns1 = nslist[0];
			values.dns2 = nslist[1];
			values.dns3 = nslist[2];
		    }

		    ipanel.setValues(values);
		}
	    });
	}
    }
});
