require('dotenv').config();
const { Pool } = require('pg');

// pg avtomatik ravishda PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
// environment o'zgaruvchilarini o'qiydi, shuning uchun config bermasak ham bo'ladi.
// Lekin aniqlik uchun explicit yozamiz.
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

pool.on('error', (err) => {
  console.error('Kutilmagan DB xatosi:', err);
});

module.exports = pool;
