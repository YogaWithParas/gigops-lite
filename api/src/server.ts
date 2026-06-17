import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  // Keeping startup output intentionally simple for prototype debugging.
  console.log(`gigops-lite-api listening on http://localhost:${config.port}`);
});
