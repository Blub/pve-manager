/*
 * This class holds performance *recommended* settings for the PVE Qemu wizards
 * the *mandatory* settings are set in the PVE::QemuServer
 * config_to_command sub
 * We store this here until we get the data from the API server
*/

// this is how you would add an hypothetic FreeBSD > 10 entry
//
//virtio-blk is stable but virtIO net still
//   problematic as of 10.3
// see https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=165059
//	addOS({
//	    parent: 'generic', // inherits defaults
//	    pveOS: 'freebsd10', // must match a radiofield in OSTypeEdit.js
//	    busType: 'virtio' // must match a pveBusController value
//			    // networkCard muss match a pveNetworkCardSelector


Ext.define('PVE.qemu.OSDefaults', {
    singleton: true, // will also force creation when loaded

    constructor: function() {
	var me = this;

	var addOS = function(settings) {
		if (me.hasOwnProperty(settings.parent)) {
		    var child = Ext.clone(me[settings.parent]);
		    me[settings.pveOS] = Ext.apply(child, settings);

		} else {
		    throw("Could not find your genitor");
		}
	    };

	// default values
	me.generic = {
	    busType: 'ide',
	    networkCard: 'e1000'
	};

	// both of them are in kernel since 2.6.25
	addOS({
	    pveOS: 'l26',
	    parent : 'generic',
	    busType: 'virtio',
	    networkCard: 'virtio'
	});

	// recommandation from http://wiki.qemu.org/Windows2000
	addOS({
	    pveOS: 'w2k',
	    parent : 'generic',
	    networkCard: 'rtl8139'
	});

    }
});
