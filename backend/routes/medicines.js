// ═══════════════════════════════════════
//  routes/medicines.js — Medicine CRUD
// ═══════════════════════════════════════
const express = require('express');
const router  = express.Router();
const DB      = require('../db');

// Helper: derive status
function getStatus(med) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(med.expiry_date);
  const days = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  if (days < 0)          return 'expired';
  if (days <= 30)        return 'expiring';
  if (med.quantity <= 0) return 'out_of_stock';
  if (med.quantity <= (med.threshold || 10)) return 'low';
  return 'ok';
}

// ── GET /api/medicines ──
router.get('/', (req, res) => {
  const { branch_id, status, search } = req.query;
  let meds = DB.getAll('medicines');

  if (branch_id) meds = meds.filter(m => m.branch_id === branch_id);
  if (search)    meds = meds.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) ||
                                         (m.category||'').toLowerCase().includes(search.toLowerCase()));
  if (status)    meds = meds.filter(m => getStatus(m) === status);

  meds = meds.map(m => ({ ...m, status: getStatus(m) }));
  res.json(meds);
});

// ── GET /api/medicines/:id ──
router.get('/:id', (req, res) => {
  const med = DB.findById('medicines', req.params.id);
  if (!med) return res.status(404).json({ error: 'Medicine not found.' });
  res.json({ ...med, status: getStatus(med) });
});

// ── GET /api/medicines/barcode/:code ──
router.get('/barcode/:code', (req, res) => {
  const med = DB.filter('medicines', m => m.barcode === req.params.code)[0];
  if (!med) return res.status(404).json({ error: 'No medicine found for this barcode.' });
  res.json({ ...med, status: getStatus(med) });
});

// ── POST /api/medicines ──
router.post('/', (req, res) => {
  const { name, expiry_date, branch_id } = req.body;
  if (!name || !expiry_date || !branch_id)
    return res.status(400).json({ error: 'name, expiry_date and branch_id are required.' });

  const med = DB.insert('medicines', {
    name:         req.body.name,
    category:     req.body.category     || '',
    barcode:      req.body.barcode      || '',
    manufacturer: req.body.manufacturer || '',
    quantity:     parseInt(req.body.quantity)  || 0,
    threshold:    parseInt(req.body.threshold) || 10,
    expiry_date:  req.body.expiry_date,
    branch_id:    req.body.branch_id,
    price:        parseFloat(req.body.price)   || 0
  });
  res.status(201).json(med);
});

// ── PUT /api/medicines/:id ──
router.put('/:id', (req, res) => {
  const existing = DB.findById('medicines', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medicine not found.' });

  const updated = DB.update('medicines', req.params.id, {
    name:         req.body.name         ?? existing.name,
    category:     req.body.category     ?? existing.category,
    barcode:      req.body.barcode      ?? existing.barcode,
    manufacturer: req.body.manufacturer ?? existing.manufacturer,
    quantity:     req.body.quantity     !== undefined ? parseInt(req.body.quantity) : existing.quantity,
    threshold:    req.body.threshold    !== undefined ? parseInt(req.body.threshold) : existing.threshold,
    expiry_date:  req.body.expiry_date  ?? existing.expiry_date,
    branch_id:    req.body.branch_id    ?? existing.branch_id,
    price:        req.body.price        !== undefined ? parseFloat(req.body.price) : existing.price
  });
  res.json(updated);
});

// ── DELETE /api/medicines/:id ──
router.delete('/:id', (req, res) => {
  const deleted = DB.delete('medicines', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Medicine not found.' });
  res.json({ message: 'Medicine deleted.' });
});

module.exports = router;
