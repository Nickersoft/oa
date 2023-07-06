import { objectify } from "radash";
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
