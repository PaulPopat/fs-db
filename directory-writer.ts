import * as Path from "@path";
import {
  IsArray,
  IsString,
  IsRecord,
  PatternMatch,
  DoNotCare,
  IsEmpty,
} from "@type_guard";
import { Action, Keys, ObjectPath } from "./config.ts";
import WriteFile from "./file-writer.ts";
import { IsTypeOption, TypeOption } from "./primitives.ts";

export type WriteFunction = {
  [ObjectPath]: string;
  [Action]: "delete";
  [Keys]: Array<string | number | symbol>;
};

type BaseWriteItem =
  | WriteFunction
  | TypeOption
  | WriteObject
  | undefined
  | null;

type WriteItem = BaseWriteItem | BaseWriteItem[];

type WriteObject = {
  [key: string]: WriteItem;
};

const IsWriteFunction = (arg: unknown): arg is WriteFunction =>
  !!arg &&
  typeof arg === "object" &&
  Action in arg &&
  Keys in arg &&
  ObjectPath in arg;

export default async function WriteDirectory(dir: string, data: unknown) {
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
    IsWriteFunction,
    IsTypeOption,
    IsArray(DoNotCare),
    IsRecord(IsString, DoNotCare),
    IsEmpty,
    DoNotCare
  )(
    async (data) => {
      if (data[Keys].length)
        for (const key of data[Keys])
          await remove(Path.join(data[ObjectPath], key.toString()));
      else await remove(data[ObjectPath]);
    },
    async (primitive) => await WriteFile(dir, primitive),
    async (array_data) => {
      await mkdir();
      for (const item of array_data)
        await WriteDirectory(Path.join(dir, crypto.randomUUID()), item);
    },
    async (data) => {
      await mkdir();
      for (const key in data)
        await WriteDirectory(Path.join(dir, key), data[key]);
    },
    async () => await remove(dir),
    () => {
      throw new Error("Invalid data of " + JSON.stringify(data));
    }
  )(data);
}
