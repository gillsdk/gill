import findCustomError from "../txLogInspector/findCustomError";

describe("findCustomError", () => {
  it("should return no errors for empty logs", () => {
    const result = findCustomError([]);
    expect(result).toEqual({ errors: [], found: false });
  });

  it("should parse a single Anchor-style error", () => {
    const logs = ["Error Code: Unauthorized. Error Number: 6001. Error Message: You are not authorized."];

    const result = findCustomError(logs);

    expect(result.found).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      errorName: "Unauthorized",
      errorCodeRaw: "6001",
      errorMessage: "You are not authorized.",
      rawLog: logs[0],
    });
  });

  it("should parse custom program errors (hex code)", () => {
    const logs = ["Program xyz failed: custom program error: 0x1234"];

    const result = findCustomError(logs);

    expect(result.found).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      errorCodeRaw: "0x1234",
      rawLog: logs[0],
    });
  });

  it("should parse custom program errors (decimal code)", () => {
    const logs = ["Program abc failed: custom program error: 1337"];

    const result = findCustomError(logs);

    expect(result.found).toBe(true);
    expect(result.errors[0]).toMatchObject({
      errorCodeRaw: "1337",
      rawLog: logs[0],
    });
  });

  it("should parse generic program log errors", () => {
    const logs = ["Program log: Error: Something went wrong"];

    const result = findCustomError(logs);

    expect(result.found).toBe(true);
    expect(result.errors[0]).toMatchObject({
      errorMessage: "Something went wrong",
      rawLog: logs[0],
    });
  });

  it("should parse multiple different errors", () => {
    const logs = [
      "Error Code: InvalidInput. Error Number: 6002. Error Message: Bad input",
      "Program abc failed: custom program error: 0x42",
      "Program log: Error: Overflow detected",
    ];

    const result = findCustomError(logs);

    expect(result.found).toBe(true);
    expect(result.errors).toHaveLength(3);

    expect(result.errors[0]).toMatchObject({
      errorName: "InvalidInput",
      errorCodeRaw: "6002",
      errorMessage: "Bad input",
    });
    expect(result.errors[1]).toMatchObject({
      errorCodeRaw: "0x42",
    });
    expect(result.errors[2]).toMatchObject({
      errorMessage: "Overflow detected",
    });
  });

  it("should ignore unrelated logs", () => {
    const logs = ["Program xyz succeeded", "Instruction complete"];

    const result = findCustomError(logs);

    expect(result.found).toBe(false);
    expect(result.errors).toHaveLength(0);
  });
});
