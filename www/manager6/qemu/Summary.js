Ext.define('PVE.qemu.Summary', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pveQemuSummary',

    tbar: [ '->', { xtype: 'pveRRDTypeSelector' } ],
    scrollable: true,
    bodyStyle: 'padding:10px',
    defaults: {
	style: 'padding-top:10px',
	width: 800
    },

    initComponent: function() {
        var me = this;

	var nodename = me.pveSelNode.data.node;
	if (!nodename) {
	    throw "no node name specified";
	}

	var vmid = me.pveSelNode.data.vmid;
	if (!vmid) {
	    throw "no VM ID specified";
	}

	if (!me.workspace) {
	    throw "no workspace specified";
	}

	if (!me.statusStore) {
	    throw "no status storage specified";
	}

	var rstore = me.statusStore;

	var statusview = Ext.create('PVE.qemu.StatusView', {
	    title: gettext('Status'),
	    pveSelNode: me.pveSelNode,
	    width: 400,
	    rstore: rstore
	});

	var rrdurl = "/api2/png/nodes/" + nodename + "/qemu/" + vmid + "/rrd";

	var notesview = Ext.create('PVE.panel.NotesView', {
	    pveSelNode: me.pveSelNode,
	    flex: 1
	});

	Ext.apply(me, {
	    items: [
		{
		    style: 'padding-top:0px',
		    layout: {
			type: 'hbox',
			align: 'stretchmax'
		    },
		    border: false,
		    items: [ statusview, notesview ]
		},
		{
		    xtype: 'pveRRDView',
		    title: gettext('CPU usage'),
		    pveSelNode: me.pveSelNode,
		    datasource: 'cpu',
		    rrdurl: rrdurl
		},
		{
		    xtype: 'pveRRDView',
		    title: gettext('Memory usage'),
		    pveSelNode: me.pveSelNode,
		    datasource: 'mem,maxmem',
		    rrdurl: rrdurl
		},
		{
		    xtype: 'pveRRDView',
		    title: gettext('Network traffic'),
		    pveSelNode: me.pveSelNode,
		    datasource: 'netin,netout',
		    rrdurl: rrdurl
		},
		{
		    xtype: 'pveRRDView',
		    title: gettext('Disk IO'),
		    pveSelNode: me.pveSelNode,
		    datasource: 'diskread,diskwrite',
		    rrdurl: rrdurl
		}
	    ]
	});

	me.on('activate', function() {
	    notesview.load();
	});

	me.callParent();
    }
});