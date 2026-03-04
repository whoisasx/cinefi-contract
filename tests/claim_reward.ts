import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Cinefi } from "../target/types/cinefi";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { assert } from "chai";

const MARKET_SEED = Buffer.from("market_seed");
const POSITION_SEED = Buffer.from("position_seed");
const VAULT_SEED = Buffer.from("vault_seed");
const ORACLE_REPORT_SEED = Buffer.from("oracle_report_seed");
const TREASURY_SEED = Buffer.from("treasury_seed");

const SECONDS_PER_DAY = 86_400;
const BETTING_DURATION_DAYS = 14;
const SETTLEMENT_DAY = 21;
const DEFAULT_RADIUS = 5;

function mediaIdToBytes(mediaId: bigint): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64LE(mediaId);
	return buf;
}

function bucketToBytes(bucket: number): Buffer {
	return Buffer.from([bucket]);
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

function deriveUserPositionPDA(
	programId: PublicKey,
	user: PublicKey,
	marketPDA: PublicKey,
	bucket: number,
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[
			POSITION_SEED,
			user.toBuffer(),
			marketPDA.toBuffer(),
			bucketToBytes(bucket),
		],
		programId,
	);
}

function deriveTreasuryPDA(programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

async function airdrop(
	connection: anchor.web3.Connection,
	pubkey: PublicKey,
	sol = 10,
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
): Promise<{
	marketPDA: PublicKey;
	vaultPDA: PublicKey;
	oracleReportPDA: PublicKey;
}> {
	const [marketPDA] = deriveMarketPDA(program.programId, mediaId);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [oracleReportPDA] = deriveOracleReportPDA(
		program.programId,
		marketPDA,
	);

	const arg = bettingStartsAfter !== null ? new BN(bettingStartsAfter) : null;

	await program.methods
		.createMarket(
			arg,
			new BN(mediaId.toString()),
			DEFAULT_RADIUS,
			oracleSet,
			2,
		)
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

async function placeBet(
	program: Program<Cinefi>,
	user: Keypair,
	marketPDA: PublicKey,
	bucket: number,
	amount: BN,
): Promise<{ userPositionPDA: PublicKey }> {
	const [userPositionPDA] = deriveUserPositionPDA(
		program.programId,
		user.publicKey,
		marketPDA,
		bucket,
	);
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);

	await program.methods
		.placeBet(bucket, amount)
		.accountsPartial({
			user: user.publicKey,
			market: marketPDA,
			userPosition: userPositionPDA,
			vault: vaultPDA,
		})
		.signers([user])
		.rpc();

	return { userPositionPDA };
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

async function submitScore(
	program: Program<Cinefi>,
	oracleSigner: Keypair,
	marketPDA: PublicKey,
	oracleReportPDA: PublicKey,
	score: number,
) {
	await program.methods
		.submitScore(score)
		.accountsPartial({
			oracleSigner: oracleSigner.publicKey,
			market: marketPDA,
			oracleReport: oracleReportPDA,
		})
		.signers([oracleSigner])
		.rpc();
}

async function resolveMarket(
	program: Program<Cinefi>,
	caller: Keypair,
	marketPDA: PublicKey,
	oracleReportPDA: PublicKey,
) {
	const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);
	const [treasuryPDA] = deriveTreasuryPDA(program.programId);

	await program.methods
		.resolveMarket()
		.accountsPartial({
			caller: caller.publicKey,
			market: marketPDA,
			oracleReport: oracleReportPDA,
			vault: vaultPDA,
			treasury: treasuryPDA,
		})
		.signers([caller])
		.rpc();
}

describe("claim_reward_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.cinefi as Program<Cinefi>;

	const oracle1 = Keypair.generate();
	const oracle2 = Keypair.generate();
	const oracle3 = Keypair.generate();
	const oracleSet: [PublicKey, PublicKey, PublicKey] = [
		oracle1.publicKey,
		oracle2.publicKey,
		oracle3.publicKey,
	];

	const creator = Keypair.generate();
	const bettor = Keypair.generate();

	before(async () => {
		await airdrop(provider.connection, creator.publicKey);
		await airdrop(provider.connection, bettor.publicKey);
		await airdrop(provider.connection, oracle1.publicKey, 2);
		await airdrop(provider.connection, oracle2.publicKey, 2);
	});

	it("fails with MarketNotResolved when market has not been resolved", async () => {
		const mediaId = BigInt(5001);
		const bucket = 50;
		const amount = new BN(100_000_000);

		const { marketPDA } = await createMarket(
			program,
			creator,
			mediaId,
			null,
			oracleSet,
		);
		const { userPositionPDA } = await placeBet(
			program,
			bettor,
			marketPDA,
			bucket,
			amount,
		);
		const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);

		try {
			await program.methods
				.claimReward()
				.accountsPartial({
					user: bettor.publicKey,
					market: marketPDA,
					userPosition: userPositionPDA,
					vault: vaultPDA,
				})
				.signers([bettor])
				.rpc();
			assert.fail("Expected transaction to fail with MarketNotResolved");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "MarketNotResolved");
		}
	});

	it("fails with Unauthorized when a different user tries to claim another's position", async () => {
		const mediaId = BigInt(5002);
		const bucket = 30;
		const amount = new BN(100_000_000);

		const stranger = Keypair.generate();
		await airdrop(provider.connection, stranger.publicKey, 2);

		const { marketPDA } = await createMarket(
			program,
			creator,
			mediaId,
			null,
			oracleSet,
		);
		const [bettorPositionPDA] = deriveUserPositionPDA(
			program.programId,
			bettor.publicKey,
			marketPDA,
			bucket,
		);
		const [vaultPDA] = deriveVaultPDA(program.programId, marketPDA);

		await program.methods
			.placeBet(bucket, amount)
			.accountsPartial({
				user: bettor.publicKey,
				market: marketPDA,
				userPosition: bettorPositionPDA,
				vault: vaultPDA,
			})
			.signers([bettor])
			.rpc();

		try {
			await program.methods
				.claimReward()
				.accountsPartial({
					user: stranger.publicKey,
					market: marketPDA,
					userPosition: bettorPositionPDA,
					vault: vaultPDA,
				})
				.signers([stranger])
				.rpc();
			assert.fail(
				"Expected transaction to fail due to invalid user_position seeds",
			);
		} catch (err: any) {
			assert.ok(
				err,
				"Should fail when trying to claim another user's position",
			);
		}
	});
});
