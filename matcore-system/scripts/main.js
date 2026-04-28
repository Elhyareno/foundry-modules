import { MatCoreDashboard } from "./app.js";
import { MatCoreRegistry } from "./registry.js";
import { registerCoreModules } from "./registry-defaults.js";

const MODULE_ID = "matcore-system";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.once("ready", () => {
  const registry = new MatCoreRegistry();

  game.matcore = {
    registry,
    registerModule: (id, definition) => registry.register(id, definition),
    unregisterModule: id => registry.unregister(id),
    runAction: (moduleId, actionId, payload = {}) => registry.runAction(moduleId, actionId, payload),
    open: () => new MatCoreDashboard().render(true)
  };

  registerCoreModules();
    Handlebars.registerHelper("json", function(context) {
    return JSON.stringify(context, null, 2);
    });  

  console.log(`${MODULE_ID} | API exposée sur game.matcore`);
  Hooks.callAll("matcoreReady", game.matcore);
});