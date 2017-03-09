<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>$nodename - Proxmox Virtual Environment</title>

    <link rel="icon" sizes="128x128" href="/pve2/images/logo-128.png" />
    <link rel="apple-touch-icon" sizes="128x128" href="/pve2/images/logo-128.png" />
    <link rel="stylesheet" type="text/css" href="/pve2/touch/resources/css/sencha-touch.css" />
    <link rel="stylesheet" type="text/css" href="/pve2/touch/resources/css/pve.css" />
    [% IF langfile %]
    <script type='text/javascript' src='/pve2/locale/pve-lang-[% lang %].js'></script>
    [% ELSE %]
    <script type="text/javascript">function gettext(buf) { return buf; }</script>
    [% END %]
    <script type="text/javascript" src="/pve2/touch/sencha-touch-all-debug.js"></script>
    <script type="text/javascript" src="/pve2/touch/pvemanager-mobile.js"></script>
    <script type="text/javascript">
if (typeof(PVE) === 'undefined') PVE = {};
PVE.UserName = '[% username %]'
PVE.CSRFPreventionToken = '[% token %]';
    </script>
  </head>
  <body>
  </body>
</html>
