# Identity-First Voting: A Biometric-Authenticated Election Portal for University Clubs

A complete mini-project web application for conducting secure club elections in universities using **biometric simulation** (image upload hash matching).

## Tech Stack
- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript (ES6)
- **Backend:** Python Flask (REST APIs)
- **Database:** MySQL schema included (`sql/schema.sql`), SQLite supported for quick local run
- **Authentication:** JWT-based role authentication (Admin / Voter)
- **Security:** Password hashing, protected routes, one-voter-one-vote DB constraint, token blocklist logout

---

## Folder Structure

```text
Voting/
├── app.py
├── requirements.txt
├── .env.example
├── README.md
├── templates/
│   ├── index.html
│   ├── admin.html
│   └── voter.html
├── static/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── admin.js
│       └── voter.js
└── sql/
    ├── schema.sql
    └── dummy_data.sql
```

---

## Core Modules

### Admin Module
- Login with username/password (`/admin/login`)
- Create election (`/admin/create-election`)
- Add candidate (`/admin/add-candidate`)
- Register voter with biometric image (`/admin/register-voter`)
- Enable/disable voting (`/admin/elections/<id>/toggle`)
- View real-time stats (`/admin/stats/<id>`)
- Publish results (`/admin/declare-results/<id>`)
- Logout (`/admin/logout`)

### Voter Module
- Login with Student ID (`/voter/login`)
- Verify biometric image (`/voter/verify-biometric`)
- View active elections (`/voter/active-elections`)
- View candidates (`/voter/elections/<id>/candidates`)
- Cast vote once (`/voter/cast-vote`)
- Logout (`/voter/logout`)

### Public
- View published results (`/results`)

---

## Database Schema
Use the MySQL schema:

```bash
mysql -u root -p voting_portal < sql/schema.sql
```

Then load sample data if needed:

```bash
mysql -u root -p voting_portal < sql/dummy_data.sql
```

> `app.py` supports MySQL via `DATABASE_URL=mysql+pymysql://...`.

---

## Local Run Instructions

1. **Create virtual environment and install dependencies**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   export $(grep -v '^#' .env | xargs)
   ```

3. **Initialize database and seed default users**
   ```bash
   flask --app app.py shell -c "from app import db; db.create_all()"
   flask --app app.py seed
   ```

4. **Run server**
   ```bash
   python app.py
   ```

5. **Open in browser**
   - Home: `http://localhost:5000/`
   - Admin UI: `http://localhost:5000/admin`
   - Voter UI: `http://localhost:5000/voter`

---

## Default Demo Credentials
- **Admin:** `admin` / `admin@123`
- **Voter:** `STU001`

For STU001 biometric verification, use the same image used during registration (or register a new voter through Admin UI first).

---

## Security Notes
- Admin password stored with Werkzeug password hash.
- JWT protects role-based API routes.
- Logout invalidates tokens via blocklist table.
- One voter can vote only once per election using DB unique constraint.
- Input validation is included on server APIs.
- Biometric simulation stores only hash digest (not raw image bytes) in DB.

---

## Academic Mini-Project Notes
This project is intentionally clean and readable:
- Small, understandable codebase
- Well-separated frontend/backend
- Covers real-world requirements: authentication, authorization, validation, and election integrity
