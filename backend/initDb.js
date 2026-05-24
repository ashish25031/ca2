require('dotenv').config();

const isLocal = process.env.DB_SERVER === 'localhost' || process.env.DB_SERVER === '.';
const isWindowsAuth = isLocal && !process.env.DB_USER;

let sql;
if (isWindowsAuth) {
    sql = require('mssql/msnodesqlv8');
} else {
    sql = require('mssql');
}

const DB_NAME = process.env.DB_DATABASE || 'sfs_db';

async function initDb() {
    try {
        let pool;

        // We only attempt to automatically create the Database if running locally
        // On Azure, the database itself is created via the Azure Portal
        if (isLocal) {
            console.log('Connecting to master database to ensure database exists...');
            const masterConfig = isWindowsAuth 
                ? { connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=master;Trusted_Connection=yes;' }
                : { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: 'master', options: { encrypt: false, trustServerCertificate: true } };
            
            pool = await sql.connect(masterConfig);
            
            console.log(`Checking if database ${DB_NAME} exists...`);
            const dbCheck = await pool.request().query(`SELECT name FROM sys.databases WHERE name = N'${DB_NAME}'`);

            if (dbCheck.recordset.length === 0) {
                console.log(`Creating database ${DB_NAME}...`);
                await pool.request().query(`CREATE DATABASE ${DB_NAME}`);
                console.log(`Database ${DB_NAME} created successfully.`);
            } else {
                console.log(`Database ${DB_NAME} already exists.`);
            }
            await pool.close();
        } else {
            console.log(`Assuming Azure database ${DB_NAME} is already created via Azure Portal.`);
        }

        console.log(`Connecting to ${DB_NAME} to create tables...`);
        let appConfig;
        if (isWindowsAuth) {
            appConfig = { connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=${DB_NAME};Trusted_Connection=yes;` };
        } else {
            appConfig = {
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                server: process.env.DB_SERVER,
                database: DB_NAME,
                options: { encrypt: !isLocal, trustServerCertificate: isLocal }
            };
        }

        pool = await sql.connect(appConfig);

        // Create Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
            CREATE TABLE Users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(100) NOT NULL,
                email NVARCHAR(100) NOT NULL UNIQUE,
                password NVARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('Users table checked/created.');

        // Create Files table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Files' and xtype='U')
            CREATE TABLE Files (
                id INT IDENTITY(1,1) PRIMARY KEY,
                filename NVARCHAR(255) NOT NULL,
                filepath NVARCHAR(1000) NOT NULL,
                filesize BIGINT NOT NULL,
                uploaded_by INT NOT NULL FOREIGN KEY REFERENCES Users(id),
                upload_date DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('Files table checked/created.');

        // Create SharedLinks table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SharedLinks' and xtype='U')
            CREATE TABLE SharedLinks (
                id INT IDENTITY(1,1) PRIMARY KEY,
                file_id INT NOT NULL FOREIGN KEY REFERENCES Files(id),
                share_token NVARCHAR(255) NOT NULL UNIQUE,
                access_password NVARCHAR(255) NULL,
                expiry_time DATETIME2 NULL,
                created_at DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('SharedLinks table checked/created.');

        await pool.close();
        console.log('Database initialization complete!');
        process.exit(0);

    } catch (err) {
        console.error('Error initializing database:', err);
        if (err.originalError) {
             console.error('Original error:', err.originalError);
        }
        process.exit(1);
    }
}

initDb();
