include ../../defines.mk

TOUCHDIR=touch-2.4.2
TOUCHSRC=sencha-touch-2.4.2-gpl.zip

TOUCHDATA = 					\
	${TOUCHDIR}/sencha-touch-all.js		\
	${TOUCHDIR}/sencha-touch-all-debug.js

${TOUCHDATA}: ${TOUCHSRC}
	rm -rf ${TOUCHDIR}
	unzip -x ${TOUCHSRC}
	touch ${TOUCHDATA}

all: ${TOUCHDATA}

.PHONY: install 
install: ${TOUCHDATA}
	install -d ${WWWTOUCHDIR}
	install -m 0644 ${TOUCHDATA} ${WWWTOUCHDIR}
	install -d ${WWWTOUCHDIR}/resources/css
	cp ${TOUCHDIR}/resources/css/*.css ${WWWTOUCHDIR}/resources/css
	install -m 0644 pve.css ${WWWTOUCHDIR}/resources/css
	install -d ${WWWTOUCHDIR}/resources/themes/images
	cp -a ${TOUCHDIR}/resources/themes/images/default ${WWWTOUCHDIR}/resources/themes/images
	chown -R www-data:www-data ${WWWTOUCHDIR}
	find ${WWWTOUCHDIR} -type f -exec chmod -R 0644 '{}' ';'

.PHONY: clean
clean:
	rm -rf *~ ${TOUCHDIR}

