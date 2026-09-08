import { useTranslation } from "react-i18next";

const BUSINESS_CATEGORIES = [
  {
    value: "Dairy",
    icon: "🐄",
  },
  {
    value: "Kirana",
    icon: "🛒",
  },
  {
    value: "Tailoring",
    icon: "🧵",
  },
  {
    value: "Food Processing",
    icon: "🥫",
  },
  {
    value: "Repair Shop",
    icon: "🔧",
  },
];

export { BUSINESS_CATEGORIES };

export default function BusinessStep({
  value,
  onChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="guided-step">
      <div className="guided-step__heading">
        <span className="guided-step__eyebrow">
          {t("form.step2Label")}
        </span>

        <h2>
          {t("form.businessTitle")}
        </h2>

        <p>
          {t("form.businessDescription")}
        </p>
      </div>

      <div className="business-options">
        {BUSINESS_CATEGORIES.map(
          (business) => {
            const selected =
              value === business.value;

            return (
              <label
                key={business.value}
                className={[
                  "business-option",
                  selected
                    ? "business-option--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name="businessCategory"
                  value={business.value}
                  checked={selected}
                  onChange={onChange}
                />

                <span className="business-option__icon">
                  {business.icon}
                </span>

                <span className="business-option__content">
                  <strong>
                    {t(
                      `businessCategories.${business.value}`
                    )}
                  </strong>

                  <small>
                    {t(
                      `businessCategories.${business.value}Description`
                    )}
                  </small>
                </span>

                <span className="business-option__check">
                  {selected ? "✓" : ""}
                </span>
              </label>
            );
          }
        )}
      </div>

      <div className="guided-info">
        <span className="guided-info__icon">
          i
        </span>

        <span>
          {t("form.businessEvidenceNote")}
        </span>
      </div>
    </div>
  );
}