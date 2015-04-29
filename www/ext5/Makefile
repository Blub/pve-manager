include ../../defines.mk

EXTJSDIR=ext-5.1.0
EXTJSSRC=${EXTJSDIR}-gpl.zip

EXTDATA=	\
	extjs/build/ext-all.js	\
	extjs/build/ext-all-debug.js	\
	extjs/build/bootstrap.js

EXT_THEME=	\
	extjs/packages/ext-theme-base	\
	extjs/packages/ext-theme-neutral	\
	extjs/packages/ext-theme-neptune	\

${EXTDATA}: ${EXTJSSRC}
	rm -rf ${EXTJSDIR} extjs
	unzip -x ${EXTJSSRC}
	mv ${EXTJSDIR} extjs
	touch ${EXTDATA}

all: ${EXTDATA}

.PHONY: install 
install: ${EXTDATA}
	install -d ${WWWEXT5DIR}
	install -m 0644 ${EXTDATA} ${WWWEXT5DIR}
	install -d ${WWWEXT5DIR}/packages
	cp -a extjs/build/packages/ext-locale ${WWWEXT5DIR}/packages
	cp -a ${EXT_THEME} ${WWWEXT5DIR}/packages
	chown -R www-data:www-data ${WWWEXT5DIR}

.PHONY: distclean
distclean: clean

.PHONY: clean
clean:
	rm -rf *~ ${EXTJSDIR} extjs

