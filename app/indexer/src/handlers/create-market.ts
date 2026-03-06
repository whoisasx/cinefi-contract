import { PublicKey } from "@solana/web3.js";
import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { CreateMarketEvent } from "../types/events";
import { fetchMarket, fetchOracleReport } from "../rpc";

export async function handleCreateMarket(
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<CreateMarketEvent> {
	const marketPubkey = new PublicKey(ix.accounts[1]);
	const oracleReportPubkey = new PublicKey(ix.accounts[3]);

	const [market, oracleReport] = await Promise.all([
		fetchMarket(marketPubkey, network),
		fetchOracleReport(oracleReportPubkey, network),
	]);

	return {
		eventType: "create_market",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		marketId: market.pubkey,
		data: { market, oracleReport },
	};
}
