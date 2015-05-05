Ext.define('PVE.panel.StatusPanel', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.pveStatusPanel',

    
    //title: "Logs",
    //tabPosition: 'bottom',

    initComponent: function() {
        var me = this;

	var stateid = 'ltab';
	var sp = Ext.state.Manager.getProvider();

	var state = sp.get(stateid);
	if (state && state.value) {
	    me.activeTab = state.value;
	}

	Ext.apply(me, {
	    listeners: {
		tabchange: function() {
		    var atab = me.getActiveTab().itemId;
		    var state = { value: atab };
		    sp.set(stateid, state);
		}
	    },
	    items: [
		{
		    itemId: 'tasks',
		    title: gettext('Tasks'),
		    xtype: 'pveClusterTasks'
		},
		{
		    itemId: 'clog',
		    title: gettext('Cluster log'),
		    xtype: 'pveClusterLog'
		}
	    ]
	});

	me.callParent();

	me.items.get(0).fireEvent('show', me.items.get(0));

	var statechange = function(sp, key, state) {
	    if (key === stateid) {
		var atab = me.getActiveTab().itemId;
		var ntab = state.value;
		if (state && ntab && (atab != ntab)) {
		    me.setActiveTab(ntab);
		}
	    }
	};

	sp.on('statechange', statechange);
	me.on('destroy', function() {
	    sp.un('statechange', statechange);		    
	});

    }
});
