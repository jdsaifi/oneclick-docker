# OneClick Docker - Project Plan

> A DigitalOcean-style web UI for creating and managing Docker containers visually.
> No YAML. No CLI. Just click and deploy.

---

## Vision

Existing Docker UIs (Portainer, Yacht, Dockge) either expose raw Docker complexity or offer rigid templates with no customization. None provide a guided, visual "create a container" experience like DigitalOcean's droplet creation flow.

**OneClick Docker** fills this gap: a single-page guided form where users pick an image, configure settings with smart defaults, and click "Create" to get a running container with connection details.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 15 (App Router)** | Server components, API routes, SSR |
| Language | **TypeScript** | Type safety across frontend + backend |
| Styling | **Tailwind CSS v4** | Utility-first, rapid UI development |
| UI Components | **shadcn/ui** | Accessible, composable, not a dependency - just copy-paste components |
| Icons | **Lucide React** | Clean icon set, tree-shakable |
| State Management | **Zustand** | Lightweight, no boilerplate |
| Forms | **React Hook Form + Zod** | Validation with type inference |
| Docker SDK | **dockerode** | ~2M weekly downloads, full Docker Engine API coverage |
| Real-time | **Server-Sent Events (SSE)** | Container status updates, log streaming |
| Data | **SQLite via better-sqlite3** | Zero-config, file-based, perfect for self-hosted |
| ORM | **Drizzle ORM** | Type-safe, lightweight, great SQLite support |
| Auth (optional) | **next-auth** | Simple auth for multi-user setups |
| Package Manager | **pnpm** | Fast, disk-efficient |

---

## Core Features (MVP)

### 1. Container Creation Flow (The Hero Feature)

A single-page form inspired by DigitalOcean's droplet creation, with numbered sections:

#### Section 1: Choose Image
- Visual catalog with categories: **OS**, **Database**, **Web Server**, **Language/Runtime**, **Application**
- Popular images with icons: Ubuntu, Alpine, Debian, PostgreSQL, MySQL, Redis, MongoDB, Nginx, Node.js, Python, etc.
- Search Docker Hub for any image
- Tag/version selector per image
- **Smart defaults**: When an image is selected, auto-populate ports, volumes, and environment variables by inspecting image metadata via `docker.getImage().inspect()`

#### Section 2: Choose Size (Resource Limits)
- DigitalOcean-style visual tier cards:
  - **Nano**: 0.25 CPU, 256 MB RAM
  - **Small**: 0.5 CPU, 512 MB RAM
  - **Medium**: 1 CPU, 1 GB RAM
  - **Large**: 2 CPU, 2 GB RAM
  - **XL**: 4 CPU, 4 GB RAM
  - **Custom**: Manual sliders for CPU and memory
- Maps to Docker's `NanoCpus` and `Memory` fields

#### Section 3: Volumes (Persistent Storage)
- Auto-suggested based on image metadata (e.g., PostgreSQL auto-suggests `/var/lib/postgresql/data`)
- Two modes:
  - **Named Volume** (Docker-managed) - just give it a name
  - **Bind Mount** (host directory) - pick a host path
- Add/remove volume mappings visually

#### Section 4: Network & Ports
- Auto-detected exposed ports from image metadata
- Simple table: Container Port -> Host Port, with protocol toggle (TCP/UDP)
- Port conflict detection (check if host port is already in use)
- Network selection: default bridge, or pick/create a custom network
- Container-to-container linking shown visually when on the same network

#### Section 5: Environment Variables
- Auto-populated from image metadata (e.g., `POSTGRES_PASSWORD`, `MYSQL_ROOT_PASSWORD`)
- Required variables marked with asterisk
- Password fields masked with show/hide toggle
- Add custom key-value pairs
- Import from `.env` file

#### Section 6: Additional Settings
- **Container name**: Auto-generated but editable
- **Restart policy**: Dropdown (Don't restart / Unless stopped / Always / On failure)
- **Hostname**: Optional
- **Command override**: Optional, for advanced users
- **Labels**: Key-value pairs for organization

#### Section 7: Review & Create
- Summary card showing all selected configuration
- Estimated resource usage
- **"Create Container"** button
- After creation: show container IP, mapped ports, connection commands (e.g., `psql -h localhost -p 5432`)

---

### 2. Container Dashboard

- Grid/list view of all containers
- Status indicators: Running (green), Stopped (gray), Error (red)
- Quick actions: Start, Stop, Restart, Remove
- Resource usage bars (CPU, Memory) via Docker stats API
- Search and filter by name, image, status, labels

### 3. Container Detail View

- **Overview tab**: Status, image, created date, ports, volumes, network, environment variables
- **Logs tab**: Real-time log streaming via SSE
- **Terminal tab**: Web-based terminal (exec into container) via WebSocket
- **Stats tab**: Live CPU, memory, network I/O charts
- **Settings tab**: Edit configuration (requires container recreation)

### 4. Image Management

- List local images with size, tags, created date
- Pull new images from Docker Hub with progress bar
- Remove unused images
- Image search with Docker Hub integration

### 5. Volume Management

- List all volumes with size, mount points, associated containers
- Create / Remove volumes
- Inspect volume details

### 6. Network Management

- List all networks with driver, containers attached
- Create / Remove custom networks
- Visual network topology (which containers are connected)

---

## Project Structure

```
webapp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with sidebar
│   │   ├── page.tsx                  # Dashboard (container list)
│   │   ├── containers/
│   │   │   ├── page.tsx              # Container list view
│   │   │   ├── create/
│   │   │   │   └── page.tsx          # Container creation flow
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Container detail view
│   │   ├── images/
│   │   │   └── page.tsx              # Image management
│   │   ├── volumes/
│   │   │   └── page.tsx              # Volume management
│   │   ├── networks/
│   │   │   └── page.tsx              # Network management
│   │   └── api/                      # API Routes
│   │       ├── containers/
│   │       │   ├── route.ts          # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET, DELETE
│   │       │       ├── start/route.ts
│   │       │       ├── stop/route.ts
│   │       │       ├── restart/route.ts
│   │       │       ├── logs/route.ts # SSE log streaming
│   │       │       └── stats/route.ts
│   │       ├── images/
│   │       │   ├── route.ts          # GET (list), POST (pull)
│   │       │   ├── [id]/route.ts     # GET, DELETE
│   │       │   └── search/route.ts   # Docker Hub search
│   │       ├── volumes/
│   │       │   └── route.ts          # CRUD
│   │       ├── networks/
│   │       │   └── route.ts          # CRUD
│   │       └── system/
│   │           └── info/route.ts     # Docker system info
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Navigation sidebar
│   │   │   ├── header.tsx            # Top bar with search
│   │   │   └── mobile-nav.tsx        # Mobile navigation
│   │   ├── containers/
│   │   │   ├── container-card.tsx    # Container grid card
│   │   │   ├── container-list.tsx    # Container list/grid view
│   │   │   ├── container-logs.tsx    # Log viewer component
│   │   │   ├── container-stats.tsx   # Stats charts
│   │   │   └── container-terminal.tsx # Web terminal
│   │   ├── create/                   # Container creation form sections
│   │   │   ├── image-picker.tsx      # Section 1: Image catalog
│   │   │   ├── size-selector.tsx     # Section 2: Resource tiers
│   │   │   ├── volume-config.tsx     # Section 3: Volume setup
│   │   │   ├── network-config.tsx    # Section 4: Ports & network
│   │   │   ├── env-config.tsx        # Section 5: Environment vars
│   │   │   ├── advanced-config.tsx   # Section 6: Additional settings
│   │   │   └── review-summary.tsx    # Section 7: Review & create
│   │   ├── images/
│   │   │   └── image-list.tsx
│   │   ├── volumes/
│   │   │   └── volume-list.tsx
│   │   └── networks/
│   │       └── network-list.tsx
│   ├── lib/
│   │   ├── docker.ts                 # dockerode client singleton
│   │   ├── docker-utils.ts           # Helper functions for Docker operations
│   │   ├── image-catalog.ts          # Curated image list with metadata
│   │   ├── smart-defaults.ts         # Image-aware default configurations
│   │   ├── port-utils.ts             # Port conflict detection
│   │   └── format.ts                 # Formatting utilities (bytes, dates, etc.)
│   ├── stores/
│   │   ├── container-store.ts        # Zustand store for container state
│   │   └── create-form-store.ts      # Zustand store for creation form
│   ├── types/
│   │   ├── container.ts              # Container type definitions
│   │   ├── image.ts                  # Image type definitions
│   │   └── docker.ts                 # Docker API type definitions
│   └── hooks/
│       ├── use-containers.ts         # Container data fetching hook
│       ├── use-container-logs.ts     # SSE log streaming hook
│       ├── use-container-stats.ts    # Real-time stats hook
│       └── use-docker-images.ts      # Image data fetching hook
├── public/
│   └── icons/                        # OS/DB/framework logos
├── drizzle/                          # Database migrations
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── claude.md                         # This file
```

---

## Implementation Phases

### Phase 1: Project Setup & Foundation
- [ ] Initialize Next.js 15 project with TypeScript and Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up project structure (folders, base files)
- [ ] Configure dockerode client with Docker socket connection
- [ ] Create API route: `GET /api/system/info` to verify Docker connection
- [ ] Build root layout with sidebar navigation
- [ ] Build a basic dashboard page (placeholder)

### Phase 2: Container Listing & Management
- [ ] API routes: List containers, start, stop, restart, remove
- [ ] Container dashboard with grid/list view
- [ ] Container cards showing status, image, ports, resource usage
- [ ] Quick action buttons (start/stop/restart/remove)
- [ ] Search and filter containers
- [ ] Real-time status updates via polling or SSE

### Phase 3: Container Creation Flow (Core Feature)
- [ ] Create Zustand store for multi-section form state
- [ ] **Image Picker**: Curated catalog with categories, icons, search, tag selector
- [ ] **Size Selector**: Visual tier cards with CPU/RAM presets
- [ ] **Volume Config**: Auto-suggested volumes from image inspect, add/remove UI
- [ ] **Network & Ports**: Auto-detected ports, conflict checking, network picker
- [ ] **Environment Variables**: Auto-populated from image, required field marking, .env import
- [ ] **Advanced Settings**: Name, restart policy, hostname, command override, labels
- [ ] **Review & Create**: Summary card, create button, post-creation connection info
- [ ] API route: `POST /api/containers` with full configuration support
- [ ] Smart defaults engine: inspect image metadata to pre-fill configuration

### Phase 4: Container Detail View
- [ ] Container overview tab with all configuration details
- [ ] Real-time log streaming (SSE via API route)
- [ ] Log viewer component with search, auto-scroll, download
- [ ] Live stats (CPU, memory, network I/O) with charts
- [ ] Web terminal via exec API (WebSocket)

### Phase 5: Image, Volume & Network Management
- [ ] Image list with pull, remove, search Docker Hub
- [ ] Image pull progress bar
- [ ] Volume CRUD with associated container info
- [ ] Network CRUD with attached container visualization

### Phase 6: Polish & Advanced Features
- [ ] Dark/light theme toggle
- [ ] Mobile responsive layout
- [ ] Toast notifications for all actions
- [ ] Error handling and loading states throughout
- [ ] Container compose/stack creation (multi-container with shared network)
- [ ] Template system: save and reuse container configurations
- [ ] Export configuration as docker-compose.yml or `docker run` command

---

## Image Catalog (Curated Defaults)

The image picker will ship with a curated list of popular images, organized by category. Each entry includes display metadata and smart defaults.

```typescript
type CatalogImage = {
  name: string;            // e.g., "postgres"
  displayName: string;     // e.g., "PostgreSQL"
  description: string;     // e.g., "Relational database"
  category: "os" | "database" | "webserver" | "language" | "application";
  icon: string;            // Path to icon
  officialImage: boolean;
  popularTags: string[];   // e.g., ["16", "15", "16-alpine"]
  defaultTag: string;      // e.g., "16"
  defaults: {
    ports: { container: number; host: number; protocol: "tcp" | "udp" }[];
    volumes: { container: string; name: string }[];
    env: { key: string; value: string; required: boolean; secret: boolean; description: string }[];
    size: "nano" | "small" | "medium" | "large";
  };
};
```

### Initial Catalog

**Operating Systems:** Ubuntu, Debian, Alpine, Rocky Linux, Fedora
**Databases:** PostgreSQL, MySQL, MariaDB, MongoDB, Redis, Elasticsearch
**Web Servers:** Nginx, Apache (httpd), Caddy, Traefik
**Languages/Runtimes:** Node.js, Python, Go, Ruby, PHP, OpenJDK
**Applications:** WordPress, Ghost, Nextcloud, Gitea, MinIO

---

## Smart Defaults Engine

When a user selects an image, the system:

1. **Checks the curated catalog** for pre-defined defaults
2. **Falls back to image inspection** via `docker.getImage(name).inspect()` which returns:
   - `Config.ExposedPorts` -> auto-populate port mappings
   - `Config.Volumes` -> auto-suggest volume mounts
   - `Config.Env` -> show default environment variables
3. **Suggests a resource tier** based on image type (databases get "Medium", simple OS gets "Nano")

This is the key differentiator: no other Docker UI does this.

---

## API Design

All API routes are Next.js Route Handlers under `src/app/api/`.

### Containers
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/containers` | List all containers (with filters) |
| POST | `/api/containers` | Create and start a new container |
| GET | `/api/containers/[id]` | Get container details |
| DELETE | `/api/containers/[id]` | Remove container |
| POST | `/api/containers/[id]/start` | Start container |
| POST | `/api/containers/[id]/stop` | Stop container |
| POST | `/api/containers/[id]/restart` | Restart container |
| GET | `/api/containers/[id]/logs` | Stream logs (SSE) |
| GET | `/api/containers/[id]/stats` | Stream stats (SSE) |

### Images
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/images` | List local images |
| POST | `/api/images/pull` | Pull image from registry |
| DELETE | `/api/images/[id]` | Remove image |
| GET | `/api/images/search` | Search Docker Hub |
| GET | `/api/images/[name]/inspect` | Inspect image for smart defaults |

### Volumes & Networks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/volumes` | List volumes |
| POST | `/api/volumes` | Create volume |
| DELETE | `/api/volumes/[name]` | Remove volume |
| GET | `/api/networks` | List networks |
| POST | `/api/networks` | Create network |
| DELETE | `/api/networks/[id]` | Remove network |

### System
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/system/info` | Docker engine info & version |

---

## UI/UX Design Principles

1. **Single-page creation flow** (not a wizard) - all sections visible, scroll to navigate, numbered sections with sticky progress indicator
2. **Smart defaults everywhere** - a user should be able to select an image, scroll to the bottom, and click "Create" with zero additional configuration
3. **Progressive disclosure** - simple options visible by default, advanced settings behind expandable sections
4. **Immediate feedback** - port conflict warnings, image pull progress, container creation status
5. **Connection-first results** - after creating a container, prominently show how to connect to it (ports, IPs, CLI commands)
6. **Dark mode by default** - terminal/DevOps tools look better dark (with light mode option)

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "dockerode": "^4",
    "zustand": "^5",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "zod": "^3",
    "drizzle-orm": "^0.38",
    "better-sqlite3": "^11",
    "lucide-react": "^0.460",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "sonner": "^1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/dockerode": "^3",
    "@types/better-sqlite3": "^7",
    "tailwindcss": "^4",
    "drizzle-kit": "^0.30",
    "eslint": "^9",
    "eslint-config-next": "^15"
  }
}
```

---

## How We'll Build It

We will build this step by step, one phase at a time. Each phase will be a working increment:

1. **Phase 1** gives us a running app with Docker connection verified
2. **Phase 2** gives us a useful container dashboard
3. **Phase 3** gives us the hero feature - the creation flow
4. **Phase 4** adds depth to container management
5. **Phase 5** completes the Docker resource management
6. **Phase 6** polishes and adds power-user features

At the end of each phase, we'll have something usable and demoable.

---

## Current Status

- [x] Project plan created
- [x] Phase 1: Project Setup & Foundation
- [x] Phase 2: Container Listing & Management
- [x] Phase 3: Container Creation Flow
- [x] Phase 4: Container Detail View
- [x] Phase 5: Image, Volume & Network Management
- [ ] Phase 6: Polish & Advanced Features
