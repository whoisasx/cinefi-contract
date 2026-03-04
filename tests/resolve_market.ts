import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Cinefi } from "../target/types/cinefi";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { assert } from "chai";

const MARKET_SEED = Buffer.from("market_seed");
const VAULT_SEED = Buffer.from("vault_seed");
const ORACLE_REPORT_SEED = Buffer.from("oracle_report_seed");
const TREASURY_SEED = Buffer.from("treasury_seed");

const SECONDS_PER_DAY = 86_400;
const SETTLEMENT_DAY = 21;

function mediaIdToBytes(mediaId: bigint): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64LE(mediaId);
	return buf;
}

function deriveMarketPDA(
	programId: PublicKey,
	mediaId: bigint,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[MARKET_SEED, mediaIdToBytes(mediaId)],
		programId,
	);
}

function deriveVaultPDA(
	programId: PublicKey,
	marketPDA: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[VAULT_SEED, marketPDA.toBuffer()],
		programId,
	);
}

function deriveOracleReportPDA(
	programId: PublicKey,
	marketPDA: PublicKey,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[ORACLE_REPORT_SEED, marketPDA.toBuffer()],
		programId,
	);
}

function deriveTreasuryPDA(programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

async function airdrop(
	connection: anchor.web3.Connection,
	pubkey: PublicKey,
	sol = 2,
) {
	const sig = await connection.requestAirdrop(
		pubkey,
		sol * anchor.web3.LAMPORTS_PER_SOL,
	);
	const { blockhash, lastValidBlockHeight } =
		await connection.getLatestBlockhash();
	await connection.confirmTransaction({
		signature: sig,
		blockhash,
		lastValidBlockHeight,
	});
}

async function ensureTreasuryInitialized(program: Program<Cinefi>) {
	const provider = program.provider as anchor.AnchorProvider;
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);
	const existing = await provider.connection.getAccountInfo(treasuryPDA);

	if (!existing) {
		await program.methods
			.initializeTreasury()
			.accountsPartial({
				authority: provider.wallet.publicKey,
				treasury: treasuryPDA,
			})
			.rpc();
	}

	return treasuryPDA;
}

async function createMarket(
	program: Program<Cinefi>,
	creator: Keypair,
	mediaId: bigint,
	bettingStartsAfter: number | null,
	oracleSet: [PublicKey, PublicKey, PublicKey],
) {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);

	const arg = bettingStartsAfter !== null ? new BN(bettingStartsAfter) : null;

	await program.methods
		.createMarket(arg, new BN(mediaId.toString()), 5, oracleSet, 2)
		.accountsPartial({
			creator: creator.publicKey,
			market: marketPDA,
			vault: vaultPDA,
			oracleReport: oracleReportPDA,
		})
		.signers([creator])
		.rpc();

	return { marketPDA, vaultPDA, oracleReportPDA };
}

async function closeMarket(
	program: Program<Cinefi>,
	caller: Keypair,
	marketPDA: PublicKey,
) {
	await program.methods
		.closeMarket()
		.accountsPartial({ caller: caller.publicKey, market: marketPDA })
		.signers([caller])
		.rpc();
}

describe("resolve_market_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.cinefi as Program<Cinefi>;

	const creator = Keypair.generate();
	const oracle1 = Keypair.generate();
	const oracle2 = Keypair.generate();
	const oracle3 = Keypair.generate();
	const oracleSet: [PublicKey, PublicKey, PublicKey] = [
		oracle1.publicKey,
		oracle2.publicKey,
		oracle3.publicKey,
	];

	before(async () => {
		await airdrop(provider.connection, creator.publicKey, 10);
		await airdrop(provider.connection, oracle1.publicKey);
		await airdrop(provider.connection, oracle2.publicKey);
		await airdrop(provider.connection, oracle3.publicKey);
		await ensureTreasuryInitialized(program);
	});

	it("resolves market successfully after finalized oracle report", async () => {
		const mediaId = BigInt(6201);
		const startsAfter = -(SETTLEMENT_DAY * SECONDS_PER_DAY) - 10;

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);
		const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
		const [treasuryPDA] = deriveTreasuryPDA(program.programId);

		await closeMarket(program, creator, marketPDA);

		await program.methods
			.submitScore(55)
			.accountsPartial({
				oracleSigner: oracle1.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
			})
			.signers([oracle1])
			.rpc();

		await program.methods
			.submitScore(55)
			.accountsPartial({
				oracleSigner: oracle2.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
			})
			.signers([oracle2])
			.rpc();

		await program.methods
			.resolveMarket()
			.accountsPartial({
				caller: creator.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
				vault: vaultPDA,
				treasury: treasuryPDA,
			})
			.signers([creator])
			.rpc();

		const market = await program.account.market.fetch(marketPDA);
		assert.isTrue(market.resolved, "market should be resolved");
		assert.equal(
			market.finalOutcome,
			55,
			"final outcome should match oracle",
		);
	});

	it("fails with MarketNotClosed when market is not closed", async () => {
		const mediaId = BigInt(6202);
		const startsAfter = -(SETTLEMENT_DAY * SECONDS_PER_DAY) - 10;

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);
		const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
		const [treasuryPDA] = deriveTreasuryPDA(program.programId);

		try {
			await program.methods
				.resolveMarket()
				.accountsPartial({
					caller: creator.publicKey,
					market: marketPDA,
					oracleReport: oracleReportPDA,
					vault: vaultPDA,
					treasury: treasuryPDA,
				})
				.signers([creator])
				.rpc();
			assert.fail("Expected MarketNotClosed");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "MarketNotClosed");
		}
	});

	it("fails with OracleNotFinalized when threshold is not met", async () => {
		const mediaId = BigInt(6203);
		const startsAfter = -(SETTLEMENT_DAY * SECONDS_PER_DAY) - 10;

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);
		const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
		const [treasuryPDA] = deriveTreasuryPDA(program.programId);

		await closeMarket(program, creator, marketPDA);

		await program.methods
			.submitScore(48)
			.accountsPartial({
				oracleSigner: oracle1.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
			})
			.signers([oracle1])
			.rpc();

		try {
			await program.methods
				.resolveMarket()
				.accountsPartial({
					caller: creator.publicKey,
					market: marketPDA,
					oracleReport: oracleReportPDA,
					vault: vaultPDA,
					treasury: treasuryPDA,
				})
				.signers([creator])
				.rpc();
			assert.fail("Expected OracleNotFinalized");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "OracleNotFinalized");
		}
	});

	it("fails with SettlementNotReady before settlement time", async () => {
		const mediaId = BigInt(6204);
		const startsAfter = -(14 * SECONDS_PER_DAY + 1);

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);
		const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
		const [treasuryPDA] = deriveTreasuryPDA(program.programId);

		await closeMarket(program, creator, marketPDA);

		try {
			await program.methods
				.resolveMarket()
				.accountsPartial({
					caller: creator.publicKey,
					market: marketPDA,
					oracleReport: oracleReportPDA,
					vault: vaultPDA,
					treasury: treasuryPDA,
				})
				.signers([creator])
				.rpc();
			assert.fail("Expected SettlementNotReady");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "SettlementNotReady");
		}
	});
});
