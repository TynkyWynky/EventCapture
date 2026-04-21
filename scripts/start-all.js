const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

const isWindows = process.platform === "win32";
const command = isWindows ? "powershell" : "bash";
const commandArgs = isWindows
  ? [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(__dirname, "start-all.ps1"),
      ...args.map((arg) => {
        if (arg === "--check-only") return "-CheckOnly";
        if (arg === "--skip-checks") return "-SkipChecks";
        return arg;
      }),
    ]
  : [path.join(__dirname, "start-all.sh"), ...args];

const result = spawnSync(command, commandArgs, {
  stdio: "inherit",
  cwd: repoRoot,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
