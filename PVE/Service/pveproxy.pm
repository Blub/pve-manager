package PVE::Service::pveproxy;

use strict;
use warnings;

use PVE::SafeSyslog;
use PVE::Daemon;
use HTTP::Response;
use Encode;
use URI;
use URI::QueryParam;
use File::Find;
use Data::Dumper;
use PVE::API2Tools;
use PVE::API2;
use PVE::API2::Formatter::Standard;
use PVE::API2::Formatter::HTML;
use PVE::HTTPServer;

use PVE::ExtJSIndex;
use PVE::ExtJSIndex5;
use PVE::NoVncIndex;
use PVE::TouchIndex;

use PVE::Tools;

use base qw(PVE::Daemon);

my $cmdline = [$0, @ARGV];

my %daemon_options = (
    max_workers => 3,
    restart_on_error => 5,
    stop_wait_time => 15,
    leave_children_open_on_reload => 1,
    setuid => 'www-data',
    setgid => 'www-data',
    pidfile => '/var/run/pveproxy/pveproxy.pid',
);

my $daemon = __PACKAGE__->new('pveproxy', $cmdline, %daemon_options);

my $ext5_dir_exists;

sub add_dirs {
    my ($result_hash, $alias, $subdir) = @_;

    $result_hash->{$alias} = $subdir;

    my $wanted = sub {
	my $dir = $File::Find::dir;
	if ($dir =~m!^$subdir(.*)$!) {
	    my $name = "$alias$1/";
	    $result_hash->{$name} = "$dir/";
	}
    };

    find({wanted => $wanted, follow => 0, no_chdir => 1}, $subdir);
}

sub init {
    my ($self) = @_;

    # we use same ALLOW/DENY/POLICY as pveproxy
    my $proxyconf = PVE::API2Tools::read_proxy_config();

    my $accept_lock_fn = "/var/lock/pveproxy.lck";

    my $lockfh = IO::File->new(">>${accept_lock_fn}") ||
	die "unable to open lock file '${accept_lock_fn}' - $!\n";

    my $family = PVE::Tools::get_host_address_family($self->{nodename});
    my $socket = $self->create_reusable_socket(8006, undef, $family);

    $ext5_dir_exists = (-d '/usr/share/pve-manager/ext5');

    my $dirs = {};

    add_dirs($dirs, '/pve2/locale/', '/usr/share/pve-manager/locale/');
    add_dirs($dirs, '/pve2/touch/', '/usr/share/pve-manager/touch/');
    add_dirs($dirs, '/pve2/ext4/', '/usr/share/pve-manager/ext4/');

    if ($ext5_dir_exists) { # only add ext5 dirs if it was build
	add_dirs($dirs, '/pve2/ext5/', '/usr/share/pve-manager/ext5/');
	add_dirs($dirs, '/pve2/manager5/', '/usr/share/pve-manager/manager5/');
    }

    add_dirs($dirs, '/pve2/images/' => '/usr/share/pve-manager/images/');
    add_dirs($dirs, '/pve2/css/' => '/usr/share/pve-manager/css/');
    add_dirs($dirs, '/pve2/js/' => '/usr/share/pve-manager/js/');
    add_dirs($dirs, '/vncterm/' => '/usr/share/vncterm/');
    add_dirs($dirs, '/novnc/' => '/usr/share/novnc-pve/');

    $self->{server_config} = {
	base_handler_class => 'PVE::API2',
	keep_alive => 100,
	max_conn => 500,
	max_requests => 1000,
	lockfile => $accept_lock_fn,
	socket => $socket,
	lockfh => $lockfh,
	debug => $self->{debug},
	trusted_env => 0, # not trusted, anyone can connect
	logfile => '/var/log/pveproxy/access.log',
	allow_from => $proxyconf->{ALLOW_FROM},
	deny_from => $proxyconf->{DENY_FROM},
	policy => $proxyconf->{POLICY},
	ssl => {
	    # Note: older versions are considered insecure, for example
	    # search for "Poodle"-Attac
	    method => 'tlsv1',
	    sslv2 => 0,
	    sslv3 => 0,
	    cipher_list => $proxyconf->{CIPHERS} || 'HIGH:MEDIUM:!aNULL:!MD5',
	    key_file => '/etc/pve/local/pve-ssl.key',
	    cert_file => '/etc/pve/local/pve-ssl.pem',
	},
	# Note: there is no authentication for those pages and dirs!
	pages => {
	    '/' => \&get_index,
	    # avoid authentication when accessing favicon
	    '/favicon.ico' => {
		file => '/usr/share/pve-manager/images/favicon.ico',
	    },
	},
	dirs => $dirs,
    };
}

sub run {
    my ($self) = @_;

    my $server = PVE::HTTPServer->new(%{$self->{server_config}});
    $server->run();
}

$daemon->register_start_command();
$daemon->register_restart_command(1);
$daemon->register_stop_command();
$daemon->register_status_command();

our $cmddef = {
    start => [ __PACKAGE__, 'start', []],
    restart => [ __PACKAGE__, 'restart', []],
    stop => [ __PACKAGE__, 'stop', []],
    status => [ __PACKAGE__, 'status', [], undef, sub { print shift . "\n";} ],
};

sub is_phone {
    my ($ua) = @_;

    return 0 if !$ua;

    return 1 if $ua =~ m/(iPhone|iPod|Windows Phone)/;

    if ($ua =~ m/Mobile(\/|\s)/) {
	return 1 if $ua =~ m/(BlackBerry|BB)/;
	return 1 if ($ua =~ m/(Android)/) && ($ua !~ m/(Silk)/);
    }

    return 0;
}

# NOTE: Requests to those pages are not authenticated
# so we must be very careful here

sub get_index {
    my ($server, $r, $args) = @_;

    my $lang = 'en';
    my $username;
    my $token = 'null';

    if (my $cookie = $r->header('Cookie')) {
	if (my $newlang = ($cookie =~ /(?:^|\s)PVELangCookie=([^;]*)/)[0]) {
	    if ($newlang =~ m/^[a-z]{2,3}(_[A-Z]{2,3})?$/) {
		$lang = $newlang;
	    }
	}
	my $ticket = PVE::REST::extract_auth_cookie($cookie);
	if (($username = PVE::AccessControl::verify_ticket($ticket, 1))) {
	    $token = PVE::AccessControl::assemble_csrf_prevention_token($username);
	}
    }

    $username = '' if !$username;

    my $mobile = is_phone($r->header('User-Agent')) ? 1 : 0;

    if (defined($args->{mobile})) {
	$mobile = $args->{mobile} ? 1 : 0;
    }

    my $ext5;
    if (defined($args->{ext5})) {
	$ext5 = $args->{ext5} ? 1 : 0;
    }

    my $page;

    if (defined($args->{console}) && $args->{novnc}) {
	$page = PVE::NoVncIndex::get_index($lang, $username, $token, $args->{console});
    } elsif ($mobile) {
	$page = PVE::TouchIndex::get_index($lang, $username, $token, $args->{console});
    } elsif ($ext5 && $ext5_dir_exists) {
	$page = PVE::ExtJSIndex5::get_index($lang, $username, $token, $args->{console});
    } else {
	$page = PVE::ExtJSIndex::get_index($lang, $username, $token, $args->{console});
    }
    my $headers = HTTP::Headers->new(Content_Type => "text/html; charset=utf-8");
    my $resp = HTTP::Response->new(200, "OK", $headers, $page);

    return $resp;
}

1;

__END__

=head1 NAME

pveproxy - the PVE API proxy server

=head1 SYNOPSIS

=include synopsis

=head1 DESCRIPTION

This is the REST API proxy server, listening on port 8006. This is usually
started as service using:

 # service pveproxy start

=head1 Host based access control

It is possible to configure apache2 like access control lists. Values are read
from file /etc/default/pveproxy. For example:

 ALLOW_FROM="10.0.0.1-10.0.0.5,192.168.0.0/22"
 DENY_FROM="all"
 POLICY="allow"

IP addresses can be specified using any syntax understoop by Net::IP. The
name 'all' is an alias for '0/0'.

The default policy is 'allow'.

 Match                      | POLICY=deny | POLICY=allow
 ---------------------------|-------------|------------
 Match Allow only           | allow       | allow
 Match Deny only            | deny        | deny
 No match                   | deny        | allow
 Match Both Allow & Deny    | deny        | allow

=head1 SSL Cipher Suite

You can define the chiper list in /etc/default/pveproxy, for example

 CIPHERS="HIGH:MEDIUM:!aNULL:!MD5"

Above is the default. See the ciphers(1) man page from the openssl
package for list of all available options.

=head1 FILES

 /etc/default/pveproxy

=include pve_copyright
