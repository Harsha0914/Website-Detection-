import logging
import os
import re
from typing import Optional, Dict, Any, List
import pymongo
from pymongo import UpdateOne
from app.config import settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[pymongo.MongoClient] = None
_last_mongo_error: Optional[str] = None


def get_mongo_client() -> Optional[pymongo.MongoClient]:
    """
    Returns a cached MongoClient instance.
    Uses MONGODB_URI from settings/environment with connection pooling and timeouts.
    """
    global _mongo_client, _last_mongo_error
    if _mongo_client is not None:
        try:
            # Check if active
            _mongo_client.admin.command("ping")
            return _mongo_client
        except Exception as ping_err:
            _last_mongo_error = f"Ping failed: {ping_err}"
            _mongo_client = None

    uri = os.environ.get("MONGODB_URI") or settings.MONGODB_URI
    if not uri or "mongodb" not in uri:
        _last_mongo_error = "MONGODB_URI is empty or invalid"
        return None

    try:
        kwargs = {
            "serverSelectionTimeoutMS": 4000,
            "connectTimeoutMS": 4000,
            "socketTimeoutMS": 5000,
            "maxPoolSize": 20,
            "minPoolSize": 1,
            "retryWrites": True,
        }
        try:
            import certifi
            kwargs["tlsCAFile"] = certifi.where()
        except Exception:
            pass

        client = pymongo.MongoClient(uri, **kwargs)
        # Test connection
        client.admin.command("ping")
        _mongo_client = client
        _last_mongo_error = None
        logger.info("Successfully established connection to MongoDB Atlas!")
        return _mongo_client
    except Exception as e:
        _last_mongo_error = str(e)
        logger.warning(f"Failed to connect to MongoDB: {e}")
        return None


def get_mongo_db() -> Optional[pymongo.database.Database]:
    """Returns the default MongoDB database."""
    client = get_mongo_client()
    if client is None:
        return None
    db_name = os.environ.get("MONGODB_DB_NAME") or settings.MONGODB_DB_NAME or "shop_presence"
    return client[db_name]


def ping_mongodb() -> bool:
    """Returns True if MongoDB is responsive, False otherwise."""
    try:
        client = get_mongo_client()
        if client:
            res = client.admin.command("ping")
            return bool(res.get("ok"))
    except Exception:
        pass
    return False


def get_mongo_status() -> Dict[str, Any]:
    """Returns detailed status information about the MongoDB connection."""
    global _last_mongo_error
    try:
        client = get_mongo_client()
        if not client:
            return {"connected": False, "error": _last_mongo_error or "Could not establish connection to MongoDB"}
        
        db = get_mongo_db()
        db_name = db.name if db is not None else "unknown"
        collections = db.list_collection_names() if db is not None else []
        
        counts = {}
        if db is not None:
            for col in collections[:5]:
                try:
                    counts[col] = db[col].estimated_document_count()
                except Exception:
                    pass

        return {
            "connected": True,
            "database": db_name,
            "collections": collections,
            "counts": counts,
            "uri_target": settings.MONGODB_URI.split("@")[-1].split("?")[0] if "@" in settings.MONGODB_URI else "configured",
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


def init_mongo_indexes():
    """Ensures necessary MongoDB indexes exist for fast geospatial & search queries."""
    try:
        db = get_mongo_db()
        if db is None:
            return
        
        # 1. Unique place ID index
        db.businesses.create_index([("external_place_id", pymongo.ASCENDING)], unique=True, sparse=True)
        # 2. 2dsphere index for geolocation searches
        db.businesses.create_index([("location", pymongo.GEOSPHERE)])
        # 3. Category & Text indexes
        db.businesses.create_index([("category", pymongo.ASCENDING)])
        db.businesses.create_index([("name", pymongo.TEXT), ("address", pymongo.TEXT)])
        
        # Searches collection index
        db.searches.create_index([("created_at", pymongo.DESCENDING)])
    except Exception as e:
        logger.warning(f"Error creating MongoDB indexes: {e}")


def upsert_business(business_dict: Dict[str, Any]) -> bool:
    """Upserts a single business into the MongoDB businesses collection."""
    try:
        db = get_mongo_db()
        if db is None:
            return False

        doc = dict(business_dict)
        place_id = doc.get("external_place_id") or doc.get("id")
        if not place_id:
            return False

        lat = doc.get("latitude")
        lng = doc.get("longitude")
        if lat is not None and lng is not None:
            try:
                lat_f = float(lat)
                lng_f = float(lng)
                if -90 <= lat_f <= 90 and -180 <= lng_f <= 180:
                    doc["location"] = {
                        "type": "Point",
                        "coordinates": [lng_f, lat_f],
                    }
            except (ValueError, TypeError):
                pass

        db.businesses.update_one(
            {"external_place_id": str(place_id)},
            {"$set": doc},
            upsert=True,
        )
        return True
    except Exception as e:
        logger.warning(f"Error upserting business to MongoDB: {e}")
        return False


def upsert_businesses_batch(businesses: List[Dict[str, Any]]) -> int:
    """Bulk upserts a list of businesses into MongoDB."""
    if not businesses:
        return 0
    try:
        db = get_mongo_db()
        if db is None:
            return 0

        ops = []
        for b in businesses:
            doc = dict(b)
            place_id = doc.get("external_place_id") or doc.get("id")
            if not place_id:
                continue

            lat = doc.get("latitude")
            lng = doc.get("longitude")
            if lat is not None and lng is not None:
                try:
                    lat_f = float(lat)
                    lng_f = float(lng)
                    if -90 <= lat_f <= 90 and -180 <= lng_f <= 180:
                        doc["location"] = {
                            "type": "Point",
                            "coordinates": [lng_f, lat_f],
                        }
                except (ValueError, TypeError):
                    pass

            ops.append(UpdateOne({"external_place_id": str(place_id)}, {"$set": doc}, upsert=True))

        if ops:
            result = db.businesses.bulk_write(ops, ordered=False)
            return (result.upserted_count or 0) + (result.modified_count or 0)
    except Exception as e:
        logger.warning(f"Error bulk upserting businesses to MongoDB: {e}")
    return 0


def find_nearby_businesses(
    latitude: float,
    longitude: float,
    radius_km: float = 2.0,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    limit: int = 150,
) -> List[Dict[str, Any]]:
    """
    Finds businesses from MongoDB within radius_km using geospatial query ($geoWithin / $centerSphere).
    Earth radius is ~6378.1 km.
    """
    try:
        db = get_mongo_db()
        if db is None:
            return []

        # MongoDB $centerSphere uses radians: radius_km / 6378.1
        radius_radians = radius_km / 6378.1
        query: Dict[str, Any] = {
            "location": {
                "$geoWithin": {
                    "$centerSphere": [[longitude, latitude], radius_radians]
                }
            }
        }

        if category and category.strip() and category.strip() not in ("All Categories", "All Shops"):
            query["category"] = {"$regex": re.escape(category.strip()), "$options": "i"}

        if keyword and keyword.strip():
            query["$or"] = [
                {"name": {"$regex": re.escape(keyword.strip()), "$options": "i"}},
                {"address": {"$regex": re.escape(keyword.strip()), "$options": "i"}},
                {"category": {"$regex": re.escape(keyword.strip()), "$options": "i"}},
            ]

        cursor = db.businesses.find(query, {"_id": 0}).limit(limit)
        return list(cursor)
    except Exception as e:
        logger.warning(f"MongoDB geospatial search failed: {e}")
        return []


def upsert_user(user_dict: Dict[str, Any]) -> bool:
    """Upserts a user into the MongoDB users collection."""
    try:
        db = get_mongo_db()
        if db is None:
            return False

        doc = dict(user_dict)
        email = (doc.get("email") or "").lower().strip()
        username = (doc.get("username") or "").lower().strip()
        if not email and not username:
            return False

        # Build filter query
        if email and username:
            filter_query = {"$or": [{"email": email}, {"username": username}]}
        elif email:
            filter_query = {"email": email}
        else:
            filter_query = {"username": username}

        doc["email"] = email
        if username:
            doc["username"] = username

        db.users.update_one(filter_query, {"$set": doc}, upsert=True)
        logger.info(f"User {email or username} successfully synced to MongoDB Atlas users collection!")
        return True
    except Exception as e:
        logger.warning(f"Error upserting user to MongoDB: {e}")
        return False


def find_user_by_email_or_username(identifier: str) -> Optional[Dict[str, Any]]:
    """Finds a user from MongoDB users collection by email or username."""
    try:
        db = get_mongo_db()
        if db is None or not identifier:
            return None

        clean_id = identifier.lower().strip()
        user_doc = db.users.find_one(
            {"$or": [{"email": clean_id}, {"username": clean_id}]},
            {"_id": 0}
        )
        return user_doc
    except Exception as e:
        logger.warning(f"Error finding user in MongoDB: {e}")
        return None
