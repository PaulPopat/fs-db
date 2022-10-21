import { ObjectPath } from "./config.ts";
import { TypeOption } from "./primitives.ts";

export type StatePart = TypeOption | State;

export type State = {
  [key: string]: StatePart;
};

export type Readify<TState extends StatePart> = TState extends TypeOption
  ? TState
  : TState extends State
  ? {
      [TKey in keyof TState]: Readify<TState[TKey]>;
    } & {
      [ObjectPath]: string;
    } & Iterable<[keyof TState, TState[keyof TState]]>
  : never;

export type Promised<T> = T extends Promise<infer R> ? R : T;
