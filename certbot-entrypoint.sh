#!/bin/sh

if [ ! -f /etc/letsencrypt/live/clustra.tech/fullchain.pem ]; then
    certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        -d clustra.tech \
        --non-interactive \
        --agree-tos \
        --email paitong1550@gmail.com \
        --rsa-key-size 4096 \
        --keep-until-expiring \
        --non-interactive \
        --agree-tos \
        --preferred-challenges http-01 \
        --server https://acme-v02.api.letsencrypt.org/directory
fi 