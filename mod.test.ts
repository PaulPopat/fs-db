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
      let index = 0;
      if (Array.isArray(expected))
        for (const item of subject as Iterable<any>)
          CheckState(item, expected[index++]);
      else if (typeof expected === "object")
        CheckState(subject as any, expected as any);
      else Testing.assertEquals(subject, expected as any);
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

  Bdd.it("Saves arrays", async () => {
    const manager = await CreateState(DirPath, {
      test: new Uint8Array([0, 1, 2, 3]),
    });

    CheckState(manager.GetState(), {
      test: new Uint8Array([0, 1, 2, 3]),
    });
  });
});
