#!/bin/sh
set -e
RESOLVER=$(awk '$1=="nameserver"{print $2; exit}' /etc/resolv.conf)
export RESOLVER
GATEWAY_URL=${GATEWAY_URL:-http://gateway:8080}
export GATEWAY_URL
envsubst '${RESOLVER} ${GATEWAY_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
