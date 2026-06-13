from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from pydantic import BaseModel
import os
import json
import base64
import random
from dotenv import load_dotenv

import google.generativeai as genai_v1
from google import genai as genai_v2

load_dotenv()


router = APIRouter()

# ----------------- Upstream detect_disease -----------------
def _get_client():
    api_key = os.getenv("GEMINI_API_KEY_ANALYZE") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    return genai_v2.Client(api_key=api_key)

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

# ----------------- Stashed changes -----------------
class AnalyzeRequest(BaseModel):
    text: str

@router.post("/analyze")
async def analyze_farmer_text(request: AnalyzeRequest):
    """
    Analyzes the text of what the farmer does using the Analyze API key.
    """
    analyze_key = os.environ.get("GEMINI_API_KEY_ANALYZE")
    if not analyze_key:
        raise HTTPException(status_code=500, detail="Analyze API key not configured")
    
    # Configure with the Analyze key
    genai_v1.configure(api_key=analyze_key)
    model = genai_v1.GenerativeModel('gemini-flash-latest')
    
    try:
        response = model.generate_content(
            f"Analyze the following farmer activity and provide insights or advice: {request.text}"
        )
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scan")
async def scan_disease(file: UploadFile = File(...)):
    """
    Scans an uploaded image for plant diseases using the Scan API key.
    """
    scan_key = os.environ.get("GEMINI_API_KEY_SCAN")
    if not scan_key:
        raise HTTPException(status_code=500, detail="Scan API key not configured")
        
    # Configure with the Scan key
    genai_v1.configure(api_key=scan_key)
    model = genai_v1.GenerativeModel('gemini-flash-latest')
    
    try:
        # Read the file content
        contents = await file.read()
        
        # Prepare the image part for Gemini
        image_part = {
            "mime_type": file.content_type,
            "data": contents
        }
        
        prompt = "Analyze this plant image and tell me if there are any diseases. If there is a disease, what is it and what is the recommendation?"
        response = model.generate_content([prompt, image_part])
        
        return {
            "filename": file.filename,
            "disease_analysis": response.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_market_data(crop: str, location: str = None, language: str = 'en'):
    analyze_key = os.environ.get("GEMINI_API_KEY_ANALYZE")
    if not analyze_key:
        raise HTTPException(status_code=500, detail="Analyze API key not configured")
        
    genai_v1.configure(api_key=analyze_key)
    model = genai_v1.GenerativeModel('gemini-flash-latest', generation_config={"response_mime_type": "application/json"})
    
    location_text = f"specifically for {location}" if location else "in India"
    
    lang_map = {
        'hi': 'Hindi',
        'mr': 'Marathi',
        'pa': 'Punjabi',
        'te': 'Telugu',
        'ta': 'Tamil',
        'en': 'English'
    }
    lang_name = lang_map.get(language[:2] if language else 'en', 'English')
    
    prompt = f"""
    You are an expert agricultural economist in India.
    Provide a highly realistic current market price per quintal in INR for {crop} {location_text}.
    Also predict the price for next month based on typical seasonal trends.
    Give a system advice as either "Hold" or "Sell Now" based on the trend.
    Additionally, provide realistic historical price data for the past 6 months.
    Provide a 2-3 sentence 'graph_explanation' explaining this historical trend data. 
    CRITICAL: This 'graph_explanation' MUST be written entirely in {lang_name}.
    Respond ONLY with a valid JSON object in the exact format below:
    {{
      "crop": "{crop}",
      "current_price_per_quintal": 2500.50,
      "predicted_price_next_month": 2650.00,
      "advice": "Hold",
      "graph_explanation": "YOUR {lang_name} EXPLANATION HERE",
      "historical_data": [
        {{"month": "Jan", "price": 2400}},
        {{"month": "Feb", "price": 2450}},
        {{"month": "Mar", "price": 2420}},
        {{"month": "Apr", "price": 2480}},
        {{"month": "May", "price": 2500}},
        {{"month": "Jun", "price": 2500}}
      ]
    }}
    """
    
    try:
        response = await model.generate_content_async(prompt)
        data = json.loads(response.text)
        return {
            "crop": crop,
            "current_price_per_quintal": round(float(data.get("current_price_per_quintal", 2400.0)), 2),
            "predicted_price_next_month": round(float(data.get("predicted_price_next_month", 2500.0)), 2),
            "advice": data.get("advice", "Hold"),
            "graph_explanation": data.get("graph_explanation", ""),
            "historical_data": data.get("historical_data", [])
        }
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        # Fallback to realistic values if AI fails
        return {
            "crop": crop,
            "current_price_per_quintal": 2400.00,
            "predicted_price_next_month": 2550.00,
            "advice": "Hold",
            "graph_explanation": "Could not generate explanation.",
            "historical_data": [
                {"month": "M-6", "price": 2300},
                {"month": "M-5", "price": 2350},
                {"month": "M-4", "price": 2320},
                {"month": "M-3", "price": 2400},
                {"month": "M-2", "price": 2450},
                {"month": "M-1", "price": 2400}
            ]
        }

@router.get("/price-prediction")
async def get_price_prediction(crop: str, location: str = None, language: str = 'en'):
    return await generate_market_data(crop, location, language)

@router.get("/irrigation-recommendation")
async def get_irrigation(location: str):
    # Keep the existing mock for irrigation
    return {
        "location": location,
        "forecast": "Light rain expected in 2 days.",
        "soil_moisture_estimate": "45%",
        "recommendation": "Delay watering until after the rain."
    }
