import os
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
import google.generativeai as genai
import json
from groq import AsyncGroq

from core.database import get_db
from core.dependencies import get_current_user

router = APIRouter()

class TextDescriptionRequest(BaseModel):
    description: str
    language: str = None

class RefreshMarketDataRequest(BaseModel):
    language: str = None

class UserSettingsRequest(BaseModel):
    name: str = None
    language: str = None
    land_size: str = None
    primary_crop: str = None
    dark_mode: bool = None

from typing import List

class ChecklistItem(BaseModel):
    task: str
    done: bool

class RoutineChecklistUpdate(BaseModel):
    checklist: List[ChecklistItem]

async def process_description_with_groq(description_text: str):
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Groq API Key not configured")
    
    client = AsyncGroq(api_key=groq_key)
    
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
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": description_text}
            ],
            response_format={"type": "json_object"}
        )
        
        text = response.choices[0].message.content.strip()
        data = json.loads(text)
        return data
    except Exception as e:
        import traceback
        print(f"Groq processing error: {e}")
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
        "marketData": current_user.get("marketData", None),
        "dark_mode": current_user.get("dark_mode", False),
        "routine_checklist": current_user.get("routine_checklist", None)
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
    extracted_data = await process_description_with_groq(description_text=request.description)
    
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

@router.post("/settings")
async def update_settings(
    request: UserSettingsRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    updates = {}
    if request.name is not None:
        updates["name"] = request.name
    if request.language is not None:
        updates["language"] = request.language
    if request.land_size is not None:
        updates["land_size"] = request.land_size
    if request.dark_mode is not None:
        updates["dark_mode"] = request.dark_mode
        
    if request.primary_crop is not None:
        # We ensure primary crop is in crops list
        crops = current_user.get("crops", [])
        if request.primary_crop not in crops:
            crops.insert(0, request.primary_crop)
            updates["crops"] = crops

    if updates:
        await db["users"].update_one(
            {"email": current_user["email"]},
            {"$set": updates}
        )
    return {"message": "Settings updated successfully"}

@router.put("/routine-checklist")
async def update_routine_checklist(
    request: RoutineChecklistUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    checklist_dicts = [{"task": item.task, "done": item.done} for item in request.checklist]
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"routine_checklist": checklist_dicts}}
    )
    return {"status": "success"}
