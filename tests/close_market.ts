import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Cinefi } from "../target/types/cinefi";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { assert } from "chai";

const MARKET_SEED = Buffer.from("market_seed");
const VAULT_SEED = Buffer.from("vault_seed");
const ORACLE_REPORT_SEED = Buffer.from("oracle_report_seed");

const BETTING_DURATION_SECONDS = 14 * 86_400;

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
	sol: number = 2,
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

	const bettingStartsAfterArg =
		bettingStartsAfter !== null ? new BN(bettingStartsAfter) : null;

	await program.methods
		.createMarket(
			bettingStartsAfterArg,
			new BN(mediaId.toString()),
			5,
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

describe("close_market_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.cinefi as Program<Cinefi>;
	const creator = Keypair.generate();

	const oracle1 = Keypair.generate().publicKey;
	const oracle2 = Keypair.generate().publicKey;
	const oracle3 = Keypair.generate().publicKey;
	const oracleSet: [PublicKey, PublicKey, PublicKey] = [
		oracle1,
		oracle2,
		oracle3,
	];

	before(async () => {
		await airdrop(provider.connection, creator.publicKey, 10);
	});

	it("successfully closes a market after betting window ends", async () => {
		const mediaId = BigInt(2001);
		const { marketPDA } = await createMarket(
			program,
			creator,
			mediaId,
			-(BETTING_DURATION_SECONDS + 1),
			oracleSet,
		);

		await program.methods
			.closeMarket()
			.accountsPartial({
				caller: creator.publicKey,
				market: marketPDA,
			})
			.signers([creator])
			.rpc();

		const market = await program.account.market.fetch(marketPDA);
		assert.isTrue(
			market.closed,
			"market.closed should be true after closing",
		);
		assert.isFalse(market.resolved, "market.resolved should remain false");
	});

	it("fails with BettingStillOpen when betting window has not ended yet", async () => {
		const mediaId = BigInt(2002);
		const { marketPDA } = await createMarket(
			program,
			creator,
			mediaId,
			null,
			oracleSet,
		);

		try {
			await program.methods
				.closeMarket()
				.accountsPartial({
					caller: creator.publicKey,
					market: marketPDA,
				})
				.signers([creator])
				.rpc();
			assert.fail("Expected transaction to fail with BettingStillOpen");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "BettingStillOpen");
		}
	});

	it("fails with MarketAlreadyClosed when closing an already-closed market", async () => {
		const mediaId = BigInt(2001);
		const [marketPDA] = deriveMarketPDA(program.programId, mediaId);

		try {
			await program.methods
				.closeMarket()
				.accountsPartial({
					caller: creator.publicKey,
					market: marketPDA,
				})
				.signers([creator])
				.rpc();
			assert.fail(
				"Expected transaction to fail with MarketAlreadyClosed",
			);
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "MarketAlreadyClosed");
		}
	});

	it("any caller can close the market — not creator-gated", async () => {
		const mediaId = BigInt(2003);
		const { marketPDA } = await createMarket(
			program,
			creator,
			mediaId,
			-(BETTING_DURATION_SECONDS + 1),
			oracleSet,
		);

		const stranger = Keypair.generate();
		await airdrop(provider.connection, stranger.publicKey);

		await program.methods
			.closeMarket()
			.accountsPartial({
				caller: stranger.publicKey,
				market: marketPDA,
			})
			.signers([stranger])
			.rpc();

		const market = await program.account.market.fetch(marketPDA);
		assert.isTrue(
			market.closed,
			"market should be closed by a non-creator caller",
		);
	});
});
