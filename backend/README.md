# RoadGuard Backend

This is the FastAPI backend for the RoadGuard road hazard reporting application.

## Prerequisites
- Python 3.10 or higher
- PostgreSQL with PostGIS extension (Optional: The application can handle DB errors gracefully, but saving hazards requires it)
- Redis (Optional: Used for Celery, but `run.py` runs the API synchronously)

## Local Execution Instructions (No Docker)

You can clone this repository and run it locally with just Python and pip!

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Create a virtual environment (Recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

Start the FastAPI server natively using the provided run script:

```bash
python run.py
```

The server will start on `http://0.0.0.0:8000`.

### API Documentation

Once the server is running, you can access the interactive Swagger API documentation at:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Testing Hazard Classification

To test the hazard classification without needing the full DB stack, you can use the `/predict-hazard` endpoint:

```bash
curl -X 'POST' \
  'http://localhost:8000/predict-hazard' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'latitude=13.0827' \
  -F 'longitude=80.2707' \
  -F 'image=@path_to_your_image.jpg;type=image/jpeg'
```

It will return a JSON object with the prediction (`pothole`, `broken_road_edge`, `waterlogging`, or `missing_manhole_cover`), confidence score, and severity.
