import { PublicKey } from "@solana/web3.js";
import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { ClaimRewardEvent } from "../types/events";
import { fetchUserPosition } from "../rpc";

export async function handleClaimReward(
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<ClaimRewardEvent> {
	const positionPubkey = new PublicKey(ix.accounts[2]);
	const position = await fetchUserPosition(positionPubkey, network);

	return {
		eventType: "claim_reward",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		marketId: position.market,
		data: { position },
	};
}
