# Identity-First Voting: MERN Stack Edition

This project has been fully migrated from Flask to **MERN**:
- **MongoDB** for data storage
- **Express.js + Node.js** for REST API
- **React + Bootstrap** for frontend UI

## Folder Structure

```text
.
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── utils/
│       ├── seed.js
│       └── server.js
├── client/
│   └── src/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
├── package.json
└── .env.example
```

## Features

### Admin
- Login with username/password
- Create election
- Add candidate
- Register voter with simulated biometric data
- Enable/disable voting
- Publish results
- Real-time stats

### Voter
- Login via student ID + biometric sample
- View active elections
- Cast vote once per election
- View published results

## API Endpoints

### Admin
- `POST /api/admin/login`
- `POST /api/admin/create-election`
- `POST /api/admin/add-candidate`
- `POST /api/admin/register-voter`
- `PATCH /api/admin/elections/:id/toggle-voting`
- `PATCH /api/admin/elections/:id/publish-results`
- `GET /api/admin/stats`
- `POST /api/admin/logout`

### Voter
- `POST /api/voter/login`
- `GET /api/voter/active-elections`
- `GET /api/voter/elections/:id/candidates`
- `POST /api/voter/cast-vote`
- `GET /api/voter/results/:id`
- `POST /api/voter/logout`

## Data Model (MongoDB Collections)
- `admins`
- `voters`
- `elections`
- `candidates`
- `votes` (unique index on `voterId + electionId`)
- `tokenblocklists`

## Run Locally

1. Install dependencies
```bash
cp .env.example .env
npm install
```

2. Start MongoDB locally (default URI in `.env`)

3. Seed admin user
```bash
npm run seed --workspace server
```

4. Run backend + frontend
```bash
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## Demo Credentials
- Admin: `admin / admin@123`

## Notes on biometric simulation
For academic/demo use, biometric matching is simulated by hashing provided biometric text/image signature using SHA-256 + pepper.
