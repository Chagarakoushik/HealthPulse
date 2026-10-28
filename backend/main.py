from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.database import db_manager
from backend.routes.patients import router as patients_router
from backend.seed_data import INITIAL_PATIENT_RECORDS
from backend.models import calculate_age
from backend.services.ai_service import generate_health_remarks
from datetime import datetime, date, timezone

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("HealthRecordAPI")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and seed if empty
    logger.info("Initializing Health Record Management Backend...")
    await db_manager.connect()

    # Auto-seed sample patient records if database is empty
    try:
        col = db_manager.patients_collection
        count = await col.count_documents({})
        if count == 0:
            logger.info("Database is empty. Auto-seeding 10 assessment patient records...")
            now = datetime.now(timezone.utc).isoformat()
            for item in INITIAL_PATIENT_RECORDS:
                dob = date.fromisoformat(item["date_of_birth"])
                age = calculate_age(dob)
                remarks = await generate_health_remarks(
                    name=item["name"],
                    age=age,
                    glucose=item["glucose"],
                    haemoglobin=item["haemoglobin"],
                    cholesterol=item["cholesterol"],
                )
                await col.insert_one({
                    "name": item["name"],
                    "date_of_birth": item["date_of_birth"],
                    "email": item["email"].lower(),
                    "glucose": item["glucose"],
                    "haemoglobin": item["haemoglobin"],
                    "cholesterol": item["cholesterol"],
                    "ai_remarks": remarks,
                    "created_at": now,
                    "updated_at": now,
                })
            logger.info("Auto-seeding completed.")
    except Exception as e:
        logger.warning(f"Could not complete auto-seed during startup: {e}")

    yield

    # Shutdown: Close database connections
    logger.info("Shutting down Health Record Management Backend...")
    await db_manager.close()

app = FastAPI(
    title="Health Records Management API",
    description="Full-stack EHR system with Groq AI clinical remarks generation, MongoDB persistence, and strict medical validations.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware to allow React Vite dev and production clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Validation Error Handler providing clear, user-friendly messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = str(err.get("msg", "Validation error"))
        errors.append(f"{field}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation Failed",
            "errors": errors,
        }
    )

# Include routes
app.include_router(patients_router)

@app.get("/")
async def root():
    return {
        "message": "Health Records Management API is running.",
        "version": "1.0.0",
        "documentation": "/docs",
        "status_endpoint": "/api/health",
        "patients_endpoint": "/api/patients"
    }

if __name__ == "__main__":
    import uvicorn
    from backend.config import HOST, PORT
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
