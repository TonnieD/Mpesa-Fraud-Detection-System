#Library importations
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
from utils.preprocessing import preprocessing
from utils.feature_engineering import feature_engineering

import os
from dotenv import load_dotenv

load_dotenv()  # loads .env file into environment

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8000))


#App initialization
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Model & Encoder loading
model = joblib.load('models/best_model.pkl')

#Pydantic Request Model
class TransactionRequest(BaseModel):
    transaction_id : str
    amount : float
    sender_balance_before : float
    transaction_type : str
    device_type : str
    region : str
    hour : int
    day_of_week : str
    month_2026 : int

# Pydantic Response Model
class TransactionResponse(BaseModel):
    fraud_probability : float = None
    risk_tier : str
    recommended_action : str
    action_rationale : str

#Health status endpoint
@app.get('/health_status')
async def health_status():
    return {'status': 'OK'}

#Prediction Endpoint
@app.post('/predict')
async def predict(request:TransactionRequest):
    try:
        # Convert request to dataframe
        data = request.dict()
        df = pd.DataFrame([data])

        # Perform feature engineering
        df = feature_engineering(df)

        #Check_hard coded rules
        if df['drain_rate'].values[0] >= 100:
            return TransactionResponse(risk_tier = 'HIGH',
            recommended_action = 'BLOCK',
            action_rationale = 'Transaction Exceeds Available Balance')
        elif df['account_emptied'].values[0] == 1:
            return TransactionResponse(risk_tier = 'HIGH',
            recommended_action = 'BLOCK',
            action_rationale = 'Account Will Be Emptied')

            

        # Preprocess the data
        df = preprocessing(df)

        # Predict the fraud probability
        fraud_probability = model.predict_proba(df)[0][1]

        # Determine the risk tier
        if fraud_probability >= 0.502:
            risk_tier = 'HIGH'
            recommended_action = 'BLOCK'
            action_rationale = 'High fraud probability detected'
        elif fraud_probability > 0.497:
            risk_tier = 'MEDIUM'
            recommended_action = 'CHALLENGE'
            action_rationale = 'Medium fraud probability detected'
        else:
            risk_tier = 'LOW'
            recommended_action = 'APPROVE'
            action_rationale = 'Low fraud probability detected'

        # Return the response
        return TransactionResponse(
            fraud_probability=fraud_probability,
            risk_tier=risk_tier,
            recommended_action=recommended_action,
            action_rationale=action_rationale
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run(app, host=HOST, port=PORT)