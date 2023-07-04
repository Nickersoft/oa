import { BackgroundColorName, Chalk, ChalkInstance } from "../deps.ts";

export class Logger {
  private readonly chalk: ChalkInstance;

  constructor(
    private readonly name: string,
    private readonly color: BackgroundColorName,
  ) {
    this.chalk = new Chalk();
  }

  log(message: string) {
    console.log(`${this.chalk[this.color](this.name)} ${message}`);
  }
}
