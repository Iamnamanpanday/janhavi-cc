# Credence — Credit Approval Predictor

A React web app with a FastAPI backend for entering applicant details manually
and getting an estimate from a hyperparameter-tuned Logistic Regression model.
The bundled training data is synthetic and intended only for demonstrating the
end-to-end flow.

## Run locally

Open two PowerShell terminals from the project directory.

**Terminal 1 — API backend**

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — React frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The
frontend proxies API requests to `http://localhost:8000`. API documentation is
available at `http://localhost:8000/docs`.

## API

- `GET /api/health` — service health
- `GET /api/model-info` — sample model metadata
- `POST /api/predict` — validate applicant fields and return the estimate

Set `FRONTEND_ORIGINS` to a comma-separated list of allowed frontend origins
when hosting the API and frontend on separate domains. The default allows the
local Vite development server.

## Deploy with Docker

Build and run the bundled frontend and backend:

```powershell
docker build -t credence-credit-demo .
docker run --rm -p 8000:8000 credence-credit-demo
```

Deploy this image to a container host that supports Docker. The app listens on
the host-provided `PORT` environment variable, falling back to port `8000`.

## Sample profile

The form starts with example details you can edit. The model is tuned at API
startup against [`data/sample_credit_training.csv`](./data/sample_credit_training.csv).
Annual income is entered and stored in Indian rupees (INR). It uses numeric
scaling, categorical one-hot encoding, and 3-fold stratified cross-validation.
The separate
[`data/sample_credit_applicants.csv`](./data/sample_credit_applicants.csv) file
is retained as an optional data example; predictions in the web app are entered
manually.

## Responsible use

This project is an educational demo, not a production credit-decision system.
Its synthetic data cannot support real lending decisions. Before any real-world
use, replace it with properly governed data and review validation, calibration,
fairness, explainability, security, human oversight, and applicable lending
requirements. The estimate shown is not an actual credit decision.
