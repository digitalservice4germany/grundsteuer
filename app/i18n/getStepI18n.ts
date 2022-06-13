import { i18Next } from "~/i18n.server";

export type I18nObjectField = {
  label: string;
  options?: {
    [index: string]: {
      label: string;
      help?: string;
      description?: string;
    };
  };
  placeholder?: string;
  help?: string;
};

export type I18nObject = {
  headline: string;
  description?: string;
  hint?: string;
  fields: {
    [index: string]: I18nObjectField;
  };
  specifics: Record<string, string>;
  help: Record<string, string>;
  nextButtonLabel: string;
  common: Record<string, string>;
};

export const getStepI18n = async (
  stepI18nKey: string,
  stepI18nParams?: { id?: string },
  bundesland = "default",
  prefix = ""
) => {
  const tFunction = await i18Next.getFixedT("de", "all");
  let key = prefix ? prefix + "." + stepI18nKey : stepI18nKey;
  if (
    [
      "grundstueck.bodenrichtwertInfo",
      "grundstueck.bodenrichtwertAnzahl",
    ].includes(stepI18nKey)
  ) {
    key = `${stepI18nKey}.${bundesland.toLowerCase()}`;
  }
  return {
    ...tFunction(key, stepI18nParams),
    common: { ...tFunction("common") },
  } as I18nObject;
};
