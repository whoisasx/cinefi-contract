import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { InitializeTreasuryEvent } from "../types/events";

export async function handleInitializeTreasury(
	tx: HeliusEnhancedTransaction,
	_ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<InitializeTreasuryEvent> {
	return {
		eventType: "initialize_treasury",
		network,
		signature: tx.signature,
		slot: tx.slot,
		timestamp: tx.timestamp,
		data: {},
	};
}
