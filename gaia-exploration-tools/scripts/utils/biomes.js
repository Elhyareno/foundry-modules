import { BIOMES } from "../data/biomes.js";
import { normaliserTexte } from "./text.js";

export function trouverBiome(biome){
   const nomNormalisee = normaliserTexte(biome);
        const biomeTrouve = BIOMES.find(biomeValide => {
            return normaliserTexte(biomeValide) === nomNormalisee;
        });
    return biomeTrouve;
   }

export function creerListeBiomesHtml(){
            return `<h2>Biomes disponibles</h2>
            <ul>
                ${BIOMES.map(biome => `<li>${biome}</li>`).join("")}
            </ul>
            `;
}