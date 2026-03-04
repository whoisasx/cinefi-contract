import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Cinefi } from "../target/types/cinefi";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { assert } from "chai";

const MARKET_SEED = Buffer.from("market_seed");
const VAULT_SEED = Buffer.from("vault_seed");
const ORACLE_REPORT_SEED = Buffer.from("oracle_report_seed");

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

	return { marketPDA, oracleReportPDA };
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

describe("submit_score_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.cinefi as Program<Cinefi>;

	const creator = Keypair.generate();
	const oracle1 = Keypair.generate();
	const oracle2 = Keypair.generate();
	const oracle3 = Keypair.generate();
	const outsider = Keypair.generate();
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
		await airdrop(provider.connection, outsider.publicKey);
	});

	it("finalizes oracle report after threshold submissions", async () => {
		const mediaId = BigInt(6101);
		const startsAfter = -(SETTLEMENT_DAY * SECONDS_PER_DAY) - 10;

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);

		await closeMarket(program, creator, marketPDA);

		await program.methods
			.submitScore(42)
			.accountsPartial({
				oracleSigner: oracle1.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
			})
			.signers([oracle1])
			.rpc();

		await program.methods
			.submitScore(42)
			.accountsPartial({
				oracleSigner: oracle2.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
			})
			.signers([oracle2])
			.rpc();

		const report = await program.account.oracleReport.fetch(
			oracleReportPDA,
		);
		assert.equal(report.submissionCount, 2, "should have two submissions");
		assert.isTrue(report.finalized, "report should be finalized");
		assert.isFalse(report.disputed, "report should not be disputed");
		assert.equal(report.agreedScore, 42, "agreed score should match");
	});

	it("fails with UnauthorizedOracle for non-oracle signer", async () => {
		const mediaId = BigInt(6102);
		const startsAfter = -(SETTLEMENT_DAY * SECONDS_PER_DAY) - 10;

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);

		await closeMarket(program, creator, marketPDA);

		try {
			await program.methods
				.submitScore(50)
				.accountsPartial({
					oracleSigner: outsider.publicKey,
					market: marketPDA,
					oracleReport: oracleReportPDA,
				})
				.signers([outsider])
				.rpc();
			assert.fail("Expected UnauthorizedOracle");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "UnauthorizedOracle");
		}
	});

	it("fails with OracleAlreadySubmitted on duplicate oracle submission", async () => {
		const mediaId = BigInt(6103);
		const startsAfter = -(SETTLEMENT_DAY * SECONDS_PER_DAY) - 10;

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);

		await closeMarket(program, creator, marketPDA);

		await program.methods
			.submitScore(60)
			.accountsPartial({
				oracleSigner: oracle1.publicKey,
				market: marketPDA,
				oracleReport: oracleReportPDA,
			})
			.signers([oracle1])
			.rpc();

		try {
			await program.methods
				.submitScore(60)
				.accountsPartial({
					oracleSigner: oracle1.publicKey,
					market: marketPDA,
					oracleReport: oracleReportPDA,
				})
				.signers([oracle1])
				.rpc();
			assert.fail("Expected OracleAlreadySubmitted");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "OracleAlreadySubmitted");
		}
	});

	it("fails with OracleWindowClosed when outside settlement window", async () => {
		const mediaId = BigInt(6104);
		const startsAfter = -(14 * SECONDS_PER_DAY + 1);

		const { marketPDA, oracleReportPDA } = await createMarket(
			program,
			creator,
			mediaId,
			startsAfter,
			oracleSet,
		);

		await closeMarket(program, creator, marketPDA);

		try {
			await program.methods
				.submitScore(25)
				.accountsPartial({
					oracleSigner: oracle1.publicKey,
					market: marketPDA,
					oracleReport: oracleReportPDA,
				})
				.signers([oracle1])
				.rpc();
			assert.fail("Expected OracleWindowClosed");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "OracleWindowClosed");
		}
	});
});
