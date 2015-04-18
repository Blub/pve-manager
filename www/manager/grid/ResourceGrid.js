// fixme: remove this fix
// this hack is required for ExtJS 4.0.0
Ext.override(Ext.grid.feature.Chunking, {
    attachEvents: function() {
        var grid = this.view.up('gridpanel'),
            scroller = grid.down('gridscroller[dock=right]');
        if (scroller === null ) {
            grid.on("afterlayout", this.attachEvents, this);
	    return;
        }
        scroller.el.on('scroll', this.onBodyScroll, this, {buffer: 300});
    },
    rowHeight: PVE.Utils.gridLineHeigh()
});

Ext.define('PVE.grid.ResourceGrid', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pveResourceGrid'],

    //fixme: this makes still problems with the scrollbar
    //features: [ {ftype: 'chunking'}],
    
    initComponent : function() {
	var me = this;

	var rstore = PVE.data.ResourceStore;
	var sp = Ext.state.Manager.getProvider();

	var coldef = rstore.defaultColums();

	var store = Ext.create('Ext.data.Store', {
	    model: 'PVEResources',
	    sorters: [
		{
		    property : 'type',
		    direction: 'ASC'
		}
	    ],
	    proxy: { type: 'memory' }
	});

	var textfilter = '';

	var textfilter_match = function(item) {
	    var match = false;
	    Ext.each(['name', 'storage', 'node', 'type', 'text'], function(field) {
		var v = item.data[field];
		if (v !== undefined) {
		    v = v.toLowerCase();
		    if (v.indexOf(textfilter) >= 0) {
			match = true;
			return false;
		    }
		}
	    });
	    return match;
	};

	var updateGrid = function() {

	    var filterfn = me.viewFilter ? me.viewFilter.filterfn : null;
	    
	    //console.log("START GRID UPDATE " +  me.viewFilter);

	    store.suspendEvents();

	    var nodeidx = {};
	    var gather_child_nodes = function(cn) {
		if (!cn) {
		    return;
		}
                var cs = cn.childNodes;
		if (!cs) {
		    return;
		}
		var len = cs.length, i = 0, n, res;

                for (; i < len; i++) {
		    var child = cs[i];
		    var orgnode = rstore.data.get(child.data.id);
		    if (orgnode) {
			if ((!filterfn || filterfn(child)) &&
			    (!textfilter || textfilter_match(child))) {
			    nodeidx[child.data.id] = orgnode;
			}
		    }
		    gather_child_nodes(child);
		}
	    };
	    gather_child_nodes(me.pveSelNode);

	    // remove vanished items
	    var rmlist = [];
	    store.each(function(olditem) {
		var item = nodeidx[olditem.data.id];
		if (!item) {
		    //console.log("GRID REM UID: " + olditem.data.id);
		    rmlist.push(olditem);
		}
	    });

	    if (rmlist.length) {
		store.remove(rmlist);
	    }

	    // add new items
	    var addlist = [];
	    var key;
	    for (key in nodeidx) {
		if (nodeidx.hasOwnProperty(key)) {
		    var item = nodeidx[key];
		
		    // getById() use find(), which is slow (ExtJS4 DP5) 
		    //var olditem = store.getById(item.data.id);
		    var olditem = store.data.get(item.data.id);

		    if (!olditem) {
			//console.log("GRID ADD UID: " + item.data.id);
			var info = Ext.apply({}, item.data);
			var child = Ext.ModelMgr.create(info, store.model, info.id);
			addlist.push(item);
			continue;
		    }
		    // try to detect changes
		    var changes = false;
		    var fieldkeys = PVE.data.ResourceStore.fieldNames;
		    var fieldcount = fieldkeys.length;
		    var fieldind;
		    for (fieldind = 0; fieldind < fieldcount; fieldind++) {
			var field = fieldkeys[fieldind];
			if (field != 'id' && item.data[field] != olditem.data[field]) {
			    changes = true;
			    //console.log("changed item " + item.id + " " + field + " " + item.data[field] + " != " + olditem.data[field]);
			    olditem.beginEdit();
			    olditem.set(field, item.data[field]);
			}
		    }
		    if (changes) {
			olditem.endEdit(true);
			olditem.commit(true); 
		    }
		}
	    }

	    if (addlist.length) {
		store.add(addlist);
	    }

	    store.sort();

	    store.resumeEvents();

	    store.fireEvent('datachanged', store);

	    //console.log("END GRID UPDATE");
	};

	var filter_task = new Ext.util.DelayedTask(function(){
	    updateGrid();
	});

	var load_cb = function() { 
	    updateGrid(); 
	};

	Ext.applyIf(me, {
	    title: gettext('Search')
	});

	Ext.apply(me, {
	    store: store,
	    tbar: [
		'->', 
		gettext('Search') + ':', ' ',
		{
		    xtype: 'textfield',
		    width: 200,
		    value: textfilter,
		    enableKeyEvents: true,
		    listeners: {
			keyup: function(field, e) {
			    var v = field.getValue();
			    textfilter = v.toLowerCase();
			    filter_task.delay(500);
			}
		    }
		}
	    ],
	    viewConfig: {
		stripeRows: true
            },
	    listeners: {
		itemcontextmenu: function(v, record, item, index, event) {
		    event.stopEvent();
		    v.select(record);
		    var menu;
		    
		    if (record.data.type === 'qemu' && !record.data.template) {
			menu = Ext.create('PVE.qemu.CmdMenu', {
			    pveSelNode: record
			});
		    } else if (record.data.type === 'qemu' && record.data.template) {
			menu = Ext.create('PVE.qemu.TemplateMenu', {
			    pveSelNode: record
			});
		    } else if (record.data.type === 'lxc') {
			menu = Ext.create('PVE.lxc.CmdMenu', {
			    pveSelNode: record
			});
		    } else {
			return;
		    }

		    menu.showAt(event.getXY());
		},
		itemdblclick: function(v, record) {
		    var ws = me.up('pveStdWorkspace');
		    ws.selectById(record.data.id);
		},
		destroy: function() {
		    rstore.un("load", load_cb);
		}
	    },
            columns: coldef
	});

	me.callParent();

	updateGrid();
	rstore.on("load", load_cb);
    }
});
