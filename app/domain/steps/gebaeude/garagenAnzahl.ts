import { StepDefinition } from "~/domain/steps/index.server";

export type GebaeudeGaragenAnzahlFields = {
  anzahlGaragen: string;
};

export const gebaeudeGaragenAnzahl: StepDefinition = {
  fields: {
    anzahlGaragen: {
      validations: {
        required: {},
        onlyDecimal: {},
        noZero: {},
        maxLength: {
          maxLength: 4,
          msg: "Die Zahl darf höchstens 4 Ziffern beinhalten",
        },
      },
    },
  },
};
