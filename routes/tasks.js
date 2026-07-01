const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const VALID_STATUSES = ['Pending', 'In Progress', 'Done'];

// 6. Filtrlash va qidiruv: /api/tasks?list_id=&status=&search=
router.get('/', async (req, res) => {
  try {
    const { list_id, status, search } = req.query;
    const conditions = [];
    const params = [];

    if (list_id) {
      params.push(list_id);
      conditions.push(`list_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    let query = 'SELECT * FROM tasks';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bitta vazifani olish
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vazifa topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Vazifa yaratish (title, description, status)
router.post('/', async (req, res) => {
  const { list_id, title, description, status } = req.body;
  if (!list_id || !title) {
    return res.status(400).json({ error: 'list_id va title majburiy' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status quyidagilardan biri bo'lishi kerak: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const result = await pool.query(
      `INSERT INTO tasks (list_id, title, description, status)
       VALUES ($1, $2, $3, COALESCE($4, 'Pending')) RETURNING *`,
      [list_id, title, description || null, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Vazifani yangilash (masalan statusni "In Progress" qilish)
// completed_at maydoni DB trigger orqali avtomatik boshqariladi (8-band)
router.put('/:id', async (req, res) => {
  const { title, description, status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status quyidagilardan biri bo'lishi kerak: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status)
       WHERE id = $4 RETURNING *`,
      [title, description, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vazifa topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Vazifani o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vazifa topilmadi' });
    }
    res.json({ message: 'Vazifa o\'chirildi', task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
