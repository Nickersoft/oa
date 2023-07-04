import { draw, faker, random, shuffle } from "../deps.ts";
import { KEYS } from "./constants.ts";

export function getRandomKeys() {
  return new Array(random(1, 10)).fill(0).map(() => draw(KEYS));
}

export function randomSubset(arr: readonly string[], size: number) {
  return shuffle(arr).slice(0, size);
}

export function getRandomString(): string {
  const strType = draw(
    [
      "email",
      "name",
      "ip",
      "password",
      "user",
      "emoji",
      "int",
      "lorem-short",
      "lorem-medium",
      "lorem-long",
      "bigint",
      "url",
      "path",
      "phone",
      "uuid",
      "random",
    ] as const,
  );

  let text = "";

  switch (strType) {
    case "uuid":
      text = faker.string.uuid();
      break;
    case "random":
      text = faker.string.alphanumeric();
      break;
    case "lorem-short":
      text = faker.lorem.word();
      break;
    case "lorem-medium":
      text = faker.lorem.sentence();
      break;
    case "lorem-long":
      text = faker.lorem.paragraph();
      break;
    case "email":
      text = faker.internet.email();
      break;
    case "ip":
      text = faker.internet.ip();
      break;
    case "name":
      text = faker.person.fullName();
      break;
    case "password":
      text = faker.internet.password();
      break;
    case "user":
      text = faker.internet.userName();
      break;
    case "emoji":
      text = faker.internet.emoji();
      break;
    case "int":
      text = faker.number.int().toString();
      break;
    case "bigint":
      text = faker.number.bigInt().toString();
      break;
    case "url":
      text = faker.internet.url();
      break;
    case "path":
      text = faker.system.filePath();
      break;
    case "phone":
      text = faker.phone.number();
      break;
  }

  return text;
}
