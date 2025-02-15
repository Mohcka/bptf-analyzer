#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create user
    CREATE USER $DASHBOARD_DB_USERNAME WITH PASSWORD '$DASHBOARD_DB_PASSWORD';
    
    -- Grant connect privilege to database
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO $DASHBOARD_DB_USERNAME;
    
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO $DASHBOARD_DB_USERNAME;
    
    -- Grant select on all existing tables
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO $DASHBOARD_DB_USERNAME;
    
    -- Grant select on future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO $DASHBOARD_DB_USERNAME;
EOSQL