import { cosmiconfig } from "cosmiconfig";

import { ValidationError } from "cliffy/flags/_errors.ts";
import { deepMerge } from "std/collections/deep_merge.ts";

import type { Protocol } from "puppeteer/vendor/puppeteer-core/vendor/devtools-protocol/types/protocol.d.ts";

import { MonkeyConfig } from "./types.ts";
import { shake, validateURL } from "./utils.ts";

export const defaultConfig = {
  cookies: [],
  headers: {},
  num: 1,
  debug: false,
  url: "",
  duration: "10s",
  show: false,
  targets: {
    scrolling: {
      enabled: true,
    },
    buttons: {
      enabled: true,
    },
    inputs: {
      enabled: true,
    },
    links: {
      enabled: true,
    },
    typing: {
      enabled: true,
    },
  },
} satisfies MonkeyConfig;

export async function loadConfig(
  path?: string,
  mergeIn: Partial<MonkeyConfig> = {},
): Promise<MonkeyConfig> {
  const cc = cosmiconfig("oa");

  const result = await (path ? cc.load(path) : cc.search("."));

  const config = shake(result?.config ?? {});

  const combined = deepMerge(
    defaultConfig,
    deepMerge(
      config,
      shake({
        ...mergeIn,
        duration: mergeIn.duration === defaultConfig.duration ? undefined : mergeIn.duration,
        num: mergeIn.num === defaultConfig.num ? undefined : mergeIn.num,
      }),
    ),
  ) as MonkeyConfig;

  if (combined.url.length === 0) {
    throw new ValidationError("No URL provided!");
  } else {
    validateURL(combined.url);
  }

  const cookies = combined.cookies.map(({ domain, ...cookie }) => ({
    ...cookie,
    domain: domain ?? new URL(combined.url).hostname,
  })) as Protocol.Network.CookieParam[];

  return {
    ...combined,
    cookies,
  } as MonkeyConfig;
}
