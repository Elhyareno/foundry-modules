import { FCoreChat } from "../../lib-foundry-core/scripts/index.js";
import { MODULE_ID, SOCKET_NAME } from "./constants.js";
import { updateItemHp } from "./items.js";
import { escapeHtml } from "./utils.js";

export function registerSocket() {
  game.socket.on(SOCKET_NAME, async payload => {
    if (!game.user.isGM) return;

    if (payload?.type === "updateItemHp") {
      const result = await updateItemHp(payload.data ?? {});
      if (result) await postItemHpUpdate(result, payload.data ?? {});
    }
  });
}

export async function requestItemHpUpdate(data) {
  if (game.user.isGM) {
    const result = await updateItemHp(data);
    if (result) await postItemHpUpdate(result, data);
    return result;
  }

  game.socket.emit(SOCKET_NAME, {
    moduleId: MODULE_ID,
    type: "updateItemHp",
    data
  });

  return null;
}

async function postItemHpUpdate(result, data) {
  const verb = result.mode === "damage" ? "subit" : "récupère";
  const title = result.mode === "damage" ? "Objet abîmé" : "Objet réparé";

  await FCoreChat.send(`
    <div class="pf2e-small-tools-card">
      <h3>${escapeHtml(title)}</h3>
      <p><strong>${escapeHtml(result.item.name)}</strong> ${verb} ${result.amount} PV.</p>
      <p class="pf2e-small-tools-muted">${result.before} → ${result.after} / ${result.max} PV</p>
      ${data.reason ? `<p class="pf2e-small-tools-muted">${escapeHtml(data.reason)}</p>` : ""}
    </div>
  `, { actor: result.actor });
}
