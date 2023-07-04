import { KeyInput, stdColors } from "../deps.ts";
import { ColorMethods } from "./types.ts";

export const STRING_TYPES = [
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
  "binary",
  "url",
  "path",
  "phone",
  "uuid",
  "random",
] as const;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

export const KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  "Tab",
  "Escape",
  "Backspace",
  "Delete",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Shift",
  "Control",
  "Meta",
  "Alt",
].concat(ALPHABET).concat(ALPHABET.map((el) => el.toUpperCase())) as KeyInput[];

export const BG_COLORS: ColorMethods[] = [
  "bgRed",
  "bgGreen",
  "bgYellow",
  "bgMagenta",
  "bgCyan",
  "bgBrightRed",
  "bgBrightGreen",
  "bgBrightYellow",
  "bgBrightBlue",
  "bgBrightMagenta",
  "bgBrightCyan",
];
