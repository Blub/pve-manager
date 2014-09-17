/*jslint confusion: true */
Ext.define('PVE.openvz.CreateWizard', {
    extend: 'PVE.window.Wizard',

    initComponent: function() {
	var me = this;

	var summarystore = Ext.create('Ext.data.Store', {
	    model: 'KeyValue',
	    sorters: [
		{
		    property : 'key',
		    direction: 'ASC'
		}
	    ]
	});

	var storagesel = Ext.create('PVE.form.StorageSelector', {
	    name: 'storage',
	    fieldLabel: gettext('Storage'),
	    storageContent: 'rootdir',
	    autoSelect: true,
	    allowBlank: false
	});

	var tmplsel = Ext.create('PVE.form.FileSelector', {
	    name: 'ostemplate',
	    storageContent: 'vztmpl',
	    fieldLabel: gettext('Template'),
	    allowBlank: false
	});

	var tmplstoragesel = Ext.create('PVE.form.StorageSelector', {
	    name: 'tmplstorage',
	    fieldLabel: gettext('Storage'),
	    storageContent: 'vztmpl',
	    autoSelect: true,
	    allowBlank: false,
	    listeners: {
		change: function(f, value) {
		    tmplsel.setStorage(value);
		}
	    }
	});

	var bridgesel = Ext.create('PVE.form.BridgeSelector', {
	    name: 'bridge',
	    fieldLabel: gettext('Bridge'),
	    labelAlign: 'right',
	    autoSelect: true,
	    disabled: true,
	    allowBlank: false
	});

	Ext.applyIf(me, {
	    subject: gettext('OpenVZ Container'),
	    items: [
		{
		    xtype: 'inputpanel',
		    title: gettext('General'),
		    column1: [
			{
			    xtype: 'PVE.form.NodeSelector',
			    name: 'nodename',
			    fieldLabel: gettext('Node'),
			    allowBlank: false,
			    onlineValidator: true,
			    listeners: {
				change: function(f, value) {
				    tmplstoragesel.setNodename(value);
				    tmplsel.setStorage(undefined, value);
				    bridgesel.setNodename(value);
				    storagesel.setNodename(value);
				}
			    }
			},
			{
			    xtype: 'pveVMIDSelector',
			    name: 'vmid',
			    value: '',
			    loadNextFreeVMID: true,
			    validateExists: false
			},
			{
			    xtype: 'pvetextfield',
			    name: 'hostname',
			    vtype: 'DnsName',
			    value: '',
			    fieldLabel: gettext('Hostname'),
			    skipEmptyText: true,
			    allowBlank: true
			}
		    ],
		    column2: [
			{
			    xtype: 'pvePoolSelector',
			    fieldLabel: gettext('Resource Pool'),
			    name: 'pool',
			    value: '',
			    allowBlank: true
			},
			storagesel,
			{
			    xtype: 'textfield',
			    inputType: 'password',
			    name: 'password',
			    value: '',
			    fieldLabel: gettext('Password'),
			    allowBlank: false,
			    minLength: 5,
			    change: function(f, value) {
				if (!me.rendered) {
				    return;
				}
				me.down('field[name=confirmpw]').validate();
			    }
			},
			{
			    xtype: 'textfield',
			    inputType: 'password',
			    name: 'confirmpw',
			    value: '',
			    fieldLabel: gettext('Confirm password'),
			    allowBlank: false,
			    validator: function(value) {
				var pw = me.down('field[name=password]').getValue();
				if (pw !== value) {
				    return "Passwords does not match!";
				}
				return true;
			    }
			}
		    ],
		    onGetValues: function(values) {
			delete values.confirmpw;
			if (!values.pool) {
			    delete values.pool;
			}
			return values;
		    }
		},
		{
		    xtype: 'inputpanel',
		    title: gettext('Template'),
		    column1: [ tmplstoragesel, tmplsel]
		},
		{
		    xtype: 'pveOpenVZResourceInputPanel',
		    title: gettext('Resources')
		},
		{
		    xtype: 'inputpanel',
		    title: gettext('Network'),
		    column1: [
			{
			    xtype: 'radiofield',
			    name: 'networkmode',
			    inputValue: 'routed',
			    boxLabel: 'Routed mode (venet)',
			    checked: true,
			    listeners: {
				change: function(f, value) {
				    if (!me.rendered) {
					return;
				    }
				    me.down('field[name=ip_address]').setDisabled(!value);
				    me.down('field[name=ip_address]').validate();
				}
			    }
			},
			{
			    xtype: 'textfield',
			    name: 'ip_address',
			    vtype: 'IP64Address',
			    value: '',
			    fieldLabel: gettext('IP address'),
			    labelAlign: 'right',
			    allowBlank: false
			}
		    ],
		    column2: [
			{
			    xtype: 'radiofield',
			    name: 'networkmode',
			    inputValue: 'bridge',
			    boxLabel: gettext('Bridged mode'),
			    checked: false,
			    listeners: {
				change: function(f, value) {
				    if (!me.rendered) {
					return;
				    }
				    me.down('field[name=firewall]').setDisabled(!value);
				    me.down('field[name=bridge]').setDisabled(!value);
				    me.down('field[name=bridge]').validate();
				}
			    }
			},
			bridgesel,
			{
			    xtype: 'pvecheckbox',
			    fieldLabel: gettext('Firewall'),
			    name: 'firewall',
			    checked: false,
			    disabled: true
			}
		    ],
		    onGetValues: function(values) {
			if (values.networkmode === 'bridge') {
			    var netif = PVE.Parser.printOpenVZNetIf({
				eth0: {
				    ifname: "eth0",
				    bridge: values.bridge,
				    firewall: values.firewall
				}
			    });
			    return { netif: netif };
			} else {
			    return { ip_address: values.ip_address };
			}
		    }
		},
		{
		    xtype: 'inputpanel',
		    title: 'DNS',
		    column1: [
			{
			    xtype: 'pvetextfield',
			    name: 'searchdomain',
			    skipEmptyText: true,
			    fieldLabel: gettext('DNS domain'),
			    emptyText: 'use host settings',
			    allowBlank: true,
			    listeners: {
				change: function(f, value) {
				    if (!me.rendered) {
					return;
				    }
				    var field = me.down('#dns1');
				    field.setDisabled(!value);
				    field.clearInvalid();
				    field = me.down('#dns2');
				    field.setDisabled(!value);
				    field.clearInvalid();
				}
			    }
			},
			{
			    xtype: 'pvetextfield',
			    fieldLabel: gettext('DNS server') + " 1",
			    vtype: 'IPAddress',
			    allowBlank: true,
			    disabled: true,
			    name: 'nameserver',
			    itemId: 'dns1'
			},
			{
			    xtype: 'pvetextfield',
			    fieldLabel: gettext('DNS server') + " 2",
			    vtype: 'IPAddress',
			    skipEmptyText: true,
			    disabled: true,
			    name: 'nameserver',
			    itemId: 'dns2'
			}
		    ]
		},
		{
		    title: gettext('Confirm'),
		    layout: 'fit',
		    items: [
			{
			    title: gettext('Settings'),
			    xtype: 'grid',
			    store: summarystore,
			    columns: [
				{header: 'Key', width: 150, dataIndex: 'key'},
				{header: 'Value', flex: 1, dataIndex: 'value'}
			    ]
			}
		    ],
		    listeners: {
			show: function(panel) {
			    var form = me.down('form').getForm();
			    var kv = me.getValues();
			    var data = [];
			    Ext.Object.each(kv, function(key, value) {
				if (key === 'delete' || key === 'tmplstorage') { // ignore
				    return;
				}
				if (key === 'password') { // don't show pw
				    return;
				}
				var html = Ext.htmlEncode(Ext.JSON.encode(value));
				data.push({ key: key, value: value });
			    });
			    summarystore.suspendEvents();
			    summarystore.removeAll();
			    summarystore.add(data);
			    summarystore.sort();
			    summarystore.resumeEvents();
			    summarystore.fireEvent('datachanged', summarystore);
			}
		    },
		    onSubmit: function() {
			var kv = me.getValues();
			delete kv['delete'];

			var nodename = kv.nodename;
			delete kv.nodename;
			delete kv.tmplstorage;

			PVE.Utils.API2Request({
			    url: '/nodes/' + nodename + '/openvz',
			    waitMsgTarget: me,
			    method: 'POST',
			    params: kv,
			    success: function(response, opts){
				var upid = response.result.data;
		    
				var win = Ext.create('PVE.window.TaskViewer', { 
				    upid: upid
				});
				win.show();
				me.close();
			    },
			    failure: function(response, opts) {
				Ext.Msg.alert(gettext('Error'), response.htmlStatus);
			    }
			});
		    }
		}
	    ]
	});

	me.callParent();
    }
});



