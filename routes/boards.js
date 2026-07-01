const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 1. Barcha boardlarni ro'yxat shaklida olish
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM boards ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bitta boardni olish
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM boards WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Board yaratish
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name majburiy' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO boards (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Board yangilash
router.put('/:id', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE boards SET name = COALESCE($1, name), description = COALESCE($2, description)
       WHERE id = $3 RETURNING *`,
      [name, description, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Board o'chirish (bog'liq lists va tasks CASCADE bilan o'chadi)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM boards WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board topilmadi' });
    }
    res.json({ message: 'Board o\'chirildi', board: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Kengaytirish: boardga tegishli vazifalarning umumiy sonini hisoblash
router.get('/:id/tasks-count', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(t.id)::int AS total_tasks
       FROM tasks t
       JOIN lists l ON t.list_id = l.id
       WHERE l.board_id = $1`,
      [req.params.id]
    );
    res.json({ board_id: Number(req.params.id), total_tasks: result.rows[0].total_tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Statistik ma'lumotlar: boardda qancha vazifa bajarilgan, foizlarda holat
router.get('/:id/stats', async (req, res) => {
  try {
    const boardId = req.params.id;

    const totalResult = await pool.query(
      `SELECT COUNT(t.id)::int AS total
       FROM tasks t JOIN lists l ON t.list_id = l.id
       WHERE l.board_id = $1`,
      [boardId]
    );
    const total = totalResult.rows[0].total;

    const statusResult = await pool.query(
      `SELECT t.status, COUNT(*)::int AS count
       FROM tasks t JOIN lists l ON t.list_id = l.id
       WHERE l.board_id = $1
       GROUP BY t.status`,
      [boardId]
    );

    const statuses = ['Pending', 'In Progress', 'Done'];
    const stats = {};
    statuses.forEach((s) => {
      const row = statusResult.rows.find((r) => r.status === s);
      const count = row ? row.count : 0;
      stats[s] = {
        count,
        percent: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
      };
    });

    res.json({ board_id: Number(boardId), total_tasks: total, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
