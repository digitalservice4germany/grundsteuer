import { PruefenMachineContext } from "~/domain/pruefen/states";

export type PruefenCondition = (
  context: PruefenMachineContext | undefined
) => boolean;
export type PruefenConditions = Record<string, PruefenCondition>;

const isEigentuemer: PruefenCondition = (context) => {
  const eligibleEigentuemerArten = [
    "eigentuemer",
    "angehoerig",
    "eigentuemerNeu",
  ];
  return !!(
    context?.start?.abgeber &&
    eligibleEigentuemerArten.includes(context.start.abgeber)
  );
};

const isPrivatperson: PruefenCondition = (context) => {
  return (
    context?.eigentuemerTyp?.eigentuemerTyp == "privatperson" ||
    context?.eigentuemerTyp?.eigentuemerTyp == "mehrereErben"
  );
};

const isBundesmodelBundesland: PruefenCondition = (context) => {
  const bundesmodellBundeslaender = [
    "BE",
    "BB",
    "HB",
    "MV",
    "NW",
    "RP",
    "SL",
    "SN",
    "ST",
    "SH",
    "TH",
  ];
  return !!(
    context?.bundesland?.bundesland &&
    bundesmodellBundeslaender.includes(context.bundesland.bundesland)
  );
};

const isEligibleGrundstueckArt: PruefenCondition = (context) => {
  const eligibleGrundstueckArten = [
    "einfamilienhaus",
    "zweifamilienhaus",
    "eigentumswohnung",
    "unbebaut",
  ];
  return !!(
    context?.grundstueckArt?.grundstueckArt &&
    eligibleGrundstueckArten.includes(context.grundstueckArt.grundstueckArt)
  );
};

const isNotAusland: PruefenCondition = (context) => {
  return context?.ausland?.ausland == "false";
};

const isNotFremderBoden: PruefenCondition = (context) => {
  const notFremderBoden = ["false", "noBuilding"];
  return !!(
    context?.fremderBoden?.fremderBoden &&
    notFremderBoden.includes(context.fremderBoden.fremderBoden)
  );
};

const isNotBeguenstigung: PruefenCondition = (context) => {
  return context?.beguenstigung?.beguenstigung == "false";
};

const hasMiteigentum: PruefenCondition = (context) => {
  const eligibleOptions = ["keine"];
  return !!(
    context?.miteigentum?.miteigentum &&
    eligibleOptions.includes(context.miteigentum.miteigentum)
  );
};

export const pruefenConditions: PruefenConditions = {
  isPrivatperson,
  isEigentuemer,
  isBundesmodelBundesland,
  isEligibleGrundstueckArt,
  isNotAusland,
  isNotFremderBoden,
  isNotBeguenstigung,
  hasMiteigentum,
};
