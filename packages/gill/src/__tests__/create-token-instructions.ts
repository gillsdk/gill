import type { Address, Instruction, KeyPairSigner } from "@solana/kit";
import { generateKeyPairSigner } from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getInitializeMetadataPointerInstruction,
  getInitializeMintInstruction,
  getInitializeTokenMetadataInstruction,
  getMintSize,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022";

import { getMinimumBalanceForRentExemption } from "../core";
import { getCreateTokenInstructions, GetCreateTokenInstructionsArgs, TOKEN_PROGRAM_ADDRESS } from "../programs/token";
import { getCreateMetadataAccountV3Instruction } from "../programs/token-metadata";

const MOCK_SPACE = 122n;
const MOCK_RENT = 10000n;

jest.mock("../core", () => ({
  // preserve all real implementations to only change the desired ones
  ...jest.requireActual("../core"),
  getMinimumBalanceForRentExemption: jest.fn(),
}));

jest.mock("../programs/token-metadata", () => ({
  // preserve all real implementations to only change the desired ones
  ...jest.requireActual("../programs/token-metadata"),
  getCreateMetadataAccountV3Instruction: jest.fn(),
}));

jest.mock("@solana-program/system", () => ({
  getCreateAccountInstruction: jest.fn(),
}));

jest.mock("@solana-program/token-2022", () => ({
  // preserve all real implementations to only change the desired ones
  ...jest.requireActual("@solana-program/token-2022"),
  getInitializeMetadataPointerInstruction: jest.fn(),
  getInitializeMintInstruction: jest.fn(),
  getInitializeTokenMetadataInstruction: jest.fn(),
  getMintSize: jest.fn(),
}));

describe("getCreateTokenInstructions", () => {
  let mockPayer: KeyPairSigner;
  let mockMint: KeyPairSigner;

  const mockMetadataAddress = "mockMetadataAddress" as Address;

  let mockMintAuthority: KeyPairSigner;
  let mockFreezeAuthority: KeyPairSigner;

  let mockCreateAccountInstruction: Instruction;
  let mockInitializeMintInstruction: Instruction;
  let mockCreateMetadataInstruction: Instruction;

  let mockInitializeMetadataPointerInstruction: Instruction;
  let mockInitializeTokenMetadataInstruction: Instruction;

  const metadata: GetCreateTokenInstructionsArgs["metadata"] = {
    isMutable: true,
    name: "Test Token",
    symbol: "TEST",
    uri: "https://example.com/metadata.json",
  };

  beforeAll(async () => {
    [mockPayer, mockMint, mockMintAuthority, mockFreezeAuthority] = await Promise.all([
      generateKeyPairSigner(),
      generateKeyPairSigner(),
      generateKeyPairSigner(),
      generateKeyPairSigner(),
    ]);
  });

  beforeEach(() => {
    mockCreateAccountInstruction = {
      data: new Uint8Array([1]),
      programAddress: "system" as Address,
    };
    mockInitializeMintInstruction = {
      data: new Uint8Array([2]),
      programAddress: "tokenProgram" as Address,
    };
    mockCreateMetadataInstruction = {
      data: new Uint8Array([4]),
      programAddress: "metadata" as Address,
    };
    mockInitializeTokenMetadataInstruction = {
      data: new Uint8Array([5]),
      programAddress: "initMetadata" as Address,
    };
    mockInitializeMetadataPointerInstruction = {
      data: new Uint8Array([6]),
      programAddress: "initMetadataPointer" as Address,
    };

    (getCreateAccountInstruction as jest.Mock).mockReturnValue(mockCreateAccountInstruction);
    (getInitializeMintInstruction as jest.Mock).mockReturnValue(mockInitializeMintInstruction);
    (getCreateMetadataAccountV3Instruction as jest.Mock).mockReturnValue(mockCreateMetadataInstruction);
    (getInitializeMetadataPointerInstruction as jest.Mock).mockReturnValue(mockInitializeMetadataPointerInstruction);
    (getInitializeTokenMetadataInstruction as jest.Mock).mockReturnValue(mockInitializeTokenMetadataInstruction);

    (getMinimumBalanceForRentExemption as jest.Mock).mockReturnValue(MOCK_RENT);
    (getMintSize as jest.Mock).mockReturnValue(MOCK_SPACE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create basic token instructions with default values", () => {
    const args: GetCreateTokenInstructionsArgs = {
      feePayer: mockPayer,
      metadata,
      metadataAddress: mockMetadataAddress,
      mint: mockMint,
    };

    const instructions = getCreateTokenInstructions(args);

    expect(instructions).toHaveLength(3);
    expect(instructions[0]).toBe(mockCreateAccountInstruction);
    expect(instructions[1]).toBe(mockInitializeMintInstruction);
    expect(instructions[2]).toBe(mockCreateMetadataInstruction);

    expect(getCreateAccountInstruction).toHaveBeenCalledWith({
      lamports: MOCK_RENT,
      newAccount: mockMint,
      payer: mockPayer,
      programAddress: TOKEN_PROGRAM_ADDRESS,
      space: MOCK_SPACE,
    });

    expect(getInitializeMintInstruction).toHaveBeenCalledWith(
      {
        decimals: 9,
        freezeAuthority: null,
        mint: mockMint.address,
        mintAuthority: mockPayer.address,
      },
      {
        programAddress: TOKEN_PROGRAM_ADDRESS,
      },
    );

    expect(getCreateMetadataAccountV3Instruction).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionDetails: null,
        data: {
          name: metadata.name,
          collection: null,
          sellerFeeBasisPoints: 0,
          creators: null,
          symbol: metadata.symbol,
          uri: metadata.uri,
          uses: null,
        },
        isMutable: true,
        metadata: mockMetadataAddress,
        mint: mockMint.address,
        mintAuthority: mockPayer,
        payer: mockPayer,
        updateAuthority: mockPayer,
      }),
    );
  });

  it("should throw error for unsupported token program", () => {
    const args: GetCreateTokenInstructionsArgs = {
      feePayer: mockPayer,
      metadata,
      metadataAddress: mockMetadataAddress,
      mint: mockMint,
      tokenProgram: "UnsupportedProgramId" as Address,
    };

    expect(() => getCreateTokenInstructions(args)).toThrow(
      "Unsupported token program. Try 'TOKEN_PROGRAM_ADDRESS' or 'TOKEN_2022_PROGRAM_ADDRESS'",
    );
  });

  describe("should use original token program", () => {
    it("should use original token program when specified", () => {
      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMetadataAddress,
        mint: mockMint,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      };

      getCreateTokenInstructions(args);

      expect(getCreateAccountInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          programAddress: TOKEN_PROGRAM_ADDRESS,
          space: MOCK_SPACE,
        }),
      );

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          mint: mockMint.address,
        }),
        {
          programAddress: TOKEN_PROGRAM_ADDRESS,
        },
      );
    });

    it("should use custom decimals when provided", () => {
      const args: GetCreateTokenInstructionsArgs = {
        decimals: 6,
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMetadataAddress,
        mint: mockMint,
      };

      getCreateTokenInstructions(args);

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          decimals: 6,
          mint: mockMint.address,
        }),
        {
          programAddress: TOKEN_PROGRAM_ADDRESS,
        },
      );
    });

    it("should allow custom decimals of 0 when provided, not the default of 9", () => {
      const args: GetCreateTokenInstructionsArgs = {
        decimals: 0,
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMetadataAddress,
        mint: mockMint,
      };

      getCreateTokenInstructions(args);

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          decimals: 0,
          mint: mockMint.address,
        }),
        {
          programAddress: TOKEN_PROGRAM_ADDRESS,
        },
      );
    });

    it("should use custom mint and freeze authorities when provided", () => {
      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        freezeAuthority: mockFreezeAuthority.address,
        metadata,
        metadataAddress: mockMetadataAddress,
        mint: mockMint,
        mintAuthority: mockMintAuthority,
      };

      getCreateTokenInstructions(args);

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          freezeAuthority: mockFreezeAuthority.address,
          mintAuthority: mockMintAuthority.address,
        }),
        {
          programAddress: TOKEN_PROGRAM_ADDRESS,
        },
      );
    });

    it("should add metadata instruction when metadata is provided", () => {
      const metadata: GetCreateTokenInstructionsArgs["metadata"] = {
        isMutable: false,
        name: "Test Token",
        symbol: "TEST",
        uri: "https://example.com/metadata.json",
      };

      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMetadataAddress,
        mint: mockMint,
      };

      const instructions = getCreateTokenInstructions(args);

      expect(instructions).toHaveLength(3);
      expect(instructions[2]).toBe(mockCreateMetadataInstruction);

      expect(getCreateMetadataAccountV3Instruction).toHaveBeenCalledWith(
        expect.objectContaining({
          collectionDetails: null,
          data: {
            name: metadata.name,
            collection: null,
            sellerFeeBasisPoints: 0,
            creators: null,
            symbol: metadata.symbol,
            uri: metadata.uri,
            uses: null,
          },
          isMutable: false,
          metadata: mockMetadataAddress,
          mint: mockMint.address,
          mintAuthority: mockPayer,
          payer: mockPayer,
          updateAuthority: mockPayer,
        }),
      );
    });

    it("should use custom metadata update authority", () => {
      const customUpdateAuthority = { address: "customUpdateAuth" } as KeyPairSigner;

      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMetadataAddress,
        mint: mockMint,
        updateAuthority: customUpdateAuthority,
      };

      getCreateTokenInstructions(args);

      expect(getCreateMetadataAccountV3Instruction).toHaveBeenCalledWith(
        expect.objectContaining({
          updateAuthority: customUpdateAuthority,
        }),
      );
    });
  });

  describe("should use token22 program", () => {
    it("should use Token-2022 program when specified", () => {
      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMint.address,
        mint: mockMint,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
      };

      getCreateTokenInstructions(args);

      expect(getCreateAccountInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          programAddress: TOKEN_2022_PROGRAM_ADDRESS,
          space: MOCK_SPACE,
        }),
      );

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          mint: mockMint.address,
        }),
        {
          programAddress: TOKEN_2022_PROGRAM_ADDRESS,
        },
      );
    });

    it("should use custom decimals when provided", () => {
      const args: GetCreateTokenInstructionsArgs = {
        decimals: 6,
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMint.address,
        mint: mockMint,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
      };

      getCreateTokenInstructions(args);

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          decimals: 6,
          mint: mockMint.address,
        }),
        {
          programAddress: TOKEN_2022_PROGRAM_ADDRESS,
        },
      );
    });

    it("should use custom mint and freeze authorities when provided", () => {
      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        freezeAuthority: mockFreezeAuthority.address,
        metadata,
        metadataAddress: mockMint.address,
        mint: mockMint,
        mintAuthority: mockMintAuthority,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
      };

      getCreateTokenInstructions(args);

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          freezeAuthority: mockFreezeAuthority.address,
          mintAuthority: mockMintAuthority.address,
        }),
        {
          programAddress: TOKEN_2022_PROGRAM_ADDRESS,
        },
      );
    });

    it("should add metadata instruction when metadata is provided", () => {
      const metadata: GetCreateTokenInstructionsArgs["metadata"] = {
        isMutable: false,
        name: "Test Token22",
        symbol: "TEST",
        uri: "https://example.com/metadata.json",
      };

      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMint.address,
        mint: mockMint,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
      };

      const instructions = getCreateTokenInstructions(args);

      expect(instructions).toHaveLength(4);
      expect(instructions[1]).toBe(mockInitializeMetadataPointerInstruction);
      expect(instructions[3]).toBe(mockInitializeTokenMetadataInstruction);

      expect(getInitializeMetadataPointerInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          authority: mockPayer.address,
          metadataAddress: mockMint.address,
          mint: mockMint.address,
        }),
      );

      expect(getInitializeMintInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          mint: mockMint.address,
          mintAuthority: mockPayer.address,
        }),
        {
          programAddress: TOKEN_2022_PROGRAM_ADDRESS,
        },
      );

      expect(getInitializeTokenMetadataInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: mockMint.address,
          mint: mockMint.address,
          mintAuthority: mockPayer,
          name: metadata.name,
          symbol: metadata.symbol,
          updateAuthority: mockPayer.address,
          uri: metadata.uri,
        }),
      );
    });

    it("should use custom metadata update authority", () => {
      const customUpdateAuthority = { address: "customUpdateAuth" } as KeyPairSigner;

      const args: GetCreateTokenInstructionsArgs = {
        feePayer: mockPayer,
        metadata,
        metadataAddress: mockMint.address,
        mint: mockMint,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
        updateAuthority: customUpdateAuthority,
      };

      const instructions = getCreateTokenInstructions(args);

      expect(instructions).toHaveLength(4);
      expect(instructions[1]).toBe(mockInitializeMetadataPointerInstruction);
      expect(instructions[3]).toBe(mockInitializeTokenMetadataInstruction);

      expect(getInitializeMetadataPointerInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadataAddress: mockMint.address,
          mint: mockMint.address,
        }),
      );

      expect(getInitializeTokenMetadataInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          updateAuthority: customUpdateAuthority.address,
        }),
      );
    });
  });
});
