import { useEffect, useState } from "react";

const initialApplicant = {
  age: 32,
  annual_income: 4800000,
  employment_years: 5,
  debt_to_income: 0.29,
  credit_history_months: 74,
  missed_payments: 1,
  housing: "rent",
  employment_type: "full_time",
};

const fields = [
  {
    name: "age",
    label: "Age",
    type: "number",
    min: 18,
    max: 100,
    step: 1,
    suffix: "years",
    helper: "Must be 18 or older",
  },
  {
    name: "annual_income",
    label: "Annual income",
    type: "number",
    min: 0,
    max: 100000000,
    step: 10000,
    prefix: "₹",
    helper: "Gross yearly income in INR",
  },
  {
    name: "employment_years",
    label: "Time in employment",
    type: "number",
    min: 0,
    max: 80,
    step: 1,
    suffix: "years",
    helper: "Years in current work",
  },
  {
    name: "debt_to_income",
    label: "Debt-to-income ratio",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
    helper: "Enter as a decimal, e.g. 0.29 = 29%",
  },
  {
    name: "credit_history_months",
    label: "Credit history",
    type: "number",
    min: 0,
    max: 1200,
    step: 1,
    suffix: "months",
    helper: "How long credit accounts have existed",
  },
  {
    name: "missed_payments",
    label: "Missed payments",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    helper: "On record in the available credit history",
  },
];

function App() {
  const [applicant, setApplicant] = useState(initialApplicant);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    fetch("/api/model-info")
      .then(async (response) => {
        if (!response.ok) throw new Error("Model details are not available.");
        return response.json();
      })
      .then(setModelInfo)
      .catch(() => setModelInfo(null));
  }, []);

  function updateField(event) {
    const { name, value, type } = event.target;
    setApplicant((current) => ({
      ...current,
      [name]: type === "number" ? Number(value) : value,
    }));
    setResult(null);
    setError("");
  }

  async function submitApplicant(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicant),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "The applicant could not be scored.");
      }
      setResult(data);
    } catch (requestError) {
      setError(
        requestError.message === "Failed to fetch"
          ? "Could not connect to the prediction API. Make sure the backend is running."
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setApplicant(initialApplicant);
    setResult(null);
    setError("");
  }

  const isApproved = result?.prediction.toLowerCase() === "approved";
  const confidence = result?.approval_probability;

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Credence home">
          <span className="brand-mark">c</span>
          <span>credence<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="model-status"><span className="status-dot" /> ML model online</span>
          <span className="topbar-divider" />
          <span className="topbar-label">A decision support demo</span>
        </div>
      </header>

      <main>
        <section className="intro">
          <div className="eyebrow"><span /> CREDIT ELIGIBILITY ESTIMATOR</div>
          <h1>A clearer view of<br /><em>what comes next.</em></h1>
          <p className="intro-copy">
            Enter a few applicant details to see how our Logistic Regression
            model assesses a sample credit application.
          </p>
          <div className="intro-meta">
            <span><span className="meta-icon">✳</span> Logistic Regression</span>
            <span><span className="meta-icon">⌁</span> Hyperparameter optimized</span>
          </div>
        </section>

        <section className="workspace">
          <form className="form-card" onSubmit={submitApplicant}>
            <div className="card-heading">
              <div>
                <div className="step-label">APPLICANT PROFILE <span>01</span></div>
                <h2>Tell us about the applicant</h2>
                <p>All fields are required to generate an estimate.</p>
              </div>
              <div className="profile-icon" aria-hidden="true">◉</div>
            </div>

            <div className="form-section">
              <div className="section-title"><span className="section-number">A</span> PERSONAL &amp; FINANCIAL</div>
              <div className="field-grid">
                {fields.map((field) => (
                  <label className="field" key={field.name} htmlFor={field.name}>
                    <span className="field-label">{field.label}</span>
                    <span className="input-wrap">
                      {field.prefix && <span className="input-affix">{field.prefix}</span>}
                      <input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={applicant[field.name]}
                        onChange={updateField}
                        required
                      />
                      {field.suffix && <span className="input-affix">{field.suffix}</span>}
                    </span>
                    <span className="field-helper">{field.helper}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section select-section">
              <div className="section-title"><span className="section-number">B</span> LIVING &amp; WORK</div>
              <div className="field-grid">
                <label className="field" htmlFor="housing">
                  <span className="field-label">Housing situation</span>
                  <select id="housing" name="housing" value={applicant.housing} onChange={updateField}>
                    <option value="rent">Renting</option>
                    <option value="mortgage">Paying a mortgage</option>
                    <option value="own">Own my home</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="field-helper">Your current living arrangement</span>
                </label>
                <label className="field" htmlFor="employment_type">
                  <span className="field-label">Employment type</span>
                  <select id="employment_type" name="employment_type" value={applicant.employment_type} onChange={updateField}>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="self_employed">Self-employed</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="field-helper">Your primary source of income</span>
                </label>
              </div>
            </div>

            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="form-actions">
              <button className="reset-button" type="button" onClick={resetForm}>Reset fields</button>
              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? "Assessing profile…" : <>Get my estimate <span aria-hidden="true">↗</span></>}
              </button>
            </div>
            <p className="privacy-note"><span aria-hidden="true">⌑</span> Your details are processed for this estimate and are not saved.</p>
          </form>

          <aside className="side-column">
            <div className={`result-card ${result ? (isApproved ? "result-approved" : "result-declined") : ""}`}>
              {result ? (
                <div className="result-content" aria-live="polite">
                  <div className="result-orbit"><span>{isApproved ? "✓" : "↗"}</span></div>
                  <div className="result-kicker">MODEL ASSESSMENT</div>
                  <h2>{isApproved ? "Looks promising." : "Needs another look."}</h2>
                  <p className="result-description">
                    The sample model estimates this application as
                    <strong> {result.prediction.toLowerCase()}</strong>.
                  </p>
                  {confidence !== null && confidence !== undefined && (
                    <div className="probability">
                      <div className="probability-heading">
                        <span>Approval likelihood</span>
                        <strong>{Math.round(confidence * 100)}%</strong>
                      </div>
                      <div className="probability-track">
                        <span style={{ width: `${Math.round(confidence * 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="result-disclaimer">{result.message}</div>
                </div>
              ) : (
                <>
                  <div className="result-placeholder-icon" aria-hidden="true">✳</div>
                  <div className="result-kicker">YOUR ESTIMATE</div>
                  <h2>Your result will<br />appear here.</h2>
                  <p className="placeholder-copy">Complete the applicant profile and run the model to see an estimate.</p>
                  <div className="placeholder-foot"><span>01</span><span className="placeholder-line" /><span>02</span><span className="placeholder-line" /><span>03</span></div>
                </>
              )}
            </div>

            <div className="model-card">
              <div className="model-card-heading">
                <span className="model-card-icon">⌘</span>
                <span>UNDER THE HOOD</span>
              </div>
              <h3>A model, not a verdict.</h3>
              <p>This demo uses a Logistic Regression model trained on synthetic sample data. Real credit decisions need validated data and human oversight.</p>
              {modelInfo && (
                <div className="model-stats">
                  <span>{modelInfo.training_rows} sample profiles</span>
                  <span>3-fold model tuning</span>
                </div>
              )}
            </div>
            <div className="side-note"><span>✧</span> For educational use only. Not financial advice.</div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>© 2026 CREDENCE <i>·</i> BUILT FOR A MORE INFORMED TOMORROW</span>
        <span>PRIVACY FIRST <i>·</i> ALWAYS HUMAN-CENTERED</span>
      </footer>
    </div>
  );
}

export default App;
