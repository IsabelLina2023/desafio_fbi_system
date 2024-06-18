import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
//process.loadEnvFile();

const { Pool } = pg;
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

const config = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    allowExitOnIdle: true
};

export const pool = new Pool(config);