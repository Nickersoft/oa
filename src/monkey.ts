import {
  type BackgroundColorName,
  draw,
  ms,
  Page,
  puppeteer,
  sleep,
} from "../deps.ts";

import { chalk } from "./chalk.ts";
import { getRandomKeys, getRandomString } from "./random.ts";

export interface MonkeyArgs {
  name: string;
  color: BackgroundColorName;
  url: string;
  show?: boolean;
  runFor?: string;
}

async function getInteractiveElements(page: Page) {
  const clickableSelectors = ["a", "button", "input"].join(", ");

  const inputSelectors = [
    `input`,
    `not([type="select"])`,
    `not([type="radio"])`,
    `not([type="checkbox"])`,
    `not([type="button"])`,
    `not([type="submit"])`,
  ].join(":");

  return {
    buttons: await page.$$(clickableSelectors),
    inputs: await page.$$(inputSelectors),
  };
}

export async function monkeyTest(
  { name, color, url, show, runFor }: MonkeyArgs,
) {
  const browser = await puppeteer.launch({ headless: !show });
  const page = await browser.newPage();
  const prefix = chalk[color](`[${name}]`);
  const runtimeMs = ms(runFor);

  let currentURL = url;

  function log(text: string) {
    console.log(`${prefix} ${text}`);
  }

  async function clickRandom() {
    const randomElement = draw(elements.buttons);
    const text = await page.evaluate((el) => el.textContent, randomElement);
    const tag = await page.evaluate((el) => el.tagName, randomElement);

    await randomElement?.click();

    log(`Clicked "${tag.toLowerCase()}" element with text: "${text}"`);
  }

  async function inputRandom() {
    const randomElement = draw(elements.inputs);
    const text = getRandomString();

    await randomElement?.focus();
    await randomElement?.evaluate((el) => el.value = "");
    await page.keyboard.type(text);
    await page.keyboard.press("Enter");

    log(`Filled input with string: "${text}"`);
  }

  async function typeRandom() {
    const keys = getRandomKeys();

    for (const key of keys) {
      key && await page.keyboard.press(key);
    }

    log(`Pressed the following keys: "${JSON.stringify(keys)}"`);
  }

  // Automatically close any new tabs that are opened
  browser.on("targetcreated", async (target) => {
    const page = await target.page();
    if (page) page.close();
  });

  // Close the browser when the process exits
  globalThis.addEventListener("unload", async () => {
    await browser.close();
  });

  await page.goto(currentURL);

  log(`Waiting for first page load...`);

  await page.waitForNetworkIdle({ idleTime: 250 });

  let elements = await getInteractiveElements(page);
  let running = true;

  setTimeout(() => {
    running = false;
  }, runtimeMs);

  while (running) {
    if (elements.buttons.length === 0 && elements.inputs.length === 0) {
      console.log("No interactive components found. Exiting...");
      break;
    }

    if (page.url() !== currentURL) {
      elements = await getInteractiveElements(page);
      currentURL = page.url();
    }

    const actions: ("click" | "type" | "input")[] = ["type"];

    if (elements.buttons.length > 0) actions.push("click");

    if (elements.inputs.length > 0) actions.push("input");

    const action = draw(actions);

    try {
      switch (action) {
        case "type":
          await typeRandom();
          break;
        case "click":
          await clickRandom();
          break;
        case "input":
          await inputRandom();
          break;
      }

      await sleep(150);
    } catch (_e: unknown) {
      // Skip errors
    }
  }
}
