import { cli } from "./src/cli.ts";

if (import.meta.main) {
  cli.parse();
}
