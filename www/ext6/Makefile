include ../../defines.mk

EXTJSDIR=ext-6.0.0
EXTJSSRC=${EXTJSDIR}-gpl.zip

EXTDATA=	\
	extjs/build/ext-all.js	\
	extjs/build/ext-all-debug.js

EXT_THEME=	\
	extjs/build/classic/theme-classic	\
	extjs/build/classic/theme-neptune	\

${EXTDATA}: ${EXTJSSRC}
	rm -rf ${EXTJSDIR} extjs
	unzip -x ${EXTJSSRC}
	mv ${EXTJSDIR} extjs
	touch ${EXTDATA}

${EXTJSSRC}:
	wget http://cdn.sencha.com/ext/gpl/ext-6.0.0-gpl.zip

all: ${EXTDATA}

.PHONY: install
install: ${EXTDATA}
	install -d ${WWWEXT6DIR}
	install -m 0644 ${EXTDATA} ${WWWEXT6DIR}
	install -d ${WWWEXT6DIR}
	cp -a extjs/build/classic/locale ${WWWEXT6DIR}
	cp -a ${EXT_THEME} ${WWWEXT6DIR}
	chown -R www-data:www-data ${WWWEXT6DIR}

.PHONY: distclean
distclean: clean

.PHONY: clean
clean:
	rm -rf *~ ${EXTJSDIR} extjs

