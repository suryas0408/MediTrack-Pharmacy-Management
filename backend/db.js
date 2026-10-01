// ════════════════════════════════════════
//  db.js — Simple JSON file-based database
// ════════════════════════════════════════
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const filePath = (name) => path.join(DATA_DIR, `${name}.json`);

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const DB = {
  // Read all records
  getAll(table) {
    try {
      if (!fs.existsSync(filePath(table))) return [];
      return JSON.parse(fs.readFileSync(filePath(table), 'utf8'));
    } catch { return []; }
  },

  // Write all records
  saveAll(table, data) {
    fs.writeFileSync(filePath(table), JSON.stringify(data, null, 2));
  },

  // Find by id
  findById(table, id) {
    return DB.getAll(table).find(r => r.id === id) || null;
  },

  // Insert
  insert(table, record) {
    const all = DB.getAll(table);
    const newRecord = { id: uid(), createdAt: new Date().toISOString(), ...record };
    all.push(newRecord);
    DB.saveAll(table, all);
    return newRecord;
  },

  // Update by id
  update(table, id, data) {
    const all = DB.getAll(table);
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    DB.saveAll(table, all);
    return all[idx];
  },

  // Delete by id
  delete(table, id) {
    const all = DB.getAll(table);
    const filtered = all.filter(r => r.id !== id);
    DB.saveAll(table, filtered);
    return filtered.length < all.length;
  },

  // Filter records
  filter(table, predicate) {
    return DB.getAll(table).filter(predicate);
  },

  uid
};

// ── Seed default data on first run ──
function seed() {
  if (DB.getAll('branches').length > 0) return;

  const b1 = DB.insert('branches', { name: 'Main Branch',     location: 'Block A, City Hospital', phone: '+91 98765 43210' });
  const b2 = DB.insert('branches', { name: 'North Wing',      location: 'Block B, City Hospital', phone: '+91 98765 43211' });
  const b3 = DB.insert('branches', { name: 'Emergency Dept',  location: 'Block C, City Hospital', phone: '+91 98765 43212' });

  const admin = DB.insert('users', { name: 'Admin User',   email: 'admin@hospital.com', password: 'admin123', role: 'admin', branch_id: b1.id });
  const staff = DB.insert('users', { name: 'Staff Member', email: 'staff@hospital.com', password: 'staff123', role: 'user',  branch_id: b2.id });

  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

  const meds = [
    DB.insert('medicines', { name: 'Paracetamol', category: 'Analgesic',      barcode: '8901001', manufacturer: 'GSK',         quantity: 150, threshold: 20, expiry_date: addDays(180), branch_id: b1.id, price: 5  }),
    DB.insert('medicines', { name: 'Amoxicillin', category: 'Antibiotic',     barcode: '8901002', manufacturer: 'Cipla',        quantity: 8,   threshold: 15, expiry_date: addDays(90),  branch_id: b1.id, price: 25 }),
    DB.insert('medicines', { name: 'Metformin',   category: 'Antidiabetic',   barcode: '8901003', manufacturer: 'Sun Pharma',   quantity: 60,  threshold: 10, expiry_date: addDays(20),  branch_id: b2.id, price: 12 }),
    DB.insert('medicines', { name: 'Aspirin',     category: 'Analgesic',      barcode: '8901004', manufacturer: 'Bayer',        quantity: 200, threshold: 30, expiry_date: addDays(365), branch_id: b2.id, price: 3  }),
    DB.insert('medicines', { name: 'Omeprazole',  category: 'Antacid',        barcode: '8901005', manufacturer: 'AstraZeneca',  quantity: 5,   threshold: 10, expiry_date: addDays(-5),  branch_id: b3.id, price: 18 }),
    DB.insert('medicines', { name: 'Cetirizine',  category: 'Antihistamine',  barcode: '8901006', manufacturer: 'Ranbaxy',      quantity: 90,  threshold: 15, expiry_date: addDays(10),  branch_id: b3.id, price: 8  }),
  ];

  meds.forEach((m, i) => {
    DB.insert('transactions', {
      medicine_id: m.id, medicine_name: m.name,
      type: i % 2 === 0 ? 'IN' : 'OUT',
      quantity: 20 + i * 5,
      branch_id: m.branch_id,
      user_id: admin.id, user_name: admin.name,
      date: addDays(-i),
      datetime: new Date().toLocaleString(),
      note: 'Seed data'
    });
  });

  console.log('✅ Database seeded with default data.');
}

seed();

module.exports = DB;
