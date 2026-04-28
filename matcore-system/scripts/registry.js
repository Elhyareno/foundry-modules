export class MatCoreRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(id, definition = {}) {
    if (!id) {
      console.warn("MatCore | register() sans id ignoré");
      return;
    }

    this.modules.set(id, {
      id,
      label: definition.label ?? id,
      type: definition.type ?? "Module",
      icon: definition.icon ?? "fa-solid fa-cube",
      order: definition.order ?? 100,
      getStatus: definition.getStatus ?? (() => "active"),
      getData: definition.getData ?? (() => ({})),
      actions: definition.actions ?? {}
    });

    console.log(`MatCore | Module enregistré : ${id}`);
  }

  unregister(id) {
    this.modules.delete(id);
  }

  get(id) {
    return this.modules.get(id) ?? null;
  }

  getAll() {
    return Array.from(this.modules.values())
      .sort((a, b) => a.order - b.order);
  }

  async collectAll() {
    const entries = [];

    for (const module of this.getAll()) {
      try {
        entries.push({
          ...module,
          status: await module.getStatus(),
          data: await module.getData()
        });
      } catch (error) {
        console.error(`MatCore | Erreur collecte ${module.id}`, error);

        entries.push({
          ...module,
          status: "error",
          data: {},
          error
        });
      }
    }

    return entries;
  }

  async runAction(moduleId, actionId, payload = {}) {
    const module = this.get(moduleId);
    const action = module?.actions?.[actionId];

    if (!action) {
      ui.notifications.warn(`Action MatCore introuvable : ${moduleId}.${actionId}`);
      return null;
    }

    return action(payload);
  }
}