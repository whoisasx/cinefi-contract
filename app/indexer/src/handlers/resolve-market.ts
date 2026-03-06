import { PublicKey } from "@solana/web3.js";
import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { ResolveMarketEvent } from "../types/events";
import { fetchMarket, fetchOracleReport, fetchBucketPrizes } from "../rpc";

export async function handleResolveMarket(
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<ResolveMarketEvent> {
	const marketPubkey = new PublicKey(ix.accounts[1]);
	const oracleReportPubkey = new PublicKey(ix.accounts[2]);

	const [market, oracleReport, bucketPrizes] = await Promise.all([
		fetchMarket(marketPubkey, network),
		fetchOracleReport(oracleReportPubkey, network),
		fetchBucketPrizes(marketPubkey, network),
	]);

	return {
		eventType: "resolve_market",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		marketId: market.pubkey,
		data: { market, oracleReport, bucketPrizes },
	};
}
