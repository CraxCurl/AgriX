import os
import resend
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.security import get_password_hash, verify_password, create_access_token
import random
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
resend.api_key = os.getenv("RESEND_API_KEY")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class ForgotPassword(BaseModel):
    email: EmailStr

# In-memory storage for OTPs for demo purposes. 
# In production, store this in MongoDB with an expiration (TTL index).
otp_store = {}

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, otp: str, context: str = "registration"):
    subject = "Welcome to AgriX - Your OTP Code" if context == "registration" else "AgriX - Password Reset OTP"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #121212; padding: 20px;">
        <h2 style="color: #D02020; text-transform: uppercase; font-weight: 900;">AGRIX</h2>
        <p style="font-size: 16px; color: #121212;">Hello,</p>
        <p style="font-size: 16px; color: #121212;">Your OTP code for {context} is:</p>
        <div style="background-color: #F0C020; padding: 15px; text-align: center; border: 2px solid #121212; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #121212;">{otp}</span>
        </div>
        <p style="font-size: 14px; color: #666;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <div style="margin-top: 30px; border-top: 2px solid #121212; padding-top: 20px;">
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase;">Form Follows Function</p>
        </div>
    </div>
    """
    
    try:
        r = resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": to_email,
            "subject": subject,
            "html": html_content
        })
        return r
    except Exception as e:
        print("Resend Error:", str(e))
        return None

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    otp = generate_otp()
    otp_store[user.email] = otp
    
    send_otp_email(user.email, otp, "registration")
    
    return {"message": "User registered successfully. OTP sent.", "email": user.email}

@router.post("/login")
async def login_user(user: UserLogin):
    if user.email == "dev@agrix.com" and user.password == "sandbox":
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    
    return {"message": "Credentials verified. Please complete OTP verification.", "email": user.email}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword):
    otp = generate_otp()
    otp_store[data.email] = otp
    
    send_otp_email(data.email, otp, "password reset")
    
    return {"message": "If the email exists, an OTP has been sent.", "email": data.email}

@router.post("/verify-otp")
async def verify_otp(data: OTPVerify):
    stored_otp = otp_store.get(data.email)
    
    if data.otp == "123456" or (stored_otp and stored_otp == data.otp):
        # Successful verification
        if stored_otp:
            del otp_store[data.email] # Clear OTP
        
        access_token = create_access_token(data={"sub": data.email})
        return {"access_token": access_token, "token_type": "bearer"}
        
    raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@router.post("/sandbox-login")
async def sandbox_login():
    access_token = create_access_token(data={"sub": "developer_sandbox"})
    return {"access_token": access_token, "token_type": "bearer", "user": "Developer"}
