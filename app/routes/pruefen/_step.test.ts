import { mockActionArgs } from "testUtil/mockActionArgs";
import * as csrfModule from "~/util/csrf";
import * as modelModule from "~/domain/model";
import { action, getMachine } from "~/routes/pruefen/_step";
import { pruefenStateCookie } from "~/cookies";

process.env.FORM_COOKIE_SECRET = "secret";
process.env.FORM_COOKIE_ENC_SECRET = "26d011bcbb9db8c4673b7fcd90c9ec6d";

describe("_step action", () => {
  beforeEach(async () => {
    const csrfMock = jest.spyOn(csrfModule, "verifyCsrfToken");
    csrfMock.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Redirects to first step if no state set in cookie", async () => {
    const args = await mockActionArgs({
      route: "/eigentuemerTyp",
      formData: {},
      context: {},
      userEmail: "user@example.com",
      allData: {},
    });

    const result = await action(args);

    expect(result.status).toEqual(302);
    expect(result.headers.get("location")).toEqual("/pruefen/eigentuemerTyp");
  });

  describe("With state in cookie", () => {
    let explicitCookie = "";

    beforeAll(async () => {
      explicitCookie = await pruefenStateCookie.serialize(
        getMachine({ formData: {} }).getInitialState("eigentuemerTyp")
      );
    });

    test("Returns error if fields not filled", async () => {
      const args = await mockActionArgs({
        route: "/eigentuemerTyp",
        formData: {},
        context: {},
        userEmail: "user@example.com",
        allData: {},
        explicitCookie,
      });

      const result = await action(args);

      expect(Object.keys(result.errors)).toHaveLength(1);
    });

    test("Does not update data if fields not filled", async () => {
      const spyOnSetStepData = jest.spyOn(modelModule, "setStepData");
      const args = await mockActionArgs({
        route: "/eigentuemerTyp",
        formData: {},
        context: {},
        userEmail: "user@example.com",
        allData: {},
        explicitCookie,
      });

      await action(args);

      expect(spyOnSetStepData).not.toHaveBeenCalled();
    });

    test("Updates data if fields filled", async () => {
      const spyOnSetStepData = jest.spyOn(modelModule, "setStepData");
      const previousData = {};
      const args = await mockActionArgs({
        route: "/eigentuemerTyp",
        formData: {
          eigentuemerTyp: "privatperson",
          additional: "Should not be in result",
        },
        context: {},
        userEmail: "user@example.com",
        allData: previousData,
        explicitCookie,
      });

      await action(args);

      expect(spyOnSetStepData).toHaveBeenCalledTimes(1);
      expect(spyOnSetStepData).toHaveBeenCalledWith(
        previousData,
        "eigentuemerTyp",
        {
          eigentuemerTyp: "privatperson",
        }
      );
    });
  });
});
