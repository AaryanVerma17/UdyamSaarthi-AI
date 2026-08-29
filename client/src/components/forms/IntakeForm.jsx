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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="intake-form">
      <div className="field-group">
        <label>{t("form.village")}</label>
        <input name="village" value={form.village} onChange={handleChange} required />
      </div>
      <div className="field-group">
        <label>{t("form.block")}</label>
        <input name="block" value={form.block} onChange={handleChange} />
      </div>
      <div className="field-group">
        <label>{t("form.district")}</label>
        <input name="district" value={form.district} onChange={handleChange} required />
      </div>
      <div className="field-group">
        <label>{t("form.state")}</label>
        <input name="state" value={form.state} onChange={handleChange} />
      </div>
      <div className="field-group">
        <label>{t("form.ownCapital")}</label>
        <input
          type="number"
          min="1"
          name="ownCapital"
          value={form.ownCapital}
          onChange={handleChange}
          required
        />
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
