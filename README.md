# 🏮 Lantern

A lightweight, real-time homelab monitoring dashboard. Clean stats, live container visibility, and port badges — all in one minimal dark UI.

![Lantern Dashboard](screenshot.png)

---

## Features

- **Live system stats** — CPU, RAM, and disk usage with animated donut rings and smooth number transitions
- **Container monitoring** — All running Docker containers with per-container CPU, RAM, and port badges
- **Clickable port badges** — Click any port badge to instantly open that service in a new tab
- **Lightweight** — Static frontend served by Nginx, no Node.js runtime. Glances handles stats collection. Total RAM usage is a fraction of comparable dashboards
- **Auto-refresh** — Stats update automatically every few seconds

---

## Quick Start

Create a `docker-compose.yml`:

```yaml
services:
  lantern:
    image: siddatechie/lantern:latest
    pid: host
    ports:
      - "7575:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d
```

Open `http://your-server-ip:7575` in your browser.

---

## Requirements

- Docker
- The container needs access to the host Docker socket (`/var/run/docker.sock`) for container visibility
- `pid: host` is required for Glances to see host processes and container stats correctly

---

## Configuration

No configuration needed. Lantern auto-discovers your Docker containers and reads system stats from the host via Glances.

---

## Tech Stack

- **Frontend** — React + Vite (static files, served by Nginx)
- **Stats** — [Glances](https://github.com/nicolargo/glances) REST API
- **Container** — Nginx + Glances via supervisord, single Docker image

---

## Roadmap (v2)

- Real-time streaming via SSE (no more polling)
- psutil-based Python backend replacing Glances REST
- Quick-access links / app shortcuts
- Process monitor
- Multi-server support

---

## Contributing

PRs welcome. This is a solo homelab project so keep it simple and lightweight.

---

## License

MIT
