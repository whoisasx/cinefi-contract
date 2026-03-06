import { PublicKey } from "@solana/web3.js";
import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { SubmitScoreEvent } from "../types/events";
import { fetchOracleReport } from "../rpc";

export async function handleSubmitScore(
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<SubmitScoreEvent> {
	const oracleReportPubkey = new PublicKey(ix.accounts[2]);
	const oracleReport = await fetchOracleReport(oracleReportPubkey, network);

	return {
		eventType: "submit_score",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		marketId: oracleReport.market,
		data: { oracleReport },
	};
}
