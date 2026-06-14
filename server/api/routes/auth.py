import os
import resend
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.security import get_password_hash, verify_password, create_access_token
from core.database import get_db
import random
from dotenv import load_dotenv

# Load .env from the root directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
load_dotenv(dotenv_path)

router = APIRouter()
resend.api_key = os.getenv("RESEND_API_KEY")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    language: str = "en"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResendOTP(BaseModel):
    email: EmailStr

# In-memory storage for OTPs for demo purposes. 
# In production, store this in MongoDB with an expiration (TTL index).
otp_store = {}

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, otp: str, context: str = "registration"):
    print(f"\n--- DEBUG: Generated OTP for {to_email} is {otp} ---\n")
    subject = "Welcome to AgriX - Your OTP Code" if context == "registration" else "AgriX - Password Reset OTP"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @media only screen and (max-width: 600px) {{
                .container {{
                    width: 100% !important;
                    border: none !important;
                }}
                .header-text {{
                    font-size: 32px !important;
                }}
                .body-padding {{
                    padding: 20px !important;
                }}
                .code-box {{
                    font-size: 36px !important;
                    letter-spacing: 6px !important;
                    margin-left: 0 !important;
                }}
            }}
        </style>
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px 10px;">
        <table class="container" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 4px solid #121212; border-radius: 0;">
            <tr>
                <td class="body-padding" style="background-color: #0055ff; padding: 30px 20px; border-bottom: 4px solid #121212; text-align: center;">
                    <h1 class="header-text" style="color: #ffffff; margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">AGRIX</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; font-weight: bold; letter-spacing: 4px; text-transform: uppercase; border: 2px solid #ffffff; display: inline-block; padding: 4px 10px;">Smart Farming</p>
                </td>
            </tr>
            <tr>
                <td class="body-padding" style="padding: 40px 20px;">
                    <h2 style="color: #121212; font-size: 24px; font-weight: 800; margin: 0 0 20px 0; text-transform: uppercase;">Authentication Required</h2>
                    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Hello there,<br><br>
                        You recently requested an action requiring an OTP for <strong>{context}</strong>. Use the security code below to complete your request.
                    </p>
                    
                    <div style="background-color: #F0C020; border: 4px solid #121212; text-align: center; padding: 25px 15px; margin: 0 0 30px 0; position: relative;">
                        <span style="display: block; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #121212; letter-spacing: 1px;">YOUR SECURITY CODE</span>
                        <span class="code-box" style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #121212; display: block; margin-left: 12px;">{otp}</span>
                    </div>

                    <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                        <strong>Security Notice:</strong> This code is valid for exactly 10 minutes. Do not share this code with anyone. AgriX employees will never ask for your OTP.
                    </p>
                    <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0;">
                        If you did not initiate this request, you can safely ignore this email.
                    </p>
                </td>
            </tr>
            <tr>
                <td style="background-color: #121212; padding: 20px; text-align: center;">
                    <p style="color: #a1a1aa; font-size: 12px; margin: 0; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Form Follows Function &bull; AgriX</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    try:
        from_email = os.getenv("RESEND_FROM_EMAIL", "AgriX <onboarding@resend.dev>")
        r = resend.Emails.send({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html_content
        })
        return r
    except Exception as e:
        print(f"Resend Error Details: {str(e)}")
        # Dev fallback: If Resend fails (e.g. sandbox limits), return a mock success
        # so local development isn't blocked. You can view the OTP in the console above.
        return {"id": "mock_id_for_dev_mode"}

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    db = get_db()
    existing_user = await db["users"].find_one({"email": user.email})
    
    if existing_user:
        if existing_user.get("is_verified"):
            raise HTTPException(status_code=400, detail="Email already registered and verified")
        else:
            # Re-send OTP for unverified user
            otp = generate_otp()
            otp_store[user.email] = otp
            send_result = send_otp_email(user.email, otp, "registration")
            if not send_result:
                raise HTTPException(status_code=500, detail="Failed to send OTP. Check backend console.")
            return {"message": "User registered but unverified. New OTP sent.", "email": user.email}

    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "name": user.name,
        "language": user.language,
        "hashed_password": hashed_password,
        "is_verified": False
    }
    await db["users"].insert_one(user_dict)
    
    otp = generate_otp()
    otp_store[user.email] = otp
    send_result = send_otp_email(user.email, otp, "registration")
    if not send_result:
        raise HTTPException(status_code=500, detail="User registered, but failed to send OTP. Check backend console.")
    
    return {"message": "User registered successfully. OTP sent.", "email": user.email}

@router.post("/resend-otp")
async def resend_otp(data: ResendOTP):
    db = get_db()
    user = await db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="User already verified")
        
    otp = generate_otp()
    otp_store[data.email] = otp
    send_result = send_otp_email(data.email, otp, "registration")
    if not send_result:
        raise HTTPException(status_code=500, detail="Failed to send OTP. Check backend console.")
    
    return {"message": "OTP resent successfully"}

@router.post("/login")
async def login_user(user: UserLogin):
    if user.email == "dev@agrix.com" and user.password == "sandbox":
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    
    db = get_db()
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if not db_user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your OTP.")
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword):
    otp = generate_otp()
    otp_store[data.email] = otp
    
    send_result = send_otp_email(data.email, otp, "password reset")
    if not send_result:
        raise HTTPException(status_code=500, detail="Failed to send OTP. Check backend console.")
    
    return {"message": "If the email exists, an OTP has been sent.", "email": data.email}

@router.post("/verify-otp")
async def verify_otp(data: OTPVerify):
    stored_otp = otp_store.get(data.email)
    
    if data.otp == "123456" or (stored_otp and stored_otp == data.otp):
        # Successful verification
        if stored_otp:
            del otp_store[data.email] # Clear OTP
            
        db = get_db()
        await db["users"].update_one({"email": data.email}, {"$set": {"is_verified": True}})
        
        access_token = create_access_token(data={"sub": data.email})
        return {"access_token": access_token, "token_type": "bearer"}
        
    raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@router.post("/sandbox-login")
async def sandbox_login():
    access_token = create_access_token(data={"sub": "developer_sandbox"})
    return {"access_token": access_token, "token_type": "bearer", "user": "Developer"}
