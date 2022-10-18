import { Action, Keys, ObjectPath } from "./config.ts";
import ReadDirectory from "./directory-reader.ts";
import WriteDirectory, { WriteFunction } from "./directory-writer.ts";
import { Promised, Readify, State, Writify } from "./types.ts";
import { Path } from "./deps.ts";

export function Delete<TState extends Record<never, never>>(
  item: Readify<TState>,
  keys?: (keyof TState)[]
): WriteFunction {
  return {
    [ObjectPath]: item[ObjectPath],
    [Action]: "delete" as const,
    [Keys]: keys ?? [],
  };
}

export default async function CreateState<TState extends State>(
  dir: string,
  init: Writify<TState>
) {
  dir = Path.join(dir);

  const initialise = async () => {
    await Deno.mkdir(dir, { recursive: true });
    await WriteDirectory(dir, init);
  };

  try {
    const stats = await Deno.stat(dir);
    if (!stats.isDirectory) await initialise();
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
    await initialise();
  }

  return {
    GetState(): Readify<TState> {
      /*
       We cast to any because we can guarentee the quality of the state.
       This is because it can only be got and set from within this ecosystem.
      */
      // deno-lint-ignore no-explicit-any
      return ReadDirectory(dir) as any;
    },
    async SetState(value: Writify<TState>) {
      await WriteDirectory(dir, value);
    },
  };
}

export type StateManager<TState extends State> = Promised<
  ReturnType<typeof CreateState<TState>>
>;

export type { State, Writify, Readify };
