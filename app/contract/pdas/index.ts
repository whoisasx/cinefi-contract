import { PublicKey } from "@solana/web3.js";

export const MARKET_SEED = Buffer.from("market_seed");
export const VAULT_SEED = Buffer.from("vault_seed");
export const TREASURY_SEED = Buffer.from("treasury_seed");
export const ORACLE_REPORT_SEED = Buffer.from("oracle_report_seed");
export const POSITION_SEED = Buffer.from("position_seed");

export function deriveMarketPDA(
	programId: PublicKey,
	mediaId: bigint,
): [PublicKey, number] {
	const mediaIdBytes = Buffer.alloc(8);
	mediaIdBytes.writeBigInt64LE(mediaId);

	return PublicKey.findProgramAddressSync(
		[MARKET_SEED, mediaIdBytes],
		programId,
	);
}

export function deriveVaultPDA(
	programId: PublicKey,
	marketKey: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[VAULT_SEED, marketKey.toBuffer()],
		programId,
	);
}

export function deriveTreasuryPDA(programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

export function deriveOracleReportPDA(
	programId: PublicKey,
	marketKey: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[ORACLE_REPORT_SEED, marketKey.toBuffer()],
		programId,
	);
}

export function deriveUserPositionPDA(
	programId: PublicKey,
	userKey: PublicKey,
	marketKey: PublicKey,
	bucket: number,
): [PublicKey, number] {
	const bucketBytes = Buffer.alloc(1);
	bucketBytes.writeUInt8(bucket);

	return PublicKey.findProgramAddressSync(
		[POSITION_SEED, userKey.toBuffer(), marketKey.toBuffer(), bucketBytes],
		programId,
	);
}
