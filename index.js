import fs from "node:fs/promises";
import { getChannels, getLiveSports, search } from "./api.js";
import { buildPlaylist } from "./m3u.js";

const sportsOnly = String(process.env.SPORTS_ONLY ?? "true").toLowerCase() === "true";
const liveOnly = String(process.env.LIVE_ONLY ?? "false").toLowerCase() === "true";
const query = process.env.QUERY || "futebol";

function dataOf(result) {
  return result?.data ?? [];
}

function normalizeChannel(channel) {
  return channel;
}

function normalizeEvent(event) {
  return event;
}

let channels = [];
let events = [];

if (sportsOnly) {
  const searchResult = await search(query);

  channels = dataOf(searchResult)
    .filter(item => item && typeof item === "object")
    .map(normalizeChannel)
    .filter(channel => {
      const category = String(channel.category || "").toLowerCase();
      return category.includes("sport") ||
             category.includes("esport") ||
             category.includes("futebol") ||
             category.includes("futebol");
    });

  events = dataOf(searchResult)
    .filter(item => item && typeof item === "object")
    .map(normalizeEvent)
    .filter(event => {
      if (!liveOnly) return true;
      return String(event.status || "").toLowerCase() === "live";
    });

  // Se a busca não retornar canais, tenta o endpoint específico de esportes.
  if (liveOnly || events.length === 0) {
    const liveResult = await getLiveSports();
    events = dataOf(liveResult);
  }
} else {
  const channelResult = await getChannels();
  channels = dataOf(channelResult);
}

const playlist = buildPlaylist(channels, events);

await fs.mkdir("playlist", { recursive: true });
await fs.writeFile("playlist/playlist.m3u", playlist, "utf8");

console.log(`Playlist gerada: ${channels.length} canais + ${events.length} eventos.`);
console.log("Somente campos stream_url são usados; embed_url não é extraído.");
