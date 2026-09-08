import { useTranslation } from "react-i18next";

import IntakeForm from "../components/forms/IntakeForm";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

import {
  useReportStore,
} from "../store/reportStore";

import {
  generateFeasibilityReport,
} from "../services/api";

import Report from "./Report";


export default function Home() {
  const {
    t,
    i18n,
  } = useTranslation();

  const {
    report,
    isLoading,
    error,
    setReport,
    setLoading,
    setError,
    reset,
  } = useReportStore();


  async function handleSubmit(input) {
    setLoading(true);

    try {
      const result =
        await generateFeasibilityReport({
          ...input,
          language:
            i18n.language,
        });

      setReport(result);
    } catch (err) {
      const message =
        err?.response?.data
          ?.message ||
        err?.message ||
        t(
          "errors.generic"
        );

      setError(message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="page">
      <header className="app-header">
        <div className="app-header__brand">
          <p className="app-header__eyebrow">
            {t(
              "appEyebrow"
            )}
          </p>

          <h1>
            {t("appTitle")}
          </h1>

          <p className="app-header__tagline">
            {t("tagline")}
          </p>
        </div>

        <div className="app-header__controls">
          <LanguageSwitcher />
        </div>
      </header>


      {!report && (
        <>
          <section className="hero-card">
            <div className="hero-card__content">
              <h2>
                {t(
                  "home.heroTitle"
                )}
              </h2>

              <p>
                {t(
                  "home.heroDescription"
                )}
              </p>
            </div>
          </section>


          <div className="intake-layout">
            <IntakeForm
              onSubmit={
                handleSubmit
              }
              isLoading={
                isLoading
              }
            />

            <aside className="info-card">
              <h3>
                {t(
                  "home.infoTitle"
                )}
              </h3>

              <p>
                {t(
                  "home.infoDescription"
                )}
              </p>

              <ul className="info-list">
                <li>
                  <span className="info-list__icon">
                    1
                  </span>

                  <span>
                    {t(
                      "home.info1"
                    )}
                  </span>
                </li>

                <li>
                  <span className="info-list__icon">
                    2
                  </span>

                  <span>
                    {t(
                      "home.info2"
                    )}
                  </span>
                </li>

                <li>
                  <span className="info-list__icon">
                    3
                  </span>

                  <span>
                    {t(
                      "home.info3"
                    )}
                  </span>
                </li>

                <li>
                  <span className="info-list__icon">
                    4
                  </span>

                  <span>
                    {t(
                      "home.info4"
                    )}
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </>
      )}


      {error && (
        <div
          className="error-banner"
          role="alert"
        >
          <span className="error-banner__icon">
            !
          </span>

          <span>
            {error}
          </span>
        </div>
      )}


      {report && (
        <>
          <Report
            report={report}
          />

          <div className="report-actions">
            <button
              type="button"
              className="reset-btn"
              onClick={reset}
            >
              ←{" "}
              {t(
                "report.startOver"
              )}
            </button>
          </div>
        </>
      )}
    </main>
  );
}