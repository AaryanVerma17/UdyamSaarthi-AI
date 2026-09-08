import { useTranslation } from "react-i18next";

export default function LocationStep({
  form,
  errors,
  touched,
  onChange,
  onBlur,
}) {
  const { t } = useTranslation();

  function fieldClass(name) {
    return touched[name] && errors[name]
      ? "invalid"
      : "";
  }

  function renderError(name) {
    if (!touched[name] || !errors[name]) {
      return null;
    }

    return (
      <span className="field-error">
        {errors[name]}
      </span>
    );
  }

  return (
    <div className="guided-step">
      <div className="guided-step__heading">
        <span className="guided-step__eyebrow">
          {t("form.step1Label")}
        </span>

        <h2>{t("form.locationTitle")}</h2>

        <p>
          {t("form.locationDescription")}
        </p>
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="village">
            {t("form.village")}{" "}
            <span>*</span>
          </label>

          <input
            id="village"
            name="village"
            value={form.village}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass("village")}
            autoComplete="address-level3"
            placeholder={t(
              "form.villagePlaceholder"
            )}
          />

          {renderError("village")}
        </div>

        <div className="field-group">
          <label htmlFor="block">
            {t("form.block")}
          </label>

          <input
            id="block"
            name="block"
            value={form.block}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass("block")}
            autoComplete="address-level2"
            placeholder={t(
              "form.blockPlaceholder"
            )}
          />

          <span className="field-hint">
            {t("form.blockHint")}
          </span>

          {renderError("block")}
        </div>

        <div className="field-group">
          <label htmlFor="district">
            {t("form.district")}{" "}
            <span>*</span>
          </label>

          <input
            id="district"
            name="district"
            value={form.district}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass("district")}
            autoComplete="address-level2"
            placeholder={t(
              "form.districtPlaceholder"
            )}
          />

          {renderError("district")}
        </div>

        <div className="field-group">
          <label htmlFor="state">
            {t("form.state")}{" "}
            <span>*</span>
          </label>

          <input
            id="state"
            name="state"
            value={form.state}
            onChange={onChange}
            onBlur={onBlur}
            className={fieldClass("state")}
            autoComplete="address-level1"
            placeholder={t(
              "form.statePlaceholder"
            )}
          />

          {renderError("state")}
        </div>
      </div>

      <div className="guided-info">
        <span className="guided-info__icon">
          i
        </span>

        <span>
          {t("form.locationEvidenceNote")}
        </span>
      </div>
    </div>
  );
}