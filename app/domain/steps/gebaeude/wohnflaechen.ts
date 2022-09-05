import { StepDefinition } from "~/domain/steps/index.server";

export type GebaeudeWohnflaechenFields = {
  wohnflaeche1: string;
  wohnflaeche2: string;
};

export const gebaeudeWohnflaechen: StepDefinition = {
  fields: {
    wohnflaeche1: {
      validations: {
        required: {},
        onlyDecimal: {},
        noZero: {},
        maxLength: {
          maxLength: 6,
          msg: "Die Zahl darf nur bis zu 6 Ziffern beinhalten",
        },
      },
    },
    wohnflaeche2: {
      validations: {
        required: {},
        onlyDecimal: {},
        noZero: {},
        maxLength: {
          maxLength: 6,
          msg: "Die Zahl darf nur bis zu 6 Ziffern beinhalten",
        },
      },
    },
  },
};
