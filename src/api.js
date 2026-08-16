const API = process.env.API_BASE;

if (!API) {
  throw new Error("Defina API_BASE no ambiente.");
}

function headers() {
  const h = { "Accept": "application/json" };
  if (process.env.API_TOKEN) {
    h.Authorization = `Bearer ${process.env.API_TOKEN}`;
  }
  return h;
}

export async function getJson(path) {
  const url = new URL(path, API);
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getChannels() {
  return getJson("/channels");
}

export async function getLiveSports() {
  return getJson("/sports?status=live");
}

export async function search(query) {
  return getJson(`/search?q=${encodeURIComponent(query)}`);
}
