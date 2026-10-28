from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator
import re

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def get_glucose_status(val: float) -> Dict[str, str]:
    if val < 70:
        return {"level": "Low", "badge": "warning", "message": "Below normal fasting range (<70 mg/dL). Risk of hypoglycemia."}
    elif val <= 99:
        return {"level": "Normal", "badge": "success", "message": "Optimal fasting glucose level (70-99 mg/dL)."}
    elif val <= 125:
        return {"level": "Prediabetes", "badge": "warning", "message": "Elevated fasting glucose (100-125 mg/dL). Diet and lifestyle review suggested."}
    else:
        return {"level": "High", "badge": "danger", "message": "Elevated fasting glucose (≥126 mg/dL). Diagnostic evaluation for diabetes recommended."}

def get_haemoglobin_status(val: float) -> Dict[str, str]:
    if val < 12.0:
        return {"level": "Low", "badge": "warning" if val >= 10.0 else "danger", "message": "Below standard range (<12.0 g/dL). Indicates potential anemia or iron deficiency."}
    elif val <= 17.5:
        return {"level": "Normal", "badge": "success", "message": "Healthy haemoglobin range (12.0-17.5 g/dL)."}
    else:
        return {"level": "High", "badge": "warning", "message": "Above standard range (>17.5 g/dL). Possible polycythemia or dehydration."}

def get_cholesterol_status(val: float) -> Dict[str, str]:
    if val < 200:
        return {"level": "Desirable", "badge": "success", "message": "Optimal total cholesterol (<200 mg/dL)."}
    elif val <= 239:
        return {"level": "Borderline", "badge": "warning", "message": "Borderline elevated cholesterol (200-239 mg/dL). Heart-healthy diet recommended."}
    else:
        return {"level": "High", "badge": "danger", "message": "Elevated total cholesterol (≥240 mg/dL). Cardiovascular risk assessment indicated."}

def get_overall_risk(glucose: float, haemoglobin: float, cholesterol: float) -> Dict[str, str]:
    is_high = (
        glucose >= 126 or
        glucose < 60 or
        cholesterol >= 240 or
        haemoglobin < 10.0 or
        haemoglobin > 18.0
    )
    is_moderate = (
        (100 <= glucose <= 125) or
        (60 <= glucose < 70) or
        (200 <= cholesterol <= 239) or
        (10.0 <= haemoglobin < 12.0) or
        (haemoglobin > 17.5)
    )

    if is_high:
        return {"status": "High Risk", "color": "rose", "badge": "danger"}
    elif is_moderate:
        return {"status": "Moderate Risk", "color": "amber", "badge": "warning"}
    else:
        return {"status": "Normal", "color": "emerald", "badge": "success"}


class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the patient")
    date_of_birth: date = Field(..., description="Date of birth in YYYY-MM-DD format")
    email: str = Field(..., description="Valid email address")
    glucose: float = Field(..., gt=0, le=1000, description="Fasting blood glucose in mg/dL")
    haemoglobin: float = Field(..., gt=0, le=30, description="Haemoglobin level in g/dL")
    cholesterol: float = Field(..., gt=0, le=1000, description="Total cholesterol level in mg/dL")
    ai_remarks: Optional[str] = Field(None, description="Groq AI clinical evaluation remarks")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Patient name must contain at least 2 non-whitespace characters.")
        # Ensure it contains alphabetic characters
        if not re.search(r"[a-zA-Z]", cleaned):
            raise ValueError("Patient name must contain letters.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not re.match(EMAIL_REGEX, cleaned):
            raise ValueError(f"'{v}' is not a valid email address.")
        return cleaned

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        today = date.today()
        if v > today:
            raise ValueError(f"Date of birth cannot be in the future (given: {v}, today: {today}).")
        if v.year < 1900:
            raise ValueError("Date of birth must be after the year 1900.")
        return v

    @field_validator("glucose")
    @classmethod
    def validate_glucose(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Glucose level must be a positive number greater than 0.")
        if v > 1000:
            raise ValueError("Glucose level exceeds physiological maximum limit (1000 mg/dL).")
        return round(float(v), 2)

    @field_validator("haemoglobin")
    @classmethod
    def validate_haemoglobin(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Haemoglobin level must be a positive number greater than 0.")
        if v > 30:
            raise ValueError("Haemoglobin level exceeds physiological limit (30 g/dL).")
        return round(float(v), 2)

    @field_validator("cholesterol")
    @classmethod
    def validate_cholesterol(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Cholesterol level must be a positive number greater than 0.")
        if v > 1000:
            raise ValueError("Cholesterol level exceeds maximum threshold (1000 mg/dL).")
        return round(float(v), 2)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    email: Optional[str] = None
    glucose: Optional[float] = Field(None, gt=0, le=1000)
    haemoglobin: Optional[float] = Field(None, gt=0, le=30)
    cholesterol: Optional[float] = Field(None, gt=0, le=1000)
    ai_remarks: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Patient name must contain at least 2 non-whitespace characters.")
        if not re.search(r"[a-zA-Z]", cleaned):
            raise ValueError("Patient name must contain letters.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().lower()
        if not re.match(EMAIL_REGEX, cleaned):
            raise ValueError(f"'{v}' is not a valid email address.")
        return cleaned

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        today = date.today()
        if v > today:
            raise ValueError(f"Date of birth cannot be in the future (given: {v}, today: {today}).")
        if v.year < 1900:
            raise ValueError("Date of birth must be after the year 1900.")
        return v


class PatientResponse(PatientBase):
    id: str
    age: int = 0
    glucose_info: Dict[str, str] = {}
    haemoglobin_info: Dict[str, str] = {}
    cholesterol_info: Dict[str, str] = {}
    overall_risk: Dict[str, str] = {}
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_doc(cls, doc: Dict[str, Any]) -> "PatientResponse":
        dob = doc["date_of_birth"]
        if isinstance(dob, str):
            dob = date.fromisoformat(dob)
        
        age = calculate_age(dob)
        glucose = float(doc["glucose"])
        haemoglobin = float(doc["haemoglobin"])
        cholesterol = float(doc["cholesterol"])

        created = doc.get("created_at")
        if isinstance(created, str):
            created = datetime.fromisoformat(created)
        elif not created:
            created = datetime.utcnow()

        updated = doc.get("updated_at")
        if isinstance(updated, str):
            updated = datetime.fromisoformat(updated)
        elif not updated:
            updated = created

        return cls(
            id=str(doc.get("_id") or doc.get("id")),
            name=doc["name"],
            date_of_birth=dob,
            email=doc["email"],
            glucose=glucose,
            haemoglobin=haemoglobin,
            cholesterol=cholesterol,
            ai_remarks=doc.get("ai_remarks"),
            age=age,
            glucose_info=get_glucose_status(glucose),
            haemoglobin_info=get_haemoglobin_status(haemoglobin),
            cholesterol_info=get_cholesterol_status(cholesterol),
            overall_risk=get_overall_risk(glucose, haemoglobin, cholesterol),
            created_at=created,
            updated_at=updated,
        )


class PatientStats(BaseModel):
    total_patients: int
    normal_count: int
    moderate_count: int
    high_risk_count: int
    avg_glucose: float
    avg_haemoglobin: float
    avg_cholesterol: float
