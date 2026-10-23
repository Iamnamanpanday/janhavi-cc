from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_credit_training.csv"
TARGET_COLUMN = "approval"


def create_model() -> tuple[GridSearchCV, dict[str, Any]]:
    data = pd.read_csv(DATA_PATH)
    if TARGET_COLUMN not in data.columns:
        raise ValueError(f"Training data must include a {TARGET_COLUMN!r} column.")

    features = data.drop(columns=[TARGET_COLUMN])
    labels = data[TARGET_COLUMN].astype(str).str.strip()
    if labels.nunique() < 2 or labels.value_counts().min() < 2:
        raise ValueError("Training data needs at least two examples of each class.")

    numeric_columns = features.select_dtypes(include="number").columns.tolist()
    categorical_columns = [
        column for column in features.columns if column not in numeric_columns
    ]
    transformers = []
    if numeric_columns:
        transformers.append(
            (
                "numeric",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric_columns,
            )
        )
    if categorical_columns:
        transformers.append(
            (
                "categorical",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_columns,
            )
        )

    pipeline = Pipeline(
        [
            ("preprocessing", ColumnTransformer(transformers)),
            (
                "classifier",
                LogisticRegression(solver="liblinear", max_iter=2000),
            ),
        ]
    )
    folds = min(3, int(labels.value_counts().min()))
    search = GridSearchCV(
        pipeline,
        {
            "classifier__C": [0.1, 1.0, 10.0],
            "classifier__penalty": ["l1", "l2"],
        },
        scoring="f1_weighted",
        cv=StratifiedKFold(n_splits=folds, shuffle=True, random_state=42),
        n_jobs=1,
    )
    search.fit(features, labels)
    return search, {
        "best_params": search.best_params_,
        "cross_validation_score": float(search.best_score_),
        "training_rows": int(len(data)),
    }


def predict_approval(model: GridSearchCV, applicant: dict[str, Any]) -> dict[str, Any]:
    features = pd.DataFrame([applicant], columns=model.feature_names_in_)
    probabilities = model.predict_proba(features)[0]
    classes = model.classes_.tolist()
    prediction = str(model.predict(features)[0])
    approved_index = classes.index("approved") if "approved" in classes else None

    return {
        "prediction": prediction,
        "approval_probability": (
            float(probabilities[approved_index]) if approved_index is not None else None
        ),
    }
