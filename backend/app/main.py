from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from contextlib import asynccontextmanager
import asyncio
from app.services.chunking import processing_queue

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background task queue worker when the app starts
    queue_task = asyncio.create_task(processing_queue.process_queue())
    yield
    # Cancel the task when the app shuts down
    queue_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import upload, chat, websockets, auth
from app.core.database import Base, engine

# Initialize DB tables for testing purposes
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
app.include_router(upload.router, prefix=settings.API_V1_STR + "/contracts", tags=["contracts"])
app.include_router(chat.router, prefix=settings.API_V1_STR + "/chat", tags=["chat"])
app.include_router(websockets.router, prefix=settings.API_V1_STR, tags=["websockets"])

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request

# Mount the static Vite React app on the root path for production
dist_dir = os.path.join(os.path.dirname(__file__), "../../../frontend/dist")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# We must define the catch-all for React at the very bottom so it doesn't intercept API routes
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    # Catch-all to serve the React index.html for Single Page Application routing (and avoiding 404s on refresh)
    @app.get("/{catchall:path}")
    async def serve_react_app(request: Request, catchall: str):
        # Allow specific static files from the root of /dist like logo.png
        if catchall in ["logo.png", "vite.svg"]:
            return FileResponse(os.path.join(dist_dir, catchall))
        
        # Everything else goes to index.html (React Router)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    print("WARNING: React /dist folder not found. Make sure to run `npm run build` in the frontend directory.")

