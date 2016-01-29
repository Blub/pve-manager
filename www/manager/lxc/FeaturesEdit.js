Ext.define('PVE.lxc.FeaturesInputPanel', {
    extend: 'PVE.panel.InputPanel',

    features: {},

    onGetValues: function(values) {
	var me = this;
	var del = values['delete'];
	delete values['delete'];

	Ext.Object.each(values, function(name, val) {
	    me.features[name] = val;
	});

	Ext.Array.each(del, function(val) {
	    delete me.features[val];
	});

	return { features: PVE.Parser.printLxcFeatures(me.features) };
    },

    fillForm: function(data) {
	var me = this;

	data.available.sort(function(a, b) { return a.id < b.id; });

	if (Ext.isDefined(data.features)) {
	    me.features = PVE.Parser.parseLxcFeatures(data.features);
	    if (!me.features) {
		Ext.Msg.alert(gettext('Error'), gettext('Unable to parse features'));
		me.close();
		return;
	    }
	}

	Ext.Array.each(data.available, function(option) {
	    // for now all values are booleans with the default-value off:
	    var value = me.features[option.id];
	    var enabled = PVE.Parser.parseBoolean(value);
	    if (!option.allowed && !enabled) { // hide
		return true; // continue
	    }
	    var item = {
		xtype: 'pvecheckbox',
		name: option.id,
		uncheckedValue: 0,
		defaultValue: false,
		deleteDefaultValue: true,
		checked: enabled,
		fieldLabel: gettext(option.name),
	    };
	    if (!option.allowed) {
		if (enabled) {
		    item.style = { 'color': 'red' };
		} else {
		    item.disabled = true; // FIXME: now dead code
		}
	    }
	    me.items.items[0].add(item);
	});
    },

    initComponent : function() {
	var me = this;
	me.items = [];
	me.callParent();
    }
});

Ext.define('PVE.lxc.FeaturesEdit', {
    extend: 'PVE.window.Edit',

    initComponent : function() {
	var me = this;

	me.nodename = me.pveSelNode.data.node;
	if (!me.nodename) { 
	    throw "no node name specified";
	}

	me.vmid = me.pveSelNode.data.vmid;
	if (!me.vmid) {
	    throw "no VM ID specified";
	}

	var ipanel = Ext.create('PVE.lxc.FeaturesInputPanel', {});

	Ext.applyIf(me, {
	    subject: gettext('Features Options'),
	    fieldDefaults: {
		labelWidth: 120
	    },
	    items: ipanel
	});

	me.callParent();

	me.load({
	    success: function(response, options) {
		ipanel.fillForm(response.result.data);
	    }
	});
    }
});
