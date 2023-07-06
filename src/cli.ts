import { ArgumentValue } from "cliffy/flags/types.ts";
import { Command, ValidationError } from "cliffy/command/mod.ts";
import { colors } from "cliffy/ansi/colors.ts";

import { getSetCookies } from "std/http/cookie.ts";

import { range } from "radash";

import { Protocol } from "puppeteer/vendor/puppeteer-core/vendor/devtools-protocol/types/protocol.d.ts";

import { defaultConfig, loadConfig } from "./config.ts";
import { BG_COLORS } from "./constants.ts";

import { monkeyTest } from "./monkey.ts";
import { randomSubset } from "./random.ts";
import { ColorMethods } from "./types.ts";
import { kvToMap, validateURL } from "./utils.ts";

export function urlType({ value }: ArgumentValue): string {
  validateURL(value);
  return value;
}

export function kvType({ value }: ArgumentValue): string {
  if (value.split("=").length !== 2) {
    throw new ValidationError(
      "Invalid cookie. Must be of the format name=value.",
    );
  }
  return value;
}

export const cli = await new Command()
  .name("oa")
  .description("A Deno-based monkey testing CLI.")
  .version("v0.0.1")
  .type("URL", urlType)
  .type("KV", kvType)
  .arguments("[url:URL]")
  .option("-n, --num <num:integer>", "Number of monkeys to dispatch.", {
    default: defaultConfig.num,
  })
  .option("-s, --show", "Show the browser windows.")
  .option("-d, --duration <duration:string>", "How long to run the test.", {
    default: defaultConfig.duration,
  })
  .option(
    "-f, --filter-links <filter:string>",
    "Only follow links that contain the given string.",
    { conflicts: ["skip-links"], equalsSign: true },
  )
  .option("-B, --skip-buttons", "Skip clicking buttons.")
  .option("-L, --skip-links", "Skip clicking links.")
  .option("-C, --skip-clicking", "Skip random clicking.")
  .option("-I, --skip-inputs", "Skip filling inputs.")
  .option("-T, --skip-typing", "Skip sending random keystrokes.")
  .option("-S, --skip-scrolling", "Skip scrolling.")
  .option("-D, --debug", "Whether to print additional debug information.")
  .option(
    "-c, --cookie <cookie:KV>",
    "Cookie to pass to the browser. Can be used multiple times. Example: -c foo=bar -c baz=qux.",
    { collect: true },
  )
  .option(
    "-F, --config-file <file:string>",
    "Load the configuration from a local file.",
  )
  .option(
    "-H, --header <header:KV>",
    "Header to pass to the browser. Can be used multiple times. Example: -H foo=bar -c baz=qux.",
    { collect: true },
  )
  .action(
    async ({ cookie = [], header = [], debug, configFile, ...flags }, url) => {
      const headers = kvToMap(header);

      const cookies = getSetCookies(
        new Headers(cookie.map((cookie) => ["set-cookie", cookie])),
      ) as Protocol.Network.CookieParam[];

      const config = await loadConfig(configFile, {
        ...flags,
        url,
        headers,
        cookies,
        debug,
        targets: {
          ...flags.skipButtons && { buttons: { enabled: false } },
          ...flags.skipInputs && { inputs: { enabled: false } },
          ...flags.skipLinks && { links: { enabled: false } },
          ...flags.skipTyping && { typing: { enabled: false } },
          ...flags.skipClicking && { clicking: { enabled: false } },
          ...flags.skipScrolling && { scrolling: { enabled: false } },
          ...flags.filterLinks &&
            {
              links: {
                enabled: true,
                filter: flags.filterLinks,
              },
            },
        },
      });

      if (config.num < 1 || config.num > 7) {
        throw new ValidationError(
          "Number of monkeys must be between 1 and 7.",
        );
      }

      if (debug) {
        console.log(
          `\n${colors.bold("Configuration:")}\n\n${JSON.stringify(config, null, 2)}\n`,
        );
      }

      const monkeyColors = randomSubset(
        BG_COLORS,
        config.num,
      ) as ColorMethods[];

      await Promise.all(
        Array.from(range(1, config.num)).map((num, idx) =>
          monkeyTest(
            `Monkey ${num}`,
            monkeyColors[idx],
            config,
          )
        ),
      );

      console.log("\n🐵 All the monkeys are done!");

      Deno.exit(0);
    },
  );
