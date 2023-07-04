import { cosmiconfig } from "../deps.ts";
import { MonkeyConfig } from "./monkey.ts";

export async function loadConfig(path?: string): Promise<MonkeyConfig | null> {
  const cc = cosmiconfig("oa");
  const result = await (path ? cc.load(path) : cc.search("."));
  return result?.config ?? null;
}
