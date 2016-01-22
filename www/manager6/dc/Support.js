Ext.define('PVE.dc.Support', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pveDcSupport',

    invalidHtml: '<h1>No valid subscription</h1>' + PVE.Utils.noSubKeyHtml,

    communityHtml: 'Please use the public community <a target="_blank" href="http://forum.proxmox.com">forum</a> for any questions.',

    activeHtml: 'Please use our <a target="_blank" href="https://my.proxmox.com">support portal</a> for any questions. You can also use the public community <a target="_blank" href="http://forum.proxmox.com">forum</a> to get additional information.',

    bugzillaHtml: '<h1>Bug Tracking</h1>Our bug tracking system is available <a target="_blank" href="https://bugzilla.proxmox.com">here</a>.',

    docuHtml: '<h1>Documentation</h1>Complete documentation, tutorials, videos and more is available at our <a target="_blank" href="http://pve.proxmox.com/wiki/Documentation">wiki</a>.',

    updateActive: function(data) {
	var me = this;
	
	var html = '<h1>' + data.productname + '</h1>' + me.activeHtml; 
	html += '<br><br>' + me.docuHtml;
	html += '<br><br>' + me.bugzillaHtml;

	me.update(html);
    },

    updateCommunity: function(data) {
	var me = this;

	var html = '<h1>' + data.productname + '</h1>' + me.communityHtml; 
	html += '<br><br>' + me.docuHtml;
	html += '<br><br>' + me.bugzillaHtml;

	me.update(html);
    },
	 
    updateInactive: function(data) {
	var me = this;
	me.update(me.invalidHtml);
    },

    initComponent: function() {
        var me = this;

	var reload = function() {
	    PVE.Utils.API2Request({
		url: '/nodes/localhost/subscription',
		method: 'GET',
		waitMsgTarget: me,
		failure: function(response, opts) {
		    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		    me.update(gettext('Unable to load subscription status') + ": " + response.htmlStatus);
		},
		success: function(response, opts) {
		    var data = response.result.data;

		    if (data.status === 'Active') {
			if (data.level === 'c') {
			    me.updateCommunity(data);
			} else {
			    me.updateActive(data);
			}
		    } else {
			me.updateInactive(data);
		    }
		}
	    });
	};

	Ext.apply(me, {
	    autoScroll: true,
	    bodyStyle: 'padding:10px',
	    listeners: {
		show: reload
	    }
	});

	me.callParent();
    }
});
