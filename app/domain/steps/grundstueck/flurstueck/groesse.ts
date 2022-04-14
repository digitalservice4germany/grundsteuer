import { StepDefinition } from "~/domain/steps";
import { validateFlurstueckGroesseLength } from "~/domain/validation";

export type GrundstueckFlurstueckGroesseFields = {
  groesseHa: string;
  groesseA: string;
  groesseQm: string;
};

export const grundstueckFlurstueckGroesse: StepDefinition = {
  fields: {
    groesseHa: {
      validations: {
        onlyDecimal: {},
        flurstueckGroesseRequired: {},
        flurstueckGroesseLength: {},
        flurstueckGroesse: {},
      },
    },
    groesseA: {
      validations: {
        onlyDecimal: {},
        flurstueckGroesseRequired: {},
        flurstueckGroesseLength: {},
        flurstueckGroesse: {},
      },
    },
    groesseQm: {
      validations: {
        onlyDecimal: {},
        flurstueckGroesseRequired: {},
        flurstueckGroesseLength: {},
        flurstueckGroesse: {},
      },
    },
  },
};
