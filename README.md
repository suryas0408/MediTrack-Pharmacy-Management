# 🏥 MediTrack — Smart Hospital Pharmacy Inventory System

A full-featured pharmacy inventory management system with barcode scanning, voice input, multi-branch support, alerts, and Excel export.

---

## 🚀 Quick Start

### Option A — Standalone (No Server Needed)
Simply open `frontend/index.html` in your browser.
- Uses browser localStorage as the database
- All features work offline
- Perfect for single-machine use

### Option B — Full Stack (Node.js Backend)

#### Prerequisites
- Node.js v16 or higher
- npm

#### Installation
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

---

## 🔐 Default Login Credentials

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@hospital.com     | admin123   |
| Staff | staff@hospital.com     | staff123   |

---

## 📁 Project Structure

```
meditrack/
├── frontend/
│   └── index.html          # Complete frontend (standalone or served)
├── backend/
│   ├── server.js           # Express server entry point
│   ├── db.js               # JSON file-based database
│   ├── data/               # Auto-created JSON data files
│   └── routes/
│       ├── auth.js         # Login / Register / OTP
│       ├── medicines.js    # Medicine CRUD + barcode lookup
│       ├── transactions.js # Stock In / Stock Out
│       ├── branches.js     # Branch management
│       ├── users.js        # User management
│       └── reports.js      # Analytics + Excel download
├── package.json
└── README.md
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint                      | Description          |
|--------|-------------------------------|----------------------|
| POST   | /api/auth/login               | Login                |
| POST   | /api/auth/register            | Register             |
| POST   | /api/auth/forgot-password     | Send OTP             |
| POST   | /api/auth/verify-otp          | Verify OTP           |
| POST   | /api/auth/reset-password      | Reset password       |

### Medicines
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/medicines                    | List all medicines       |
| GET    | /api/medicines/:id                | Get by ID                |
| GET    | /api/medicines/barcode/:code      | Lookup by barcode        |
| POST   | /api/medicines                    | Add medicine             |
| PUT    | /api/medicines/:id                | Update medicine          |
| DELETE | /api/medicines/:id                | Delete medicine          |

### Transactions
| Method | Endpoint                           | Description      |
|--------|------------------------------------|------------------|
| GET    | /api/transactions                  | List all         |
| POST   | /api/transactions/stock-in         | Stock In         |
| POST   | /api/transactions/stock-out        | Stock Out        |

### Branches
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | /api/branches         | List all branches  |
| POST   | /api/branches         | Add branch         |
| PUT    | /api/branches/:id     | Update branch      |
| DELETE | /api/branches/:id     | Delete branch      |

### Reports
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/reports/summary        | Analytics summary        |
| GET    | /api/reports/download       | Download Excel (.xlsx)   |

**Query params for reports:** `branch_id`, `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)

---

## ✅ Features

- 🔐 Login / Register + OTP Forgot Password
- 📷 Barcode Scanner (camera + manual entry)
- 🎤 Voice Input (Web Speech API)
- 📦 Inventory Management (CRUD)
- 🔄 Stock In / Stock Out with transaction history
- 🔔 Low Stock Alerts (below threshold)
- ⏰ Expiry Alerts (30-day warning + expired)
- 🏥 Multi-Branch System
- 📊 Reports & Analytics
- 📄 Excel Export (3 sheets: Inventory, Transactions, Alerts)
- 👥 User Management (Admin only)
- 🌙 Dark theme UI

---

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript, SheetJS (Excel)  
**Backend:** Node.js, Express.js, ExcelJS  
**Database:** JSON file-based (easily replaceable with MySQL/MongoDB)

---

## 📝 Notes

- To integrate real email for OTP, install `nodemailer` and configure SMTP in `routes/auth.js`
- To use a real database, replace `db.js` with a MySQL/MongoDB adapter
- The frontend works standalone without the backend (uses localStorage)
