from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.model import create_model, predict_approval


class Applicant(BaseModel):
    model_config = ConfigDict(extra="forbid")

    age: int = Field(ge=18, le=100)
    annual_income: float = Field(ge=0, le=100_000_000)
    employment_years: float = Field(ge=0, le=80)
    debt_to_income: float = Field(ge=0, le=1)
    credit_history_months: int = Field(ge=0, le=1200)
    missed_payments: int = Field(ge=0, le=100)
    housing: str = Field(pattern="^(rent|mortgage|own|other)$")
    employment_type: str = Field(pattern="^(full_time|part_time|contract|self_employed|other)$")

    @model_validator(mode="after")
    def employment_cannot_exceed_age(self) -> "Applicant":
        if self.employment_years > self.age - 16:
            raise ValueError("Employment years must be less than age minus 16.")
        return self


@asynccontextmanager
async def lifespan(application: FastAPI):
    application.state.model, application.state.model_info = create_model()
    yield


app = FastAPI(
    title="Credit Approval Prediction API",
    version="1.0.0",
    description="Demonstration API for a Logistic Regression credit approval model.",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/model-info")
def model_info() -> dict[str, Any]:
    return app.state.model_info


@app.post("/api/predict")
def predict(applicant: Applicant) -> dict[str, Any]:
    try:
        result = predict_approval(
            app.state.model, applicant.model_dump()
        )
    except (ValueError, KeyError) as error:
        raise HTTPException(
            status_code=422, detail=f"Applicant could not be scored: {error}"
        ) from error
    return {
        **result,
        "message": "Model estimate only; this is not a credit decision.",
    }


frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
