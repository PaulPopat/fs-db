import { MT } from "./deps.ts";

export type Schema = Record<string, MT.ISerialiseable<unknown>>;

export type StateWriter<TSchema extends Schema> = Partial<{
  [TKey in keyof TSchema]: Record<string, MT.Serialised<TSchema[TKey]>>;
}>;

export type StateReader<TSchema extends Schema> = {
  [TKey in keyof TSchema]: Record<string, MT.Serialised<TSchema[TKey]>> &
    Iterable<[string, MT.Serialised<TSchema[TKey]>]>;
};

export default interface IDirectory<TSchema extends Schema> {
  readonly Model: StateReader<TSchema>;
  Write(data: StateWriter<TSchema>): void;
}
