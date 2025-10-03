/**
 * Import and log one of each type of symbol from the reexported or generated program clients
 */

/**
 * SPL System program client
 */
import { SYSTEM_PROGRAM_ADDRESS } from "gill/programs";
SYSTEM_PROGRAM_ADDRESS;

import { getTransferSolInstruction } from "gill/programs";
getTransferSolInstruction;

/**
 * SPL Address Lookup Table program client
 */
import { ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS } from "gill/programs";
ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS;

import { getAddressLookupTableDecoder } from "gill/programs";
getAddressLookupTableDecoder;

/**
 * SPL Compute Budget program client
 */
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from "gill/programs";
COMPUTE_BUDGET_PROGRAM_ADDRESS;

import { getSetComputeUnitLimitInstruction } from "gill/programs";
getSetComputeUnitLimitInstruction;

// !this is a custom symbol that gill provides
import { isSetComputeLimitInstruction } from "gill/programs";
isSetComputeLimitInstruction;

/**
 * !SPL Memo program is generated and vendored in
 */
import { MEMO_PROGRAM_ADDRESS } from "gill/programs";
MEMO_PROGRAM_ADDRESS;

import { getAddMemoInstruction } from "gill/programs";
getAddMemoInstruction;

/**
 * ! Metaplex's Token Metadata client is generated and vendored in
 */
import { TOKEN_METADATA_PROGRAM_ADDRESS } from "gill/programs";
TOKEN_METADATA_PROGRAM_ADDRESS;

import { getMetadataCodec } from "gill/programs";
getMetadataCodec;

/**
 * SPL Token 2022 program client
 */
import { TOKEN_2022_PROGRAM_ADDRESS } from "gill/programs";
TOKEN_2022_PROGRAM_ADDRESS;

import { getMintToInstruction } from "gill/programs";
getMintToInstruction;

// !this is a custom symbol that gill provides
import { getAssociatedTokenAccountAddress } from "gill/programs";
getAssociatedTokenAccountAddress;

// !this is a custom symbol that gill provides
import { TOKEN_PROGRAM_ADDRESS } from "gill/programs";
TOKEN_PROGRAM_ADDRESS;
