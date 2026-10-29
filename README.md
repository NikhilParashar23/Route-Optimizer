# RouteCraft — Connecting Points, Crafting Routes

**RouteCraft** is a web-based school bus route optimization system that generates efficient, capacity-safe bus routes using student locations, school details, and available buses. It combines pickup point clustering, road-network routing, and vehicle route optimization to reduce unnecessary travel and improve fleet utilization.

RouteCraft also supports **shareable driver and parent links**, allowing drivers to navigate assigned routes and parents to track bus locations live on a map.

## Features

### Route Optimization
- Two-step configuration wizard for school details, bus fleet, students, and route settings.
- Flexible school location input using coordinates, Plus Codes, or addresses.
- Support for mixed-capacity fleets with multiple bus types.
- Student data through sample generation or CSV/Excel uploads.
- DBSCAN-based pickup point clustering with walking-distance validation.
- Road-network distance and travel-time calculations using OSRM.
- Vehicle routing optimization using Google OR-Tools.
- Automatic assignment of the smallest suitable bus to each route.
- Route duration, fuel consumption, and cost estimates.
- Validation and meaningful error messages for infeasible requests.

### Interactive Results
- Interactive MapLibre map with school, pickup points, and bus routes.
- Light and dark map themes.
- Bus-wise route manifests and ordered pickup stops.
- Statistics for students, buses, distance, utilization, walking distance, and fuel cost.
- Turn-by-turn navigation with simulation and live GPS modes.

### Driver and Parent Tracking
- Shareable driver links for route navigation and GPS reporting.
- Shareable parent links for viewing bus locations and trip status.
- Live location updates with stale-position detection.
- Token-based access to shared trip information.
- Responsive map views that work across devices.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | Next.js, React, JavaScript/TypeScript |
| Styling | Tailwind CSS, Framer Motion, lucide-react |
| Forms and Validation | React Hook Form, Zod |
| Maps | MapLibre GL JS, OpenFreeMap |
| Backend | Python, Flask, Flask-CORS |
| Clustering | scikit-learn, DBSCAN |
| Route Optimization | Google OR-Tools |
| Road Network | OpenStreetMap, OSRM |
| Geocoding | Open Location Codes (Plus Codes), address geocoding |

## Project Structure

```text
Route-Optimizer/
├── app/
│   ├── api/[...path]/       # Backend API proxy
│   ├── driver/[tripId]/     # Driver navigation page
│   ├── track/[tripId]/      # Parent tracking page
│   ├── results/             # Optimization results
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── results/             # Maps, route cards, statistics
│   └── ContactForm.tsx      # Configuration wizard
├── hooks/results/           # Route navigation hooks
├── lib/
│   ├── results/             # API, geocoding, navigation
│   └── trips/               # Shareable link utilities
├── backend/
│   ├── app.py               # Flask application
│   ├── config.py            # Backend configuration
│   ├── trip_routes.py       # Trip and tracking APIs
│   ├── trip_store.py        # Trip and location storage
│   ├── upload_routes.py     # Roster upload APIs
│   ├── services/            # Clustering and optimization
│   ├── data/sample_data.py  # Sample data generator
│   └── requirements.txt
├── public/                  # Static assets and map worker
├── scripts/                 # Build utility scripts
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- Access to an OSRM server

### 1. Clone the Repository

```bash
git clone https://github.com/NikhilParashar23/Route-Optimizer.git
cd Route-Optimizer
```

### 2. Set Up the Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
source .venv/bin/activate
```

Install dependencies and start Flask:

```bash
pip install -r requirements.txt
python app.py
```

The backend runs at `http://127.0.0.1:5001`.

Check the health endpoint:

```text
http://127.0.0.1:5001/api/health
```

### 3. Set Up the Frontend

Open a second terminal in the project root:

```bash
npm install
npm run copy-worker
npm run dev
```

Open `http://localhost:3000` in your browser.

If the map does not load, verify that `http://localhost:3000/maplibre-gl-worker.js` is accessible and rerun the worker-copy command if necessary.

## Configuration

### Frontend Environment

Create a `.env.local` file in the project root if you need to configure the backend URL:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5001
```

### Backend Configuration

Configure the OSRM endpoint, solver time limit, stop dwell time, and other optimization settings in the backend configuration files.

Keep environment files and secrets out of version control.

## How to Use RouteCraft

1. **Configure the school:** Enter the school location and available bus fleet.
2. **Add students:** Generate sample students, upload a CSV/Excel roster, or add custom students.
3. **Set route constraints:** Configure maximum walking distance, route duration, and distance/time priority.
4. **Optimize routes:** Generate pickup points and capacity-safe bus routes.
5. **Review results:** Explore the interactive map, route manifests, and fleet statistics.
6. **Navigate:** Select a bus and use simulation mode or live GPS navigation.
7. **Share links:** Generate a driver link for navigation and a parent link for live tracking.

### Student Roster Format

CSV and Excel files should contain the following columns:

| student_name | plus_code |
|---|---|
| Aarav Patil | XQ64+8F Amravati |
| Diya Sharma | XQ53+M2 |

The `home_plus_code` column is also supported. Short Plus Codes are completed relative to the school's location.

## API Reference

### Planning APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend availability |
| GET | `/api/sample-data` | Generate sample school and student data |
| POST | `/api/optimize` | Generate optimized routes |
| POST | Upload endpoint | Import and validate a student roster |

### Trip and Tracking APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/<tripId>/public?t=<token>` | Retrieve trip details for parent tracking |
| GET | `/api/trips/<tripId>/live?t=<token>` | Retrieve the latest bus location and status |
| Driver location update | See `backend/trip_routes.py` | Report live GPS coordinates |

The exact request formats and additional endpoints are defined in the backend source code.

## Deployment

- **Frontend:** Deploy to Vercel or another platform supporting Next.js.
- **Backend:** Deploy Flask using a production server such as Gunicorn.
- **API connectivity:** Configure the frontend proxy or backend URL appropriately.
- **Live tracking:** Use HTTPS for browser GPS access on mobile devices.
- **Trip persistence:** Use a persistent database or shared storage for trip details, tokens, and live positions.
- **Map worker:** Ensure the MapLibre worker is copied into the public directory during deployment.

For local demonstrations, an HTTPS tunnel can expose the application temporarily. Such links may stop working when the tunnel closes or its URL changes.

## Future Scope

- Time-window and school-bell constraints.
- Real-time traffic-aware optimization.
- User accounts, saved plans, and persistent database storage.
- Dedicated driver application with offline maps and voice navigation.
- Parent notifications and estimated arrival times.

## Team

Built with ❤️ by the RouteCraft team
| Name | 
|---|
| Harshit Singh |
| Nikhil Parashar |
| Snigdha Raibagkar |


## Acknowledgements

RouteCraft is built using open-source software and open map data, including OpenStreetMap, OSRM, Google OR-Tools, scikit-learn, Flask, Next.js, React, MapLibre GL JS, and OpenFreeMap.

---

*RouteCraft — Connecting Points, Crafting Routes*