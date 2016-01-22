Ext.define('PVE.form.HotplugFeatureSelector', {
    extend: 'PVE.form.KVComboBox',
    alias: ['widget.pveHotplugFeatureSelector'],

    multiSelect: true,
    allowBlank: true,
    deleteEmpty: false,

    setValue: function(value, doSelect) {
	var me = this;

	if (me.multiSelect && Ext.isString(value)) {
	    if (value === '0') {
		value = [];
	    } else if (value === '1') {
		value = ['disk', 'network', 'usb'];
	    } else {
		value = value.split(',');
	    }
	}

	me.callParent([value, doSelect]);
    },

    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
	    if (Ext.isArray(val)) {
		val = val.join(',') || '0';
	    }
            if (val !== null && val !== '') {
                data = {};
                data[me.getName()] = val;
            } else if (me.deleteEmpty) {
		data = {};
                data['delete'] = me.getName();
	    }
        }
        return data;
    },

  
    initComponent: function() {
	var me = this;

	me.data = [['disk', gettext('Disk')], 
		   ['network',  gettext('Network')], 
		   ['usb',  gettext('USB')],
		   ['memory',  gettext('Memory')],
		   ['cpu',  gettext('CPU')]];
	
	me.callParent();
    }
});
