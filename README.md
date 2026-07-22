# M-Pesa Fraud Detection System

A real-time transaction fraud detection and prevention system built for the Kenyan mobile money ecosystem. The system intercepts M-Pesa transactions before settlement and returns an `ALLOW`, `CHALLENGE`, or `BLOCK` decision within the latency window of a transaction initiation.

---

## Problem Statement

M-Pesa processes **37.15 billion transactions annually**, with a total value of **KSh 38.29 trillion**. Conservative estimates place annual fraud losses at **KSh 2.3 billion (~$17.6M USD)** (approximately KSh 6.3 million stolen every single day).

Common attack vectors include SIM swaps, social engineering, fraudulent merchant transactions, number masking, and fake balance SMS traps.

---

## Solution

Rather than logging fraud after the fact, this system sits **between transaction initiation and transaction completion**, scoring each transaction in real time and returning one of three decisions:

| Decision | Condition |
|---|---|
| `ALLOW` | Low fraud probability: transaction proceeds normally |
| `CHALLENGE` | Elevated risk: OTP or user verification triggered |
| `BLOCK` | High fraud probability or deterministic fraud signal: transaction halted before settlement |

---

## Project Structure

```text
Mpesa-Fraud-Detection-System/
├── Data/
│   ├── mpesa_synthetic.csv: Raw dataset (120K synthetic M-Pesa transactions)
│   ├── Feature_engineered.csv: Engineered dataset
│   ├── training.csv: Training split (109,915 rows)
│   └── evaluation.csv: Unseen evaluation set (10,000 rows)
├── inference/
│   ├── models/
│   │   ├── best_model.pkl: Trained XGBoost model (GridSearchCV tuned)
│   │   └── encoder.pkl: Fitted ColumnTransformer encoder
│   ├── utils/
│   │   ├── feature_engineering.py: Derives drain_rate, account_emptied, cyclic encoding
│   │   └── preprocessing.py: Drops columns, maps device_type, applies encoder
│   ├── main.py: FastAPI application
│   ├── requirements.txt: Production dependencies
│   ├── .env: Local environment variables (not pushed)
│   └── .gitignore
├── src/
│   ├── app/
│   │   ├── about/: Landing page & system specifications
│   │   ├── dashboard/: Exploratory Data Analysis (EDA)
│   │   ├── single-prediction/: Real-time transaction evaluator
│   │   ├── batch-prediction/: Batch CSV scoring pipeline
│   │   └── api/predict/: Next.js API proxy route handler
│   ├── components/: Layout shell, navigation sidebar, loading skeletons
│   └── utils/csvProcessor.ts: Automated feature engineering & CSV validation
├── Notebooks/
│   ├── EDA.ipynb: Exploratory data analysis
│   ├── feature_engineering.ipynb: Feature engineering pipeline
│   └── modeling.ipynb: Model training, tuning, and evaluation
├── Reports/
│   ├── transactions.pbix: Power BI dashboard
│   ├── transactions.png: Transaction analysis dashboard
│   └── fraud.png: Fraud analysis dashboard
├── render.yaml: Render deployment configuration
└── README.md
```

---

## ML Pipeline

### Data
- **Source:** Synthetic M-Pesa fraud dataset: [Kaggle (calebboen)](https://www.kaggle.com/datasets/calebboen/mpesa-transactions-fraud)
- **Size:** 120,000 transactions × 13 features
- **Fraud rate:** 2.93% (class imbalanced)

### Feature Engineering
| Feature | Description |
|---|---|
| `drain_rate` | `(amount / sender_balance_before) × 100` (primary fraud signal) |
| `account_emptied` | Binary flag (`amount >= sender_balance_before`) |
| `hour_sin/cos` | Cyclical encoding of hour (cycle length: 24) |
| `day_sin/cos` | Cyclical encoding of day of week (cycle length: 7) |
| `month_sin/cos` | Cyclical encoding of month (cycle length: 12) |

### Models Compared
| Model | Recall (Fraud) | Precision (Fraud) | F1 |
|---|---|---|---|
| Logistic Regression | 0.47 | 0.03 | 0.05 |
| Random Forest | 0.54 | 0.03 | 0.06 |
| XGBoost (base) | 0.62 | 0.03 | 0.06 |
| LightGBM (base) | 0.62 | 0.03 | 0.06 |
| **XGBoost (tuned)** | **0.68** | **0.03** | **0.06** |

### Selected Model
**XGBoost** tuned with GridSearchCV + SMOTE (via imblearn Pipeline)

| Parameter | Value |
|---|---|
| `max_depth` | 4 |
| `learning_rate` | 0.01 |
| `colsample_bytree` | 0.5 |
| Class imbalance | SMOTE inside CV folds |

### Final Evaluation (Unseen Data)
Evaluated against 10,000 completely unseen transactions with original 97/3 class ratio preserved:

| Metric | Score |
|---|---|
| Recall (fraud) | 0.68 |
| Precision (fraud) | 0.03 |
| Accuracy | 0.35 |

---

## Decisioning Architecture

Transactions are evaluated in two layers before a decision is returned:

**Layer 1: Hard Rules (deterministic, no model inference):**
- `drain_rate >= 100%` → immediate `BLOCK` (transaction exceeds available balance)
- `account_emptied = 1` → immediate `BLOCK` (transaction empties sender account)

**Layer 2: Model Inference (probabilistic):**
- `probability >= 0.502` → `BLOCK`
- `probability >= 0.497` → `CHALLENGE`
- `probability < 0.497` → `ALLOW`

---

## Web Application (UI/UX)

The system includes a lightweight Next.js control panel and analyst workspace:

- **About Landing Page (`/`):** System architecture overview, model card performance metrics, technology stack, and synthetic data limitations.
- **Analytics Dashboard (`/dashboard`):** Exploratory Data Analysis (EDA) on the Training Dataset with interactive distribution charts (Recharts).
- **Single Prediction (`/single-prediction`):** Form interface for real-time single transaction evaluation against rule gates and ML probabilities.
- **Batch Prediction (`/batch-prediction`):** Concurrent CSV transaction scoring (max 1,000 rows per batch) with real-time decision tallies (`ALLOW`, `CHALLENGE`, `BLOCK`). Supports both raw synthetic M-Pesa CSVs (automated client feature engineering) and clean engineered CSVs.

---

## API Reference

**Base URL:** `https://mpesa-fraud-detection-system.onrender.com`

### Health Check

`GET /health_status`

**Response:**
```json
{
  "status": "OK"
}
```

### Predict

`POST /predict`

**Request Body:**
```json
{
  "transaction_id": "TXN123",
  "amount": 5000.0,
  "sender_balance_before": 8000.0,
  "transaction_type": "peer",
  "device_type": "smartphone",
  "region": "Nairobi",
  "hour": 14,
  "day_of_week": "Friday",
  "month_2026": 4
}
```

**Response:**
```json
{
  "fraud_probability": 0.501,
  "risk_tier": "LOW",
  "recommended_action": "ALLOW",
  "action_rationale": "Low fraud probability detected"
}
```

**Valid categorical values:**
- `transaction_type`: `peer`, `till`, `paybill`
- `device_type`: `smartphone`, `feature`
- `region`: `Nairobi`, `Mombasa`, `Kisumu`, `Nakuru`, `Eldoret`
- `day_of_week`: `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

---

## Known Limitations

- Precision is stuck at 0.03 across all models (a consequence of the synthetic dataset's uniform fraud distribution). Only `drain_rate` and `account_emptied` carry genuine predictive signal.
- SMOTE applied to synthetic data may inflate metrics beyond what is achievable on real M-Pesa transaction data.
- Categorical inputs are case-sensitive and must match training data values exactly. Frontend uses constrained dropdown inputs to prevent encoder errors.
- Model does not capture SIM swap fraud, agent float abuse, or number masking as explicit features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Framework | XGBoost, scikit-learn, imbalanced-learn |
| API | FastAPI, Uvicorn |
| Web Application | Next.js 14, React, Tailwind CSS |
| Data Processing | Pandas, NumPy |
| Model Serialisation | Joblib |
| EDA & Visualisation | Power BI, Recharts, Seaborn, Matplotlib |
| Deployment | Render, Vercel |

---

## Future Work

- Retrain on real M-Pesa transaction data with genuine behavioural signal
- Add SIM swap flag, agent transaction type, and network velocity features
- Extend to bank transaction channel with a `channel` feature
- Build full preprocessing pipeline for raw-input-to-prediction in one call
- Implement online learning for continuous model adaptation
- Live carrier switch integration for direct network interception

---

## Author

**Anthony Ng'ang'a Chege**  
Data Scientist & ML Engineer  
[Portfolio](https://anthonyngangachege.vercel.app) · [GitHub](https://github.com/TonnieD) · [LinkedIn](https://linkedin.com/in/anthony-nganga-chege)