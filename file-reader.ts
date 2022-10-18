import { IsKeyOf } from "./deps.ts";
import { Delimiter } from "./config.ts";
import { Handlers, TypeOption } from "./primitives.ts";

export default function ReadFile(path: string): TypeOption {
  try {
    const data = Deno.readTextFileSync(path);
    const [type, value] = data.split(Delimiter);

    if (!IsKeyOf(Handlers, type)) throw new Error("Unknown data type " + type);
    const handler = Handlers[type];

    return handler.from_file(value);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
    return undefined;
  }
}
