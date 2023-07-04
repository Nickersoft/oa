import { objectify, string, ValidationError } from "../deps.ts";

export function validateURL(url: string) {
  if (!string().url().safeParse(url).success) {
    throw new ValidationError(
      "Invalid URL. URLs must include a protocol and domain.",
    );
  }
}

export function kvToMap(kv: string[]) {
  return objectify(
    kv?.map((cookie) => cookie.split("=")) ?? [],
    ([key]) => key,
    ([_, value]) => value,
  );
}
