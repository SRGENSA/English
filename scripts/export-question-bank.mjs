import { createWriteStream } from "node:fs";
import { once } from "node:events";
import { BANK_SIZE, bankQuestion } from "../src/questionBank.js";
const file = process.argv[2] || "/tmp/talaqa-generated-bank.ndjson";
const out = createWriteStream(file);
for (let id = 0; id < BANK_SIZE; id++)
  if (!out.write(JSON.stringify(bankQuestion(id)) + "\n"))
    await once(out, "drain");
out.end();
await once(out, "finish");
console.log(`Exported ${BANK_SIZE} compositional grammar drills to ${file}`);
