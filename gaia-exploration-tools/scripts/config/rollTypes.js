export function createRollTypes(generator) {
  return {
    event: {
      generate: b => generator.generateEvent(b),
      format: (result, b) => generator.formatEvent(result, b)
    },

    curiosity: {
      generate: b => generator.generateCuriosity(b),
      format: (result, b) => generator.formatCuriosity(result, b)
    },

    resource: {
      generate: b => generator.generateResource(b),
      format: (result, b) => generator.formatResource(result, b)
    }
  };
}