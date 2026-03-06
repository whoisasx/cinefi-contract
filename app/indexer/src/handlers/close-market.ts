import { PublicKey } from "@solana/web3.js";
import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { CloseMarketEvent } from "../types/events";
import { fetchMarket } from "../rpc";

export async function handleCloseMarket(
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<CloseMarketEvent> {
	const marketPubkey = new PublicKey(ix.accounts[1]);
	const market = await fetchMarket(marketPubkey, network);

	return {
		eventType: "close_market",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		marketId: market.pubkey,
		data: { market },
	};
}
