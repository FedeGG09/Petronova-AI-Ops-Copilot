import os
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AESA Risk API")

MODEL_PATH = os.getenv("MODEL_PATH", "modelo_riesgo.pkl")
model = joblib.load(MODEL_PATH)

class SupplyInput(BaseModel):
    amount: float
    province: str
    status: str
    issue: str

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/predict")
def predict(data: SupplyInput):
    df = pd.DataFrame([{
        "amount": data.amount,
        "province": data.province,
        "status": data.status,
        "issue": data.issue,
    }])

    pred = float(model.predict(df)[0])
    return {
        "risk_score": max(0.0, min(1.0, pred)),
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
