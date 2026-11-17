// @ts-check
// Loaded by the test bootstrap before Obsidian starts. The installed app binds
// its CLI socket in the OS home/runtime directory even with --user-data-dir.
// Redirect only that endpoint; never change HOME or touch the user's socket.
if (process.versions.electron && process.type === "browser") {
	const fs = require("node:fs");
	const net = require("node:net");
	const os = require("node:os");
	const path = require("node:path");
	const userData = process.argv.find((arg) => arg.startsWith("--user-data-dir="))?.slice("--user-data-dir=".length);
	if (!userData || !path.basename(userData).startsWith("opdk-e2e-userdata-")) {
		throw new Error("CLI isolation requires opdk's explicit temporary user-data directory.");
	}
	const shared = process.platform === "win32"
		? `\\\\.\\pipe\\obsidian-cli-${os.userInfo().username}`
		: path.join(process.platform !== "darwin" && process.env.XDG_RUNTIME_DIR || os.homedir(), ".obsidian-cli.sock");
	const isolated = process.platform === "win32"
		? `\\\\.\\pipe\\better-properties-e2e-${process.pid}`
		: path.join(userData, "cli.sock");
	const unlink = fs.unlinkSync;
	fs.unlinkSync = (target) => unlink(target === shared ? isolated : target);
	net.Server.prototype.listen = new Proxy(net.Server.prototype.listen, {
		apply(target, receiver, args) {
			return Reflect.apply(target, receiver, args.map((value) => value === shared ? isolated : value));
		},
	});
}
