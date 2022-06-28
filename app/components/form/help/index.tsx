import SteuernummerHelp from "~/components/form/help/grundstueck/Steuernummer";
import _ from "lodash";
import { GrundModel } from "~/domain/steps";
import { I18nObjectField } from "~/i18n/getStepI18n";
import DefaultHelpContent from "~/components/form/help/Default";
import GrundstueckAnzahlHelp from "~/components/form/help/grundstueck/GrundstueckAnzahl";
import GemarkungHelp from "~/components/form/help/grundstueck/Gemarkung";
import { getCurrentStateWithoutId } from "~/util/getCurrentState";
import GrundbuchblattHelp from "~/components/form/help/grundstueck/Grundbuchblatt";
import FlurHelp from "~/components/form/help/grundstueck/Flur";
import EigentuemerAnzahlHelp from "~/components/form/help/eigentuemer/EigentuemerAnzahl";
import { BodenrichtwertEingabeHelp } from "~/components/form/help/grundstueck/bodenrichtwert/BodenrichtwertEingabeHelp";

export const helpComponents = {
  grundstueck: {
    steuernummer: { steuernummer: SteuernummerHelp },
    anzahl: { anzahl: GrundstueckAnzahlHelp },
    bodenrichtwertEingabe: { bodenrichtwert: BodenrichtwertEingabeHelp },
    flurstueck: {
      angaben: {
        gemarkung: GemarkungHelp,
        grundbuchblattnummer: GrundbuchblattHelp,
      },
      flur: {
        flur: FlurHelp,
      },
    },
  },
  eigentuemer: {
    anzahl: {
      anzahl: EigentuemerAnzahlHelp,
    },
  },
};

export const getHelpComponent = ({
  path,
  allData,
  i18n,
  helpText,
}: {
  path: string;
  allData?: GrundModel;
  i18n?: I18nObjectField;
  helpText?: string;
}) => {
  const pathWithoutId = getCurrentStateWithoutId(path);
  const helpComponent = _.get(helpComponents, pathWithoutId);
  if (helpComponent) {
    return helpComponent({ allData, i18n });
  } else if (helpText) {
    return (
      <DefaultHelpContent elements={[{ type: "paragraph", value: helpText }]} />
    );
  }
};
