function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function isAuthorizedStream(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Aceita somente uma URL de stream fornecida diretamente pela API.
  // Não extrai streams de páginas embed.
  return /^https?:\/\//i.test(url.trim());
}

function cleanName(value, fallback) {
  const name = String(value ?? "").trim();
  return name || fallback;
}

export function channelToM3U(channel) {
  if (!channel || typeof channel !== "object") {
    return "";
  }

  // A API precisa fornecer diretamente:
  // channel.stream_url
  const stream = channel.stream_url;

  if (!isAuthorizedStream(stream)) {
    return "";
  }

  const id = cleanName(channel.id, "");
  const name = cleanName(channel.name, "Canal");
  const group = cleanName(channel.category, "Brasil");
  const logo = cleanName(channel.logo_url, "");

  const extinf =
    `#EXTINF:-1 ` +
    `tvg-id="${esc(id)}" ` +
    `tvg-name="${esc(name)}" ` +
    `tvg-logo="${esc(logo)}" ` +
    `group-title="${esc(group)}",${name}`;

  return [
    extinf,
    stream.trim()
  ].join("\n");
}

export function eventToM3U(event) {
  if (!event || typeof event !== "object") {
    return "";
  }

  // O evento também precisa fornecer diretamente:
  // event.stream_url
  const stream = event.stream_url;

  if (!isAuthorizedStream(stream)) {
    return "";
  }

  const name = cleanName(event.title, "Evento ao vivo");
  const group = cleanName(event.category, "Esportes");
  const poster = cleanName(event.poster, "");

  const extinf =
    `#EXTINF:-1 ` +
    `tvg-name="${esc(name)}" ` +
    `tvg-logo="${esc(poster)}" ` +
    `group-title="${esc(group)}",${name}`;

  return [
    extinf,
    stream.trim()
  ].join("\n");
}

export function buildPlaylist(channels = [], events = []) {
  const entries = [];

  let channelsReceived = 0;
  let channelsWithStream = 0;

  let eventsReceived = 0;
  let eventsWithStream = 0;

  // Canais
  for (const channel of channels) {
    channelsReceived++;

    const item = channelToM3U(channel);

    if (item) {
      channelsWithStream++;
      entries.push(item);
    }
  }

  // Eventos
  for (const event of events) {
    eventsReceived++;

    const item = eventToM3U(event);

    if (item) {
      eventsWithStream++;
      entries.push(item);
    }
  }

  // Diagnóstico no GitHub Actions
  console.log(`Canais recebidos: ${channelsReceived}`);
  console.log(`Canais com stream_url: ${channelsWithStream}`);

  console.log(`Eventos recebidos: ${eventsReceived}`);
  console.log(`Eventos com stream_url: ${eventsWithStream}`);

  console.log(`Total de entradas M3U: ${entries.length}`);

  if (entries.length === 0) {
    console.warn(
      "Nenhuma entrada foi adicionada à playlist. " +
      "Verifique se a API fornece stream_url diretamente."
    );
  }

  return "#EXTM3U\n\n" + entries.join("\n\n") + "\n";
}
