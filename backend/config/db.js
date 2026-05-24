let sql = require('mssql');
require('dotenv').config();

const isLocal = process.env.DB_SERVER === 'localhost' || process.env.DB_SERVER === '.';

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: !isLocal, // True for Azure, false for local
        trustServerCertificate: isLocal // True for local dev
    }
};

// Use Windows Authentication for local connections if no DB_USER is provided
if (isLocal && !process.env.DB_USER) {
    sql = require('mssql/msnodesqlv8');
    dbConfig.connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_DATABASE};Trusted_Connection=yes;`;
} else {
    dbConfig.user = process.env.DB_USER;
    dbConfig.password = process.env.DB_PASSWORD;
}

let poolPromise;

const connectDB = async () => {
    try {
        if (!poolPromise) {
            console.log('Connecting to Azure SQL Database...');
            poolPromise = sql.connect(dbConfig);
        }
        await poolPromise;
        console.log('Azure SQL Database connected successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};

const getPool = async () => {
    if (!poolPromise) {
        await connectDB();
    }
    return poolPromise;
};

module.exports = { connectDB, getPool, sql };
