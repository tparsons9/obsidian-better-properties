import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export default function checkCliSocket(): () => void {
	if (!process.env.BETTER_PROPERTIES_APP_ASAR || !existsSync(process.env.BETTER_PROPERTIES_APP_ASAR)) {
		throw new Error("Set OBSIDIAN_PATH to the installed Obsidian app.asar.");
	}
	const sharedSocket = process.platform === "win32" ? undefined
		: join(process.platform !== "darwin" && process.env.XDG_RUNTIME_DIR || homedir(), ".obsidian-cli.sock");
	const socketStat = () => sharedSocket && existsSync(sharedSocket) ? statSync(sharedSocket) : undefined;
	const before = socketStat();
	return () => {
		const after = socketStat();
		if (before?.dev !== after?.dev || before?.ino !== after?.ino) {
			throw new Error("The E2E run changed the normal Obsidian CLI socket.");
		}
	};
}
