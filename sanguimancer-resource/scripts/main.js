import { initSanguimancerAPI } from "./resource.js";
import { registerHooks } from "./hooks.js";

Hooks.once("init", () => {
  console.log("Sanguimancer | Init");
});

Hooks.once("ready", () => {
  console.log("Sanguimancer | Ready");

  initSanguimancerAPI();
  registerHooks();
});