# GearGuard - Maintenance Management System

A mini Odoo-like maintenance module built with Node.js, PostgreSQL, and React.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend on `http://localhost:3001`.

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app entry
│   │   ├── config/
│   │   │   └── database.js     # PostgreSQL connection
│   │   │   └── prisma.js
│   │   ├── database/
│   │   │   ├── migrate.js      # Database migrations
│   │   │   └── seed.js         # Sample data
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Index.js
│   │   │   ├── Equipment.js
│   │   │   ├── MaintenanceTeam.js
│   │   │   └── MaintenanceRequest.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── equipment.routes.js
│   │   │   ├── team.routes.js
│   │   │   └── request.routes.js
│   │   └── utils/
│   │       └── helpers.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── KanbanColumn.jsx
    │   │   ├── KanbanCard.jsx
    │   │   └── RequestModal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Login.css
    │   │   ├── Dashboard.jsx
    │   │   ├── Dashboard.css
    │   │   ├── Kanban.jsx
    │   │   ├── Kanban.css
    │   │   ├── Calendar.jsx
    │   │   ├── Calendar.css
    │   │   ├── Equipment.jsx
    │   │   ├── Equipment.css
    │   │   ├── Reports.jsx
    │   │   ├── Teams.jsx
    │   │   └── Teams.css
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

## 🔐 Default Credentials (after seeding)


| Email                 | Password    | Role       |
| ----------------------- | ------------- | ------------ |
| manager@gearguard.com | password123 | Manager    |
| sarah@gearguard.com   | password123 | Technician |
| mike@gearguard.com    | password123 | Technician |
| lisa@gearguard.com    | password123 | User       |

## ✨ Features

- **Kanban Board** - Drag & drop request management
- **Calendar View** - Schedule preventive maintenance
- **Equipment Management** - Track assets with warranty alerts
- **Team Management** - Organize technicians into teams
- **Role-Based Access** - User, Technician, Manager roles
- **Reports & Analytics** - Charts and statistics
- **Smart Buttons** - Odoo-style quick actions

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Maintenance Requests

- `GET /api/requests` - List requests
- `GET /api/requests/kanban` - Kanban grouped data
- `GET /api/requests/calendar` - Calendar events
- `POST /api/requests` - Create request
- `PATCH /api/requests/:id/status` - Update status
- `PATCH /api/requests/:id/assign` - Assign technician
- `PATCH /api/requests/:id/complete` - Mark completed

### Equipment

- `GET /api/equipment` - List equipment
- `GET /api/equipment/:id/requests` - Smart button
- `POST /api/equipment` - Create equipment
