import { Delimiter } from "./config.ts";
import { Handlers, TypeOption } from "./primitives.ts";
import { Keys } from "./utilts.ts";

export default async function WriteFile<T extends TypeOption>(
  path: string,
  data: T
) {
  if (data === undefined || data === null) {
    try {
      await Deno.remove(path);
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }

    return;
  }

  const r = Keys(Handlers)
    .map((k) => [k, Handlers[k]] as const)
    .find(([_, h]) => h.checker(data));
  if (!r) throw new Error("No handler for " + path);

  const [key, handler] = r;
  // We know this is the correct type because of the logic above but it confuses typescript
  // deno-lint-ignore no-explicit-any
  const to_file: (value: T) => string = handler.to_file as any;
  await Deno.writeTextFile(path, key + Delimiter + to_file(data));
}
