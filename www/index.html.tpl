<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>[% nodename %] - Proxmox Virtual Environment</title>
    <link rel="icon" sizes="128x128" href="/pve2/images/logo-128.png" />
    <link rel="apple-touch-icon" sizes="128x128" href="/pve2/images/logo-128.png" />
    <link rel="stylesheet" type="text/css" href="/pve2/ext6/theme-crisp/resources/theme-crisp-all.css" />
    <link rel="stylesheet" type="text/css" href="/pve2/ext6/crisp/resources/charts-all.css" />
    <link rel="stylesheet" type="text/css" href="/pve2/css/font-awesome.css" />
    <link rel="stylesheet" type="text/css" href="/pve2/css/ext6-pve.css" />
    [% IF langfile %]
    <script type='text/javascript' src='/pve2/locale/pve-lang-[% lang %].js'></script>
    [%- ELSE %]
    <script type='text/javascript'>function gettext(buf) { return buf; }</script>
    [% END %]
    [%- IF debug %]
    <script type="text/javascript" src="/pve2/ext6/ext-all-debug.js"></script>
    <script type="text/javascript" src="/pve2/ext6/charts-debug.js"></script>
    [%- ELSE %]
    <script type="text/javascript" src="/pve2/ext6/ext-all.js"></script>
    <script type="text/javascript" src="/pve2/ext6/charts.js"></script>
    [% END %]
    <script type="text/javascript" src="/pve2/js/pvemanagerlib.js"></script>
    <script type="text/javascript" src="/pve2/ext6/locale/locale-[% lang %].js"></script>

    <script type="text/javascript">
    if (typeof(PVE) === 'undefined') PVE = {};
    PVE.UserName = '[% username %]'
    PVE.CSRFPreventionToken = '[% token %]';
    Ext.History.fieldid = 'x-history-field';
    Ext.onReady(function() { Ext.create('PVE.StdWorkspace');});
    </script>

  </head>
  <body>
    <!-- Fields required for history management -->
    <form id="history-form" class="x-hidden">
    <input type="hidden" id="x-history-field"/>
    </form>
  </body>
</html>
