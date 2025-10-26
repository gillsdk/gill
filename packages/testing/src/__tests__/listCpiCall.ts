import { listCpiCalls } from "../txLogInspector/listCpiCalls";

describe("listCpiCalls", () => {
  it("should return empty array for empty logs", () => {
    expect(listCpiCalls([])).toEqual([]);
  });

  it("should parse a single top-level program invocation", () => {
    const logs = ["Program 11111111111111111111111111111111 invoke [1]"];

    const result = listCpiCalls(logs);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      programId: "11111111111111111111111111111111",
      depth: 1,
    });
  });

  it("should parse multiple program invocations with different depths", () => {
    const logs = [
      "Program 11111111111111111111111111111111 invoke [1]",
      "Program 2nQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin invoke [2]",
      "Program 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin invoke [3]",
    ];

    const result = listCpiCalls(logs);

    expect(result).toHaveLength(3);

    expect(result[0]).toMatchObject({
      programId: "11111111111111111111111111111111",
      depth: 1,
    });
    expect(result[1]).toMatchObject({
      programId: "2nQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      depth: 2,
    });
    expect(result[2]).toMatchObject({
      programId: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      depth: 3,
    });
  });

  it("should ignore unrelated logs", () => {
    const logs = [
      "Program 11111111111111111111111111111111 success",
      "Some random message",
      "Program log: Custom output",
    ];

    const result = listCpiCalls(logs);

    expect(result).toHaveLength(0);
  });
});
