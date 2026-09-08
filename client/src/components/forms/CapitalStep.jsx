import { useTranslation } from "react-i18next";

export default function CapitalStep({
  value,
  error,
  touched,
  onChange,
  onBlur,
}) {
  const { t } = useTranslation();

  const isInvalid =
    touched && Boolean(error);

  return (
    <div className="guided-step">
      <div className="guided-step__heading">
        <span className="guided-step__eyebrow">
          {t("form.step3Label")}
        </span>

        <h2>
          {t("form.capitalTitle")}
        </h2>

        <p>
          {t("form.capitalDescription")}
        </p>
      </div>

      <div className="capital-input-wrapper">
        <span className="capital-input-wrapper__symbol">
          ₹
        </span>

        <input
          id="ownCapital"
          name="ownCapital"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={
            isInvalid ? "invalid" : ""
          }
          placeholder="50,000"
          aria-invalid={isInvalid}
          aria-describedby="capital-hint"
        />
      </div>

      {isInvalid && (
        <span className="field-error">
          {error}
        </span>
      )}

      <span
        id="capital-hint"
        className="field-hint capital-hint"
      >
        {t("form.capitalHint")}
      </span>

      <div className="capital-example">
        <div className="capital-example__icon">
          ₹
        </div>

        <div>
          <strong>
            {t("form.capitalExampleTitle")}
          </strong>

          <p>
            {t("form.capitalExampleText")}
          </p>
        </div>
      </div>

      <div className="guided-info">
        <span className="guided-info__icon">
          i
        </span>

        <span>
          {t("form.capitalEvidenceNote")}
        </span>
      </div>
    </div>
  );
}