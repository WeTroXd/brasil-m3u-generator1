# 🇧🇷 Brasil M3U Generator

Gerador de playlists M3U para canais e eventos a partir de uma **API autorizada**.

## Como funciona

```text
API autorizada
     ↓
Node.js
     ↓
filtra canais/eventos
     ↓
usa stream_url fornecido pela API
     ↓
playlist/playlist.m3u
     ↓
GitHub
     ↓
VLC / Kodi / TiviMate
```

> Este projeto não extrai streams de páginas `embed_url`, não quebra DRM e não tenta descobrir URLs internas. A API precisa fornecer diretamente um `stream_url` que você tenha autorização para reproduzir/distribuir.

## 1. Configurar localmente

Instale Node.js 20+.

Copie:

```bash
cp .env.example .env
```

Configure:

```env
API_BASE=https://sua-api-autorizada.com
API_TOKEN=
SPORTS_ONLY=true
LIVE_ONLY=false
QUERY=futebol
```

O projeto usa as seguintes rotas por padrão:

```text
GET /channels
GET /sports?status=live
GET /search?q=futebol
```

Se sua API usa outras rotas, altere `src/api.js`.

## 2. Formato esperado

Para canais:

```json
{
  "data": [
    {
      "id": "canal-1",
      "name": "Canal Esportivo",
      "logo_url": "https://exemplo.com/logo.png",
      "category": "Esportes",
      "stream_url": "https://exemplo.com/live/canal.m3u8"
    }
  ]
}
```

Para eventos:

```json
{
  "data": [
    {
      "id": "jogo-1",
      "title": "Time A x Time B",
      "category": "Futebol",
      "status": "live",
      "poster": "https://exemplo.com/poster.jpg",
      "stream_url": "https://exemplo.com/live/jogo.m3u8"
    }
  ]
}
```

## 3. Gerar

```bash
npm start
```

A saída será:

```text
playlist/playlist.m3u
```

## 4. GitHub Actions

Crie estes Secrets no repositório:

- `API_BASE`
- `API_TOKEN` (se necessário)

A Action atualiza a playlist a cada 30 minutos.

Depois do primeiro update, a playlist poderá ser acessada pelo endereço:

```text
https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPOSITORIO/main/playlist/playlist.m3u
```

Substitua `SEU_USUARIO` e `SEU_REPOSITORIO`.

## Personalização

Para incluir outras categorias, altere o filtro em `src/index.js`.

Para alterar o intervalo de atualização, edite:

```yaml
schedule:
  - cron: "*/30 * * * *"
```

O GitHub Actions usa UTC.
