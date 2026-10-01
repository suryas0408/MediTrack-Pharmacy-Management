// ═══════════════════════════════════════════════
//  MediTrack — Smart Hospital Pharmacy System
//  Backend Server (Node.js + Express)
// ═══════════════════════════════════════════════
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes        = require('./routes/auth');
const medicineRoutes    = require('./routes/medicines');
const transactionRoutes = require('./routes/transactions');
const branchRoutes      = require('./routes/branches');
const userRoutes        = require('./routes/users');
const reportRoutes      = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Routes ──
app.use('/api/auth',         authRoutes);
app.use('/api/medicines',    medicineRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/branches',     branchRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/reports',      reportRoutes);

// ── Catch-all → serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏥 MediTrack Server running at http://localhost:${PORT}`);
  console.log(`📦 API available at http://localhost:${PORT}/api`);
  console.log(`\nDefault credentials:`);
  console.log(`  Admin : admin@hospital.com / admin123`);
  console.log(`  Staff : staff@hospital.com / staff123\n`);
});
