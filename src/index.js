import fs from "node:fs/promises";
import { getChannels, getLiveSports, search } from "./api.js";
import { buildPlaylist } from "./m3u.js";

const sportsOnly =
  String(process.env.SPORTS_ONLY ?? "true").toLowerCase() === "true";

const liveOnly =
  String(process.env.LIVE_ONLY ?? "false").toLowerCase() === "true";

const query = process.env.QUERY || "futebol";

function dataOf(result) {
  return result?.data ?? [];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isSportsCategory(value = "") {
  const category = String(value).toLowerCase();

  return (
    category.includes("sport") ||
    category.includes("esport") ||
    category.includes("futebol")
  );
}

let channels = [];
let events = [];

if (sportsOnly) {
  console.log(`Buscando conteúdo para: "${query}"`);

  const searchResult = await search(query);

  // ==========================================================
  // DIAGNÓSTICO TEMPORÁRIO
  // Mostra exatamente o que a API está retornando.
  // ==========================================================
  console.log("");
  console.log("===== RESPOSTA COMPLETA DA API =====");
  console.log(JSON.stringify(searchResult, null, 2));
  console.log("====================================");
  console.log("");

  const data = dataOf(searchResult);

  if (
    data &&
    !Array.isArray(data) &&
    typeof data === "object"
  ) {
    channels = asArray(data.channels);
    events = asArray(data.events);
  } else {
    const items = asArray(data);

    channels = items.filter(
      item =>
        item &&
        typeof item === "object" &&
        isSportsCategory(item.category)
    );

    events = items.filter(
      item =>
        item &&
        typeof item === "object"
    );
  }

  // Mantém somente canais esportivos
  channels = channels.filter(channel =>
    isSportsCategory(channel.category)
  );

  // Se LIVE_ONLY estiver ativado, mantém somente eventos live
  if (liveOnly) {
    events = events.filter(
      event =>
        String(event.status || "").toLowerCase() === "live"
    );
  }

  // Se não encontrou eventos e LIVE_ONLY estiver ativado,
  // tenta consultar diretamente os esportes ao vivo.
  if (events.length === 0 && liveOnly) {
    console.log("Nenhum evento encontrado na busca.");
    console.log("Consultando /sports?status=live...");

    const liveResult = await getLiveSports();

    console.log("");
    console.log("===== RESPOSTA /sports?status=live =====");
    console.log(JSON.stringify(liveResult, null, 2));
    console.log("=========================================");
    console.log("");

    events = asArray(dataOf(liveResult));
  }
} else {
  console.log("SPORTS_ONLY está desativado.");
  console.log("Buscando todos os canais...");

  const channelResult = await getChannels();

  console.log("");
  console.log("===== RESPOSTA /channels =====");
  console.log(JSON.stringify(channelResult, null, 2));
  console.log("==============================");
  console.log("");

  channels = asArray(dataOf(channelResult));
}

// ==========================================================
// RESUMO ANTES DA GERAÇÃO
// ==========================================================

console.log("");
console.log("===== RESUMO =====");
console.log(`Canais encontrados: ${channels.length}`);
console.log(`Eventos encontrados: ${events.length}`);
console.log("==================");
console.log("");

// Mostra quais campos de stream existem,
// sem tentar extrair embed_url.
for (const channel of channels) {
  console.log(
    `[CANAL] ${channel.name || channel.id || "Sem nome"} | ` +
    `stream_url: ${channel.stream_url ? "SIM" : "NÃO"} | ` +
    `embed_url: ${channel.embeds?.length ? "SIM" : "NÃO"}`
  );
}

for (const event of events) {
  console.log(
    `[EVENTO] ${event.title || event.id || "Sem nome"} | ` +
    `stream_url: ${event.stream_url ? "SIM" : "NÃO"} | ` +
    `embed_url: ${event.embeds?.length ? "SIM" : "NÃO"}`
  );
}

console.log("");

// ==========================================================
// GERA PLAYLIST
// ==========================================================

const playlist = buildPlaylist(channels, events);

await fs.mkdir("playlist", { recursive: true });

await fs.writeFile(
  "playlist/playlist.m3u",
  playlist,
  "utf8"
);

// ==========================================================
// CONTAGEM FINAL
// ==========================================================

const playlistEntries =
  (playlist.match(/#EXTINF:/g) || []).length;

console.log("===== RESULTADO =====");
console.log(`Playlist gerada: ${channels.length} canais + ${events.length} eventos.`);
console.log(`Entradas M3U geradas: ${playlistEntries}`);
console.log("=====================");
console.log("");

console.log(
  "Somente campos stream_url são usados. " +
  "Nenhum embed_url é extraído ou convertido."
);
