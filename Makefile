include defines.mk

DESTDIR=

SUBDIRS = aplinfo PVE bin www po

ARCH:=$(shell dpkg-architecture -qDEB_BUILD_ARCH)
GITVERSION:=$(shell cat .git/refs/heads/master)

DEB=${PACKAGE}_${VERSION}-${PACKAGERELEASE}_${ARCH}.deb

all: ${SUBDIRS}

check:
	${MAKE} -C bin/test check

%:
	set -e && for i in ${SUBDIRS}; do ${MAKE} -C $$i $@; done

.PHONY: dinstall
dinstall: ${DEB}
	dpkg -i ${DEB}

country.dat: country.pl
	./country.pl > country.dat

.PHONY: deb
deb: $(DEB)
$(DEB):
	make clean
	rm -rf dest
	mkdir dest
	make DESTDIR=`pwd`/dest install
	mkdir dest/DEBIAN
	sed -e s/@VERSION@/${VERSION}/ -e s/@PACKAGE@/${PACKAGE}/ -e s/@PACKAGERELEASE@/${PACKAGERELEASE}/ debian/control.in >dest/DEBIAN/control
	install -m 0644 debian/conffiles dest/DEBIAN
	install -m 0755 debian/config dest/DEBIAN
	install -m 0644 debian/templates dest/DEBIAN
	install -m 0755 debian/preinst dest/DEBIAN
	install -m 0755 debian/postinst dest/DEBIAN
	install -m 0755 debian/prerm dest/DEBIAN
	install -m 0755 debian/postrm dest/DEBIAN
	install -m 0644 debian/triggers dest/DEBIAN
	install -m 0644 -D debian/lintian-overrides dest/usr/share/lintian/overrides/${PACKAGE}
	echo "git clone git://git.proxmox.com/git/pve-manager.git\\ngit checkout ${GITVERSION}" >  dest/usr/share/doc/${PACKAGE}/SOURCE
	gzip -n --best dest/usr/share/man/*/*
	gzip -n --best dest/usr/share/doc/${PACKAGE}/changelog.Debian
	dpkg-deb --build dest
	mv dest.deb ${DEB}
	rm -rf dest
	# supress lintian error: statically-linked-binary usr/bin/pvemailforward
	lintian -X binaries ${DEB}	

.PHONY: upload
upload: ${DEB} check
	./repoid.pl .git check
	tar cf - ${DEB} | ssh -X repoman@repo.proxmox.com upload --product pve --dist stretch

#.PHONY: poupload
#poupload:
#	rsync po/*.po po/pve-manager.pot pve.proxmox.com:/home/ftp/sources/po-files/

.PHONY: install
install: country.dat vzdump.conf vzdump-hook-script.pl pve-apt.conf mtu bridgevlan bridgevlanport vlan vlan-down
	install -d -m 0700 -o www-data -g www-data ${DESTDIR}/var/log/pveproxy
	install -D -m 0644 debian/pve.logrotate ${DESTDIR}/etc/logrotate.d/pve
	install -d ${DESTDIR}/usr/share/${PACKAGE}
	install -d ${DESTDIR}/usr/share/man/man1
	install -d ${DOCDIR}/examples
	install -d ${DESTDIR}/var/lib/${PACKAGE}
	install -d ${DESTDIR}/var/lib/vz/images
	install -d ${DESTDIR}/var/lib/vz/template/cache
	install -d ${DESTDIR}/var/lib/vz/template/iso
	install -d ${DESTDIR}/var/lib/vz/template/qemu
	install -D -m 0644 pve-apt.conf ${DESTDIR}/etc/apt/apt.conf.d/75pveconf
	install -D -m 0644 pve-sources.list ${DESTDIR}/etc/apt/sources.list.d/pve-enterprise.list
	install -D -m 0644 pve-blacklist.conf ${DESTDIR}/etc/modprobe.d/pve-blacklist.conf
	install -D -m 0644 vzdump.conf ${DESTDIR}/etc/vzdump.conf
	install -D -m 0755 mtu ${DESTDIR}/etc/network/if-up.d/mtu
	install -D -m 0755 bridgevlan ${DESTDIR}/etc/network/if-up.d/bridgevlan
	install -D -m 0755 bridgevlanport ${DESTDIR}/etc/network/if-up.d/bridgevlanport
	install -D -m 0755 vlan ${DESTDIR}/etc/network/if-pre-up.d/vlan
	install -D -m 0755 vlan-down ${DESTDIR}/etc/network/if-post-down.d/vlan

	install -m 0644 vzdump-hook-script.pl ${DOCDIR}/examples/vzdump-hook-script.pl
	install -m 0644 spice-example-sh ${DOCDIR}/examples/spice-example-sh
	install -m 0644 copyright ${DOCDIR}
	install -m 0644 debian/changelog.Debian ${DOCDIR}
	install -m 0644 country.dat ${DESTDIR}/usr/share/${PACKAGE}
	# temporary: set ExtJS 6 migration devel directory
	install -d ${DESTDIR}/usr/share/${PACKAGE}/manager6
	set -e && for i in ${SUBDIRS}; do ${MAKE} -C $$i $@; done

.PHONY: distclean
distclean: clean

.PHONY: clean
clean:
	set -e && for i in ${SUBDIRS}; do ${MAKE} -C $$i $@; done
	find . -name '*~' -exec rm {} ';'
	rm -rf dest country.dat *.deb ca-tmp
