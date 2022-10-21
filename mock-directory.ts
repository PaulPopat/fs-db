import { IsKeyOf } from "./deps.ts";
import { ObjectPath } from "./config.ts";
import { Readify, State } from "./types.ts";
import { IsTypeOption } from "./primitives.ts";

export default function Mock<TState extends State>(
  data: TState
): Readify<TState> {
  const getter = (name: string) => {
    const item = data[name];
    if (!item) return undefined;
    if (IsTypeOption(item)) return item;
    if (typeof item === "object") return Mock(item);
  };

  // deno-lint-ignore no-explicit-any
  return new Proxy<any>(
    {
      [Symbol.iterator]: function* () {
        for (const key in data) yield [key, getter(key)];
      },
      [ObjectPath]: "test",
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
        return getter((name as string).toString());
      },
      getOwnPropertyDescriptor(_, name) {
        const value = getter(name.toString());
        return {
          configurable: true,
          enumerable: true,
          writable: false,
          value: value,
        };
      },
      getPrototypeOf() {
        return null;
      },
      has(original, name) {
        return name in original || IsKeyOf(data, name);
      },
      isExtensible() {
        return false;
      },
      ownKeys() {
        return Object.keys(data);
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
