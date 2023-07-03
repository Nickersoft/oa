# 🦍 oa

`oa` (short for "oo oo aa aa") is a simple command-line tool for monkey testing frontend applications. 

[Monkey testing](https://en.wikipedia.org/wiki/Monkey_testing) is a technique in which random click, input and keyboard events are sent to an application to test its resilience. In other words, as if a monkey was using it. Monkey testing can also be helpful for adding an increased load to the application to debug performance and memory bottlenecks.

Unlike other load testing tools, `oa` uses [Puppeteer](https://pptr.dev) under-the-hood to run your website in a real browser environment. While the browser is hidden by default, you can choose to show it via the `--show` flag.

**Disclaimer: this tool is intended primarily for use on local websites. Attempting to run `oa` on a hosted website, especially one you don't own, is a good way to get your IP blocked.**

## Usage

Using `oa` is fairly straightforward. You can test a website using the default options by just passing the URL to the command:

```bash
oa http://127.0.0.1:8080/login
```

## Flags

`oa` supports a few flags to customize its behavior:

| Name      | Alias | Description                                                                              | Default Value |
| --------- | ----- | ---------------------------------------------------------------------------------------- | ------------- |
| `--show`  | `-s`  | Show the browser window while testing.                                                   | `false`       |
| `--count` | `-c`  | The number of monkeys/instances to run.                                                  | 3             |
| `--time`  | `-t`  | The duration to run the test. Supports human-readable times such as '5m', '1 hour', etc. | 10s           |

