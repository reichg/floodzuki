import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useCallback, useEffect, useState } from "react";

type ValidationValues = Record<string, string>;

type Translate = ReturnType<typeof useLocale>["t"];

const VALIDATIONS = {
  presence: (fieldName: string, value: string, t: Translate) => {
    return value.length > 0 ? true : t("validations.presence", { fieldName });
  },
};

export const useValidations = (values: ValidationValues) => {
  const { t } = useLocale();
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrorMessages] = useState<string>();

  const validate = useCallback(
    (values: ValidationValues) => {
      const errors: Record<string, string> = {};

      Object.keys(values).forEach((key) => {
        const value = values[key];
        const validation = VALIDATIONS.presence;

        if (validation) {
          const error = validation(key, value, t);

          if (typeof error !== "boolean") {
            errors[key] = error;
          }
        }
      });

      setIsValid(Object.keys(errors).length === 0);
      setErrorMessages(Object.values(errors).join(", "));
    },
    [t]
  );

  useEffect(() => {
    validate(values);
  }, [validate, values]);

  return [isValid, errors] as const;
};
