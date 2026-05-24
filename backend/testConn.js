const sql = require('mssql/msnodesqlv8');

const config = {
  server: 'localhost',
  database: 'master',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    driver: 'ODBC Driver 17 for SQL Server'
  }
};

async function test() {
    try {
        console.log('Testing mssql with custom ODBC driver...');
        await sql.connect(config);
        console.log('Connected!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        if (e.originalError) console.error(e.originalError);
        process.exit(1);
    }
}
test();
