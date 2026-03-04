import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { Cinefi } from "../target/types/cinefi";

const TREASURY_SEED = Buffer.from("treasury_seed");

function deriveTreasuryPDA(programId: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

describe("initialize_treasury_test", async () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.cinefi as Program<Cinefi>;

	it("initializes treasury PDA", async () => {
		const [treasuryPDA] = deriveTreasuryPDA(program.programId);
		const before = await provider.connection.getAccountInfo(treasuryPDA);

		if (!before) {
			await program.methods
				.initializeTreasury()
				.accountsPartial({
					authority: provider.wallet.publicKey,
					treasury: treasuryPDA,
				})
				.rpc();
		}

		const after = await provider.connection.getAccountInfo(treasuryPDA);
		assert.isNotNull(after, "treasury PDA account must exist");
		assert.equal(
			after!.owner.toBase58(),
			program.programId.toBase58(),
			"treasury account owner should be program id",
		);
		assert.isAbove(
			after!.lamports,
			0,
			"treasury account should be rent funded",
		);
	});
});
