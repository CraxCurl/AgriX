from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from pydantic import BaseModel
import os
import json
import base64
import random
from dotenv import load_dotenv

import google.generativeai as genai_v1
from google import genai as genai_v2
from groq import AsyncGroq

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

class WeatherPestRequest(BaseModel):
    temperature: float
    humidity: float
    location: str = ""
    crop: str

class RoutineScoutRequest(BaseModel):
    crop: str
    temperature: float
    humidity: float

class CropRecommendationRequest(BaseModel):
    temperature: float
    humidity: float
    location: str = ""
    current_crops: str

@router.post("/crop-recommendation")
async def get_crop_recommendation(request: CropRecommendationRequest):
    """
    Analyzes location, weather, and previous crops to recommend the best next crop to plant.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    client = AsyncGroq(api_key=groq_key)
    
    prompt = f"Given the current location ({request.location}) with weather conditions (Temperature: {request.temperature}°C, Humidity: {request.humidity}%), and knowing the farmer currently or previously planted: {request.current_crops}, what is the best crop to plant next? Consider crop rotation best practices, local climate, and soil health. Keep your recommendation highly actionable, clear, and under 5 sentences."
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"recommendation": response.choices[0].message.content.strip()}
    except Exception as e:
        print(f"Crop recommendation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch AI crop recommendation.")

@router.post("/weather-pest-forecast")
async def weather_pest_forecast(request: WeatherPestRequest):
    """
    Analyzes weather data to predict pests and provide recommended actions.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    client = AsyncGroq(api_key=groq_key)
    
    prompt = f"Given the current weather conditions (Temperature: {request.temperature}°C, Humidity: {request.humidity}%, Location: {request.location}) and the farmed crop ({request.crop}), predict the most likely agricultural pests that could arrive or spread under these specific conditions. Merge your pest prediction with specific, actionable recommended steps the farmer should take right now. Keep your response clear, direct, and under 4 sentences."
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"analysis": response.choices[0].message.content.strip()}
    except Exception as e:
        print(f"Weather pest forecast error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch AI pest forecast.")

@router.post("/routine-scout")
async def routine_scout_checklist(request: RoutineScoutRequest):
    """
    Generates a 4-6 item field inspection checklist based on crop and weather.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    client = AsyncGroq(api_key=groq_key)
    
    prompt = f"You are an agricultural AI. Generate a field inspection checklist of 4-6 simple, highly practical tasks for a farmer growing {request.crop} in {request.temperature}°C and {request.humidity}% humidity. Return ONLY a valid JSON object with a single key 'items' containing an array of strings. Example: {{\"items\": [\"Check leaves for spots\", \"Inspect stems for holes\"]}}"
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        text = response.choices[0].message.content.strip()
        
        data = json.loads(text)
        return {"items": data.get("items", [])}
    except Exception as e:
        print(f"Routine scout error: {e}")
        # Fallback to standard checklist if AI fails
        return {"items": [
            "Check leaves for spots or discoloration",
            "Look for insect eggs under leaves",
            "Inspect stems for holes",
            "Check soil moisture",
            "Verify irrigation status"
        ]}

@router.post("/analyze")
async def analyze_farmer_text(request: AnalyzeRequest):
    """
    Analyzes the text of what the farmer does using the Analyze API key.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    client = AsyncGroq(api_key=groq_key)
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": f"Analyze the following farmer activity and provide insights or advice: {request.text}"}]
        )
        return {"analysis": response.choices[0].message.content}
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

@router.post("/pest-scan")
async def scan_pest(file: UploadFile = File(...)):
    """
    Scans an uploaded image specifically for agricultural pests.
    """
    pest_key = os.environ.get("GEMINI_API_KEY_PEST")
    if not pest_key:
        raise HTTPException(status_code=500, detail="Pest API key not configured")
        
    client = genai_v2.Client(api_key=pest_key)
    image_bytes = await file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": "Analyze this crop image. Is there any pest visible? If yes, identify it and provide a one sentence recommendation. If no pest is visible, reply exactly with 'NO PESTS DETECTED. Crop appears clean.'"
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
        return {"result": response.text.strip()}
    except Exception as e:
        print(f"Pest scan error: {e}")
        return {"result": "Pest analysis failed. Please try again."}
        
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

class PestAnalysisRequest(BaseModel):
    location: str
    temperature: float
    humidity: float
    crops: list[str]

@router.post("/pest-analysis")
async def analyze_pest_risk(request: PestAnalysisRequest):
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    client = AsyncGroq(api_key=groq_key)
    
    crops_str = ", ".join(request.crops) if request.crops else "crops"
    prompt = f"""
    You are an expert agricultural pest management specialist.
    A farmer is growing {crops_str} in {request.location}.
    The current weather is {request.temperature}°C with {request.humidity}% humidity.
    Based on these conditions, provide a short, 2-3 sentence AI analysis on the most likely pest risks for these crops and recommend immediate scouting or preventative actions.
    Keep it concise, practical, and highly specific to the location and weather provided.
    """
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        return {"analysis": response.choices[0].message.content.strip()}
    except Exception as e:
        print(f"Error generating pest analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI pest analysis.")

async def generate_market_data(crop: str, location: str = None, language: str = 'en'):
    api_key = os.environ.get("GEMINI_API_KEY_SCAN") or os.environ.get("GEMINI_API_KEY_PEST") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
    client = genai_v2.Client(api_key=api_key)
    location_text = f"specifically for {location}" if location else "in India"
    
    # Step 1: Fetch ground truth from Google Search
    try:
        search_prompt = f"Search Google to find the CURRENT actual market price (mandi rate) of {crop} per quintal in INR {location_text}. Also find the price trend over the last 6 months. Be highly specific with numbers."
        search_resp = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=search_prompt,
            config={'tools': [{'google_search': {}}]}
        )
        ground_truth = search_resp.text
    except Exception as e:
        print("Search Grounding failed:", e)
        ground_truth = "Use realistic estimated Indian mandi prices based on seasonal trends."

    # Step 2: Format as JSON
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
    Based on the following actual real-world market data:
    {ground_truth}
    
    Provide the current market price per quintal in INR for {crop} {location_text}.
    Also predict the price for next month based on typical seasonal trends and the provided data.
    Give a system advice as either "Hold" or "Sell Now" based on the trend.
    Additionally, provide historical price data for the past 6 months matching the real data.
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
        {{"month": "Mar", "price": 2300}},
        {{"month": "Apr", "price": 2350}},
        {{"month": "May", "price": 2500}},
        {{"month": "Jun", "price": 2550}}
      ]
    }}
    
    (Note: to ensure freshness, please provide a slightly varied explanation each time. Current timestamp: {__import__('time').time()})
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        )
        
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
            
        import json
        data = json.loads(result_text)
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
        # Fallback to realistic varied values if AI fails
        import hashlib
        
        # Create a deterministic but varied price based on crop name
        hash_val = int(hashlib.md5(crop.encode()).hexdigest()[:4], 16)
        base_price = 1000 + (hash_val % 4000) # Prices between 1000 and 5000
        
        predicted = base_price + ((hash_val % 300) - 100) # -100 to +200 change
        advice = "Sell Now" if predicted < base_price else "Hold"
        
        return {
            "crop": crop,
            "current_price_per_quintal": float(base_price),
            "predicted_price_next_month": float(predicted),
            "advice": advice,
            "graph_explanation": "Real-time AI analysis unavailable due to API rate limits. Showing estimated fallback data.",
            "historical_data": [
                {"month": "M-6", "price": base_price - 100 + (hash_val % 50)},
                {"month": "M-5", "price": base_price - 50 + (hash_val % 80)},
                {"month": "M-4", "price": base_price + 20 - (hash_val % 60)},
                {"month": "M-3", "price": base_price - 10 + (hash_val % 100)},
                {"month": "M-2", "price": base_price + 80 - (hash_val % 40)},
                {"month": "M-1", "price": base_price}
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
