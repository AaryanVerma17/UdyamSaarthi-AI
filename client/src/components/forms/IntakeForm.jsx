import { useState } from "react";
import { useTranslation } from "react-i18next";

const BUSINESS_CATEGORIES = ["Dairy", "Kirana", "Tailoring", "Food Processing", "Repair Shop"];

export default function IntakeForm({ onSubmit, isLoading }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    village: "",
    block: "",
    district: "",
    state: "",
    ownCapital: "",
    businessCategory: BUSINESS_CATEGORIES[0],
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function validate(values) {
    const nextErrors = {};
    if (!values.village.trim()) nextErrors.village = "Village is required";
    if (!values.district.trim()) nextErrors.district = "District is required";
    const capital = Number(values.ownCapital);
    if (!values.ownCapital) {
      nextErrors.ownCapital = "Please enter your available capital";
    } else if (Number.isNaN(capital) || capital <= 0) {
      nextErrors.ownCapital = "Capital must be a positive number";
    }
    return nextErrors;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    if (touched[name]) {
      setErrors(validate(nextForm));
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(form));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setTouched({ village: true, district: true, ownCapital: true });

    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      location: {
        village: form.village,
        block: form.block,
        district: form.district,
        state: form.state,
      },
      ownCapital: form.ownCapital,
      businessCategory: form.businessCategory,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="intake-form" noValidate>
      <div className="field-group">
        <label>{t("form.village")} *</label>
        <input
          name="village"
          value={form.village}
          onChange={handleChange}
          onBlur={handleBlur}
          className={touched.village && errors.village ? "invalid" : ""}
        />
        {touched.village && errors.village && <span className="field-error">{errors.village}</span>}
      </div>

      <div className="field-group">
        <label>{t("form.block")}</label>
        <input name="block" value={form.block} onChange={handleChange} />
      </div>

      <div className="field-group">
        <label>{t("form.district")} *</label>
        <input
          name="district"
          value={form.district}
          onChange={handleChange}
          onBlur={handleBlur}
          className={touched.district && errors.district ? "invalid" : ""}
        />
        {touched.district && errors.district && <span className="field-error">{errors.district}</span>}
      </div>

      <div className="field-group">
        <label>{t("form.state")}</label>
        <input name="state" value={form.state} onChange={handleChange} />
      </div>

      <div className="field-group">
        <label>{t("form.ownCapital")} *</label>
        <input
          type="number"
          min="1"
          name="ownCapital"
          value={form.ownCapital}
          onChange={handleChange}
          onBlur={handleBlur}
          className={touched.ownCapital && errors.ownCapital ? "invalid" : ""}
        />
        {touched.ownCapital && errors.ownCapital && <span className="field-error">{errors.ownCapital}</span>}
      </div>

      <div className="field-group">
        <label>{t("form.businessCategory")}</label>
        <select name="businessCategory" value={form.businessCategory} onChange={handleChange}>
          {BUSINESS_CATEGORIES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "..." : t("form.submit")}
      </button>
    </form>
  );
}
