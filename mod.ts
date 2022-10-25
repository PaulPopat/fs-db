import ReadDirectory from "./directory-reader.ts";
import WriteDirectory from "./directory-writer.ts";
import { Promised, Readify, State } from "./types.ts";
import { Path } from "./deps.ts";

export default async function CreateState<TState extends State>(
  dir: string,
  init: TState
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
    GetState() {
      return ReadDirectory<TState>(dir);
    },
    async SetState(value: Partial<TState>) {
      await WriteDirectory(dir, value);
    },
  };
}

export type StateManager<TState extends State> = Promised<
  ReturnType<typeof CreateState<TState>>
>;

export type { State, Readify };
export type { StatePart } from "./types.ts";
export { default as Mock } from "./mock-directory.ts";
