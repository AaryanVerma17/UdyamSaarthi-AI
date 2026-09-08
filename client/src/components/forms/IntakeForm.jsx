import { useState } from "react";
import { useTranslation } from "react-i18next";

const BUSINESS_CATEGORIES = [
  "Dairy",
  "Kirana",
  "Tailoring",
  "Food Processing",
  "Repair Shop",
];

const INITIAL_FORM = {
  village: "",
  block: "",
  district: "",
  state: "",
  ownCapital: "",
  businessCategory:
    BUSINESS_CATEGORIES[0],
};

export default function IntakeForm({
  onSubmit,
  isLoading,
}) {
  const { t } = useTranslation();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [errors, setErrors] =
    useState({});

  const [touched, setTouched] =
    useState({});


  function validate(values) {
    const nextErrors = {};

    if (!values.village.trim()) {
      nextErrors.village =
        t("form.errors.village");
    }

    if (!values.district.trim()) {
      nextErrors.district =
        t("form.errors.district");
    }

    if (!values.ownCapital) {
      nextErrors.ownCapital =
        t(
          "form.errors.capitalRequired"
        );
    } else {
      const capital =
        Number(values.ownCapital);

      if (
        Number.isNaN(capital) ||
        capital <= 0
      ) {
        nextErrors.ownCapital =
          t(
            "form.errors.capitalPositive"
          );
      }
    }

    return nextErrors;
  }


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    const nextForm = {
      ...form,
      [name]: value,
    };

    setForm(nextForm);

    if (touched[name]) {
      setErrors(
        validate(nextForm)
      );
    }
  }


  function handleBlur(event) {
    const { name } =
      event.target;

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }));

    setErrors(
      validate(form)
    );
  }


  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validate(form);

    setErrors(
      validationErrors
    );

    setTouched({
      village: true,
      district: true,
      ownCapital: true,
    });

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      return;
    }

    onSubmit({
      location: {
        village:
          form.village.trim(),

        block:
          form.block.trim(),

        district:
          form.district.trim(),

        state:
          form.state.trim(),
      },

      ownCapital:
        Number(form.ownCapital),

      businessCategory:
        form.businessCategory,
    });
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="intake-form"
      noValidate
    >
      <div className="form-header">
        <h2>
          {t("form.heading")}
        </h2>

        <p>
          {t("form.description")}
        </p>
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="village">
            {t("form.village")} *
          </label>

          <input
            id="village"
            name="village"
            value={form.village}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="address-level3"
            placeholder={t(
              "form.villagePlaceholder"
            )}
            className={
              touched.village &&
              errors.village
                ? "invalid"
                : ""
            }
            aria-invalid={Boolean(
              touched.village &&
              errors.village
            )}
          />

          {touched.village &&
            errors.village && (
              <span className="field-error">
                {errors.village}
              </span>
            )}
        </div>


        <div className="field-group">
          <label htmlFor="block">
            {t("form.block")}
          </label>

          <input
            id="block"
            name="block"
            value={form.block}
            onChange={handleChange}
            autoComplete="address-level2"
            placeholder={t(
              "form.blockPlaceholder"
            )}
          />
        </div>


        <div className="field-group">
          <label htmlFor="district">
            {t("form.district")} *
          </label>

          <input
            id="district"
            name="district"
            value={form.district}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="address-level2"
            placeholder={t(
              "form.districtPlaceholder"
            )}
            className={
              touched.district &&
              errors.district
                ? "invalid"
                : ""
            }
            aria-invalid={Boolean(
              touched.district &&
              errors.district
            )}
          />

          {touched.district &&
            errors.district && (
              <span className="field-error">
                {errors.district}
              </span>
            )}
        </div>


        <div className="field-group">
          <label htmlFor="state">
            {t("form.state")}
          </label>

          <input
            id="state"
            name="state"
            value={form.state}
            onChange={handleChange}
            autoComplete="address-level1"
            placeholder={t(
              "form.statePlaceholder"
            )}
          />
        </div>


        <div className="field-group">
          <label htmlFor="ownCapital">
            {t("form.ownCapital")} *
          </label>

          <input
            id="ownCapital"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            name="ownCapital"
            value={form.ownCapital}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t(
              "form.capitalPlaceholder"
            )}
            className={
              touched.ownCapital &&
              errors.ownCapital
                ? "invalid"
                : ""
            }
            aria-invalid={Boolean(
              touched.ownCapital &&
              errors.ownCapital
            )}
          />

          <p className="field-help">
            {t(
              "form.capitalHelp"
            )}
          </p>

          {touched.ownCapital &&
            errors.ownCapital && (
              <span className="field-error">
                {errors.ownCapital}
              </span>
            )}
        </div>


        <div className="field-group">
          <label htmlFor="businessCategory">
            {t(
              "form.businessCategory"
            )}
          </label>

          <select
            id="businessCategory"
            name="businessCategory"
            value={
              form.businessCategory
            }
            onChange={handleChange}
          >
            {BUSINESS_CATEGORIES.map(
              (business) => (
                <option
                  key={business}
                  value={business}
                >
                  {business}
                </option>
              )
            )}
          </select>
        </div>
      </div>


      <button
        type="submit"
        className="primary-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading-state">
            <span
              className="spinner"
              aria-hidden="true"
            />

            {t(
              "form.generating"
            )}
          </span>
        ) : (
          t("form.submit")
        )}
      </button>
    </form>
  );
}