import ReadDirectory from "./directory-reader.ts";
import WriteDirectory from "./directory-writer.ts";
import { DeepPartial, Promised, Readify, State } from "./types.ts";
import { Path } from "./deps.ts";

async function DirExists(path: string) {
  try {
    const stats = await Deno.stat(path);
    return stats.isDirectory;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    throw err;
  }
}

async function ShouldInit(dir: string) {
  if (!(await DirExists(dir))) return true;
  for await (const _ of Deno.readDir(dir)) return false;

  console.log("Iterated everything");
  return true;
}

export default async function CreateState<TState extends State>(
  dir: string,
  init: TState
) {
  dir = Path.join(dir);

  const initialise = async () => {
    await Deno.mkdir(dir, { recursive: true });
    await WriteDirectory(dir, init);
  };

  if (await ShouldInit(dir)) await initialise();

  return {
    GetState() {
      return ReadDirectory<TState>(dir);
    },
    async SetState(value: DeepPartial<TState>) {
      await WriteDirectory(dir, value);
    },
  };
}

export type StateManager<TState extends State> = Promised<
  ReturnType<typeof CreateState<TState>>
>;

export type { State, Readify };
export type { StatePart, DeepPartial } from "./types.ts";
export { default as Mock } from "./mock-directory.ts";
export { Unpack, UnpackWithoutId, UnpackObject, Pack } from "./export-utils.ts";
export type { Idd } from "./export-utils.ts";
