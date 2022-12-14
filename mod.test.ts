// deno-lint-ignore-file no-explicit-any
import { Testing, Bdd } from "./testing-deps.ts";
import CreateState, { Readify, State } from "./mod.ts";

const DirPath = "./test-data";

Bdd.describe("init", () => {
  Bdd.beforeEach(async () => {
    try {
      await Deno.remove(DirPath, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }
  });

  function CheckState(state: Readify<any>, value: any) {
    for (const item in value) {
      const subject = state[item];
      const expected = value[item];
      if (typeof expected === "object") CheckState(subject, expected);
      else Testing.assertEquals(subject, expected);
    }
  }

  Bdd.it("Writes a basic state", async () => {
    const state = await CreateState(DirPath, { hello: "world" });
    CheckState(state.GetState(), { hello: "world" });
  });

  Bdd.it("Writes a complex object", async () => {
    const state = await CreateState(DirPath, {
      hello: { part1: "world1", part2: "world2" },
    });
    CheckState(state.GetState(), {
      hello: { part1: "world1", part2: "world2" },
    });
  });

  Bdd.it("Updates an item", async () => {
    const state = await CreateState<State>(DirPath, {
      hello: { part1: "world1", part2: "world2" },
    });
    await state.SetState({
      hello: {
        part1: "test",
      },
    });

    CheckState(state.GetState(), { hello: { part1: "test", part2: "world2" } });
  });

  Bdd.it("Deletes a null item", async () => {
    const state = await CreateState<State>(DirPath, {
      hello: { part1: "world1", part2: "world2" },
    });
    await state.SetState({
      hello: {
        part1: null,
      },
    });

    CheckState(state.GetState(), { hello: { part2: "world2" } });
  });

  Bdd.it("Compiles state types", async () => {
    const manager = await CreateState<State>(DirPath, {
      hello: { part1: "world1", part2: "world2" },
    });

    const state: Readify<State> = manager.GetState();
    CheckState(state, {
      hello: { part1: "world1", part2: "world2" },
    });
  });

  Bdd.it("Does not init twice", async () => {
    const manager = await CreateState(DirPath, {
      test: {
        t1: "Hello",
      },
    });

    await CreateState(DirPath, {
      test: {
        t2: "Hello",
      },
    });

    CheckState(manager.GetState(), {
      test: {
        t1: "Hello",
      },
    });
  });
});
