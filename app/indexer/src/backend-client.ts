import axios, { AxiosError } from "axios";
import { config } from "./config";
import { EventPayload } from "./types/events";

const client = axios.create({
	baseURL: config.backendUrl,
	timeout: 10_000,
	headers: { "Content-Type": "application/json" },
});

export async function sendEvent(payload: EventPayload): Promise<void> {
	try {
		await client.post("/indexer/event", payload);
	} catch (err) {
		const axiosErr = err as AxiosError;
		const status = axiosErr.response?.status;
		const body = axiosErr.response?.data;
		throw new Error(
			`Backend rejected event [${
				payload.eventType
			}] — HTTP ${status}: ${JSON.stringify(body)}`,
		);
	}
}
