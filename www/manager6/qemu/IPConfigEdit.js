Ext.define('PVE.qemu.IPConfigPanel', {
    extend: 'PVE.panel.InputPanel',
    alias: 'widget.PVE.qemu.IPConfigPanel',

    insideWizard: false,

    onGetValues: function(values) {
	var me = this;

	if (values['ipv4mode'] !== 'static')
	    values['ip'] = values['ipv4mode'];
	else {
	    values['ip'] = values['ip'];
	}

	if (values['ipv6mode'] !== 'static')
	    values['ip6'] = values['ipv6mode'];
	else
	    values['ip6'] = values['ip6'];

	var params = {};

	var cfg = PVE.Parser.printIPConfig(values);
	if (cfg === '') {
	    params['delete'] = [me.confid];
	} else {
	    params[me.confid] = cfg;
	}
	return params;
    },

    setIPConfig: function(confid, data) {
	var me = this;

	me.confid = confid;

	if (data['ip'] === 'dhcp') {
	    data['ipv4mode'] = data['ip'];
	    data['ip'] = '';
	} else {
	    data['ipv4mode'] = 'static';
	}
	if (data['ip6'] === 'dhcp' || data['ip6'] === 'auto') {
	    data['ipv6mode'] = data['ip6'];
	    data['ip6'] = '';
	} else {
	    data['ipv6mode'] = 'static';
	}

	me.ipconfig = data;
	me.setValues(me.ipconfig);
    },

    initComponent : function() {
	var me = this;

	me.ipconfig = {};
	me.confid = 'ipconfig0';

	me.column1 = [
	    {
		layout: {
		    type: 'hbox',
		    align: 'middle'
		},
		border: false,
		margin: '0 0 5 0',
		height: 22, // hack: set same height as text fields
		items: [
		    {
			xtype: 'label',
			text: gettext('IPv4') + ':',
		    },
		    {
			xtype: 'radiofield',
			boxLabel: gettext('Static'),
			name: 'ipv4mode',
			inputValue: 'static',
			checked: false,
			margin: '0 0 0 10',
			listeners: {
			    change: function(cb, value) {
				me.down('field[name=ip]').setDisabled(!value);
				me.down('field[name=gw]').setDisabled(!value);
			    }
			}
		    },
		    {
			xtype: 'radiofield',
			boxLabel: gettext('DHCP'),
			name: 'ipv4mode',
			inputValue: 'dhcp',
			checked: false,
			margin: '0 0 0 10'
		    }
		]
	    },
	    {
		xtype: 'textfield',
		name: 'ip',
		vtype: 'IPCIDRAddress',
		value: '',
		disabled: true,
		fieldLabel: gettext('IPv4/CIDR')
	    },
	    {
		xtype: 'textfield',
		name: 'gw',
		value: '',
		vtype: 'IPAddress',
		disabled: true,
		fieldLabel: gettext('Gateway') + ' (' + gettext('IPv4') +')',
		margin: '0 0 3 0' // override bottom margin to account for the menuseparator
	    },
	];

	me.column2 = [
	    {
		layout: {
		    type: 'hbox',
		    align: 'middle'
		},
		border: false,
		margin: '0 0 5 0',
		height: 22, // hack: set same height as text fields
		items: [
		    {
			xtype: 'label',
			text: gettext('IPv6') + ':',
		    },
		    {
			xtype: 'radiofield',
			boxLabel: gettext('Static'),
			name: 'ipv6mode',
			inputValue: 'static',
			checked: false,
			margin: '0 0 0 10',
			listeners: {
			    change: function(cb, value) {
				me.down('field[name=ip6]').setDisabled(!value);
				me.down('field[name=gw6]').setDisabled(!value);
			    }
			}
		    },
		    {
			xtype: 'radiofield',
			boxLabel: gettext('DHCP'),
			name: 'ipv6mode',
			inputValue: 'dhcp',
			checked: false,
			margin: '0 0 0 10'
		    },
		    {
			xtype: 'radiofield',
			boxLabel: gettext('SLAAC'),
			name: 'ipv6mode',
			inputValue: 'auto',
			checked: false,
			margin: '0 0 0 10'
		    }
		]
	    },
	    {
		xtype: 'textfield',
		name: 'ip6',
		value: '',
		vtype: 'IP6CIDRAddress',
		disabled: true,
		fieldLabel: gettext('IPv6/CIDR')
	    },
	    {
		xtype: 'textfield',
		name: 'gw6',
		vtype: 'IP6Address',
		value: '',
		disabled: true,
		fieldLabel: gettext('Gateway') + ' (' + gettext('IPv6') +')'
	    }
	];

	me.callParent();
    }
});

Ext.define('PVE.qemu.IPConfigEdit', {
    extend: 'PVE.window.Edit',

    isAdd: true,

    initComponent : function() {
	/*jslint confusion: true */

	var me = this;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) { 
	    throw "no node name specified";	    
	}

	me.create = me.confid ? false : true;

	var ipanel = Ext.create('PVE.qemu.IPConfigPanel', {
	    confid: me.confid,
	    nodename: nodename
	});

	Ext.applyIf(me, {
	    subject: gettext('Network Config'),
	    items: ipanel
	});

	me.callParent();

	me.load({
	    success: function(response, options) {
		me.vmconfig = response.result.data;
		var ipconfig = {};
		var value = me.vmconfig[me.confid];
		if (value) {
		    ipconfig = PVE.Parser.parseIPConfig(me.confid, value);
		    if (!ipconfig) {
			Ext.Msg.alert(gettext('Error'), gettext('Unable to parse network configuration'));
			me.close();
			return;
		    }
		}
		ipanel.setIPConfig(me.confid, ipconfig);
	    }
	});
    }
});
