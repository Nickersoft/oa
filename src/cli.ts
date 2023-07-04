import {
  type ArgumentValue,
  type BackgroundColorName,
  backgroundColorNames,
  Command,
  getSetCookies,
  objectify,
  Protocol,
  range,
  shake,
  string,
  ValidationError,
} from "../deps.ts";
import { loadConfig } from "./config.ts";

import { MonkeyConfig, monkeyTest } from "./monkey.ts";
import { randomSubset } from "./random.ts";

function urlType({ value }: ArgumentValue): string {
  if (string().url().safeParse(value).success === false) {
    throw new ValidationError(
      "Invalid URL. URLs must include a protocol and domain.",
    );
  }
  return value;
}

function kvType({ value }: ArgumentValue): string {
  if (value.split("=").length !== 2) {
    throw new ValidationError(
      "Invalid cookie. Must be of the format name=value.",
    );
  }
  return value;
}

function kvToMap(kv: string[]) {
  return objectify(
    kv?.map((cookie) => cookie.split("=")) ?? [],
    ([key]) => key,
    ([_, value]) => value,
  );
}

export const cli = await new Command()
  .name("oa")
  .description("A Deno-based monkey testing CLI.")
  .version("v0.0.1")
  .type("URL", urlType)
  .type("KV", kvType)
  .arguments("<url:URL>")
  .option("-n, --num <num:integer>", "Number of monkeys to dispatch.", {
    default: 1,
  })
  .option("-s, --show", "Show the browser windows.")
  .option("-d, --duration <duration:string>", "How long to run the test.", {
    default: "10s",
  })
  .option(
    "-f, --filter-links <filter:string>",
    "Only follow links that contain the given string.",
    { conflicts: ["skip-links"], equalsSign: true },
  )
  .option("-B, --skip-buttons", "Skip clicking buttons.")
  .option("-L, --skip-links", "Skip clicking links.")
  .option("-I, --skip-inputs", "Skip filling inputs.")
  .option("-T, --skip-typing", "Skip sending random keystrokes.")
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
    async (
      {
        cookie = [],
        header = [],
        configFile,
        duration,
        show,
        num,
        skipButtons,
        skipInputs,
        skipLinks,
        skipTyping,
        filterLinks,
      },
      url,
    ) => {
      const loadedConfig = await loadConfig(configFile) ?? {};

      const config = {
        duration: "10s",
        show: false,
        num: num ?? 1,
        cookies: [],
        headers: {},
        ...loadedConfig,
      };

      const colors = randomSubset(backgroundColorNames, config.num);

      const cookies = [
        ...config.cookies,
        ...getSetCookies(
          new Headers(cookie.map((cookie) => ["set-cookie", cookie])),
        ),
      ]
        .map((cookie) => {
          if (!cookie.domain) {
            cookie.domain = new URL(url).hostname;
          }
          return cookie;
        }) as Protocol.Network.CookieParam[];

      const headers = kvToMap(header);

      await Promise.all(
        Array.from(range(1, config.num)).map((num, idx) =>
          monkeyTest({
            ...config,
            ...shake({
              name: `Monkey ${num}`,
              duration,
              color: colors[idx] as BackgroundColorName,
              url,
              show,
              headers,
              cookies,
              skipButtons,
              skipLinks,
              skipInputs,
              skipTyping,
              filterLinks,
            }) as MonkeyConfig,
          })
        ),
      );

      console.log("\n🐵 All the monkeys are done!");

      Deno.exit(0);
    },
  );
