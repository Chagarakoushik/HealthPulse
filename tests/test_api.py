import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "database" in data
    assert "ai_engine" in data

def test_seed_and_list_patients():
    # Seed 10 records
    seed_res = client.post("/api/patients/seed?reset=true")
    assert seed_res.status_code == 200
    assert seed_res.json()["count"] == 10

    # List records
    list_res = client.get("/api/patients")
    assert list_res.status_code == 200
    records = list_res.json()
    assert len(records) == 10

    # Verify first patient has calculated fields
    p1 = records[0]
    assert "id" in p1
    assert "age" in p1
    assert "glucose_info" in p1
    assert "haemoglobin_info" in p1
    assert "cholesterol_info" in p1
    assert "overall_risk" in p1
    assert p1["ai_remarks"] is not None

def test_validation_future_dob():
    payload = {
        "name": "Aakash Verma",
        "date_of_birth": "2099-01-01",
        "email": "aakash.verma@example.com",
        "glucose": 95.0,
        "haemoglobin": 14.0,
        "cholesterol": 180.0
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == 422
    assert "future" in str(res.json()).lower()

def test_validation_invalid_email():
    payload = {
        "name": "Manish Gupta",
        "date_of_birth": "1990-01-01",
        "email": "not-an-email",
        "glucose": 95.0,
        "haemoglobin": 14.0,
        "cholesterol": 180.0
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == 422

def test_validation_negative_blood_metrics():
    payload = {
        "name": "Siddharth Sen",
        "date_of_birth": "1990-01-01",
        "email": "siddharth.sen@example.com",
        "glucose": -10.0,
        "haemoglobin": 14.0,
        "cholesterol": 180.0
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == 422

def test_duplicate_email_conflict():
    payload = {
        "name": "Pooja Reddy",
        "date_of_birth": "1992-05-10",
        "email": "pooja.reddy@example.com",
        "glucose": 90.0,
        "haemoglobin": 13.5,
        "cholesterol": 170.0
    }
    res1 = client.post("/api/patients", json=payload)
    assert res1.status_code == 201

    # Attempting to insert same email
    res2 = client.post("/api/patients", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()

def test_crud_lifecycle():
    # 1. Create
    create_payload = {
        "name": "Sunita Rao",
        "date_of_birth": "1984-07-15",
        "email": "sunita.rao@example.com",
        "glucose": 135.0,
        "haemoglobin": 11.2,
        "cholesterol": 245.0
    }
    create_res = client.post("/api/patients", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    patient_id = created_data["id"]
    assert created_data["name"] == "Sunita Rao"

    # 2. Read
    get_res = client.get(f"/api/patients/{patient_id}")
    assert get_res.status_code == 200
    assert get_res.json()["email"] == "sunita.rao@example.com"

    # 3. Update
    update_res = client.put(f"/api/patients/{patient_id}", json={"glucose": 95.0})
    assert update_res.status_code == 200
    assert update_res.json()["glucose"] == 95.0

    # 4. Delete
    delete_res = client.delete(f"/api/patients/{patient_id}")
    assert delete_res.status_code == 200

    # 5. Verify deletion
    verify_res = client.get(f"/api/patients/{patient_id}")
    assert verify_res.status_code == 404

if __name__ == "__main__":
    test_health_endpoint()
    test_seed_and_list_patients()
    test_validation_future_dob()
    test_validation_invalid_email()
    test_validation_negative_blood_metrics()
    test_duplicate_email_conflict()
    test_crud_lifecycle()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY! (7/7)")
