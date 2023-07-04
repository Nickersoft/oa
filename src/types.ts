import { Protocol, stdColors } from "../deps.ts";

interface Target {
  enabled: boolean;
}

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
    inputs?: Target;
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
  | "bgBrightRed"
  | "bgBrightGreen"
  | "bgBrightYellow"
  | "bgBrightBlue"
  | "bgBrightMagenta"
  | "bgBrightCyan"
>;
