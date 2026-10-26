import { createServer } from "./index.js";
import { createServer as createViteServer } from "vite";
const api = createServer();
api.listen(3001, "127.0.0.1");
const vite = await createViteServer();
await vite.listen();
vite.printUrls();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await vite.close();
    api.close();
    process.exit(0);
  });
