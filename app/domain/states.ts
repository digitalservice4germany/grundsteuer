import { GrundModel } from "./steps";

export interface StateMachineContext extends GrundModel {
  currentId?: number;
}

export const states = {
  id: "steps",
  initial: "grundstueck",
  states: {
    grundstueck: {
      on: {
        NEXT: [
          { target: "gebaeude", cond: "showGebaeude" },
          { target: "eigentuemer" },
        ],
      },
    },
    gebaeude: { on: { NEXT: "eigentuemer", BACK: "grundstueck" } },
    eigentuemer: {
      id: "eigentuemer",
      initial: "anzahl",
      states: {
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
              },
            },
            adresse: {
              on: {
                NEXT: {
                  target: "telefonnummer",
                },
                BACK: { target: "persoenlicheAngaben" },
              },
            },
            telefonnummer: { on: { NEXT: "steuerId", BACK: "adresse" } },
            steuerId: {
              on: { NEXT: "gesetzlicherVertreter", BACK: "telefonnummer" },
            },
            gesetzlicherVertreter: {
              on: {
                NEXT: [
                  {
                    target: "vertreter",
                    cond: "hasGesetzlicherVertreter",
                  },
                  { target: "anteil", cond: "multipleEigentuemer" },
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
                    NEXT: { target: "telefonnummer" },
                    BACK: { target: "name" },
                  },
                },
                telefonnummer: {
                  on: {
                    BACK: { target: "adresse" },
                  },
                },
              },
              on: {
                NEXT: { target: "anteil", cond: "multipleEigentuemer" },
                BACK: { target: "gesetzlicherVertreter" },
              },
            },
            anteil: {
              on: {
                BACK: [
                  {
                    target: "vertreter.telefonnummer",
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
            NEXT: {
              target: "person",
              cond: "repeatPerson",
              actions: ["incrementCurrentId"],
            },
          },
        },
      },
      on: {
        NEXT: { target: "zusammenfassung" },
      },
    },
    zusammenfassung: { type: "final" },
  },
};

export const getMachineConfig = (records: StateMachineContext) => {
  return Object.assign({}, states, { context: records });
};
