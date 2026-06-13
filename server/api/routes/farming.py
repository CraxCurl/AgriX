from fastapi import APIRouter, File, UploadFile
from google import genai
import base64
import os
import random

router = APIRouter()


def _get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your server/.env file.")
    return genai.Client(api_key=api_key)


@router.post("/disease-detection")
async def detect_disease(file: UploadFile = File(...)):
    try:
        client = _get_client()
        image_bytes = await file.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": """Analyze this image carefully.

Rules:
1. If this is NOT a crop/plant/agriculture image, return exactly: INVALID_IMAGE
2. If the crop is healthy, return exactly: HEALTHY
3. If a disease is detected, return ONLY the disease name.

Examples: HEALTHY | Tomato Early Blight | Leaf Rust | Powdery Mildew | INVALID_IMAGE"""
                        },
                        {
                            "inline_data": {
                                "mime_type": file.content_type,
                                "data": image_b64
                            }
                        }
                    ]
                }
            ]
        )

        disease_name = response.text.strip()

        if disease_name == "INVALID_IMAGE":
            return {
                "disease": "INVALID IMAGE",
                "confidence": 0,
                "recommendation": "Please upload a crop or plant image."
            }

        if disease_name == "HEALTHY":
            return {
                "disease": "HEALTHY",
                "confidence": 100,
                "recommendation": "No disease detected. Crop appears healthy."
            }

        return {
            "disease": disease_name.upper(),
            "confidence": 95,
            "recommendation": f"Disease detected: {disease_name}"
        }

    except RuntimeError as e:
        return {
            "disease": "CONFIG ERROR",
            "confidence": 0,
            "recommendation": str(e)
        }
    except Exception as e:
        msg = str(e)
        print(f"[disease-detection ERROR] {type(e).__name__}: {msg}")
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            return {
                "disease": "RATE LIMITED",
                "confidence": 0,
                "recommendation": "Too many requests. Please wait a moment and try again."
            }
        return {
            "disease": "ERROR",
            "confidence": 0,
            "recommendation": "Analysis failed. Please try again."
        }
@router.get("/price-prediction")
async def get_price_prediction(crop: str):
    base_price = random.uniform(100, 500)

    return {
        "crop": crop,
        "current_price_per_quintal": round(base_price, 2),
        "predicted_price_next_month": round(
            base_price * random.uniform(0.9, 1.2), 2
        ),
        "advice": "Hold" if random.choice([True, False]) else "Sell Now"
    }


@router.get("/irrigation-recommendation")
async def get_irrigation(location: str):
    return {
        "location": location,
        "forecast": "Light rain expected in 2 days.",
        "soil_moisture_estimate": "45%",
        "recommendation": "Delay watering until after the rain."
    }
