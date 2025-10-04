import createAndFundedKeypair from "../fixtures/createAndFundedKeypair";
import { airdropFactory, generateKeyPairSigner, lamports } from "gill";

jest.mock("gill", () => {
  const actual = jest.requireActual("gill");
  return {
    ...actual,
    airdropFactory: jest.fn(),
    generateKeyPairSigner: jest.fn(),
  };
});

describe("createAndFundedKeypair", () => {
  let mockRpc: any;
  let mockRpcSubscriptions: any;
  let mockAirdrop: jest.Mock;

  const DEFAULT_LAMPORTS = 10_000_000_000n;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock airdrop execution
    mockAirdrop = jest.fn().mockResolvedValue("mock-signature-abc123");
    (airdropFactory as jest.Mock).mockReturnValue(mockAirdrop);

    // Mock keypair generation
    (generateKeyPairSigner as jest.Mock).mockResolvedValue({ address: "mock-address" });

    // Mock RPC getBalance
    mockRpc = {
      getBalance: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({ value: lamports(DEFAULT_LAMPORTS) }),
      }),
    };

    mockRpcSubscriptions = {};
  });

  it("should create and fund a new keypair with default amount", async () => {
    const result = await createAndFundedKeypair(mockRpc, mockRpcSubscriptions);

    expect(result.fundedKeypair.address).toBe("mock-address");
    expect(result.transactionSignature).toBe("mock-signature-abc123");
    expect(result.balance).toBe(lamports(DEFAULT_LAMPORTS));

    expect(mockAirdrop).toHaveBeenCalledWith({
      commitment: "confirmed",
      lamports: DEFAULT_LAMPORTS,
      recipientAddress: "mock-address",
    });
    expect(mockRpc.getBalance).toHaveBeenCalledWith("mock-address");
  });

  it("should create and fund a new keypair with custom amount", async () => {
    const customAmount = 5_000_000_000n;
    mockRpc.getBalance = jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue({ value: lamports(customAmount) }),
    });

    const result = await createAndFundedKeypair(mockRpc, mockRpcSubscriptions, lamports(customAmount));

    expect(result.balance).toBe(lamports(customAmount));
    expect(mockAirdrop).toHaveBeenCalledWith({
      commitment: "confirmed",
      lamports: customAmount,
      recipientAddress: "mock-address",
    });
  });

  it("should throw an error if lamports amount is zero", async () => {
    await expect(createAndFundedKeypair(mockRpc, mockRpcSubscriptions, lamports(0n))).rejects.toThrow(
      "Airdrop amount must be greater than zero lamports",
    );
  });

  it("should throw an error if airdrop fails", async () => {
    mockAirdrop.mockRejectedValue(new Error("RPC error: Airdrop failed"));

    await expect(createAndFundedKeypair(mockRpc, mockRpcSubscriptions)).rejects.toThrow("RPC error: Airdrop failed");
  });

  it("should throw an error if balance fetch fails", async () => {
    mockRpc.getBalance = jest.fn().mockReturnValue({
      send: jest.fn().mockRejectedValue(new Error("RPC error: getBalance failed")),
    });

    await expect(createAndFundedKeypair(mockRpc, mockRpcSubscriptions)).rejects.toThrow("RPC error: getBalance failed");
  });
});
