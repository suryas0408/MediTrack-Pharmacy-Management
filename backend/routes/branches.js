// ═══════════════════════════════════
//  routes/branches.js — Branch CRUD
// ═══════════════════════════════════
const express = require('express');
const router  = express.Router();
const DB      = require('../db');

router.get('/', (req, res) => {
  const branches = DB.getAll('branches');
  const meds     = DB.getAll('medicines');
  const enriched = branches.map(b => ({
    ...b,
    medicine_count: meds.filter(m => m.branch_id === b.id).length
  }));
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const b = DB.findById('branches', req.params.id);
  if (!b) return res.status(404).json({ error: 'Branch not found.' });
  res.json(b);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Branch name is required.' });
  const branch = DB.insert('branches', {
    name,
    location: req.body.location || '',
    phone:    req.body.phone    || ''
  });
  res.status(201).json(branch);
});

router.put('/:id', (req, res) => {
  const existing = DB.findById('branches', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Branch not found.' });
  const updated = DB.update('branches', req.params.id, {
    name:     req.body.name     ?? existing.name,
    location: req.body.location ?? existing.location,
    phone:    req.body.phone    ?? existing.phone
  });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = DB.delete('branches', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Branch not found.' });
  res.json({ message: 'Branch deleted.' });
});

module.exports = router;
