import os
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
import google.generativeai as genai
import json

from core.database import get_db
from core.dependencies import get_current_user

router = APIRouter()

class TextDescriptionRequest(BaseModel):
    description: str
    language: str = None

class RefreshMarketDataRequest(BaseModel):
    language: str = None

async def process_description_with_gemini(description_text: str):
    analyze_key = os.environ.get("GEMINI_API_KEY_ANALYZE")
    if not analyze_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    genai.configure(api_key=analyze_key)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    prompt = """
    Extract the following details from the farmer's description:
    1. The size of the land (e.g., '5 acres', '2 hectares'). Return an empty string if not mentioned.
    2. A list of crops they are growing (e.g., ['Wheat', 'Sugarcane']). Return an empty list if none.
    3. The summarized description text.
    
    Respond STRICTLY with a JSON object in this format:
    {
        "land_size": "...",
        "crops": ["..."],
        "description": "..."
    }
    """
    
    try:
        response = await model.generate_content_async([prompt, description_text])
        
        # Parse JSON from response
        # Gemini might wrap json in markdown block
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        data = json.loads(text)
        return data
    except Exception as e:
        import traceback
        print(f"Gemini processing error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process description with AI: {str(e)}")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = {
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "language": current_user.get("language"),
        "farm_description": current_user.get("farm_description"),
        "land_size": current_user.get("land_size"),
        "crops": current_user.get("crops", []),
        "marketData": current_user.get("marketData", None)
    }
    return user_data

from .farming import generate_market_data
from datetime import datetime

@router.post("/farm-description/text")
async def update_farm_description_text(
    request: TextDescriptionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    extracted_data = await process_description_with_gemini(description_text=request.description)
    
    crops = extracted_data.get("crops", [])
    if not crops:
        crops = ["Wheat"]
    
    req_lang = request.language or current_user.get("language") or "en"
    
    import asyncio
    tasks = [generate_market_data(crop=c, location=None, language=req_lang) for c in crops]
    market_data_list = list(await asyncio.gather(*tasks))
    for md in market_data_list:
        md["lastFetched"] = datetime.utcnow().isoformat()
    
    # Update user in DB
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {
            "farm_description": extracted_data.get("description", request.description),
            "land_size": extracted_data.get("land_size", ""),
            "crops": crops,
            "marketData": market_data_list,
            "language": req_lang
        }}
    )
    
    return {"message": "Description updated successfully", "data": extracted_data}

@router.post("/refresh-market-data")
async def refresh_market_data(
    request: RefreshMarketDataRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    crops = current_user.get("crops", [])
    if not crops:
        crops = ["Wheat"]
        
    req_lang = request.language or current_user.get("language") or "en"
    
    import asyncio
    tasks = [generate_market_data(crop=c, location=None, language=req_lang) for c in crops]
    market_data_list = list(await asyncio.gather(*tasks))
    
    for md in market_data_list:
        md["lastFetched"] = datetime.utcnow().isoformat()
        
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {
            "marketData": market_data_list,
            "language": req_lang
        }}
    )
    
    return {"message": "Market data refreshed successfully", "marketData": market_data_list}
