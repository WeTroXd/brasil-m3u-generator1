function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function isAuthorizedStream(url) {
  if (!url || typeof url !== "string") return false;

  // Aceita somente URLs de stream explicitamente fornecidas pela API.
  // Não tenta descobrir/extrair streams de páginas embed.
  return /^https?:\/\//i.test(url);
}

export function channelToM3U(channel) {
  const lines = [];

  // A API deve fornecer stream_url diretamente.
  // Não usamos embed_url.
  const stream = channel.stream_url;

  if (!isAuthorizedStream(stream)) return "";

  const group = channel.category || "Brasil";
  const name = channel.name || "Canal";
  const logo = channel.logo_url || "";

  lines.push(
    `#EXTINF:-1 tvg-id="${esc(channel.id)}" tvg-name="${esc(name)}" ` +
    `tvg-logo="${esc(logo)}" group-title="${esc(group)}",${name}`
  );
  lines.push(stream);

  return lines.join("\n");
}

export function eventToM3U(event) {
  const stream = event.stream_url;

  if (!isAuthorizedStream(stream)) return "";

  const group = event.category || "Esportes";
  const name = event.title || "Evento ao vivo";
  const poster = event.poster || "";

  return [
    `#EXTINF:-1 tvg-name="${esc(name)}" tvg-logo="${esc(poster)}" group-title="${esc(group)}",${name}`,
    stream
  ].join("\n");
}

export function buildPlaylist(channels = [], events = []) {
  const entries = [];

  for (const channel of channels) {
    const item = channelToM3U(channel);
    if (item) entries.push(item);
  }

  for (const event of events) {
    const item = eventToM3U(event);
    if (item) entries.push(item);
  }

  return "#EXTM3U\n\n" + entries.join("\n\n") + "\n";
}
