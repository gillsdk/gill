import { address, getAddressEncoder, getBytesEncoder, getProgramDerivedAddress } from "gill";
import { DELEGATION_PROGRAM_ID } from "@magicblock-labs/ephemeral-rollups-sdk";

const encoder = getBytesEncoder();
const addressEncoder = getAddressEncoder();

/**
 * Derive delegation record PDA using `address`
 */
export async function delegationRecordPdaFromDelegatedAccountAddr(
  delegatedAccount: ReturnType<typeof address>
) {
  const [pda] = await getProgramDerivedAddress({
    programAddress: address(DELEGATION_PROGRAM_ID.toBase58()),
    seeds: [
      encoder.encode(Buffer.from("delegation")),
      addressEncoder.encode(delegatedAccount),
    ],
  });
  return pda;
}

/**
 * Derive delegation metadata PDA using `address`
 */
export async function delegationMetadataPdaFromDelegatedAccountAddr(
  delegatedAccount: ReturnType<typeof address>
) {
  const [pda] = await getProgramDerivedAddress({
    programAddress: address(DELEGATION_PROGRAM_ID.toBase58()),
    seeds: [
      encoder.encode(Buffer.from("delegation-metadata")),
      addressEncoder.encode(delegatedAccount),
    ],
  });
  return pda;
}

/**
 * Derive delegation buffer PDA using `address`
 */
export async function delegateBufferPdaFromDelegatedAccountAndOwnerProgramAddr(
  delegatedAccount: ReturnType<typeof address>,
  ownerProgramId: ReturnType<typeof address>
) {
  const [pda] = await getProgramDerivedAddress({
    programAddress: ownerProgramId,
    seeds: [
      encoder.encode(Buffer.from("buffer")),
      addressEncoder.encode(delegatedAccount),
    ],
  });
  return pda;
}
