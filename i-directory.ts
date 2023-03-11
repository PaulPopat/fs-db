import { ISerialiseable, Serialised } from "./deps.ts";

export type Schema = Record<string, ISerialiseable<unknown>>;

export type StateWriter<TSchema extends Schema> = Partial<{
  [TKey in keyof TSchema]: Record<string, Serialised<TSchema[TKey]>>;
}>;

export type StateReader<TSchema extends Schema> = {
  [TKey in keyof TSchema]: Record<string, Serialised<TSchema[TKey]>> &
    Iterable<[string, Serialised<TSchema[TKey]>]>;
};

export default interface IDirectory<TSchema extends Schema> {
  readonly Model: StateReader<TSchema>;
  Write(data: StateWriter<TSchema>): void;
}
