import {
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import StepIndicator from "./StepIndicator";
import LocationStep from "./LocationStep";
import BusinessStep from "./BusinessStep";
import CapitalStep from "./CapitalStep";

const INITIAL_FORM = {
  village: "",
  block: "",
  district: "",
  state: "",
  ownCapital: "",
  businessCategory: "Dairy",
};

const STEP_KEYS = [
  "location",
  "business",
  "capital",
];

export default function IntakeForm({
  onSubmit,
  isLoading,
}) {
  const { t } = useTranslation();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [currentStep, setCurrentStep] =
    useState(1);

  const [errors, setErrors] =
    useState({});

  const [touched, setTouched] =
    useState({});

  const steps = useMemo(
    () =>
      STEP_KEYS.map((key) => ({
        key,
        label: t(
          `form.steps.${key}`
        ),
      })),
    [t]
  );

  function validate(
    values,
    step = null
  ) {
    const nextErrors = {};

    const shouldValidateLocation =
      step === null || step === 1;

    const shouldValidateBusiness =
      step === null || step === 2;

    const shouldValidateCapital =
      step === null || step === 3;

    if (shouldValidateLocation) {
      if (!values.village.trim()) {
        nextErrors.village = t(
          "validation.villageRequired"
        );
      }

      if (!values.district.trim()) {
        nextErrors.district = t(
          "validation.districtRequired"
        );
      }

      if (!values.state.trim()) {
        nextErrors.state = t(
          "validation.stateRequired"
        );
      }
    }

    if (shouldValidateBusiness) {
      if (!values.businessCategory) {
        nextErrors.businessCategory =
          t(
            "validation.businessRequired"
          );
      }
    }

    if (shouldValidateCapital) {
      if (
        values.ownCapital === "" ||
        values.ownCapital === null ||
        values.ownCapital === undefined
      ) {
        nextErrors.ownCapital = t(
          "validation.capitalRequired"
        );
      } else {
        const capital = Number(
          values.ownCapital
        );

        if (
          !Number.isFinite(capital) ||
          capital <= 0
        ) {
          nextErrors.ownCapital = t(
            "validation.capitalPositive"
          );
        } else if (
          !Number.isInteger(capital)
        ) {
          nextErrors.ownCapital = t(
            "validation.capitalInteger"
          );
        }
      }
    }

    return nextErrors;
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (touched[name]) {
      const nextValues = {
        ...form,
        [name]: value,
      };

      setErrors((previous) => ({
        ...previous,
        ...validate(
          nextValues,
          currentStep
        ),
      }));
    }
  }

  function handleBlur(event) {
    const { name } = event.target;

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }));

    setErrors((previous) => ({
      ...previous,
      ...validate(
        form,
        currentStep
      ),
    }));
  }

  function markStepTouched(step) {
    if (step === 1) {
      setTouched((previous) => ({
        ...previous,
        village: true,
        district: true,
        state: true,
      }));
    }

    if (step === 2) {
      setTouched((previous) => ({
        ...previous,
        businessCategory: true,
      }));
    }

    if (step === 3) {
      setTouched((previous) => ({
        ...previous,
        ownCapital: true,
      }));
    }
  }

  function handleNext() {
    const stepErrors = validate(
      form,
      currentStep
    );

    markStepTouched(currentStep);

    setErrors((previous) => ({
      ...previous,
      ...stepErrors,
    }));

    if (
      Object.keys(stepErrors).length > 0
    ) {
      return;
    }

    setCurrentStep((previous) =>
      Math.min(
        previous + 1,
        steps.length
      )
    );
  }

  function handleBack() {
    setErrors({});

    setCurrentStep((previous) =>
      Math.max(previous - 1, 1)
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validate(form, null);

    setErrors(validationErrors);

    setTouched({
      village: true,
      district: true,
      state: true,
      businessCategory: true,
      ownCapital: true,
    });

    if (
      Object.keys(validationErrors)
        .length > 0
    ) {
      if (
        validationErrors.village ||
        validationErrors.district ||
        validationErrors.state
      ) {
        setCurrentStep(1);
      } else if (
        validationErrors.businessCategory
      ) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }

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

      ownCapital: Number(
        form.ownCapital
      ),

      businessCategory:
        form.businessCategory,
    });
  }

  function renderCurrentStep() {
    if (currentStep === 1) {
      return (
        <LocationStep
          form={form}
          errors={errors}
          touched={touched}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <BusinessStep
          value={
            form.businessCategory
          }
          onChange={handleChange}
        />
      );
    }

    return (
      <CapitalStep
        value={form.ownCapital}
        error={errors.ownCapital}
        touched={touched.ownCapital}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }

  const isLastStep =
    currentStep === steps.length;

  return (
    <section className="intake-container">
      <StepIndicator
        currentStep={currentStep}
        steps={steps}
      />

      <form
        onSubmit={handleSubmit}
        className="intake-form guided-intake-form"
        noValidate
      >
        {renderCurrentStep()}

        <div className="guided-form-actions">
          {currentStep > 1 ? (
            <button
              type="button"
              className="secondary-btn"
              onClick={handleBack}
              disabled={isLoading}
            >
              ← {t("form.back")}
            </button>
          ) : (
            <span />
          )}

          {!isLastStep ? (
            <button
              type="button"
              className="primary-btn"
              onClick={handleNext}
              disabled={isLoading}
            >
              {t("form.continue")} →
            </button>
          ) : (
            <button
              type="submit"
              className="primary-btn"
              disabled={isLoading}
            >
              {isLoading
                ? t("form.generating")
                : t("form.submit")}
            </button>
          )}
        </div>

        <div className="required-note">
          * {t("form.requiredFields")}
        </div>
      </form>
    </section>
  );
}