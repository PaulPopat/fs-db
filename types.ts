import { ObjectPath } from "./config.ts";
import { WriteFunction } from "./directory-writer.ts";
import { TypeOption } from "./primitives.ts";

export type State = {
  [key: string]: TypeOption | State | StateIterator | undefined | null;
};

type StateIterator = Iterable<TypeOption | State>;

type FromIterable<T> = T extends Iterable<infer R> ? R : T;

export type Readify<TState extends State | StateIterator> = {
  [TKey in keyof TState]: TState[TKey] extends State | StateIterator
    ? Readify<TState[TKey]>
    : TState[TKey];
} & {
  [ObjectPath]: string;
};

export type Writify<TState extends State | StateIterator | TypeOption> =
  TState extends State | StateIterator
    ?
        | (TState extends State
            ? { [TKey in keyof TState]?: Writify<TState[TKey]> }
            : Iterable<Writify<FromIterable<TState>>>)
        | WriteFunction
    : TState;

export type Promised<T> = T extends Promise<infer R> ? R : T;
