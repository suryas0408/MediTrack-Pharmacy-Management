// ══════════════════════════════════════════════════
//  routes/reports.js — Analytics + Excel Export
// ══════════════════════════════════════════════════
const express  = require('express');
const router   = express.Router();
const ExcelJS  = require('exceljs');
const DB       = require('../db');

function getStatus(med) {
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(med.expiry_date);
  const days   = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  if (days < 0)                              return 'Expired';
  if (days <= 30)                            return 'Expiring Soon';
  if (med.quantity <= 0)                     return 'Out of Stock';
  if (med.quantity <= (med.threshold || 10)) return 'Low Stock';
  return 'OK';
}

function getBranchName(id) {
  const b = DB.findById('branches', id);
  return b ? b.name : 'Unknown';
}

// ── GET /api/reports/summary ──
router.get('/summary', (req, res) => {
  const { branch_id, from, to } = req.query;
  let meds = DB.getAll('medicines');
  let txs  = DB.getAll('transactions');

  if (branch_id) { meds = meds.filter(m => m.branch_id === branch_id); txs = txs.filter(t => t.branch_id === branch_id); }
  if (from)      txs = txs.filter(t => t.date >= from);
  if (to)        txs = txs.filter(t => t.date <= to);

  const totalIn    = txs.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
  const totalOut   = txs.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);
  const expired    = meds.filter(m => getStatus(m) === 'Expired').length;
  const lowStock   = meds.filter(m => getStatus(m) === 'Low Stock').length;
  const expiring   = meds.filter(m => getStatus(m) === 'Expiring Soon').length;

  const medsReport = meds.map(m => {
    const mTxs = txs.filter(t => t.medicine_id === m.id);
    return {
      ...m,
      status:    getStatus(m),
      branch:    getBranchName(m.branch_id),
      total_in:  mTxs.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0),
      total_out: mTxs.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0)
    };
  });

  res.json({ totalIn, totalOut, totalMedicines: meds.length, expired, lowStock, expiring, medicines: medsReport });
});

// ── GET /api/reports/download ── (Excel)
router.get('/download', async (req, res) => {
  try {
    const { branch_id, from, to } = req.query;
    let meds = DB.getAll('medicines');
    let txs  = DB.getAll('transactions');

    if (branch_id) { meds = meds.filter(m => m.branch_id === branch_id); txs = txs.filter(t => t.branch_id === branch_id); }
    if (from)      txs = txs.filter(t => t.date >= from);
    if (to)        txs = txs.filter(t => t.date <= to);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'MediTrack';
    wb.created = new Date();

    // ── Sheet 1: Inventory ──
    const ws1 = wb.addWorksheet('Inventory');
    ws1.columns = [
      { header: 'Medicine Name', key: 'name',         width: 25 },
      { header: 'Category',      key: 'category',     width: 18 },
      { header: 'Manufacturer',  key: 'manufacturer', width: 18 },
      { header: 'Barcode',       key: 'barcode',      width: 14 },
      { header: 'Quantity',      key: 'quantity',     width: 10 },
      { header: 'Threshold',     key: 'threshold',    width: 10 },
      { header: 'Expiry Date',   key: 'expiry_date',  width: 14 },
      { header: 'Branch',        key: 'branch',       width: 20 },
      { header: 'Price (₹)',     key: 'price',        width: 12 },
      { header: 'Total IN',      key: 'total_in',     width: 10 },
      { header: 'Total OUT',     key: 'total_out',    width: 10 },
      { header: 'Status',        key: 'status',       width: 14 },
    ];
    // Style header row
    ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2234' } };

    meds.forEach(m => {
      const mTxs = txs.filter(t => t.medicine_id === m.id);
      const status = getStatus(m);
      const row = ws1.addRow({
        name: m.name, category: m.category || '', manufacturer: m.manufacturer || '',
        barcode: m.barcode || '', quantity: m.quantity, threshold: m.threshold || 10,
        expiry_date: m.expiry_date, branch: getBranchName(m.branch_id), price: m.price || 0,
        total_in:  mTxs.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0),
        total_out: mTxs.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0),
        status
      });
      // Color-code status column
      const statusCell = row.getCell('status');
      const colors = { 'Expired': 'FFFF6B6B', 'Expiring Soon': 'FFFFD166', 'Low Stock': 'FFFFA500', 'Out of Stock': 'FFFF6B6B', 'OK': 'FF00D4AA' };
      if (colors[status]) statusCell.font = { color: { argb: colors[status] }, bold: true };
    });

    // ── Sheet 2: Transactions ──
    const ws2 = wb.addWorksheet('Transactions');
    ws2.columns = [
      { header: 'Medicine',  key: 'medicine_name', width: 25 },
      { header: 'Type',      key: 'type',          width: 10 },
      { header: 'Quantity',  key: 'quantity',      width: 10 },
      { header: 'Branch',    key: 'branch',        width: 20 },
      { header: 'User',      key: 'user_name',     width: 18 },
      { header: 'Date',      key: 'date',          width: 14 },
      { header: 'Date/Time', key: 'datetime',      width: 20 },
      { header: 'Note',      key: 'note',          width: 30 },
    ];
    ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2234' } };
    txs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(t => {
      const row = ws2.addRow({ ...t, branch: getBranchName(t.branch_id) });
      row.getCell('type').font = { color: { argb: t.type === 'IN' ? 'FF00D4AA' : 'FFFF6B6B' }, bold: true };
    });

    // ── Sheet 3: Alerts ──
    const ws3 = wb.addWorksheet('Alerts');
    ws3.columns = [
      { header: 'Medicine',      key: 'name',         width: 25 },
      { header: 'Branch',        key: 'branch',       width: 20 },
      { header: 'Quantity',      key: 'quantity',     width: 10 },
      { header: 'Alert Type',    key: 'status',       width: 16 },
      { header: 'Days to Expiry',key: 'days',         width: 14 },
      { header: 'Expiry Date',   key: 'expiry_date',  width: 14 },
    ];
    ws3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2234' } };
    meds.filter(m => getStatus(m) !== 'OK').forEach(m => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const days  = Math.floor((new Date(m.expiry_date) - today) / (1000 * 60 * 60 * 24));
      ws3.addRow({ name: m.name, branch: getBranchName(m.branch_id), quantity: m.quantity, status: getStatus(m), days, expiry_date: m.expiry_date });
    });

    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=MediTrack_Report_${date}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Excel report.' });
  }
});

module.exports = router;
