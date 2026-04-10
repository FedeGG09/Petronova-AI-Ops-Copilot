# ML API opcional

Este servicio es opcional. Sirve para reemplazar el motor de riesgo rule-based por un modelo entrenado con sklearn/joblib.

## Entrenar

```bash
pip install -r requirements.txt
python train_risk_model.py
```

## Correr

```bash
uvicorn app:app --reload --port 8000
```
