-- Runs once, the first time the Postgres container initialises its volume.
-- `eventora` is created by POSTGRES_DB; this adds the separate database the
-- integration test suite truncates, so tests can never touch development data.
CREATE DATABASE eventora_test;
