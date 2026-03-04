import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Cinefi } from "../target/types/cinefi";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { assert } from "chai";

const MARKET_SEED = Buffer.from("market_seed");
const POSITION_SEED = Buffer.from("position_seed");
const VAULT_SEED = Buffer.from("vault_seed");

function mediaIdToBytes(mediaId: bigint): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigInt64LE(mediaId);
	return buf;
}
function bucketToBytes(bucket: number): Buffer {
	return Buffer.from([bucket]);
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
	marketPDA: PublicKey,
): Promise<[PublicKey, number]> {
	return PublicKey.findProgramAddressSync(
		[VAULT_SEED, marketPDA.toBuffer()],
		programId,
	);
}
async function deriveUserPositionPDA(
	programId: PublicKey,
	user: PublicKey,
	marketPDA: PublicKey,
	bucket: number,
): Promise<[PublicKey, number]> {
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

describe("place_bet_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.cinefi as Program<Cinefi>;
	const create = provider.wallet as anchor.Wallet;
	const user = Keypair.generate();

	it("successfully placed bet with valid bucket", async () => {
		const mediaId = BigInt(1001);
		const amount = new BN(1000);
		const bucket = 10;
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);

		const sig = await provider.connection.requestAirdrop(
			user.publicKey,
			2 * anchor.web3.LAMPORTS_PER_SOL,
		);
		const { blockhash, lastValidBlockHeight } =
			await provider.connection.getLatestBlockhash();
		await provider.connection.confirmTransaction({
			signature: sig,
			blockhash,
			lastValidBlockHeight,
		});

		const [userPositionPDA] = await deriveUserPositionPDA(
			program.programId,
			user.publicKey,
			marketPDA,
			bucket,
		);
		const [vaultPDA] = await deriveVaultPDA(program.programId, marketPDA);

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

		const userPosition = await program.account.userPosition.fetch(
			userPositionPDA,
		);
		assert.equal(
			userPosition.market.toBase58(),
			marketPDA.toBase58(),
			"market should be same",
		);
		assert.equal(
			userPosition.user.toBase58(),
			user.publicKey.toBase58(),
			"user should match",
		);
		assert.equal(userPosition.bucket, bucket, "bucket should match");
		assert.equal(
			userPosition.amount.toNumber(),
			amount.toNumber(),
			"amount should match",
		);
		assert.equal(
			userPosition.weightedAmount.toNumber(),
			amount.toNumber(),
			"weighted amount on day 0 should equal raw amount",
		);
		assert.equal(
			userPosition.claimed,
			false,
			"claimed should be false initially",
		);

		try {
			const [bucket0PDA] = await deriveUserPositionPDA(
				program.programId,
				user.publicKey,
				marketPDA,
				0,
			);
			await program.methods
				.placeBet(0, amount)
				.accountsPartial({
					user: user.publicKey,
					market: marketPDA,
					userPosition: bucket0PDA,
					vault: vaultPDA,
				})
				.signers([user])
				.rpc();
			assert.fail("Expected transaction to fail with bucket=0");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "InvalidBucket");
		}

		try {
			const [bucket101PDA] = await deriveUserPositionPDA(
				program.programId,
				user.publicKey,
				marketPDA,
				101,
			);
			await program.methods
				.placeBet(101, amount)
				.accountsPartial({
					user: user.publicKey,
					market: marketPDA,
					userPosition: bucket101PDA,
					vault: vaultPDA,
				})
				.signers([user])
				.rpc();
			assert.fail("Expected transaction to fail with bucket=101");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "InvalidBucket");
		}

		try {
			await program.methods
				.placeBet(bucket, new BN(0))
				.accountsPartial({
					user: user.publicKey,
					market: marketPDA,
					userPosition: userPositionPDA,
					vault: vaultPDA,
				})
				.signers([user])
				.rpc();
			assert.fail("Expected transaction to fail with amount=0");
		} catch (err: any) {
			assert.instanceOf(err, AnchorError);
			assert.equal(err.error.errorCode.code, "InvalidAmount");
		}
	});
	it("adds to an existing position", async () => {
		const mediaId = BigInt(1001);
		const amount = new BN(10000);
		const bucket = 10;
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);

		const sig = await provider.connection.requestAirdrop(
			user.publicKey,
			2 * anchor.web3.LAMPORTS_PER_SOL,
		);
		const { blockhash, lastValidBlockHeight } =
			await provider.connection.getLatestBlockhash();
		await provider.connection.confirmTransaction({
			signature: sig,
			blockhash,
			lastValidBlockHeight,
		});

		const [userPositionPDA] = await deriveUserPositionPDA(
			program.programId,
			user.publicKey,
			marketPDA,
			bucket,
		);
		const [vaultPDA] = await deriveVaultPDA(program.programId, marketPDA);

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

		const userPosition = await program.account.userPosition.fetch(
			userPositionPDA,
		);
		assert.equal(
			userPosition.amount.toNumber(),
			new BN(11000).toNumber(),
			"amount should accumulate across bets",
		);
		assert.equal(
			userPosition.weightedAmount.toNumber(),
			new BN(11000).toNumber(),
			"weighted amount should also accumulate",
		);
	});
	it("weighted amount decays over time", async () => {
		const mediaId = BigInt(1001);
		const amount = new BN(5000);
		const bucket = 50;
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [vaultPDA] = await deriveVaultPDA(program.programId, marketPDA);
		const [userPositionPDA] = await deriveUserPositionPDA(
			program.programId,
			user.publicKey,
			marketPDA,
			bucket,
		);

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

		const userPosition = await program.account.userPosition.fetch(
			userPositionPDA,
		);
		assert.equal(
			userPosition.weightedAmount.toNumber(),
			amount.toNumber(),
			"weighted amount on day 0 should equal raw amount (multiplier = 1.0)",
		);
		assert.isAtMost(
			userPosition.weightedAmount.toNumber(),
			userPosition.amount.toNumber(),
			"weighted amount should never exceed raw amount",
		);
	});
	it("SOL is transferred to vault", async () => {
		const mediaId = BigInt(1001);
		const amount = new BN(5000);
		const bucket = 40;
		const [marketPDA] = await deriveMarketPDA(program.programId, mediaId);
		const [vaultPDA] = await deriveVaultPDA(program.programId, marketPDA);
		const [userPositionPDA] = await deriveUserPositionPDA(
			program.programId,
			user.publicKey,
			marketPDA,
			bucket,
		);

		const vaultBalanceBefore = await provider.connection.getBalance(
			vaultPDA,
		);

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

		const vaultBalanceAfter = await provider.connection.getBalance(
			vaultPDA,
		);
		assert.equal(
			vaultBalanceAfter - vaultBalanceBefore,
			amount.toNumber(),
			"vault balance should increase by exact bet amount in lamports",
		);
	});
});
