import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync("dist/server.cjs")) {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const build = spawnSync(npmCommand, ["run", "build"], {
        stdio: "inherit",
    });

    if (build.status !== 0) {
        process.exit(build.status ?? 1);
    }
}

await import("./dist/server.cjs");