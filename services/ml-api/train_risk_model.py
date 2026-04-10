import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

np.random.seed(42)
n = 1000

data = pd.DataFrame({
    "amount": np.random.uniform(50000, 300000, n),
    "province": np.random.choice(["Neuquén", "Buenos Aires", "Chubut", "Santa Cruz"], n),
    "status": np.random.choice(["vigente", "demorado", "cancelado"], n, p=[0.6, 0.3, 0.1]),
    "issue": np.random.choice(["Sin problemas", "Atraso leve", "Atraso crítico", "Incumplimiento contractual"], n),
})

def generate_risk(row):
    risk = 0.0
    if row["amount"] > 200000:
        risk += 0.3
    elif row["amount"] > 120000:
        risk += 0.15
    if row["status"] == "demorado":
        risk += 0.3
    elif row["status"] == "cancelado":
        risk += 0.5
    issue = row["issue"].lower()
    if "crítico" in issue:
        risk += 0.4
    elif "incumplimiento" in issue:
        risk += 0.5
    elif "leve" in issue:
        risk += 0.1
    risk += np.random.normal(0, 0.05)
    return max(0, min(1, risk))

data["risk_score"] = data.apply(generate_risk, axis=1)

X = data[["amount", "province", "status", "issue"]]
y = data["risk_score"]

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), ["amount"]),
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["province", "status", "issue"]),
    ]
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", RandomForestRegressor(n_estimators=120, max_depth=6, random_state=42)),
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
pipeline.fit(X_train, y_train)

print(f"R²: {pipeline.score(X_test, y_test):.4f}")
joblib.dump(pipeline, "modelo_riesgo.pkl")
print("Modelo guardado: modelo_riesgo.pkl")
