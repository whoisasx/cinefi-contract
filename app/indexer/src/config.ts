import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function required(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

export const config = {
	port: parseInt(process.env["PORT"] ?? "4000", 10),
	mainnetRpcUrl: required("MAINNET_RPC_URL"),
	devnetRpcUrl: required("DEVNET_RPC_URL"),
	backendUrl: required("BACKEND_URL"),
} as const;

export type Network = "mainnet" | "devnet";
