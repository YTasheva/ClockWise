const { spawn } = require("child_process");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, label) {
  const child = spawn(command, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
  });
  return child;
}

const backend = run(npmCmd, ["--prefix", "backend", "run", "dev"], "backend");
const frontend = run(npmCmd, ["--prefix", "frontend", "run", "dev"], "frontend");

function shutdown() {
  backend.kill("SIGINT");
  frontend.kill("SIGINT");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
