import {
  type BackgroundColorName,
  draw,
  ElementHandle,
  ms,
  Page,
  Protocol,
  puppeteer,
  sleep,
} from "../deps.ts";

import { Logger } from "./log.ts";
import { getRandomKeys, getRandomString } from "./random.ts";

export interface MonkeyConfig {
  name: string;
  color: BackgroundColorName;
  url: string;
  num: number;
  show?: boolean;
  duration?: string;
  cookies: Protocol.Network.CookieParam[];
  headers: Record<string, string>;
  skipButtons?: boolean;
  skipLinks?: boolean;
  skipInputs?: boolean;
  skipTyping?: boolean;
  filterLinks?: string;
}

async function getInteractiveElements(page: Page, config: MonkeyConfig) {
  const clickableSelectors = [];

  if (!config.skipButtons) {
    clickableSelectors.push(`button`);
    clickableSelectors.push(`input[type="button"]`);
    clickableSelectors.push(`input[type="submit"]`);
  }

  if (!config.skipLinks) {
    let selector = "a";

    if (config.filterLinks) {
      selector += `[href~="${config.filterLinks.replace('"', '\\"')}"]`;
    }
    console.log(selector);
    clickableSelectors.push(selector);
  }

  const inputSelectors = !config.skipInputs
    ? [
      `input`,
      `not([type="select"])`,
      `not([type="radio"])`,
      `not([type="checkbox"])`,
      `not([type="button"])`,
      `not([type="submit"])`,
    ]
    : [];

  return {
    buttons: await page.$$(clickableSelectors.join(", ")),
    inputs: await page.$$(inputSelectors.join(":")),
  };
}

async function clickRandom(
  elements: ElementHandle[],
  page: Page,
  logger: Logger,
) {
  const randomElement = draw(elements);
  const text = await page.evaluate((el) => el.textContent, randomElement);
  const tag = await page.evaluate((el) => el.tagName, randomElement);

  await randomElement?.click();

  logger.log(`Clicked "${tag.toLowerCase()}" element with text: "${text}"`);
}

async function inputRandom(
  elements: ElementHandle[],
  page: Page,
  logger: Logger,
) {
  const randomElement = draw(elements);
  const text = getRandomString();

  await randomElement?.focus();
  await randomElement?.evaluate((el) => el.value = "");
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");

  logger.log(`Filled input with string: "${text}"`);
}

async function typeRandom(page: Page, logger: Logger) {
  const keys = getRandomKeys();

  for (const key of keys) {
    key && await page.keyboard.press(key);
  }

  logger.log(`Pressed the following keys: "${JSON.stringify(keys)}"`);
}

function getDesiredActions(
  buttons: ElementHandle[],
  inputs: ElementHandle[],
  config: MonkeyConfig,
) {
  const { skipInputs, skipLinks, skipButtons } = config;

  const actions: ("click" | "type" | "input")[] = [];
  const shouldClick = buttons.length > 0 && !skipButtons && !skipLinks;
  const shouldType = !config.skipTyping;
  const shouldInput = inputs.length > 0 && !skipInputs;

  if (shouldType) {
    actions.push("type");
  }

  if (shouldClick) {
    actions.push("click");
  }

  if (shouldInput) {
    actions.push("input");
  }

  return actions;
}

async function startMonkey(name: string, page: Page, config: MonkeyConfig) {
  const { color, url, headers, duration, cookies } = config;

  const logger = new Logger(name, color);

  logger.log(`Waiting for first page load...`);

  await page.setExtraHTTPHeaders(headers);
  await page.setCookie(...cookies);
  await page.goto(url);
  await page.waitForNetworkIdle({ idleTime: 250 });

  let currentURL = url;
  let elements = await getInteractiveElements(page, config);
  let running = true;

  setTimeout(() => (running = false), ms(duration));

  while (running) {
    if (elements.buttons.length === 0 && elements.inputs.length === 0) {
      console.log("No interactive components found. Exiting...");
      break;
    }

    if (page.url() !== currentURL) {
      elements = await getInteractiveElements(page, config);
      currentURL = page.url();
    }

    const actions = getDesiredActions(
      elements.buttons,
      elements.inputs,
      config,
    );

    const action = draw(actions);

    try {
      switch (action) {
        case "type":
          await typeRandom(page, logger);
          break;
        case "click":
          await clickRandom(elements.buttons, page, logger);
          break;
        case "input":
          await inputRandom(elements.inputs, page, logger);
          break;
      }

      await sleep(150);
    } catch (_e: unknown) {
      // Skip errors
    }
  }
}

export async function monkeyTest(config: MonkeyConfig) {
  const { name, show } = config;

  const browser = await puppeteer.launch({ headless: !show });
  const page = await browser.newPage();

  // Automatically close any new tabs that are opened
  browser.on("targetcreated", async (target) => {
    const page = await target.page();
    if (page) page.close();
  });

  // Close the browser when the process exits
  globalThis.addEventListener("unload", async () => {
    await browser.close();
  });

  return startMonkey(name, page, config);
}
