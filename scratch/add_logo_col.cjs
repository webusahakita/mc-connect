const mysql = require('mysql2/promise');

async function addLogoColumn() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'mc_connect'
        });

        console.log('Connected to DB');

        // Check if column exists
        const [rows] = await connection.execute("SHOW COLUMNS FROM users_mc LIKE 'logo_url'");
        if (rows.length === 0) {
            await connection.execute("ALTER TABLE users_mc ADD COLUMN logo_url VARCHAR(255) NULL");
            console.log('Added logo_url to users_mc');
        } else {
            console.log('logo_url already exists');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

addLogoColumn();
