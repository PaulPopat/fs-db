import {
  IsBigInt,
  IsBoolean,
  IsDate,
  IsNumber,
  IsString,
  IsSymbol,
  IsType,
  Optional,
  Checker,
  IsUnion,
} from "./deps.ts";
import { Decode, Encode } from "./text.ts";
import { Keys } from "./utilts.ts";

function BuildHandler<T>(
  checker: Checker<T>,
  to_file: (value: T) => string,
  from_file: (value: string) => T
) {
  return { checker, to_file, from_file };
}

export const Handlers = {
  string: BuildHandler(
    IsString,
    (s) => s,
    (v) => v
  ),
  number: BuildHandler(
    IsNumber,
    (n) => n.toString(),
    (v) => parseFloat(v)
  ),
  bigint: BuildHandler(
    IsBigInt,
    (i) => i.toString(),
    (v) => BigInt(v)
  ),
  symbol: BuildHandler(
    IsSymbol,
    (s) => s.toString(),
    (v) => Symbol.for(v)
  ),
  boolean: BuildHandler(
    IsBoolean,
    (b) => b.toString(),
    (v) => v === "true"
  ),
  date: BuildHandler(
    IsDate,
    (d) => d.getTime().toString(),
    (v) => new Date(parseInt(v))
  ),
  uint8array: BuildHandler(
    (a: unknown): a is Uint8Array => a instanceof Uint8Array,
    (a) => Decode(a),
    (v) => Encode(v)
  ),
};

export const IsTypeOption = Optional(
  IsUnion(...Keys(Handlers).map((k) => Handlers[k].checker))
);

export type TypeOption = IsType<typeof IsTypeOption>;
