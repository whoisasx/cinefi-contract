import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import type { Cinefi } from "./types";
import IDL from "../../target/idl/cinefi.json";

export * from "./pdas";
export * from "./constants";
export * from "./errors";
export * from "./types";
export * from "./utils";
export * from "./accounts";
export * from "./instructions/initialize-treasury";
export * from "./instructions/create-market";
export * from "./instructions/place-bet";
export * from "./instructions/close-market";
export * from "./instructions/submit-score";
export * from "./instructions/resolve-market";
export * from "./instructions/claim-reward";
export * from "./instructions/reclaim-pool";

export interface CinefiSDKConfig {
	connection: Connection;
	wallet?: Wallet;
	programId?: PublicKey;
}

export class CinefiSDK {
	public readonly program: Program<Cinefi>;
	public readonly connection: Connection;
	public readonly wallet?: Wallet;
	public readonly programId: PublicKey;

	constructor(config: CinefiSDKConfig) {
		this.connection = config.connection;
		this.wallet = config.wallet;
		this.programId = config.programId || new PublicKey(IDL.address);

		// Create provider
		const provider = new AnchorProvider(
			this.connection,
			this.wallet || ({} as Wallet),
			{ commitment: "confirmed" },
		);

		// Initialize program
		this.program = new Program<Cinefi>(IDL as Cinefi, provider);
	}

	/**
	 * Create a new SDK instance
	 */
	static create(config: CinefiSDKConfig): CinefiSDK {
		return new CinefiSDK(config);
	}

	/**
	 * Get the program ID
	 */
	static getProgramId(): PublicKey {
		return new PublicKey(IDL.address);
	}
}
