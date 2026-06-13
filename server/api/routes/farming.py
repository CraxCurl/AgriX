from fastapi import APIRouter, File, UploadFile, Depends
from typing import List
import random

router = APIRouter()

@router.post("/disease-detection")
async def detect_disease(file: UploadFile = File(...)):
    # Simulate ML model processing an image
    diseases = ["Healthy", "Leaf Rust", "Blight", "Powdery Mildew"]
    detected = random.choice(diseases)
    confidence = round(random.uniform(75.0, 99.9), 1)
    
    return {
        "filename": file.filename,
        "disease": detected,
        "confidence": confidence,
        "recommendation": "Use recommended fungicide." if detected != "Healthy" else "Crop looks great!"
    }

@router.get("/price-prediction")
async def get_price_prediction(crop: str):
    # Simulate price prediction model for Indian context
    base_price = random.uniform(2200, 2800)
    return {
        "crop": crop,
        "current_price_per_quintal": round(base_price, 2),
        "predicted_price_next_month": round(base_price * random.uniform(0.9, 1.2), 2),
        "advice": "Hold" if random.choice([True, False]) else "Sell Now"
    }

@router.get("/irrigation-recommendation")
async def get_irrigation(location: str):
    # Simulate weather-based irrigation advice
    return {
        "location": location,
        "forecast": "Light rain expected in 2 days.",
        "soil_moisture_estimate": "45%",
        "recommendation": "Delay watering until after the rain."
    }
