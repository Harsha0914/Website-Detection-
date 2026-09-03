# ShopPresence - Nearby Grocery & Shop Website Presence Detection Platform

A full-stack web application that helps users find nearby grocery stores, supermarkets, retail shops, and other local businesses based on geolocation and a user-configurable search distance. The platform detects whether each shop has an active website, audits digital quality, and facilitates communication and website creation proposals.

---

## Key Features

1. **Nearby Shop Discovery**: Retrieve nearby grocery stores and shops using Places API with adjustable search radius ($1\text{ km}$ to $50\text{ km}$).
2. **Website Presence Detection**: Automated validation classifying merchants into:
   - **`WEBSITE_AVAILABLE`** (Active standalone website)
   - **`NO_WEBSITE`** (No website detected, social profiles distinguished)
   - **`WEBSITE_UNREACHABLE`** (Website domain configured but down/unresponsive)
3. **11-Point Quality Audit Score (0 - 100)**:
   - Reachability ($15\text{ pts}$)
   - HTTPS / SSL Encryption ($15\text{ pts}$)
   - Mobile Viewport ($10\text{ pts}$)
   - Page Title ($10\text{ pts}$)
   - Meta Description ($10\text{ pts}$)
   - Contact Info ($10\text{ pts}$)
   - Phone Number ($8\text{ pts}$)
   - Email Address ($8\text{ pts}$)
   - Navigation Menu ($7\text{ pts}$)
   - Social Media Links ($4\text{ pts}$)
   - Open Graph Tags ($3\text{ pts}$)
4. **Interactive Map & Split View**: Leaflet OpenStreetMap with color-coded pins (Emerald for website available, Rose for no website).
5. **AI Chat Assistants**:
   - **Website Improvement Assistant**: Recommends SEO, mobile, and conversion improvements.
   - **Website Creation Assistant**: Generates website blueprints and online ordering suggestions.
6. **Admin Portal**:
   - Platform analytics & distribution charts
   - Business classification management
   - User account moderation (activate/deactivate)
   - Website creation proposal management
   - Filterable Presence Reports with **CSV Export**

---

## Tech Stack

- **Backend**: Python 3.11+ + FastAPI
- **Database**: PostgreSQL 15 + SQLAlchemy 2.0 ORM + Alembic
- **Auth**: JWT (python-jose) + bcrypt password hashing
- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons
- **Maps**: Leaflet + OpenStreetMap
- **State Management**: Zustand
- **AI Integration**: Google Gemini API (with intelligent rule-based fallback)

---

## Project Structure

```text
c:\Shop\
├── backend/
│   ├── app/
│   │   ├── auth/            # JWT token & security dependencies
│   │   ├── models/          # SQLAlchemy ORM database models
│   │   ├── routers/         # REST API route handlers
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Places, Website Detection & Analysis, AI Chat
│   │   ├── utils/           # Haversine distance, Security utils
│   │   ├── cli.py           # Admin creation CLI tool
│   │   ├── config.py        # Settings loader (.env)
│   │   ├── database.py      # Database engine & session
│   │   └── main.py          # FastAPI application entry point
│   ├── alembic/             # Database migrations
│   ├── tests/               # pytest test suite
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Map, Cards, ChatBox, Navbar, Footer, Badges
│   │   ├── pages/           # Landing, Auth, Dashboard, Shops, Detail, Admin
│   │   ├── services/        # Axios API client
│   │   ├── store/           # Zustand state stores
│   │   ├── App.jsx          # Route declarations
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, GOOGLE_PLACES_API_KEY, and GEMINI_API_KEY
```

#### Run Database Tables & Create Admin

```bash
# Run FastAPI (automatically generates tables on startup)
uvicorn app.main:app --reload --port 8000

# Create an administrator account via CLI:
python -m app.cli create-admin --email admin@example.com --password "AdminPass123" --name "Lead Administrator"
```

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend will run on `http://localhost:5173`.
The backend API and Swagger docs will be at `http://localhost:8000/docs`.

---

## Google Maps Platform API Setup & Configuration

To enable live Google Places API (New) nearby business search, geocoding, and directions links:

### 1. Enable Required Google Cloud APIs
In the [Google Cloud Console](https://console.cloud.google.com/), enable the following APIs for your project:
- **Places API (New)** (`places.googleapis.com`) — required for `searchNearby` and `searchText`
- **Geocoding API** (`maps.googleapis.com`) — required for address & location resolution (e.g., "Hitec City")
- **Maps JavaScript API** — optional for rich interactive maps

### 2. Configure Environment Variable / Replit Secrets
Add your API key to `backend/.env` or Replit Secrets:
```env
GOOGLE_PLACES_API_KEY=AIzaSy...your_google_places_api_key...
```
*(Note: Never commit your API key to source code or expose it directly in frontend client bundles.)*

---

## Running with Docker Compose

To start the complete stack (PostgreSQL + FastAPI + React Frontend in Nginx):

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## Running Automated Tests

```bash
cd backend
pytest tests/ -v
```

The test suite validates:
- User registration, password complexity, and duplicate email prevention
- JWT login, token refreshes, and role verification
- Haversine distance calculations and search radius bounding
- Website URL sanitization, social media link exclusion, and 11-point quality scoring
- Nearby shop discovery and database sync
- Admin authorization barriers and CSV report generation

---

## REST API Summary

### Authentication
- `POST /api/auth/register` — Register a new normal user
- `POST /api/auth/login` — Login and receive JWT access/refresh tokens
- `POST /api/auth/refresh` — Refresh expired access token
- `GET  /api/auth/me` — Get current user profile

### Businesses
- `GET  /api/businesses/nearby` — Discover nearby shops with website status detection
- `GET  /api/businesses/{id}` — Get single business details
- `GET  /api/businesses/filter/with-websites` — Filter shops with websites
- `GET  /api/businesses/filter/without-websites` — Filter shops without websites

### Website Analysis & Requests
- `GET  /api/websites/{business_id}` — Get website quality audit
- `POST /api/websites/{business_id}/analyze` — Trigger live re-analysis
- `POST /api/websites/requests` — Submit website development proposal

### Chat
- `POST /api/chat/conversations` — Start or retrieve assistant conversation
- `POST /api/chat/conversations/{id}/messages` — Send message and receive AI response

### Admin (Requires Admin Role)
- `GET  /api/admin/statistics` — Overall platform metrics
- `GET  /api/admin/businesses` — Business management
- `PUT  /api/admin/businesses/{id}` — Update classification
- `GET  /api/admin/users` — User management
- `PUT  /api/admin/users/{id}` — Toggle active status
- `GET  /api/admin/reports/csv` — Export CSV report
