import { MatCoreDashboard } from "./app.js";

const MODULE_ID = "matcore-system";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.once("ready", () => {
  game.matcore = {
    open: () => new MatCoreDashboard().render(true)
  };

  console.log(`${MODULE_ID} | API exposée sur game.matcore.open()`);
});