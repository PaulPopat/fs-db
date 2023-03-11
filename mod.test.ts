import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { ASCII, Struct } from "./deps.ts";
import { Directory, Schema } from "./mod.ts";

const TEST_DIR = "./test-data";

function Test<T extends Schema>(
  name: string,
  init: T,
  handler: (dir: Directory<T>) => void
) {
  Deno.test(name, () => {
    try {
      Deno.removeSync(TEST_DIR, { recursive: true });
    } catch {
      // We do not care if the directory does not exist
    }

    const db = new Directory(init, TEST_DIR);

    handler(db);
  });
}

Test(
  "Creates a basic state",
  {
    item_1: new Struct({
      an_item: new ASCII(),
    }),
  },
  (dir) => {
    dir.Write({
      item_1: {
        test_id: {
          an_item: "Hello world",
        },
      },
    });

    assertEquals(dir.Model.item_1.test_id, { an_item: "Hello world" });
  }
);

Test(
  "Can iterate over state",
  {
    item_1: new Struct({
      an_item: new ASCII(),
    }),
  },
  (dir) => {
    dir.Write({
      item_1: {
        test_id_1: {
          an_item: "This is the first item",
        },
        test_id_2: {
          an_item: "This is the second item",
        },
        test_id_3: {
          an_item: "This is the third item",
        },
        test_id_4: {
          an_item: "This is the fourth item",
        },
      },
    });

    let i = 0;
    for (const [key, value] of dir.Model.item_1) {
      i++;
      switch (i) {
        case 1:
          assertEquals(key, "test_id_1");
          assertEquals(value, { an_item: "This is the first item" });
          break;
        case 2:
          assertEquals(key, "test_id_2");
          assertEquals(value, { an_item: "This is the second item" });
          break;
        case 3:
          assertEquals(key, "test_id_3");
          assertEquals(value, { an_item: "This is the third item" });
          break;
        case 4:
          assertEquals(key, "test_id_4");
          assertEquals(value, { an_item: "This is the fourth item" });
          break;
      }
    }
  }
);
