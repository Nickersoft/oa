import { colors } from "../deps.ts";
import { ColorMethods } from "./types.ts";

export class Logger {
  constructor(
    private readonly name: string,
    private readonly color: ColorMethods,
  ) {
  }

  log(message: string) {
    console.log(
      `${colors[this.color](this.name)} ${message}`,
    );
  }
}
