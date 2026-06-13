from dotenv import load_dotenv
load_dotenv()

import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/agrix")

client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_default_database()

def get_db():
    return db
