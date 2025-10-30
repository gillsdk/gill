import { totalComputeUnits } from "../txLogInspector/totalComputeUnits";

describe("totalComputeUnits", () => {
  it("should return 0 for empty logs", () => {
    expect(totalComputeUnits([])).toBe(0);
  });

  it("should return 0 if no logs contain compute units", () => {
    const logs = ["Program xyz success", "Instruction complete", "Random log"];
    expect(totalComputeUnits(logs)).toBe(0);
  });

  it("should sum compute units from one or more valid log lines", () => {
    const logs = [
      "consumed 5000 of 200000 compute units",
      "consumed 3000 of 200000 compute units",
      "consumed 7000 of 200000 compute units",
    ];
    expect(totalComputeUnits(logs)).toBe(15000);
  });

  it("should ignore malformed compute units lines", () => {
    const logs = [
      "consumed 5000 of 200000 compute units",
      "consumed XYZ of 200000 compute units",
      "consumed 3000 of 200000 compute units",
    ];
    expect(totalComputeUnits(logs)).toBe(8000);
  });
});
