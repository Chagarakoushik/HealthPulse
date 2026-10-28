from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from bson import ObjectId
from backend.database import db_manager
from backend.models import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientStats,
    calculate_age,
    get_overall_risk,
)
from backend.services.ai_service import generate_health_remarks
from backend.seed_data import INITIAL_PATIENT_RECORDS
from backend.config import GROQ_API_KEY, GROQ_MODEL

router = APIRouter(prefix="/api", tags=["Patients"])

def serialize_id(raw_id: any) -> str:
    return str(raw_id)

def get_id_query(patient_id: str):
    """Builds MongoDB query supporting both ObjectId and string UUIDs."""
    try:
        return {"$or": [{"_id": ObjectId(patient_id)}, {"_id": patient_id}]}
    except Exception:
        return {"_id": patient_id}

async def fetch_all_docs(col, query=None):
    if query is None:
        query = {}
    # If motor collection, find() returns an AsyncIOMotorCursor
    cursor_or_list = col.find(query)
    if hasattr(cursor_or_list, "to_list"):
        return await cursor_or_list.to_list(length=2000)
    elif hasattr(cursor_or_list, "__await__"):
        return await cursor_or_list
    return cursor_or_list

@router.get("/health")
async def health_check():
    """System health check endpoint verifying database and Groq AI availability."""
    db_status = db_manager.get_status()
    groq_configured = bool(GROQ_API_KEY and GROQ_API_KEY.strip())
    
    return {
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "ai_engine": {
            "provider": "Groq",
            "model": GROQ_MODEL,
            "configured": groq_configured,
            "status": "ready" if groq_configured else "fallback_mode (no GROQ_API_KEY)"
        }
    }

@router.get("/stats", response_model=PatientStats)
async def get_patient_statistics():
    """Returns aggregated summary metrics across all patients for the dashboard."""
    col = db_manager.patients_collection
    raw_patients = await fetch_all_docs(col, {})
    
    total = len(raw_patients)
    if total == 0:
        return PatientStats(
            total_patients=0,
            normal_count=0,
            moderate_count=0,
            high_risk_count=0,
            avg_glucose=0.0,
            avg_haemoglobin=0.0,
            avg_cholesterol=0.0,
        )

    normal_count = 0
    moderate_count = 0
    high_risk_count = 0
    total_glucose = 0.0
    total_haemoglobin = 0.0
    total_cholesterol = 0.0

    for p in raw_patients:
        g = float(p.get("glucose", 0))
        h = float(p.get("haemoglobin", 0))
        c = float(p.get("cholesterol", 0))
        total_glucose += g
        total_haemoglobin += h
        total_cholesterol += c

        risk = get_overall_risk(g, h, c)
        if risk["status"] == "High Risk":
            high_risk_count += 1
        elif risk["status"] == "Moderate Risk":
            moderate_count += 1
        else:
            normal_count += 1

    return PatientStats(
        total_patients=total,
        normal_count=normal_count,
        moderate_count=moderate_count,
        high_risk_count=high_risk_count,
        avg_glucose=round(total_glucose / total, 1),
        avg_haemoglobin=round(total_haemoglobin / total, 1),
        avg_cholesterol=round(total_cholesterol / total, 1),
    )

@router.get("/patients", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None, description="Search by patient name or email"),
    risk: Optional[str] = Query(None, description="Filter by risk category: Normal, Moderate Risk, High Risk"),
    sort_by: Optional[str] = Query("created_at", description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sorting direction: asc or desc"),
):
    """Retrieves patient records with optional search, risk filtering, and sorting."""
    col = db_manager.patients_collection
    
    query = {}
    if search and search.strip():
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
        ]

    raw_list = await fetch_all_docs(col, query)
    responses = [PatientResponse.from_doc(doc) for doc in raw_list]

    # Risk filtering (in-memory to leverage calculated risk categories)
    if risk and risk != "All":
        responses = [p for p in responses if p.overall_risk["status"].lower() == risk.lower()]

    # Sorting
    reverse = (sort_order.lower() == "desc")
    if sort_by in ["name", "email"]:
        responses.sort(key=lambda x: getattr(x, sort_by).lower(), reverse=reverse)
    elif sort_by in ["glucose", "haemoglobin", "cholesterol", "age"]:
        responses.sort(key=lambda x: getattr(x, sort_by), reverse=reverse)
    elif sort_by == "date_of_birth":
        responses.sort(key=lambda x: x.date_of_birth, reverse=reverse)
    else:
        responses.sort(key=lambda x: x.created_at, reverse=reverse)

    return responses

@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    """Retrieves a single patient record by identifier."""
    col = db_manager.patients_collection
    id_q = get_id_query(patient_id)
    doc = await col.find_one(id_q)
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient record with ID '{patient_id}' not found."
        )
    return PatientResponse.from_doc(doc)

@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(payload: PatientCreate):
    """
    Creates a new patient record.
    Validates duplicate email and automatically queries Groq API for remarks.
    """
    col = db_manager.patients_collection
    
    # Duplicate email check
    existing = await col.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate Record: A patient with email '{payload.email}' already exists."
        )

    # Generate AI remarks if not explicitly provided
    remarks = payload.ai_remarks
    if not remarks or not remarks.strip():
        age = calculate_age(payload.date_of_birth)
        remarks = await generate_health_remarks(
            name=payload.name,
            age=age,
            glucose=payload.glucose,
            haemoglobin=payload.haemoglobin,
            cholesterol=payload.cholesterol,
        )

    now = datetime.now(timezone.utc)
    patient_doc = {
        "name": payload.name,
        "date_of_birth": payload.date_of_birth.isoformat(),
        "email": payload.email.lower(),
        "glucose": payload.glucose,
        "haemoglobin": payload.haemoglobin,
        "cholesterol": payload.cholesterol,
        "ai_remarks": remarks,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    result = await col.insert_one(patient_doc)
    patient_doc["_id"] = result.inserted_id

    return PatientResponse.from_doc(patient_doc)

@router.put("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, payload: PatientUpdate):
    """
    Updates an existing patient record.
    Re-validates email uniqueness and refreshes AI remarks if biomarker values change.
    """
    col = db_manager.patients_collection
    id_q = get_id_query(patient_id)
    existing = await col.find_one(id_q)
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )

    update_dict = {}
    data = payload.model_dump(exclude_unset=True)

    # Duplicate email check if updating email
    if "email" in data and data["email"]:
        new_email = data["email"].lower()
        if new_email != existing.get("email", "").lower():
            conflict = await col.find_one({"email": new_email})
            if conflict and str(conflict.get("_id")) != str(existing.get("_id")):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Duplicate Record: Another patient already uses email '{new_email}'."
                )
        update_dict["email"] = new_email

    for field in ["name", "glucose", "haemoglobin", "cholesterol"]:
        if field in data and data[field] is not None:
            update_dict[field] = data[field]

    if "date_of_birth" in data and data["date_of_birth"] is not None:
        update_dict["date_of_birth"] = data["date_of_birth"].isoformat()

    # Determine if biomarker values or DOB changed and remarks need refreshing
    biomarkers_changed = (
        ("glucose" in update_dict and update_dict["glucose"] != existing.get("glucose")) or
        ("haemoglobin" in update_dict and update_dict["haemoglobin"] != existing.get("haemoglobin")) or
        ("cholesterol" in update_dict and update_dict["cholesterol"] != existing.get("cholesterol")) or
        ("date_of_birth" in update_dict and update_dict["date_of_birth"] != existing.get("date_of_birth"))
    )

    if "ai_remarks" in data and data["ai_remarks"] is not None:
        update_dict["ai_remarks"] = data["ai_remarks"]
    elif biomarkers_changed:
        # Re-evaluate AI remarks with updated biomarker values
        name = update_dict.get("name", existing.get("name"))
        dob_str = update_dict.get("date_of_birth", existing.get("date_of_birth"))
        dob = date.fromisoformat(dob_str) if isinstance(dob_str, str) else dob_str
        age = calculate_age(dob)
        glucose = float(update_dict.get("glucose", existing.get("glucose")))
        haemoglobin = float(update_dict.get("haemoglobin", existing.get("haemoglobin")))
        cholesterol = float(update_dict.get("cholesterol", existing.get("cholesterol")))

        update_dict["ai_remarks"] = await generate_health_remarks(
            name=name,
            age=age,
            glucose=glucose,
            haemoglobin=haemoglobin,
            cholesterol=cholesterol
        )

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    await col.update_one(id_q, {"$set": update_dict})
    updated_doc = await col.find_one(id_q)
    return PatientResponse.from_doc(updated_doc)

@router.delete("/patients/{patient_id}", status_code=status.HTTP_200_OK)
async def delete_patient(patient_id: str):
    """Deletes a patient record by identifier."""
    col = db_manager.patients_collection
    id_q = get_id_query(patient_id)
    existing = await col.find_one(id_q)
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )

    await col.delete_one(id_q)
    return {
        "success": True,
        "message": f"Patient record for '{existing.get('name')}' successfully deleted.",
        "id": patient_id
    }

@router.post("/patients/{patient_id}/regenerate-remarks", response_model=PatientResponse)
async def regenerate_remarks(patient_id: str):
    """Explicitly triggers Groq AI to re-analyze blood test values and refresh remarks."""
    col = db_manager.patients_collection
    id_q = get_id_query(patient_id)
    doc = await col.find_one(id_q)
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )

    dob_val = doc["date_of_birth"]
    dob = date.fromisoformat(dob_val) if isinstance(dob_val, str) else dob_val
    age = calculate_age(dob)

    new_remarks = await generate_health_remarks(
        name=doc["name"],
        age=age,
        glucose=float(doc["glucose"]),
        haemoglobin=float(doc["haemoglobin"]),
        cholesterol=float(doc["cholesterol"]),
    )

    now = datetime.now(timezone.utc).isoformat()
    await col.update_one(id_q, {"$set": {"ai_remarks": new_remarks, "updated_at": now}})
    updated_doc = await col.find_one(id_q)
    return PatientResponse.from_doc(updated_doc)

@router.post("/patients/seed", status_code=status.HTTP_200_OK)
async def seed_initial_records(reset: bool = Query(True, description="Clear existing records before seeding")):
    """Seeds the database with the exact 10 patient test records for the assessment."""
    col = db_manager.patients_collection
    
    if reset:
        await col.delete_many({})

    inserted_count = 0
    now = datetime.now(timezone.utc).isoformat()

    for item in INITIAL_PATIENT_RECORDS:
        existing = await col.find_one({"email": item["email"].lower()})
        if existing and not reset:
            continue

        dob = date.fromisoformat(item["date_of_birth"])
        age = calculate_age(dob)
        
        remarks = await generate_health_remarks(
            name=item["name"],
            age=age,
            glucose=item["glucose"],
            haemoglobin=item["haemoglobin"],
            cholesterol=item["cholesterol"],
        )

        record = {
            "name": item["name"],
            "date_of_birth": item["date_of_birth"],
            "email": item["email"].lower(),
            "glucose": item["glucose"],
            "haemoglobin": item["haemoglobin"],
            "cholesterol": item["cholesterol"],
            "ai_remarks": remarks,
            "created_at": now,
            "updated_at": now,
        }
        await col.insert_one(record)
        inserted_count += 1

    return {
        "success": True,
        "message": f"Successfully seeded {inserted_count} patient assessment records.",
        "count": inserted_count
    }
