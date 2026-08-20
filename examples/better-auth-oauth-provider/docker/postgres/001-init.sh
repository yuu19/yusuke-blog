#!/bin/sh
set -eu

psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<EOSQL
CREATE ROLE oauth_auth LOGIN PASSWORD '${AUTH_DB_PASSWORD}';
CREATE ROLE oauth_notes LOGIN PASSWORD '${NOTES_DB_PASSWORD}';
CREATE ROLE oauth_bff LOGIN PASSWORD '${BFF_DB_PASSWORD}';
CREATE DATABASE oauth_auth OWNER oauth_auth;
CREATE DATABASE oauth_notes OWNER oauth_notes;
CREATE DATABASE oauth_bff OWNER oauth_bff;
EOSQL
