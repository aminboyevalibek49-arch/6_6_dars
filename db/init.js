// Jadvallarni yaratuvchi skript.
// Ishlatish: npm run init-db
const pool = require('./pool');

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lists (
  id SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'In Progress', 'Done')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task status = 'Done' bo'lganda completed_at ni avtomatik to'ldiruvchi trigger
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Done' AND (OLD.status IS DISTINCT FROM 'Done') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status <> 'Done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_completed_at ON tasks;
CREATE TRIGGER trg_set_completed_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_completed_at();

-- Insert paytida ham Done bo'lsa completed_at to'ldirilsin
CREATE OR REPLACE FUNCTION set_completed_at_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Done' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_completed_at_insert ON tasks;
CREATE TRIGGER trg_set_completed_at_insert
BEFORE INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_completed_at_insert();
`;

async function init() {
  try {
    await pool.query(createTablesSQL);
    console.log('✅ Jadvallar va triggerlar muvaffaqiyatli yaratildi.');
  } catch (err) {
    console.error('❌ DB init xatosi:', err.message);
  } finally {
    await pool.end();
  }
}

init();
