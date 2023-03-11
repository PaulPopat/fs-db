import { BufferReader, BufferWriter, Path } from "./deps.ts";
import IDirectory, { Schema, StateReader, StateWriter } from "./i-directory.ts";

export default class Directory<TSchema extends Schema>
  implements IDirectory<TSchema>
{
  readonly #schema: TSchema;
  readonly #dir: string;

  constructor(schema: TSchema, dir: string) {
    this.#schema = schema;
    this.#dir = dir;

    if (!this.#exists(this.#join())) Deno.mkdirSync(this.#join());
  }

  #join(...parts: string[]) {
    return Path.join(this.#dir, ...parts);
  }

  #exists(target: string) {
    try {
      Deno.statSync(target);
      return true;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) return false;
      else throw err;
    }
  }

  #read_dir(key: string, sub_key: string) {
    const path = this.#join(key, sub_key);

    if (!this.#exists(path)) return {};

    const data = Deno.readFileSync(path);
    const reader = new BufferReader(data);

    const result = this.#schema[key].Accept(reader);
    return result;
  }

  get Model(): StateReader<TSchema> {
    // deno-lint-ignore no-explicit-any
    const result: any = {};
    for (const key in this.#schema)
      Object.defineProperty(result, key, {
        get: () => {
          // deno-lint-ignore no-this-alias
          const self = this;
          // deno-lint-ignore no-explicit-any
          return new Proxy<any>(
            {
              [Symbol.iterator]: function* () {
                if (self.#exists(self.#join(key))) return;

                for (const sub_key of Deno.readDirSync(self.#join(key))) {
                  yield [sub_key, self.#read_dir(key, sub_key.name)];
                }
              },
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
              get: (original, sub_key) => {
                if (original[sub_key]) return original[sub_key];

                if (typeof sub_key !== "string")
                  throw new Error("Symbols are not allowed on state");

                return this.#read_dir(key, sub_key);
              },
              getOwnPropertyDescriptor: (_, sub_key) => {
                if (typeof sub_key !== "string")
                  throw new Error("Symbols are not allowed on state");

                try {
                  const value = this.#read_dir(key, sub_key);
                  return {
                    configurable: false,
                    enumerable: !!value,
                    writable: false,
                    value: value,
                    get: () => {
                      return this.#read_dir(key, sub_key);
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

              has: (original, name) => {
                return name in original || this.#exists(name.toString());
              },
              isExtensible() {
                return false;
              },
              ownKeys: () => {
                const response = [];
                for (const part of Deno.readDirSync(this.#dir))
                  response.push(part.name);
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
        },
      });

    return result;
  }

  Write(data: StateWriter<TSchema>) {
    for (const key in this.#schema) {
      if (!this.#exists(this.#join(key))) Deno.mkdirSync(this.#join(key));

      const item = data[key];
      if (item)
        for (const part in data[key]) {
          const writer = new BufferWriter();
          // deno-lint-ignore no-explicit-any
          this.#schema[key].Impart(item[part] as any, writer);
          Deno.writeFileSync(this.#join(key, part), writer.Buffer.bytes());
        }
    }
  }
}