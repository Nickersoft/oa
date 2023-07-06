import ms from "ms";

import { faker } from "faker";

import puppeteer, { type ElementHandle, type Page } from "puppeteer/mod.ts";
import { sample } from "std/collections/sample.ts";
import { delay } from "std/async/mod.ts";

import { Logger } from "./log.ts";
import { getRandomKeys, getRandomString } from "./random.ts";
import { ColorMethods, DesiredAction, MonkeyConfig } from "./types.ts";

async function getInteractiveElements(page: Page, config: MonkeyConfig) {
  await page.waitForNetworkIdle({ timeout: 30000 });

  const clickableSelectors = [];

  if (config.targets?.buttons?.enabled) {
    clickableSelectors.push(`button`);
    clickableSelectors.push(`input[type="button"]`);
    clickableSelectors.push(`input[type="submit"]`);
  }

  if (config.targets?.links?.enabled) {
    const filter = config.targets?.links?.filter;

    let selector = "a";

    if (filter) {
      selector += `[href*="${filter.replace('"', '\\"')}"]`;
    }

    clickableSelectors.push(selector);
  }

  const inputSelectors = config.targets?.inputs?.enabled
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
    buttons: clickableSelectors.length > 0 ? await page.$$(clickableSelectors.join(", ")) : [],
    inputs: inputSelectors.length > 0 ? await page.$$(inputSelectors.join(":")) : [],
  };
}

async function clickRandomPoint(page: Page, logger: Logger) {
  const body = await page.$("body");
  const boundingBox = await body?.boundingBox();

  if (boundingBox) {
    const randomX = faker.number.int({ min: 0, max: boundingBox.width });
    const randomY = faker.number.int({ min: 0, max: boundingBox.height });

    page.mouse.click(randomX, randomY);

    logger.log(`Clicked at (${randomX}, ${randomY})`);
  }
}

async function clickRandomElement(
  elements: ElementHandle[],
  page: Page,
  logger: Logger,
) {
  const randomElement = sample(elements);
  const text = await page.evaluate((el) => el.textContent, randomElement);
  const tag = await page.evaluate((el) => el.tagName, randomElement);

  await randomElement?.click().catch((e) => {
    logger.log(
      `Error clicking "${tag.toLowerCase()}" element with text "${text}": ${e}`,
    );
  });

  logger.log(`Clicked "${tag.toLowerCase()}" element with text: "${text}"`);
}

async function inputRandom(
  elements: ElementHandle[],
  page: Page,
  logger: Logger,
) {
  const randomElement = sample(elements);
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

async function scrollRandomly(page: Page, logger: Logger) {
  const deltaY = faker.number.int({ min: -1000, max: 1000 });

  await page.mouse.wheel({ deltaY });

  logger.log(`Scrolled a delta of ${deltaY}"`);
}

function getDesiredActions(
  buttons: ElementHandle[],
  inputs: ElementHandle[],
  config: MonkeyConfig,
) {
  const { targets } = config;

  const actions: DesiredAction[] = [];

  const shouldClickElement = buttons.length > 0 && (targets?.buttons?.enabled ||
    targets?.links?.enabled);

  const shouldClickRandom = targets?.clicking?.enabled;

  const shouldScroll = targets?.scrolling?.enabled;

  const shouldType = targets?.typing?.enabled;

  const shouldInput = inputs.length > 0 && targets?.inputs?.enabled;

  if (shouldType) {
    actions.push("type-random");
  }

  if (shouldClickElement) {
    actions.push("click-element");
  }

  if (shouldScroll) {
    actions.push("scroll");
  }

  if (shouldClickRandom) {
    actions.push("click-random");
  }

  if (shouldInput) {
    actions.push("type-input");
  }

  return actions;
}

async function startMonkey(
  name: string,
  color: ColorMethods,
  page: Page,
  config: MonkeyConfig,
) {
  const { url, headers = {}, duration, cookies = [] } = config;

  const logger = new Logger(name, color);

  logger.log(`Waiting for first page load...`);

  await page.setExtraHTTPHeaders(headers);

  await page.setCookie(...cookies);

  await page.goto(url);

  let currentURL = url;
  let elements = await getInteractiveElements(page, config);
  let running = true;
  let actions: DesiredAction[] = getDesiredActions(
    elements.buttons,
    elements.inputs,
    config,
  );

  setTimeout(() => (running = false), ms(duration));

  while (running) {
    if (elements.buttons.length === 0 && elements.inputs.length === 0) {
      console.log("No interactive components found. Exiting...");
      running = false;
      break;
    }

    if (page.url() !== currentURL) {
      elements = await getInteractiveElements(page, config);
      currentURL = page.url();
      actions = getDesiredActions(
        elements.buttons,
        elements.inputs,
        config,
      );
    }

    const action = sample(actions);

    try {
      switch (action) {
        case "type-random":
          await typeRandom(page, logger);
          break;
        case "click-element":
          await clickRandomElement(elements.buttons, page, logger);
          break;
        case "scroll":
          await scrollRandomly(page, logger);
          break;
        case "click-random":
          await clickRandomPoint(page, logger);
          break;
        case "type-input":
          await inputRandom(elements.inputs, page, logger);
          break;
      }

      await delay(150);
    } catch (_e: unknown) {
      // Skip errors
    }
  }
}

export async function monkeyTest(
  name: string,
  color: ColorMethods,
  config: MonkeyConfig,
) {
  const { show } = config;

  const browser = await puppeteer.launch({
    defaultViewport: null,
    headless: !show,
  });

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

  return startMonkey(name, color, page, config);
}
