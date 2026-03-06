import { PublicKey } from "@solana/web3.js";
import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { PlaceBetEvent } from "../types/events";
import { fetchMarket, fetchUserPosition, fetchBucketPool } from "../rpc";

export async function handlePlaceBet(
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<PlaceBetEvent> {
	const marketPubkey = new PublicKey(ix.accounts[1]);
	const positionPubkey = new PublicKey(ix.accounts[2]);

	// Fetch market and position in parallel; then fetch the updated bucket pool
	const [market, position] = await Promise.all([
		fetchMarket(marketPubkey, network),
		fetchUserPosition(positionPubkey, network),
	]);

	const bucketPool = await fetchBucketPool(
		marketPubkey,
		position.bucket,
		network,
	);

	return {
		eventType: "place_bet",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		marketId: market.pubkey,
		data: { market, position, bucketPool },
	};
}
