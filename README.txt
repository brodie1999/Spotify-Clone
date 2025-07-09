1. Design & Persist Data Model (COMPLETE)

Using alembic & sqlAlchemy to ensure dynamic updates to our database.
Allowing for smooth updates to our database from the backend.

Migrations:
    NOTE ON HOW TO MIGRATE TO POSTGRES:
        1. Use the command "alembic init alembic" this will create an initial alembic migration folder that can be edited.
            1.1. In "Script.py.mako" make sure to import our SQLModel using "import sqlmodel"
        2. In "alembic.ini" connect to the database (for me, it's postgres)
        3. In "env.py" import models and SQLModel. set "target_metadata = SQLModel.metadata"
        4. Run the command "alembic revision --autogenerate -m "Commit message" "

    When changing our models in the future we simply will update them using the same method in step 4.

Step 2. Implement Authentication & Authorization (Login & registration) COMPLETE

    2.1 - Create a user login, logout & registration page
        TASKS:
            1. In this section, using "/auth/routes" this will house our login and registration functionality (WORKING)
            2. Implement login routes (COMPLETE)
            3. Connect login & registration functionality to frontend using TypeScript & Tailwind (COMPLETE)

    2.2 - This will include passwords that are hashed when created (COMPLETE)
    2.3 - Include endpoints: POST /auth/register, POST /auth/login (COMPLETE)
    2.4 - Issue JWTs with Python-jose. (Json Web Tokens) (COMPLETE)
    2.5 - Protect our Routes (COMPLETE)
    2.6 - create a get_current_user dependency that reads the Authorization: Bearer <token> header. (COMPLETE)
    2.7 - Apply Depends(get_curren_user) to any endpoint that needs an authenticated user (COMPLETE)

3. CRUD Endpoints for Core Resources (LOADING...)

    Songs:
        - GET /songs (browse)
        - GET /songs/{id} (detail)

    Playlists:
        - GET /playlists (user’s lists)
        - POST /playlists (create)
        - GET /playlists/{id} (detail + tracks)
        - PUT /playlists/{id} (rename)
        - DELETE /playlists/{id}

    Playlist Tracks:
        - POST /playlists/{id}/tracks

    Liked Songs:
        - GET /me/liked
        - POST /me/liked/{song_id}
        - DELETE /me/liked/{song_id}

Use Pydantic models for request/response validation.

4. Spotify Web API Integration

    OAuth Flow

        - Endpoint GET /auth/spotify → redirect to Spotify’s auth page.
        - Callback GET /auth/spotify/callback → exchange code for tokens, store in user record.

    Import Playlists

        - Endpoint POST /spotify/import
        - Use spotipy or raw HTTP to fetch user’s Spotify playlists & tracks, then upsert into your DB.

    Keep Tokens Fresh

        - Store refresh_token, implement token-refresh logic in a background task or on-demand.

5. Smart Shuffle Service

    Algorithm Design

        - Pre-shuffle the list once per session & cache it (Redis?)
        - Track “played” indexes, cycle through until exhausted
        - Optionally generate multiple “sets” ahead of time to avoid repeats

    Endpoints:
        - GET /playlists/{id}/shuffle/next → returns the next track

6. Testing, Validation & Documentation

    Automated Tests:
        - Unit tests for services (shuffle logic, Spotify integration) using pytest.
        - Integration tests for endpoints using httpx.AsyncClient.

    API Docs:
        - FastAPI auto-docs at /docs and /redoc—add descriptions, example payloads.

    Data Validation:
        - Use Pydantic’s Field(..., regex=…), conint(), etc., to guard against bad data.

7. Optimization & Scaling

    Caching:
        - Cache frequent reads (e.g., playlist metadata) in Redis.

    Background Tasks:
        - Offload heavy Spotify imports to FastAPI’s BackgroundTasks or a Celery worker.

    Rate Limiting:
        - Protect your API from abuse (e.g., via slowapi or API Gateway).

8. Dockerization & Deployment

    - Dockerfiles for both backend/ and (later) frontend/.
    - Compose a docker-compose.yml bringing up:
        - FastAPI app
        - Postgres
        - Redis (optional)

    - CI/CD pipeline:
        - Run tests
        - Build Docker images
        - Deploy to AWS ECS / DigitalOcean App Platform / Railway / Render

9. Monitoring & Observability

    - Logging: structured JSON logs (via uvicorn/loguru).
    - Metrics: instrument with Prometheus + Grafana or a SaaS (e.g., Datadog).
    - Error Tracking: Sentry or similar.

10. Iterate & Extend

    - Add user-generated content (e.g., comments or collaborative playlists).
    - Real-time features (WebSockets for live listening parties).
    - Mobile SDK / GraphQL API.
    - Analytics (last-played timestamps, popular songs, etc.).
