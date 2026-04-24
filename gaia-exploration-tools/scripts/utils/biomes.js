import { BIOMES } from "../data/biomes.js";
import { normaliserTexte } from "./text.js";

export function trouverBiomes(biome){
   const nomNormalisee = normaliserTexte(biome);
        const biomeTrouve = BIOMES.find(biomeValide => {
            return normaliserTexte(biomeValide) === nomNormalisee;
        });
   }