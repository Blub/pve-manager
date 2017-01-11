#!/usr/bin/perl

use strict;
use Time::Local;
use PVE::Tools;
use Locale::PO;

my $dir = shift;


die "no such directory\n" if ! -d $dir;

my $sources = [];

my $findcmd = [['find', $dir, '-name', '*.js'],['sort']];
PVE::Tools::run_command($findcmd, outfunc => sub {
    my $line = shift;
    next if $line =~ m|/pvemanagerlib.js$|;
    next if $line =~ m|/openvz/|;
    push @$sources, $line;
});

my $filename = "messages.pot";

my $header = <<__EOD;
SOME DESCRIPTIVE TITLE.
Copyright (C) 2011-2016 Proxmox Server Solutions GmbH
This file is distributed under the same license as the pve-manager package.
Proxmox Support Team <support\@proxmox.com>, 2016.
__EOD

my $ctime = scalar localtime;

my $href = {};
my $po = new Locale::PO(-msgid=> '',
			-comment=> $header,
			-fuzzy=> 1,
			-msgstr=>
			"Project-Id-Version: pve-manager 2.0\n" .
			"Report-Msgid-Bugs-To: <support\@proxmox.com>\n" .
			"POT-Creation-Date: $ctime\n" .
			"PO-Revision-Date: YEAR-MO-DA HO:MI +ZONE\n" .
			"Last-Translator: FULL NAME <EMAIL\@ADDRESS>\n" .
			"Language-Team: LANGUAGE <support\@proxmox.com>\n" .
			"MIME-Version: 1.0\n" .
			"Content-Type: text/plain; charset=CHARSET\n" .
			"Content-Transfer-Encoding: 8bit\n");

$href->{''} = $po;

sub extract_msg {
    my ($filename, $linenr, $line) = @_;

    my $count = 0;

    while(1) {
	my $text;
	if ($line =~ m/\Wgettext\s*\((("((?:[^"\\]++|\\.)*+)")|('((?:[^'\\]++|\\.)*+)'))\)/g) {
	    $text = $3 || $5;
	}
	
	last if !$text;

	$count++;

	my $ref = "$filename:$linenr";

	if (my $po = $href->{$text}) {
	    $po->reference($po->reference() . " $ref");
	} else {   
	    my $po = new Locale::PO(-msgid=> $text, -reference=> $ref, -msgstr=> '');
	    $href->{$text} = $po;
	}
    };

    die "can't extract gettext message in '$filename' line $linenr\n"
	if !$count;
}

foreach my $s (@$sources) {
    open(SRC, $s) || die "unable to open file '$s' - $!\n";
    while(defined(my $line = <SRC>)) {
	if ($line =~ m/gettext/) {
	    extract_msg($s, $., $line);
	}
    }
    close(SRC);
}

Locale::PO->save_file_fromhash($filename, $href);

