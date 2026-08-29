import { useTranslation } from "react-i18next";
import IntakeForm from "../components/forms/IntakeForm";
import { useReportStore } from "../store/reportStore";
import { generateFeasibilityReport } from "../services/api";
import Report from "./Report";

export default function Home() {
  const { t, i18n } = useTranslation();
  const { report, isLoading, error, setReport, setLoading, setError, reset } = useReportStore();

  async function handleSubmit(input) {
    setLoading(true);
    try {
      const result = await generateFeasibilityReport({ ...input, language: i18n.language });
      setReport(result);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="app-header">
        <h1>{t("appTitle")}</h1>
        <p>{t("tagline")}</p>
        <div className="lang-switch">
          <button onClick={() => i18n.changeLanguage("en")}>EN</button>
          <button onClick={() => i18n.changeLanguage("hi")}>हिं</button>
        </div>
      </header>

      {!report && (
        <IntakeForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}

      {error && <p className="error-banner">{error}</p>}

      {report && (
        <>
          <Report report={report} />
          <button className="reset-btn" onClick={reset}>
            ← Start Over
          </button>
        </>
      )}
    </div>
  );
}
