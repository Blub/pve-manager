Ext.define('PVE.form.IPProtocolSelector', {
    extend: 'PVE.form.ComboGrid',
    alias: ['widget.pveIPProtocolSelector'],

    initComponent: function() {
	var me = this;
	
 	var store = Ext.create('Ext.data.Store', {
	    fields: [ 'p', 'd', 'n'],
	    data: [
		{ p: 'tcp', n: 6, d: 'Transmission Control Protocol' },
		{ p: 'udp', n: 17, d: 'User Datagram Protocol' },
		{ p: 'icmp', n: 1, d: 'Internet Control Message Protocol' },
		{ p: 'igmp', n: 2,  d: 'Internet Group Management' },
		{ p: 'ggp', n: 3, d: 'gateway-gateway protocol' },
		{ p: 'ipencap', n: 4, d: 'IP encapsulated in IP' },
		{ p: 'st', n: 5, d: 'ST datagram mode' },
		{ p: 'egp', n: 8, d: 'exterior gateway protocol' },
		{ p: 'igp', n: 9, d: 'any private interior gateway (Cisco)' },
		{ p: 'pup', n: 12, d: 'PARC universal packet protocol' },
		{ p: 'hmp', n: 20, d: 'host monitoring protocol' },
		{ p: 'xns-idp', n: 22, d: 'Xerox NS IDP' },
		{ p: 'rdp', n: 27, d: '"reliable datagram" protocol' },
		{ p: 'iso-tp4', n: 29, d: 'ISO Transport Protocol class 4 [RFC905]' },
		{ p: 'dccp', n: 33, d: 'Datagram Congestion Control Prot. [RFC4340]' },
		{ p: 'xtp', n: 36, d: 'Xpress Transfer Protocol' },
		{ p: 'ddp', n: 37, d: 'Datagram Delivery Protocol' },
		{ p: 'idpr-cmtp', n: 38, d: 'IDPR Control Message Transport' },
		{ p: 'ipv6', n: 41, d: 'Internet Protocol, version 6' },
		{ p: 'ipv6-route', n: 43, d: 'Routing Header for IPv6' },
		{ p: 'ipv6-frag', n: 44, d: 'Fragment Header for IPv6' },
		{ p: 'idrp', n: 45, d: 'Inter-Domain Routing Protocol' },
		{ p: 'rsvp', n: 46, d: 'Reservation Protocol' },
		{ p: 'gre', n: 47, d: 'General Routing Encapsulation' },
		{ p: 'esp', n: 50, d: 'Encap Security Payload [RFC2406]' },
		{ p: 'ah', n: 51, d: 'Authentication Header [RFC2402]' },
		{ p: 'skip', n: 57, d: 'SKIP' },
		{ p: 'ipv6-icmp', n: 58, d: 'ICMP for IPv6' },
		{ p: 'ipv6-nonxt', n: 59, d: 'No Next Header for IPv6' },
		{ p: 'ipv6-opts', n: 60, d: 'Destination Options for IPv6' },
		{ p: 'vmtp', n: 81, d: 'Versatile Message Transport' },
		{ p: 'eigrp', n: 88, d: 'Enhanced Interior Routing Protocol (Cisco)' },
		{ p: 'ospf', n: 89, d: 'Open Shortest Path First IGP' },
		{ p: 'ax.25', n: 93, d: 'AX.25 frames' },
		{ p: 'ipip', n: 94, d: 'IP-within-IP Encapsulation Protocol' },
		{ p: 'etherip', n: 97, d: 'Ethernet-within-IP Encapsulation [RFC3378]' },
		{ p: 'encap', n: 98, d: 'Yet Another IP encapsulation [RFC1241]' },
		{ p: 'pim', n: 103, d: 'Protocol Independent Multicast' },
		{ p: 'ipcomp', n: 108, d: 'IP Payload Compression Protocol' },
		{ p: 'vrrp', n: 112, d: 'Virtual Router Redundancy Protocol [RFC5798]' },
		{ p: 'l2tp', n: 115, d: 'Layer Two Tunneling Protocol [RFC2661]' },
		{ p: 'isis', n: 124, d: 'IS-IS over IPv4' },
		{ p: 'sctp', n: 132, d: 'Stream Control Transmission Protocol' },
		{ p: 'fc', n: 133, d: 'Fibre Channel' },
		{ p: 'mobility-header', n: 135, d: 'Mobility Support for IPv6 [RFC3775]' },
		{ p: 'udplite', n: 136, d: 'UDP-Lite [RFC3828]' },
		{ p: 'mpls-in-ip', n: 137, d: 'MPLS-in-IP [RFC4023]' },
		{ p: 'hip', n: 139, d: 'Host Identity Protocol' },
		{ p: 'shim6', n: 140, d: 'Shim6 Protocol [RFC5533]' },
		{ p: 'wesp', n: 141, d: 'Wrapped Encapsulating Security Payload' },
		{ p: 'rohc', n: 142, d: 'Robust Header Compression' }
	    ]
	});

	Ext.apply(me, {
	    store: store,
	    valueField: 'p',
	    displayField: 'p',
            listConfig: {
		columns: [
		    {
			header: gettext('Protocol'),
			dataIndex: 'p',
			hideable: false,
			sortable: false,
			width: 100
		    },
		    {
			header: gettext('Number'),
			dataIndex: 'n',
			hideable: false,
			sortable: false,
			width: 50
		    },
		    {
			header: gettext('Description'),
			dataIndex: 'd',
			hideable: false,
			sortable: false,
			flex: 1
		    }
		]
	    }
	});

        me.callParent();
    }
});
