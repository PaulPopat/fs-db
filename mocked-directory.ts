import IDirectory, { Schema, StateReader } from "./i-directory.ts";
import { StateWriter } from "./mod.ts";

export default class MockedDirectory<TSchema extends Schema>
  implements IDirectory<TSchema>
{
  // deno-lint-ignore no-explicit-any
  Model: StateReader<TSchema> = {} as any;

  Write(data: StateWriter<TSchema>): void {
    // deno-lint-ignore no-explicit-any
    this.Model = data as any;
  }
}
