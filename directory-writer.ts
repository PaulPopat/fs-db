import {
  Path,
  IsString,
  IsRecord,
  PatternMatch,
  DoNotCare,
  IsEmpty,
} from "./deps.ts";
import WriteFile from "./file-writer.ts";
import { IsTypeOption } from "./primitives.ts";
import { State } from "./types.ts";

export default async function WriteDirectory<TState extends State>(
  dir: string,
  data: TState
) {
  const mkdir = async () => {
    try {
      await Deno.mkdir(dir);
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
    }
  };

  const remove = async (path: string) => {
    try {
      await Deno.remove(path, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }
  };

  await PatternMatch(
    IsTypeOption,
    IsRecord(IsString, DoNotCare),
    IsEmpty,
    DoNotCare
  )(
    async (primitive) => await WriteFile(dir, primitive),
    async (data) => {
      await mkdir();
      for (const key in data)
        await WriteDirectory(Path.join(dir, key), data[key] as State);
    },
    async () => await remove(dir),
    () => {
      throw new Error("Invalid data of " + JSON.stringify(data));
    }
  )(data);
}
