import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Cinefi } from "../target/types/cinefi";
import { assert } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";

const MARKET_SEED = Buffer.from("market_seed");
const VAULT_SEED = Buffer.from("vault_seed");
const ORACLE_REPORT_SEED = Buffer.from("oracle_report_seed");

function mediaIdToBytes(mediaId: bigint): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigInt64LE(mediaId);
	return buf;
}

async function deriveMarketPDA(
	programId: PublicKey,
	mediaId: bigint,
): Promise<[PublicKey, number]> {
	return PublicKey.findProgramAddressSync(
		[MARKET_SEED, mediaIdToBytes(mediaId)],
		programId,
	);
}
async function deriveVaultPDA(
	programId: PublicKey,
	marketKey: PublicKey,
): Promise<[PublicKey, number]> {
	return PublicKey.findProgramAddressSync(
		[VAULT_SEED, marketKey.toBuffer()],
		programId,
	);
}
async function deriveOracleReportPDA(
	programId: PublicKey,
	marketKey: PublicKey,
): Promise<[PublicKey, number]> {
	return PublicKey.findProgramAddressSync(
		[ORACLE_REPORT_SEED, marketKey.toBuffer()],
		programId,
	);
}

describe("create_market_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.cinefi as Program<Cinefi>;
	const creator = provider.wallet as anchor.Wallet;

	const oracleOne = Keypair.generate();
	const oracleTwo = Keypair.generate();
	const oracleThree = Keypair.generate();

	const oracleSet = [
		oracleOne.publicKey,
		oracleTwo.publicKey,
		oracleThree.publicKey,
	];

	it("creates a market successfully with no buffer time", async () => {
		const mediaId = BigInt(1001);
		const radius = 5;
		const oracleThreshold = 2;

		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [oracleReportPDA] = await deriveOracleReportPDA(
			program.programId,
			marketPDA,
		);

		await program.methods
			.createMarket(
				null,
				new BN(mediaId.toString()),
				radius,
				oracleSet,
				oracleThreshold,
			)
			.accounts({
				creator: creator.publicKey,
			})
			.rpc();

		const market = await program.account.market.fetch(marketPDA);
		const oracleReport = await program.account.oracleReport.fetch(
			oracleReportPDA,
		);

		assert.equal(
			market.mediaId.toString(),
			mediaId.toString(),
			"media_id should match",
		);
		assert.equal(
			market.creator.toBase58(),
			creator.publicKey.toBase58(),
			"creator should match",
		);
		assert.equal(
			market.oracleThreshold,
			oracleThreshold,
			"oracle_threshold should match",
		);
		assert.equal(
			market.oracleSet[0].toBase58(),
			oracleSet[0].toBase58(),
			"oracleSet[0] should match",
		);
		assert.equal(market.totalPool.toNumber(), 0, "total_pool should be 0");
		assert.equal(
			market.totalPrizePool.toNumber(),
			0,
			"total_prize_pool should be 0",
		);

		assert.isFalse(market.resolved, "resolved should be false");
		assert.isFalse(market.closed, "closed should be false");
		assert.isFalse(market.reclaimed, "reclaimed should be false");
		assert.isFalse(market.fallbackUsed, "fallbackUsed should be false");

		assert.equal(
			oracleReport.market.toBase58(),
			marketPDA.toBase58(),
			"oracle_report.market should point to market",
		);
		assert.equal(
			oracleReport.submissionCount,
			0,
			"submission_count should be 0",
		);
		assert.isFalse(oracleReport.finalized, "finalised should be false");
		assert.isFalse(oracleReport.disputed, "disputed should be false");
	});

	it("creates a market successfully with a buffer time", async () => {
		const mediaId = BigInt(1002);
		const radius = 5;
		const oracleThreshold = 2;
		const bufferTime = new BN(3600);

		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [oracleReportPDA] = await deriveOracleReportPDA(
			program.programId,
			marketPDA,
		);

		await program.methods
			.createMarket(
				bufferTime,
				new BN(mediaId.toString()),
				radius,
				oracleSet,
				oracleThreshold,
			)
			.accounts({
				creator: creator.publicKey,
			})
			.rpc();

		const market = await program.account.market.fetch(marketPDA);
		const oracleReport = await program.account.oracleReport.fetch(
			oracleReportPDA,
		);

		const diff =
			market.bettingStartsAt.toNumber() - market.createdAt.toNumber();
		assert.equal(
			diff,
			bufferTime.toNumber(),
			"buffer_time should be reflected at betting_starts_at",
		);

		assert.equal(
			market.mediaId.toString(),
			mediaId.toString(),
			"media_id should match",
		);
		assert.equal(
			market.creator.toBase58(),
			creator.publicKey.toBase58(),
			"creator should match",
		);
		assert.equal(
			market.oracleThreshold,
			oracleThreshold,
			"oracle_threshold should match",
		);
		assert.equal(
			market.oracleSet[0].toBase58(),
			oracleSet[0].toBase58(),
			"oracleSet[0] should match",
		);
		assert.equal(market.totalPool.toNumber(), 0, "total_pool should be 0");
		assert.equal(
			market.totalPrizePool.toNumber(),
			0,
			"total_prize_pool should be 0",
		);

		assert.isFalse(market.resolved, "resolved should be false");
		assert.isFalse(market.closed, "closed should be false");
		assert.isFalse(market.reclaimed, "reclaimed should be false");
		assert.isFalse(market.fallbackUsed, "fallbackUsed should be false");

		assert.equal(
			oracleReport.market.toBase58(),
			marketPDA.toBase58(),
			"oracle_report.market should point to market",
		);
		assert.equal(
			oracleReport.submissionCount,
			0,
			"submission_count should be 0",
		);
		assert.isFalse(oracleReport.finalized, "finalised should be false");
		assert.isFalse(oracleReport.disputed, "disputed should be false");
	});

	it("fails when oracle_threshold is 1(below minimum)", async () => {
		const mediaId = BigInt(1003);
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [oracleReportPDA] = await deriveOracleReportPDA(
			program.programId,
			marketPDA,
		);

		try {
			await program.methods
				.createMarket(null, new BN(mediaId), 5, oracleSet, 1)
				.accounts({
					creator: creator.publicKey,
				})
				.rpc();

			assert.fail(
				"Expected transaction to fail with InvalidOracleThreshold",
			);
		} catch (error: any) {
			assert.include(
				error.message,
				"InvalidOracleThreshold",
				"Should throw Invalid OracleThreshold",
			);
		}
	});

	it("fails when oracle_threshold is 4(above maximum)", async () => {
		const mediaId = BigInt(1004);
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [oracleReportPDA] = await deriveOracleReportPDA(
			program.programId,
			marketPDA,
		);

		try {
			await program.methods
				.createMarket(null, new BN(mediaId), 5, oracleSet, 4)
				.accounts({
					creator: creator.publicKey,
				})
				.rpc();

			assert.fail(
				"Expected transaction to fail with InvalidOracleThreshold",
			);
		} catch (error: any) {
			assert.include(
				error.message,
				"InvalidOracleThreshold",
				"Should throw Invalid OracleThreshold",
			);
		}
	});

	it("fails when trying to create a market with duplicate media_id", async () => {
		const mediaId = BigInt(1001);
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [oracleReportPDA] = await deriveOracleReportPDA(
			program.programId,
			marketPDA,
		);

		try {
			await program.methods
				.createMarket(null, new BN(mediaId), 5, oracleSet, 3)
				.accounts({
					creator: creator.publicKey,
				})
				.rpc();

			assert.fail(
				"Expected transaction to fail with a duplicate media_id",
			);
		} catch (error: any) {
			assert.ok(error, "Should fail when market already exists");
		}
	});
});
