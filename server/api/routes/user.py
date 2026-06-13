import os
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import json

from core.database import get_db
from core.dependencies import get_current_user

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class TextDescriptionRequest(BaseModel):
    description: str

def process_description_with_gemini(description_text: str = None, audio_path: str = None):
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = """
    Extract the following details from the farmer's description:
    1. The size of the land (e.g., '5 acres', '2 hectares'). Return an empty string if not mentioned.
    2. A list of crops they are growing (e.g., ['Wheat', 'Sugarcane']). Return an empty list if none.
    3. The summarized description text. If it's an audio file, provide the transcription.
    
    Respond STRICTLY with a JSON object in this format:
    {
        "land_size": "...",
        "crops": ["..."],
        "description": "..."
    }
    """
    
    try:
        if audio_path:
            audio_file = genai.upload_file(path=audio_path)
            response = model.generate_content([prompt, audio_file])
            genai.delete_file(audio_file.name)
        else:
            response = model.generate_content([prompt, description_text])
        
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
        print(f"Gemini processing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process description with AI")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = {
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "language": current_user.get("language"),
        "farm_description": current_user.get("farm_description"),
        "land_size": current_user.get("land_size"),
        "crops": current_user.get("crops", [])
    }
    return user_data

@router.post("/farm-description/text")
async def update_farm_description_text(
    request: TextDescriptionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    extracted_data = process_description_with_gemini(description_text=request.description)
    
    # Update user in DB
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {
            "farm_description": extracted_data["description"],
            "land_size": extracted_data.get("land_size", ""),
            "crops": extracted_data.get("crops", [])
        }}
    )
    
    return {"message": "Description updated successfully", "data": extracted_data}

@router.post("/farm-description/voice")
async def update_farm_description_voice(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    # Save audio to a temporary file for Gemini upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_audio.write(await audio.read())
        temp_audio_path = temp_audio.name

    try:
        extracted_data = process_description_with_gemini(audio_path=temp_audio_path)
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

    # Update user in DB
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {
            "farm_description": extracted_data["description"],
            "land_size": extracted_data.get("land_size", ""),
            "crops": extracted_data.get("crops", [])
        }}
    )
    
    return {"message": "Voice description processed and updated successfully", "data": extracted_data}
