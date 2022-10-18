import { Path, IsKeyOf } from "./deps.ts";
import { ObjectPath } from "./config.ts";
import ReadFile from "./file-reader.ts";
import { TypeOption } from "./primitives.ts";

export type ObjectDirectory = Iterable<TypeOption | ObjectDirectory> & {
  [key: string]: TypeOption | ObjectDirectory;
  [ObjectPath]: string;
};

export default function ReadDirectory(dir: string): ObjectDirectory {
  const exists = (name: string) => {
    try {
      const target = Path.join(dir, name.toString());
      Deno.statSync(target);
      return true;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) return false;
      else throw err;
    }
  };

  const getter = (name: string) => {
    try {
      const target = Path.join(dir, name.toString());
      const stats = Deno.statSync(target);
      if (stats.isDirectory) return ReadDirectory(target);
      return ReadFile(target);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) return undefined;
      else throw err;
    }
  };

  return new Proxy<ObjectDirectory>(
    {
      [Symbol.iterator]: function* () {
        for (const item of Deno.readDirSync(dir)) yield getter(item.name);
      },
      [ObjectPath]: dir,
    },
    {
      apply() {
        throw new Error("State items cannot be functions");
      },
      construct() {
        throw new Error("State items cannot be classes");
      },
      defineProperty() {
        throw new Error("The state is immutable");
      },
      deleteProperty() {
        throw new Error("The state is immutable");
      },
      get(original, name) {
        if (IsKeyOf(original, name)) return original[name];
        return getter(name.toString());
      },
      getOwnPropertyDescriptor(_, name) {
        try {
          const value = getter(name.toString());
          return {
            configurable: false,
            enumerable: !!value,
            writable: false,
            value: value,
            get() {
              return getter(name.toString());
            },
            set() {
              throw new Error("The state is immutable");
            },
          };
        } catch (err) {
          if (err instanceof Deno.errors.NotFound) return undefined;
          else throw err;
        }
      },
      getPrototypeOf() {
        return null;
      },
      has(original, name) {
        return name in original || exists(name.toString());
      },
      isExtensible() {
        return false;
      },
      ownKeys() {
        const response = [];
        for (const part of Deno.readDirSync(dir)) response.push(part.name);
        return response;
      },
      preventExtensions() {
        return true;
      },
      set() {
        throw new Error("The state is immutable");
      },
      setPrototypeOf() {
        return false;
      },
    }
  );
}
