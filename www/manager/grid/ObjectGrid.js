Ext.define('PVE.grid.ObjectGrid', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.pveObjectGrid'],

    getObjectValue: function(key, defaultValue) {
	var me = this;
	var rec = me.store.getById(key);
	if (rec) {
	    return rec.data.value;
	}
	return defaultValue;
    },

    renderKey: function(key, metaData, record, rowIndex, colIndex, store) {
	var me = this;
	var rows = me.rows;
	var rowdef = (rows && rows[key]) ?  rows[key] : {};
	return rowdef.header || key;
    },

    renderValue: function(value, metaData, record, rowIndex, colIndex, store) {
	var me = this;
	var rows = me.rows;
	var key = record.data.key;
	var rowdef = (rows && rows[key]) ?  rows[key] : {};

	var renderer = rowdef.renderer;
	if (renderer) {
	    return renderer(value, metaData, record, rowIndex, colIndex, store);
	}

	return value;
    },

    initComponent : function() {
	var me = this;

	var rows = me.rows;

	if (!me.rstore) {
	    if (!me.url) {
		throw "no url specified";
	    }

	    me.rstore = Ext.create('PVE.data.ObjectStore', {
		url: me.url,
		interval: me.interval,
		extraParams: me.extraParams,
		rows: me.rows
	    });
	}

	var rstore = me.rstore;

	var store = Ext.create('PVE.data.DiffStore', { rstore: rstore });

	if (rows) {
	    Ext.Object.each(rows, function(key, rowdef) {
		if (Ext.isDefined(rowdef.defaultValue)) {
		    store.add({ key: key, value: rowdef.defaultValue });
		} else if (rowdef.required) {
		    store.add({ key: key, value: undefined });
		}
	    });
	}

	if (me.sorterFn) {
	    store.sorters.add(new Ext.util.Sorter({
		sorterFn: me.sorterFn
	    }));
	}

	store.filters.add(new Ext.util.Filter({
	    filterFn: function(item) {
		if (rows) {
		    var rowdef = rows[item.data.key];
		    if (!rowdef || (rowdef.visible === false)) {
			return false;
		    }
		}
		return true;
	    }
	}));

	PVE.Utils.monStoreErrors(me, rstore);

	Ext.applyIf(me, {
	    store: store,
	    hideHeaders: true,
	    stateful: false,
	    columns: [
		{
		    header: gettext('Name'),
		    width: me.cwidth1 || 100,
		    dataIndex: 'key',
		    renderer: me.renderKey
		},
		{
		    flex: 1,
		    header: gettext('Value'),
		    dataIndex: 'value',
		    renderer: me.renderValue
		}
	    ]
	});

	me.callParent();
   }
});
