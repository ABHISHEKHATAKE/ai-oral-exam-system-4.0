from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_oral_exam")

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
exams_collection = db["exams"]
exam_submissions_collection = db["exam_submissions"]
questions_collection = db["questions"]

# Create indexes
users_collection.create_index("email", unique=True)
exams_collection.create_index("teacher_id")
exam_submissions_collection.create_index([("student_id", 1), ("exam_id", 1)])