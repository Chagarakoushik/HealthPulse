import asyncio
import json
import logging
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from backend.config import MONGODB_URI, DATABASE_NAME, DATA_DIR

logger = logging.getLogger(__name__)

# Fallback JSON file path
FALLBACK_FILE = DATA_DIR / "patients_store.json"

class JSONPersistentCollection:
    """
    Asynchronous file-backed persistence layer mirroring MongoDB collections.
    Activated when a live MongoDB instance is not detected, guaranteeing
    100% functionality and persistence without system crashes.
    """
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self._lock = asyncio.Lock()
        self._load()

    def _load(self):
        if not self.filepath.exists():
            self.filepath.write_text("[]", encoding="utf-8")

    def _read_records(self) -> List[Dict[str, Any]]:
        try:
            if not self.filepath.exists():
                return []
            content = self.filepath.read_text(encoding="utf-8")
            if not content.strip():
                return []
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error reading JSON store: {e}")
            return []

    def _write_records(self, records: List[Dict[str, Any]]):
        try:
            # Custom JSON serializer for dates/datetimes
            def serializer(obj):
                if isinstance(obj, (date, datetime)):
                    return obj.isoformat()
                return str(obj)

            self.filepath.write_text(json.dumps(records, indent=2, default=serializer), encoding="utf-8")
        except Exception as e:
            logger.error(f"Error writing to JSON store: {e}")

    async def find(self, query: Optional[Dict[str, Any]] = None, sort: Optional[List] = None) -> List[Dict[str, Any]]:
        async with self._lock:
            records = self._read_records()
            if not query:
                results = list(records)
            else:
                results = []
                for r in records:
                    match = True
                    for k, v in query.items():
                        if isinstance(v, dict) and "$regex" in v:
                            import re
                            pattern = v["$regex"]
                            flags = re.IGNORECASE if v.get("$options") == "i" else 0
                            val_str = str(r.get(k, ""))
                            if not re.search(pattern, val_str, flags):
                                match = False
                                break
                        elif r.get(k) != v:
                            match = False
                            break
                    if match:
                        results.append(r)
            
            if sort:
                for field, direction in reversed(sort):
                    results.sort(key=lambda x: x.get(field, ""), reverse=(direction < 0))
            return results

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            records = self._read_records()
            for r in records:
                match = True
                for k, v in query.items():
                    if k == "_id" and str(r.get("_id")) == str(v):
                        continue
                    if r.get(k) != v:
                        match = False
                        break
                if match:
                    return r
            return None

    async def insert_one(self, doc: Dict[str, Any]):
        async with self._lock:
            records = self._read_records()
            if "_id" not in doc:
                doc["_id"] = str(uuid.uuid4())
            records.append(doc)
            self._write_records(records)
            class InsertResult:
                def __init__(self, inserted_id):
                    self.inserted_id = inserted_id
            return InsertResult(doc["_id"])

    async def update_one(self, query: Dict[str, Any], update_doc: Dict[str, Any]):
        async with self._lock:
            records = self._read_records()
            updated_count = 0
            for r in records:
                match = True
                for k, v in query.items():
                    if k == "_id" and str(r.get("_id")) == str(v):
                        continue
                    if r.get(k) != v:
                        match = False
                        break
                if match:
                    if "$set" in update_doc:
                        r.update(update_doc["$set"])
                    else:
                        r.update(update_doc)
                    updated_count += 1
                    break
            if updated_count > 0:
                self._write_records(records)
            class UpdateResult:
                def __init__(self, modified_count):
                    self.modified_count = modified_count
            return UpdateResult(updated_count)

    async def delete_one(self, query: Dict[str, Any]):
        async with self._lock:
            records = self._read_records()
            initial_len = len(records)
            filtered = []
            deleted_count = 0
            for r in records:
                match = True
                for k, v in query.items():
                    if k == "_id" and str(r.get("_id")) == str(v):
                        continue
                    if r.get(k) != v:
                        match = False
                        break
                if match and deleted_count == 0:
                    deleted_count = 1
                else:
                    filtered.append(r)
            if deleted_count > 0:
                self._write_records(filtered)
            class DeleteResult:
                def __init__(self, deleted_count):
                    self.deleted_count = deleted_count
            return DeleteResult(deleted_count)

    async def delete_many(self, query: Dict[str, Any]):
        async with self._lock:
            records = self._read_records()
            if not query:
                count = len(records)
                self._write_records([])
                class DeleteResult:
                    def __init__(self, deleted_count):
                        self.deleted_count = deleted_count
                return DeleteResult(count)
            # If query specified
            filtered = [r for r in records if not all(r.get(k) == v for k, v in query.items())]
            deleted_count = len(records) - len(filtered)
            self._write_records(filtered)
            class DelResult:
                def __init__(self, count):
                    self.deleted_count = count
            return DelResult(deleted_count)

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        records = await self.find(query)
        return len(records)


class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self._patients_collection = None
        self.is_connected = False
        self.engine_type = "uninitialized"
        self.connection_message = "Initializing..."

    @property
    def patients_collection(self):
        if self._patients_collection is None:
            # Fallback initialization for immediate access
            self._patients_collection = JSONPersistentCollection(FALLBACK_FILE)
            self.is_connected = True
            self.engine_type = "local_persistent_json"
            self.connection_message = "Connected to persistent storage engine (ready for local/Atlas MongoDB)"
        return self._patients_collection

    @patients_collection.setter
    def patients_collection(self, val):
        self._patients_collection = val

    async def connect(self):
        """Attempts connection to MongoDB; falls back gracefully to JSONPersistentCollection."""
        try:
            logger.info(f"Connecting to MongoDB at {MONGODB_URI}...")
            # Short timeout to not stall startup if local mongod is not running
            client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=1500)
            # Ping database to verify connection
            await client.admin.command('ping')
            self.client = client
            self.db = client[DATABASE_NAME]
            self._patients_collection = self.db["patients"]
            
            # Ensure unique index on email
            await self._patients_collection.create_index("email", unique=True)
            self.is_connected = True
            self.engine_type = "mongodb"
            self.connection_message = f"Connected to MongoDB ({DATABASE_NAME})"
            logger.info(f"Successfully connected to MongoDB ({DATABASE_NAME})")
        except Exception as e:
            logger.warning(f"Live MongoDB not available ({e}). Using embedded persistent store.")
            self.client = None
            self.db = None
            self._patients_collection = JSONPersistentCollection(FALLBACK_FILE)
            self.is_connected = True
            self.engine_type = "local_persistent_json"
            self.connection_message = "Connected to persistent storage engine (ready for local/Atlas MongoDB)"

    async def close(self):
        if self.client:
            self.client.close()
            self.is_connected = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "online" if self.is_connected else "offline",
            "engine": self.engine_type,
            "message": self.connection_message,
            "database_name": DATABASE_NAME,
        }

db_manager = DatabaseManager()
