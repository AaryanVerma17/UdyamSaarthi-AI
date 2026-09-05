import { useTranslation } from "react-i18next";
import ViabilityGauge from "../components/charts/ViabilityGauge";
import CompetitorMap from "../components/map/CompetitorMap";

export default function Report({ report }) {
  const { t } = useTranslation();
  const {
    viability,
    financials,
    scheme,
    repayment,
    workingCapital,
    opportunities,
    surfacedAlternatives,
    pricing,
    risks,
    competitorMapping,
    finalRecommendation,
    recommendationGated,
    narrative,
  } = report;

  return (
    <div className="report">
      <section className="report__section">
        <ViabilityGauge score={viability?.score} label={viability?.label} />
        <p className="explanation">{viability?.explanation}</p>
        {recommendationGated && surfacedAlternatives?.length > 0 && (
          <div className="saturation-alert">
            <p className="saturation-alert__title">
              ⚠️ This market looks highly saturated — here's what else might work better:
            </p>
            <ul>
              {surfacedAlternatives.map((alt) => (
                <li key={alt.business}>
                  {alt.business} — {alt.score}/100
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="report__section">
        <h3>{t("report.financialStructure")}</h3>
        <ul>
          <li>{t("report.projectCost")}: ₹{financials?.projectCost?.toLocaleString("en-IN")}</li>
          <li>{t("report.loanAmount")}: ₹{financials?.loanAmount?.toLocaleString("en-IN")}</li>
          <li>{t("report.scheme")}: {scheme?.name} ({scheme?.interestRate}% · {scheme?.tenureYears} yrs)</li>
          <li>{t("report.quarterlyInstallment")}: ₹{repayment?.quarterlyInstallment?.toLocaleString("en-IN")}</li>
          <li>{t("report.repaymentCapacity")}: {repayment?.repaymentCapacity}</li>
        </ul>
      </section>

      <section className="report__section">
        <h3>{t("report.workingCapitalAllocation")}</h3>
        <ul>
          {workingCapital &&
            Object.entries(workingCapital)
              .filter(([key]) => key !== "usedDefaultTemplate")
              .map(([head, amount]) => (
                <li key={head}>
                  {head}: ₹{Number(amount).toLocaleString("en-IN")}
                </li>
              ))}
        </ul>
      </section>

      <section className="report__section">
        <h3>{t("report.competitorMapping")}</h3>
        <p>
          {t("report.competitorCount", "Competitor Count")}: {competitorMapping?.count}{" "}
          {competitorMapping?.countConfidence?.verified ? (
            <span className="confidence-badge confidence-badge--verified">
              ✅ Field-verified ({competitorMapping.countConfidence.source}
              {competitorMapping.countConfidence.lastUpdated
                ? `, ${new Date(competitorMapping.countConfidence.lastUpdated).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                : ""}
              )
            </span>
          ) : (
            <span className="confidence-badge confidence-badge--estimate">
              ⚠️ Online estimate — not field-verified
            </span>
          )}
        </p>
        <p>
          {t("report.classifiedAs")} <strong>{competitorMapping?.classification?.replace(/_/g, " ")}</strong>
        </p>
        {competitorMapping?.countConfidence?.fieldReport && (
          <p className="field-report-note">
            📋 An unverified field report suggests a different count:{" "}
            {competitorMapping.countConfidence.fieldReport.value} ({competitorMapping.countConfidence.fieldReport.source})
          </p>
        )}
        <CompetitorMap points={competitorMapping?.points} classification={competitorMapping?.classification} />
      </section>

      <section className="report__section">
        <h3>{t("report.opportunityFinder")}</h3>
        <p>
          {t("report.requested")}: {opportunities?.requestedBusiness?.business} ({opportunities?.requestedBusiness?.score}/100)
        </p>
        <ul>
          {opportunities?.alternatives?.map((alt) => (
            <li key={alt.business}>
              {alt.business} — {alt.score}/100
            </li>
          ))}
        </ul>
        {opportunities?.improvementSuggestions?.length > 0 && (
          <>
            <p className="improvement-suggestions__label">Ways to improve your chosen business:</p>
            <ul>
              {opportunities.improvementSuggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="report__section">
        <h3>{t("report.localizedPricing")}</h3>
        <p>
          ₹{pricing?.range?.[0]}–₹{pricing?.range?.[1]} {pricing?.unit} ({t("report.confidence")}: {pricing?.confidence})
        </p>
      </section>

      <section className="report__section">
        <h3>{t("report.riskAnalysis")}</h3>
        <ul>
          {(Array.isArray(risks) ? risks : risks?.risks || []).map((risk) => (
            <li key={risk.type}>
              <strong>{risk.type}</strong> ({risk.severity}): {risk.description} — {risk.mitigation}
            </li>
          ))}
        </ul>
      </section>

      <section className="report__section report__section--recommendation">
        <h3>{t("report.recommendation")}</h3>
        <p className={`badge badge--${finalRecommendation}`}>
          {t(`report.${finalRecommendation}`)}
        </p>
        <p className="narrative">{narrative?.text}</p>
      </section>
    </div>
  );
}
