import {
  type ArgumentValue,
  type BackgroundColorName,
  backgroundColorNames,
  Command,
  range,
  string,
  ValidationError,
} from "../deps.ts";

import { monkeyTest } from "./monkey.ts";
import { randomSubset } from "./random.ts";

function urlType({ value }: ArgumentValue): string {
  if (string().url().safeParse(value).success === false) {
    throw new ValidationError(
      "Invalid URL. URLs must include a protocol and domain.",
    );
  }
  return value;
}

export const cli = await new Command()
  .name("oa")
  .description("A Deno-based monkey testing CLI.")
  .version("v0.0.1")
  .type("URL", urlType)
  .arguments("<url:URL>")
  .option("-c, --count <count:integer>", "Number of monkeys to dispatch.")
  .option("-s, --show", "Show the browser windows.")
  .option("-t, --time <time:string>", "How long to run the test.", {
    default: "10s",
  })
  .action(async ({ time, show = false, count = 3 }, url) => {
    const colors = randomSubset(backgroundColorNames, count);

    await Promise.all(
      Array.from(range(1, count)).map((num, idx) =>
        monkeyTest({
          name: `Monkey ${num}`,
          runFor: time,
          color: colors[idx] as BackgroundColorName,
          url,
          show,
        })
      ),
    );

    console.log("\n🐵 All the monkeys are done!");

    Deno.exit(0);
  });
