import { removeUndefined } from "~/util/removeUndefined";

describe("removeUndefined", function () {
  it("does nothing on an empty object", () => {
    const expected = {};
    const result = removeUndefined({});
    expect(result).toEqual(expected);
  });

  it("does nothing on a simple filled object", () => {
    const expected = { simple: "yes" };
    const result = removeUndefined({ simple: "yes" });
    expect(result).toEqual(expected);
  });

  it("removes value on a simple undefined object", () => {
    const expected = {};
    const result = removeUndefined({ simple: undefined });
    expect(result).toEqual(expected);
  });

  it("removes nested undefined value", () => {
    const expected = {};
    const result = removeUndefined({ nested: { undefined: undefined } });
    expect(result).toEqual(expected);
  });

  it("removes only undefined nested value", () => {
    const expected = { nested: { defined: "yes" } };
    const result = removeUndefined({
      nested: { undefined: undefined, defined: "yes" },
    });
    expect(result).toEqual(expected);
  });

  it("removes undefined in array", () => {
    const expected = {};
    const result = removeUndefined({ array: [{ undefined: undefined }] });
    expect(result).toEqual(expected);
  });

  it("removes only undefined in array", () => {
    const expected = { array: [{ defined: "yes" }] };
    const result = removeUndefined({
      array: [{ undefined: undefined }, { defined: "yes" }],
    });
    expect(result).toEqual(expected);
  });
});
