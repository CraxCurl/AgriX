# AgriX

A smart farming assistant that helps farmers make better decisions using AI. Styled with a bold Bauhaus constructivist modernism design emphasizing clarity, high contrast, and primary colors.

## Features

- **Dynamic Weather & Irrigation Advice**: Real-time localized weather updates (in Celsius) with tailored irrigation recommendations based on precipitation probability.
- **AI Crop Disease Detection**: Farmers can upload photos of crop leaves, and the AI model instantly predicts potential diseases along with a confidence score and actionable advice.
- **Market Price Predictions**: Forward-looking AI analysis of crop market prices to advise on whether to sell now or wait.
- **Secure Authentication**: Registration flow with email-based OTP verification using Resend. Sandbox login available for developers.

## Tech Stack

### Frontend
- **React + Vite**: Fast, modern frontend framework.
- **Tailwind CSS**: Used to implement the geometric, high-contrast Bauhaus design language.
- **Lucide React**: Clean iconography.

### Backend
- **FastAPI**: High-performance Python backend.
- **MongoDB (Motor)**: Asynchronous database for storing user data securely.
- **Resend**: Transactional email API used for reliable OTP delivery.

## Local Setup

### 1. Environment Variables
Create a `.env` file in the root of the project with the following:
```env
MONGODB_URI=your_mongodb_connection_string
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="AgriX <AgriX@yourdomain.com>"
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 2. Backend Installation
```bash
cd server
pip install -r requirements.txt
python main.py
```
*(The API will be available at http://localhost:8000)*

### 3. Frontend Installation
```bash
cd client
npm install
npm run dev
```
*(The frontend will be available at http://localhost:5173)*
