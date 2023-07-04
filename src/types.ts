import { Protocol, stdColors } from "../deps.ts";

interface Target {
  enabled: boolean;
}

export type DesiredAction =
  | "click-element"
  | "click-random"
  | "type-input"
  | "type-random"
  | "scroll";

export interface MonkeyConfig {
  url: string;
  num: number;
  debug: boolean;
  show: boolean;
  duration: string;
  cookies: Protocol.Network.CookieParam[];
  headers: Record<string, string>;
  targets?: {
    buttons?: Target;
    clicking?: Target;
    inputs?: Target;
    scrolling?: Target;
    links?: Target & { filter?: string };
    typing?: Target;
  };
}

export type ColorMethods = Extract<
  keyof typeof stdColors,
  | "bgRed"
  | "bgGreen"
  | "bgYellow"
  | "bgMagenta"
  | "bgCyan"
  | "bgBlack"
  | "bgWhite"
>;
