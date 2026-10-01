// ═══════════════════════════════════════════════
//  routes/transactions.js — Stock In / Stock Out
// ═══════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const DB      = require('../db');

// ── GET /api/transactions ──
router.get('/', (req, res) => {
  const { branch_id, type, medicine_id, from, to, search } = req.query;
  let txs = DB.getAll('transactions');

  if (branch_id)   txs = txs.filter(t => t.branch_id   === branch_id);
  if (type)        txs = txs.filter(t => t.type         === type.toUpperCase());
  if (medicine_id) txs = txs.filter(t => t.medicine_id  === medicine_id);
  if (from)        txs = txs.filter(t => t.date >= from);
  if (to)          txs = txs.filter(t => t.date <= to);
  if (search)      txs = txs.filter(t => (t.medicine_name || '').toLowerCase().includes(search.toLowerCase()));

  // Sort newest first
  txs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(txs);
});

// ── POST /api/transactions — Stock In ──
router.post('/stock-in', (req, res) => {
  const { medicine_id, quantity, user_id, user_name, note } = req.body;
  if (!medicine_id || !quantity)
    return res.status(400).json({ error: 'medicine_id and quantity are required.' });

  const med = DB.findById('medicines', medicine_id);
  if (!med) return res.status(404).json({ error: 'Medicine not found.' });

  const qty = parseInt(quantity);
  if (qty <= 0) return res.status(400).json({ error: 'Quantity must be positive.' });

  const newQty = med.quantity + qty;
  DB.update('medicines', medicine_id, { quantity: newQty });

  const tx = DB.insert('transactions', {
    medicine_id, medicine_name: med.name,
    type: 'IN', quantity: qty,
    branch_id: med.branch_id,
    user_id: user_id || 'unknown',
    user_name: user_name || 'Unknown',
    date: new Date().toISOString().split('T')[0],
    datetime: new Date().toLocaleString(),
    note: note || ''
  });

  res.status(201).json({ transaction: tx, new_quantity: newQty });
});

// ── POST /api/transactions/stock-out ──
router.post('/stock-out', (req, res) => {
  const { medicine_id, quantity, user_id, user_name, note } = req.body;
  if (!medicine_id || !quantity)
    return res.status(400).json({ error: 'medicine_id and quantity are required.' });

  const med = DB.findById('medicines', medicine_id);
  if (!med) return res.status(404).json({ error: 'Medicine not found.' });

  const qty = parseInt(quantity);
  if (qty <= 0)          return res.status(400).json({ error: 'Quantity must be positive.' });
  if (qty > med.quantity) return res.status(400).json({ error: `Only ${med.quantity} units available.` });

  const newQty = med.quantity - qty;
  DB.update('medicines', medicine_id, { quantity: newQty });

  const tx = DB.insert('transactions', {
    medicine_id, medicine_name: med.name,
    type: 'OUT', quantity: qty,
    branch_id: med.branch_id,
    user_id: user_id || 'unknown',
    user_name: user_name || 'Unknown',
    date: new Date().toISOString().split('T')[0],
    datetime: new Date().toLocaleString(),
    note: note || ''
  });

  const alert = newQty <= (med.threshold || 10)
    ? { low_stock: true, message: `Low stock alert: ${med.name} has only ${newQty} units left.` }
    : {};

  res.status(201).json({ transaction: tx, new_quantity: newQty, ...alert });
});

module.exports = router;
