import { ValidationError } from "cliffy/flags/_errors.ts";
import { string } from "zod/types.ts";
import { filterValues } from "std/collections/filter_values.ts";

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

export function shake<RemovedKeys extends string, T>(
  obj: T,
  filter?: (value: unknown) => boolean,
): Omit<T, RemovedKeys> {
  return filterValues(obj as Readonly<Record<string, unknown>>, filter ?? ((v) => v !== undefined)) as Omit<
    T,
    RemovedKeys
  >;
}

export function range(start: number, end: number): number[] {
  return new Array((end - start) + 1).fill(0).map((_, i) => i + start);
}

export function shuffle<T>(array: readonly T[]): T[] {
  return array
    .map((a) => ({ rand: Math.random(), value: a }))
    .sort((a, b) => a.rand - b.rand)
    .map((a) => a.value);
}

export function objectify<T, Key extends string | number | symbol, Value = T>(
  array: readonly T[],
  getKey: (item: T) => Key,
  getValue: (item: T) => Value = (item) => item as unknown as Value,
): Record<Key, Value> {
  return array.reduce((acc, item) => {
    acc[getKey(item)] = getValue(item);
    return acc;
  }, {} as Record<Key, Value>);
}
