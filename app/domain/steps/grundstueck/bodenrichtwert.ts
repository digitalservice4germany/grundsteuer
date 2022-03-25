import { StepDefinition } from "~/domain/steps";

export type GrundstueckBodenrichtwertFields = {
  bodenrichtwert: string;
  twoBodenrichtwerte: boolean;
};

export const grundstueckBodenrichtwert: StepDefinition = {
  fields: {
    bodenrichtwert: {
      validations: {},
    },
    twoBodenrichtwerte: {
      type: "checkbox",
      validations: {},
    },
  },
};
