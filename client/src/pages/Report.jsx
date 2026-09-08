import { useTranslation } from "react-i18next";

import ViabilityGauge from "../components/charts/ViabilityGauge";
import CompetitorMap from "../components/map/CompetitorMap";

import SectionCard from "../components/common/SectionCard";
import StatusBadge from "../components/common/StatusBadge";


function formatCurrency(value) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `₹${value.toLocaleString(
    "en-IN"
  )}`;
}


function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function getCompetitorEvidenceStatus(
  competitorMapping
) {
  if (
    competitorMapping?.countConfidence
      ?.verified
  ) {
    return "verified";
  }

  if (
    competitorMapping?.identifiable
  ) {
    return "identified";
  }

  return "unavailable";
}


export default function Report({
  report,
}) {
  const { t } =
    useTranslation();

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
    evidenceSummary,
    localMarket,
  } = report;


  const riskItems =
    Array.isArray(risks)
      ? risks
      : risks?.risks || [];


  const limitations =
    evidenceSummary
      ?.limitations || [];


  return (
    <div className="report">

      {/* =====================================================
          REPORT HEADER
          ===================================================== */}

      <header className="report-header">
        <div>
          <h2>
            {t(
              "report.title"
            )}
          </h2>

          <p>
            {report?.input?.businessCategory}
            {" · "}
            {report?.input?.location?.village}

            {report?.input?.location?.district
              ? `, ${report.input.location.district}`
              : ""}
          </p>
        </div>

        <StatusBadge
          status={
            finalRecommendation
          }
          label={t(
            `report.${finalRecommendation}`
          )}
        />
      </header>


      {/* =====================================================
          VIABILITY
          ===================================================== */}

      <SectionCard
        title={t(
          "report.viability"
        )}
      >
        <ViabilityGauge
          score={
            viability?.score
          }
          label={
            viability?.label
          }
        />

        <p className="explanation">
          {viability?.explanation}
        </p>

        {viability
          ?.estimateStatus && (
          <div
            style={{
              marginTop: "12px",
              textAlign: "center",
            }}
          >
            <StatusBadge
              status={
                viability.estimateStatus
              }
              label={formatLabel(
                viability.estimateStatus
              )}
            />
          </div>
        )}


        {recommendationGated &&
          surfacedAlternatives?.length >
            0 && (
            <div className="saturation-alert">
              <p className="saturation-alert__title">
                ⚠{" "}
                {t(
                  "report.saturationTitle"
                )}
              </p>

              <p>
                {t(
                  "report.saturationDescription"
                )}
              </p>

              <ul>
                {surfacedAlternatives.map(
                  (alternative) => (
                    <li
                      key={
                        alternative.business
                      }
                    >
                      <strong>
                        {
                          alternative.business
                        }
                      </strong>
                      {" — "}
                      {
                        alternative.score
                      }
                      /100
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
      </SectionCard>


      {/* =====================================================
          FINANCIAL STRUCTURE
          ===================================================== */}

      <SectionCard
        title={t(
          "report.financialStructure"
        )}
      >
        <div className="report-stat-grid">

          <div className="report-stat">
            <p className="report-stat__label">
              {t(
                "report.projectCost"
              )}
            </p>

            <p className="report-stat__value">
              {formatCurrency(
                financials?.projectCost
              )}
            </p>
          </div>


          <div className="report-stat">
            <p className="report-stat__label">
              {t(
                "report.loanAmount"
              )}
            </p>

            <p className="report-stat__value">
              {formatCurrency(
                financials?.loanAmount
              )}
            </p>
          </div>


          <div className="report-stat">
            <p className="report-stat__label">
              {t(
                "report.quarterlyInstallment"
              )}
            </p>

            <p className="report-stat__value">
              {formatCurrency(
                repayment?.quarterlyInstallment
              )}
            </p>
          </div>

        </div>


        <ul
          style={{
            marginTop: "18px",
          }}
        >
          <li>
            {t(
              "report.scheme"
            )}
            :{" "}
            <strong>
              {scheme?.name ||
                "—"}
            </strong>
          </li>

          <li>
            {t(
              "report.interestRate"
            )}
            :{" "}
            {scheme?.interestRate !=
            null
              ? `${scheme.interestRate}%`
              : "—"}
          </li>

          <li>
            {t(
              "report.tenure"
            )}
            :{" "}
            {scheme?.tenureYears !=
            null
              ? `${scheme.tenureYears} years`
              : "—"}
          </li>

          <li>
            {t(
              "report.repaymentCapacity"
            )}
            :{" "}

            <StatusBadge
              status={String(
                repayment?.repaymentCapacity ||
                  "unknown"
              ).toLowerCase()}
              label={
                repayment?.repaymentCapacity ||
                "Unknown"
              }
            />
          </li>
        </ul>


        {financials
          ?.financingRuleStatus && (
          <div className="limitations">
            <strong>
              {t(
                "report.financingRuleStatus"
              )}
            </strong>

            <p>
              {formatLabel(
                financials.financingRuleStatus
              )}
            </p>

            <p>
              {t(
                "report.provisionalFinancialWarning"
              )}
            </p>
          </div>
        )}
      </SectionCard>


      {/* =====================================================
          WORKING CAPITAL
          ===================================================== */}

      <SectionCard
        title={t(
          "report.workingCapitalAllocation"
        )}
      >
        <ul>
          {workingCapital &&
            Object.entries(
              workingCapital
            )
              .filter(
                ([key]) =>
                  ![
                    "usedDefaultTemplate",
                    "planningBasis",
                    "warning",
                  ].includes(key)
              )
              .map(
                ([
                  head,
                  amount,
                ]) => (
                  <li
                    key={head}
                  >
                    {formatLabel(
                      head
                    )}
                    :{" "}
                    {formatCurrency(
                      Number(amount)
                    )}
                  </li>
                )
              )}
        </ul>

        {workingCapital
          ?.warning && (
          <div className="limitations">
            <strong>
              {t(
                "report.note"
              )}
            </strong>

            <p>
              {
                workingCapital.warning
              }
            </p>
          </div>
        )}
      </SectionCard>


      {/* =====================================================
          COMPETITION
          ===================================================== */}

      <SectionCard
        title={t(
          "report.competitorMapping"
        )}
      >
        <p>
          <strong>
            {competitorMapping?.count ??
              0}
          </strong>{" "}

          {t(
            "report.identifiableCompetitors"
          )}

          <span
            className={`confidence-badge confidence-badge--${
              getCompetitorEvidenceStatus(
                competitorMapping
              ) === "verified"
                ? "verified"
                : getCompetitorEvidenceStatus(
                    competitorMapping
                  ) === "identified"
                ? "estimate"
                : "unavailable"
            }`}
          >
            {getCompetitorEvidenceStatus(
              competitorMapping
            ) === "verified"
              ? `✓ ${t(
                  "report.fieldVerified"
                )}`
              : getCompetitorEvidenceStatus(
                  competitorMapping
                ) === "identified"
              ? `• ${t(
                  "report.identifiableData"
                )}`
              : `• ${t(
                  "report.dataUnavailable"
                )}`}
          </span>
        </p>


        <p>
          {t(
            "report.classifiedAs"
          )}{" "}

          <strong>
            {formatLabel(
              competitorMapping?.classification
            )}
          </strong>
        </p>


        <p className="field-report-note">
          {
            competitorMapping
              ?.dataConfidenceNote
          }
        </p>


        <CompetitorMap
          points={
            competitorMapping?.points
          }
          classification={
            competitorMapping?.classification
          }
        />
      </SectionCard>


      {/* =====================================================
          OPPORTUNITIES
          ===================================================== */}

      <SectionCard
        title={t(
          "report.opportunityFinder"
        )}
      >
        <p>
          {t(
            "report.requested"
          )}
          :{" "}

          <strong>
            {
              opportunities
                ?.requestedBusiness
                ?.business
            }
          </strong>

          {" ("}

          {
            opportunities
              ?.requestedBusiness
              ?.score
          }

          /100)
        </p>


        {opportunities
          ?.alternatives
          ?.length > 0 && (
          <>
            <p>
              <strong>
                {t(
                  "report.alternatives"
                )}
              </strong>
            </p>

            <ul>
              {opportunities.alternatives.map(
                (alternative) => (
                  <li
                    key={
                      alternative.business
                    }
                  >
                    {
                      alternative.business
                    }
                    {" — "}
                    {
                      alternative.score
                    }
                    /100
                    {" · "}

                    <StatusBadge
                      status={
                        alternative.evidenceStatus
                      }
                      label={formatLabel(
                        alternative.evidenceStatus
                      )}
                    />
                  </li>
                )
              )}
            </ul>
          </>
        )}


        {opportunities
          ?.improvementSuggestions
          ?.length > 0 && (
          <>
            <p
              style={{
                marginTop:
                  "18px",
                fontWeight:
                  800,
              }}
            >
              {t(
                "report.improvementSuggestions"
              )}
            </p>

            <ul>
              {opportunities.improvementSuggestions.map(
                (suggestion) => (
                  <li
                    key={
                      suggestion
                    }
                  >
                    {
                      suggestion
                    }
                  </li>
                )
              )}
            </ul>
          </>
        )}
      </SectionCard>


      {/* =====================================================
          PRICING
          ===================================================== */}

      <SectionCard
        title={t(
          "report.localizedPricing"
        )}
      >
        <p>
          <span className="price-range">
            ₹
            {pricing?.range?.[0] ??
              "—"}
            {"–"}
            ₹
            {pricing?.range?.[1] ??
              "—"}
          </span>

          <span className="price-unit">
            {pricing?.unit}
          </span>
        </p>


        <p>
          {t(
            "report.confidence"
          )}
          :{" "}

          <StatusBadge
            status={
              pricing?.confidence ||
              "unknown"
            }
            label={
              pricing?.confidence ||
              "Unknown"
            }
          />
        </p>


        {pricing?.estimated && (
          <div className="limitations">
            <strong>
              {t(
                "report.estimatedPrice"
              )}
            </strong>

            <p>
              {t(
                "report.estimatedPriceDescription"
              )}
            </p>
          </div>
        )}
      </SectionCard>


      {/* =====================================================
          RISK
          ===================================================== */}

      <SectionCard
        title={t(
          "report.riskAnalysis"
        )}
      >
        <ul>
          {riskItems.map(
            (risk) => (
              <li
                key={risk.type}
              >
                <strong>
                  {formatLabel(
                    risk.type
                  )}
                </strong>{" "}

                <StatusBadge
                  status={
                    risk.severity
                  }
                  label={
                    risk.severity
                  }
                />

                <div>
                  {
                    risk.description
                  }
                </div>

                <div>
                  <strong>
                    {t(
                      "report.mitigation"
                    )}
                    :
                  </strong>{" "}

                  {
                    risk.mitigation
                  }
                </div>
              </li>
            )
          )}
        </ul>
      </SectionCard>


      {/* =====================================================
          EVIDENCE
          ===================================================== */}

      <SectionCard
        title={t(
          "report.evidence"
        )}
        className="report__section--evidence"
      >
        <div className="evidence-list">

          <div className="evidence-item">
            <p className="evidence-item__label">
              {t(
                "report.locationSource"
              )}
            </p>

            <p className="evidence-item__value">
              {
                evidenceSummary
                  ?.locationSource
                  ?.source
              }
            </p>
          </div>


          <div className="evidence-item">
            <p className="evidence-item__label">
              {t(
                "report.competitorCoverage"
              )}
            </p>

            <p className="evidence-item__value">
              {
                evidenceSummary
                  ?.competitorCoverage ||
                "Unknown"
              }
            </p>
          </div>


          <div className="evidence-item">
            <p className="evidence-item__label">
              {t(
                "report.pricingStatus"
              )}
            </p>

            <p className="evidence-item__value">
              {
                evidenceSummary
                  ?.pricingStatus
              }
            </p>
          </div>


          <div className="evidence-item">
            <p className="evidence-item__label">
              {t(
                "report.schemeRuleStatus"
              )}
            </p>

            <p className="evidence-item__value">
              {formatLabel(
                evidenceSummary
                  ?.schemeRuleStatus
              )}
            </p>
          </div>

        </div>


        {limitations.length >
          0 && (
          <div className="limitations">
            <strong>
              {t(
                "report.dataLimitations"
              )}
            </strong>

            <ul>
              {limitations.map(
                (limitation) => (
                  <li
                    key={
                      limitation
                    }
                  >
                    {
                      limitation
                    }
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </SectionCard>


      {/* =====================================================
          FINAL RECOMMENDATION
          ===================================================== */}

      <SectionCard
        title={t(
          "report.recommendation"
        )}
        className="report__section--recommendation"
      >
        <StatusBadge
          status={
            finalRecommendation
          }
          label={t(
            `report.${finalRecommendation}`
          )}
        />

        <p className="narrative">
          {narrative?.text}
        </p>
      </SectionCard>

    </div>
  );
}