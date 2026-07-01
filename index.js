require('dotenv').config();
const express = require('express');

const boardsRouter = require('./routes/boards');
const listsRouter = require('./routes/lists');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Route'lar
app.use('/api/boards', boardsRouter);
app.use('/api/lists', listsRouter);
app.use('/api/tasks', tasksRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Taskboard API ishlayapti 🚀' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// Umumiy xato handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server xatosi' });
});

app.listen(PORT, () => {
  console.log(`✅ Server http://localhost:${PORT} manzilida ishlayapti`);
});
