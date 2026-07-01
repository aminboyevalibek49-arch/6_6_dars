const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Berilgan boardga tegishli barcha ro'yxatlarni olish
router.get('/', async (req, res) => {
  try {
    const { board_id } = req.query;
    let query = 'SELECT * FROM lists';
    const params = [];
    if (board_id) {
      query += ' WHERE board_id = $1';
      params.push(board_id);
    }
    query += ' ORDER BY id ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bitta ro'yxatni olish
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lists WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ro\'yxat topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ro'yxat yaratish
router.post('/', async (req, res) => {
  const { board_id, name } = req.body;
  if (!board_id || !name) {
    return res.status(400).json({ error: 'board_id va name majburiy' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO lists (board_id, name) VALUES ($1, $2) RETURNING *',
      [board_id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ro'yxatni yangilash
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE lists SET name = COALESCE($1, name) WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ro\'yxat topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ro'yxatni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lists WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ro\'yxat topilmadi' });
    }
    res.json({ message: 'Ro\'yxat o\'chirildi', list: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
