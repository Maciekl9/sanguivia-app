const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://sanguivia_db_user:hV5Jo573qoyIWfstQnv76QBZ3lHmWEO5@dpg-d3akjop5pdvs73cvbftg-a.oregon-postgres.render.com/sanguivia_db',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Połączono z bazą danych!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query działa:', result.rows[0]);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd połączenia z bazą danych:', error.message);
    process.exit(1);
  }
}

testConnection();
