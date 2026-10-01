// ═══════════════════════════════
//  routes/users.js — User CRUD
// ═══════════════════════════════
const express = require('express');
const router  = express.Router();
const DB      = require('../db');

router.get('/', (req, res) => {
  const users = DB.getAll('users').map(({ password, ...u }) => u);
  res.json(users);
});

router.get('/:id', (req, res) => {
  const u = DB.findById('users', req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  const { password, ...safe } = u;
  res.json(safe);
});

router.put('/:id', (req, res) => {
  const existing = DB.findById('users', req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found.' });
  const updated = DB.update('users', req.params.id, {
    name:      req.body.name      ?? existing.name,
    role:      req.body.role      ?? existing.role,
    branch_id: req.body.branch_id ?? existing.branch_id
  });
  const { password, ...safe } = updated;
  res.json(safe);
});

router.delete('/:id', (req, res) => {
  const deleted = DB.delete('users', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User deleted.' });
});

module.exports = router;
