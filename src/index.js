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
  const searchResult = await search(query);
  const data = dataOf(searchResult);

  if (data && !Array.isArray(data) && typeof data === "object") {
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
      item => item && typeof item === "object"
    );
  }

  channels = channels.filter(channel =>
    isSportsCategory(channel.category)
  );

  if (liveOnly) {
    events = events.filter(
      event =>
        String(event.status || "").toLowerCase() === "live"
    );
  }

  if (events.length === 0 && liveOnly) {
    const liveResult = await getLiveSports();
    events = asArray(dataOf(liveResult));
  }
} else {
  const channelResult = await getChannels();
  channels = asArray(dataOf(channelResult));
}

const playlist = buildPlaylist(channels, events);

await fs.mkdir("playlist", { recursive: true });

await fs.writeFile(
  "playlist/playlist.m3u",
  playlist,
  "utf8"
);

console.log(
  `Playlist gerada: ${channels.length} canais + ${events.length} eventos.`
);

console.log(
  "Somente campos stream_url são usados; embed_url não é extraído."
);
