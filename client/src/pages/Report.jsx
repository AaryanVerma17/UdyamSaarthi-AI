import { useTranslation } from "react-i18next";
import ViabilityGauge from "../components/charts/ViabilityGauge";

export default function Report({ report }) {
  const { t } = useTranslation();
  const {
    viability,
    financials,
    scheme,
    repayment,
    workingCapital,
    opportunities,
    pricing,
    risks,
    competitorMapping,
    finalRecommendation,
    narrative,
  } = report;

  return (
    <div className="report">
      <section className="report__section">
        <ViabilityGauge score={viability?.score} label={viability?.label} />
        <p className="explanation">{viability?.explanation}</p>
      </section>

      <section className="report__section">
        <h3>Financial Structure</h3>
        <ul>
          <li>{t("report.projectCost")}: ₹{financials?.projectCost?.toLocaleString("en-IN")}</li>
          <li>{t("report.loanAmount")}: ₹{financials?.loanAmount?.toLocaleString("en-IN")}</li>
          <li>{t("report.scheme")}: {scheme?.name} ({scheme?.interestRate}% · {scheme?.tenureYears} yrs)</li>
          <li>{t("report.quarterlyInstallment")}: ₹{repayment?.quarterlyInstallment?.toLocaleString("en-IN")}</li>
          <li>Repayment Capacity: {repayment?.repaymentCapacity}</li>
        </ul>
      </section>

      <section className="report__section">
        <h3>Working Capital Allocation</h3>
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
        <h3>Competitor Mapping</h3>
        <p>
          {competitorMapping?.count} identifiable competitors found — classified as{" "}
          <strong>{competitorMapping?.classification?.replace(/_/g, " ")}</strong>
        </p>
      </section>

      <section className="report__section">
        <h3>Opportunity Finder</h3>
        <p>Requested: {opportunities?.requestedBusiness?.business} ({opportunities?.requestedBusiness?.score}/100)</p>
        <ul>
          {opportunities?.alternatives?.map((alt) => (
            <li key={alt.business}>
              {alt.business} — {alt.score}/100
            </li>
          ))}
        </ul>
      </section>

      <section className="report__section">
        <h3>Localized Pricing</h3>
        <p>
          ₹{pricing?.range?.[0]}–₹{pricing?.range?.[1]} {pricing?.unit} (confidence: {pricing?.confidence})
        </p>
      </section>

      <section className="report__section">
        <h3>Risk Analysis</h3>
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
