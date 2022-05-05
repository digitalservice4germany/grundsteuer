import { MachineConfig } from "xstate";
import { GrundModel } from "./steps";

export interface StateMachineContext extends GrundModel {
  personId?: number;
  flurstueckId?: number;
}

export const states: MachineConfig<any, any, any> = {
  id: "steps",
  initial: "welcome",
  states: {
    welcome: {
      on: {
        NEXT: [{ target: "grundstueck" }],
      },
    },
    grundstueck: {
      id: "grundstueck",
      initial: "uebersicht",
      states: {
        uebersicht: {
          on: {
            NEXT: [{ target: "typ" }],
          },
        },
        typ: {
          on: {
            NEXT: [
              {
                target: "abweichendeEntwicklung",
                cond: "isAbweichendeEntwicklung",
              },
              { target: "adresse" },
            ],
            BACK: [{ target: "uebersicht" }],
          },
        },
        abweichendeEntwicklung: {
          on: {
            NEXT: [{ target: "adresse" }],
            BACK: [{ target: "typ" }],
          },
        },
        adresse: {
          on: {
            BACK: [
              {
                target: "abweichendeEntwicklung",
                cond: "isAbweichendeEntwicklung",
              },
              { target: "typ" },
            ],
            NEXT: [{ target: "steuernummer" }],
          },
        },
        steuernummer: {
          on: {
            NEXT: [{ target: "gemeinde" }],
            BACK: [{ target: "adresse" }],
          },
        },
        gemeinde: {
          on: {
            NEXT: [{ target: "anzahl" }],
            BACK: [{ target: "steuernummer" }],
          },
        },
        anzahl: {
          on: {
            NEXT: [{ target: "flurstueck" }],
            BACK: [{ target: "gemeinde" }],
          },
        },
        flurstueck: {
          id: "flurstueck",
          initial: "angaben",
          states: {
            angaben: {
              on: {
                NEXT: [{ target: "flur" }],
                BACK: [
                  {
                    target: "groesse",
                    cond: "flurstueckIdGreaterThanOne",
                    actions: ["decrementFlurstueckId"],
                  },
                  { target: "#grundstueck.anzahl" },
                ],
              },
            },
            flur: {
              on: {
                NEXT: [{ target: "miteigentum" }],
                BACK: [{ target: "angaben" }],
              },
            },
            miteigentum: {
              on: {
                NEXT: [
                  { target: "miteigentumsanteil", cond: "hasMiteigentum" },
                  { target: "groesse" },
                ],
                BACK: [{ target: "flur" }],
              },
            },
            miteigentumsanteil: {
              on: {
                NEXT: [{ target: "groesse" }],
                BACK: [{ target: "miteigentum" }],
              },
            },
            groesse: {
              on: {
                NEXT: [
                  {
                    target: "angaben",
                    cond: "repeatFlurstueck",
                    actions: ["incrementFlurstueckId"],
                  },
                  { target: "#grundstueck.bodenrichtwertInfo" },
                ],
                BACK: [
                  { target: "miteigentumsanteil", cond: "hasMiteigentum" },
                  { target: "miteigentum" },
                ],
              },
            },
          },
        },
        bodenrichtwertInfo: {
          on: {
            NEXT: [{ target: "bodenrichtwertEingabe" }],
            BACK: [
              {
                target: "#flurstueck.groesse",
                actions: "setFlurstueckIdToMaximum",
              },
            ],
          },
        },
        bodenrichtwertEingabe: {
          on: {
            NEXT: [{ target: "bodenrichtwertAnzahl" }],
            BACK: [
              {
                target: "bodenrichtwertInfo",
              },
            ],
          },
        },
        bodenrichtwertAnzahl: {
          on: {
            NEXT: [
              { target: "#steps.gebaeude", cond: "isBebaut" },
              { target: "#steps.eigentuemer" },
            ],
            BACK: [{ target: "bodenrichtwertEingabe" }],
          },
        },
      },
      on: {
        BACK: { target: "welcome" },
      },
    },
    gebaeude: {
      id: "gebaeude",
      initial: "uebersicht",
      states: {
        uebersicht: {
          on: {
            NEXT: { target: "ab1949" },
          },
        },
        ab1949: {
          on: {
            NEXT: [
              { target: "baujahr", cond: "isBezugsfertigAb1949" },
              { target: "kernsaniert" },
            ],
            BACK: {
              target: "uebersicht",
            },
          },
        },
        baujahr: {
          on: {
            NEXT: {
              target: "kernsaniert",
            },
            BACK: {
              target: "ab1949",
            },
          },
        },
        kernsaniert: {
          on: {
            NEXT: [
              { target: "kernsanierungsjahr", cond: "isKernsaniert" },
              { target: "abbruchverpflichtung" },
            ],
            BACK: [
              { target: "baujahr", cond: "isBezugsfertigAb1949" },
              { target: "ab1949" },
            ],
          },
        },
        kernsanierungsjahr: {
          on: {
            NEXT: [{ target: "abbruchverpflichtung" }],
            BACK: [{ target: "kernsaniert" }],
          },
        },
        abbruchverpflichtung: {
          on: {
            NEXT: [
              {
                target: "abbruchverpflichtungsjahr",
                cond: "hasAbbruchverpflichtung",
              },
              { target: "wohnflaechen", cond: "isZweifamilienhaus" },
              { target: "wohnflaeche" },
            ],
            BACK: [
              { target: "kernsanierungsjahr", cond: "isKernsaniert" },
              { target: "kernsaniert" },
            ],
          },
        },
        abbruchverpflichtungsjahr: {
          on: {
            NEXT: [
              { target: "wohnflaechen", cond: "isZweifamilienhaus" },
              { target: "wohnflaeche" },
            ],
            BACK: [{ target: "abbruchverpflichtung" }],
          },
        },
        wohnflaeche: {
          on: {
            NEXT: {
              target: "weitereWohnraeume",
            },
            BACK: [
              {
                target: "abbruchverpflichtungsjahr",
                cond: "hasAbbruchverpflichtung",
              },
              { target: "abbruchverpflichtung" },
            ],
          },
        },
        wohnflaechen: {
          on: {
            NEXT: {
              target: "weitereWohnraeume",
            },
            BACK: [
              {
                target: "abbruchverpflichtungsjahr",
                cond: "hasAbbruchverpflichtung",
              },
              { target: "abbruchverpflichtung" },
            ],
          },
        },
        weitereWohnraeume: {
          on: {
            NEXT: [
              {
                target: "weitereWohnraeumeDetails",
                cond: "hasWeitereWohnraeume",
              },
              { target: "garagen" },
            ],
            BACK: [
              { target: "wohnflaechen", cond: "isZweifamilienhaus" },
              { target: "wohnflaeche" },
            ],
          },
        },
        weitereWohnraeumeDetails: {
          on: {
            NEXT: { target: "garagen" },
            BACK: [{ target: "weitereWohnraeume" }],
          },
        },
        garagen: {
          on: {
            NEXT: [
              { target: "garagenAnzahl", cond: "hasGaragen" },
              { target: "#eigentuemer" },
            ],
            BACK: [
              {
                target: "weitereWohnraeumeDetails",
                cond: "hasWeitereWohnraeume",
              },
              { target: "weitereWohnraeume" },
            ],
          },
        },
        garagenAnzahl: {
          on: {
            NEXT: { target: "#eigentuemer" },
            BACK: { target: "garagen" },
          },
        },
      },
      on: { NEXT: "eigentuemer", BACK: "grundstueck.bodenrichtwertAnzahl" },
    },
    eigentuemer: {
      id: "eigentuemer",
      initial: "uebersicht",
      states: {
        uebersicht: {
          on: {
            NEXT: { target: "anzahl" },
            BACK: [
              { target: "#steps.gebaeude.garagenAnzahl", cond: "hasGaragen" },
              { target: "#steps.gebaeude.garagen", cond: "isBebaut" },
              { target: "#steps.grundstueck.bodenrichtwertAnzahl" },
            ],
          },
        },
        anzahl: {
          on: {
            NEXT: [
              {
                target: "verheiratet",
                cond: "anzahlEigentuemerIsTwo",
              },
              {
                target: "person",
              },
            ],
            BACK: { target: "uebersicht" },
          },
        },
        verheiratet: {
          on: {
            NEXT: {
              target: "person",
            },
            BACK: {
              target: "anzahl",
            },
          },
        },
        person: {
          id: "person",
          initial: "persoenlicheAngaben",
          states: {
            persoenlicheAngaben: {
              on: {
                NEXT: {
                  target: "adresse",
                },
                BACK: [
                  {
                    target: "anteil",
                    cond: "personIdGreaterThanOne",

                    actions: ["decrementPersonId"],
                  },
                ],
              },
            },
            adresse: {
              on: {
                NEXT: {
                  target: "steuerId",
                },
                BACK: { target: "persoenlicheAngaben" },
              },
            },
            steuerId: {
              on: { NEXT: "gesetzlicherVertreter", BACK: "adresse" },
            },
            gesetzlicherVertreter: {
              on: {
                NEXT: [
                  {
                    target: "vertreter",
                    cond: "hasGesetzlicherVertreter",
                  },
                  { target: "anteil", cond: "hasMultipleEigentuemer" },
                ],
                BACK: { target: "steuerId" },
              },
            },
            vertreter: {
              id: "vertreter",
              initial: "name",
              states: {
                name: {
                  on: {
                    NEXT: { target: "adresse" },
                  },
                },
                adresse: {
                  on: {
                    BACK: { target: "name" },
                  },
                },
              },
              on: {
                NEXT: { target: "anteil", cond: "hasMultipleEigentuemer" },
                BACK: { target: "gesetzlicherVertreter" },
              },
            },
            anteil: {
              on: {
                BACK: [
                  {
                    target: "vertreter.adresse",
                    cond: "hasGesetzlicherVertreter",
                  },
                  { target: "gesetzlicherVertreter" },
                ],
              },
            },
          },
          on: {
            BACK: [
              { target: "verheiratet", cond: "anzahlEigentuemerIsTwo" },
              { target: "anzahl" },
            ],
            NEXT: [
              {
                target: "person",
                cond: "repeatPerson",
                actions: ["incrementPersonId"],
              },
              {
                target: "bruchteilsgemeinschaft",
                cond: "isBruchteilsgemeinschaft",
              },
              { target: "empfangsvollmacht" },
            ],
          },
        },
        bruchteilsgemeinschaft: {
          on: {
            BACK: [
              {
                target: "person.anteil",
                cond: "hasMultipleEigentuemer",
                actions: "setPersonIdToMaximum",
              },
              {
                target: "person.vertreter.adresse",
                cond: "hasGesetzlicherVertreter",
                actions: "setPersonIdToMaximum",
              },
              {
                target: "person.gesetzlicherVertreter",
                actions: "setPersonIdToMaximum",
              },
            ],
            NEXT: [
              {
                target: "bruchteilsgemeinschaftangaben.angaben",
                cond: "customBruchteilsgemeinschaftData",
              },
              { target: "empfangsbevollmaechtigter.name" },
            ],
          },
        },
        bruchteilsgemeinschaftangaben: {
          states: {
            angaben: {},
          },
          on: {
            BACK: {
              target: "bruchteilsgemeinschaft",
            },
            NEXT: { target: "empfangsbevollmaechtigter.name" },
          },
        },
        empfangsvollmacht: {
          on: {
            BACK: [
              {
                target: "person.anteil",
                cond: "hasMultipleEigentuemer",
                actions: "setPersonIdToMaximum",
              },
              {
                target: "person.vertreter.adresse",
                cond: "hasGesetzlicherVertreter",
                actions: "setPersonIdToMaximum",
              },
              {
                target: "person.gesetzlicherVertreter",
                actions: "setPersonIdToMaximum",
              },
            ],
            NEXT: [
              {
                target: "empfangsbevollmaechtigter",
                cond: "hasEmpfangsbevollmaechtigter",
              },
              { target: "abschluss" },
            ],
          },
        },
        empfangsbevollmaechtigter: {
          id: "empfangsbevollmaechtigter",
          initial: "name",
          states: {
            name: {
              on: {
                NEXT: { target: "adresse" },
              },
            },
            adresse: {
              on: {
                BACK: { target: "name" },
              },
            },
          },
          on: {
            BACK: [
              {
                target: "bruchteilsgemeinschaftangaben.angaben",
                cond: "customBruchteilsgemeinschaftData",
              },
              {
                target: "bruchteilsgemeinschaft",
                cond: "isBruchteilsgemeinschaft",
              },
              { target: "empfangsvollmacht" },
            ],
            NEXT: "abschluss",
          },
        },
        abschluss: {
          on: {
            BACK: [
              {
                target: "empfangsbevollmaechtigter.adresse",
                cond: "hasEmpfangsbevollmaechtigter",
              },
              {
                target: "empfangsbevollmaechtigter.adresse",
                cond: "isBruchteilsgemeinschaft",
              },
              {
                target: "empfangsvollmacht",
              },
            ],
          },
        },
      },
      on: {
        NEXT: { target: "zusammenfassung" },
      },
    },
    zusammenfassung: {
      type: "final",
      on: {
        BACK: { target: "eigentuemer.abschluss" },
      },
    },
  },
};

export type StateMachineConfig = typeof states;

export const getMachineConfig = (formData: StateMachineContext) => {
  return Object.assign({}, states, { context: formData });
};
