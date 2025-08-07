require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');
const cron = require('node-cron');
const fs = require('fs');

const app = express();

// Use env variables or fallback defaults
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DB_URL = process.env.DATABASE_URL || 'db.json';

// Middleware
app.use(cors());
app.use(express.json());

// Setup DB
const adapter = new JSONFile(DB_URL);
const db = new Low(adapter, { tasks: [] });

async function initDB() {
  await db.read();
  db.data ||= { tasks: [] };
  await db.write();
}
initDB();

// Routes
app.get('/tasks', async (req, res) => {
  await db.read();
  const { status, sortBy } = req.query;
  let tasks = db.data.tasks;

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  if (sortBy === 'priority') {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else if (sortBy === 'dueDate') {
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const task = { id: nanoid(), status: 'pending', ...req.body };
  db.data.tasks.push(task);
  await db.write();
  res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const index = db.data.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    db.data.tasks[index] = { ...db.data.tasks[index], ...req.body };
    await db.write();
    res.json(db.data.tasks[index]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  db.data.tasks = db.data.tasks.filter(t => t.id !== id);
  await db.write();
  res.json({ success: true });
});

// Daily summary cron job at 9 AM
cron.schedule('0 9 * * *', async () => {
  await db.read();
  const pendingTasks = db.data.tasks.filter(t => t.status === 'pending');
  console.log('📅 Daily Summary - Pending Tasks:');
  pendingTasks.forEach(t => {
    console.log(`- ${t.title} (Due: ${t.dueDate}, Priority: ${t.priority})`);
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});
