# @orbit/ui

Shared visual catalog, `ThemeShell`, `SectionWrapper`, and CSS token system (`--orbit-*`) consumed by both:
- **Orbit Hub Control Plane (Symfony + Puck Editor)**
- **Orbit Hub Data Plane (Astro SSR `hub-builder`)**

## Installation

Install pinned to a release tag via Git:

```json
{
  "dependencies": {
    "@orbit/ui": "git+ssh://git@github.com/nireneko/orbit-ui.git#v0.2.0"
  }
}
```

## Development with Docker

Every command runs inside the `node` service from `compose.yaml` (`node:22`, the repository mounted at `/app`, your host user, npm cache outside the working tree). Nothing needs Node installed on the host.

Install, type-check and test, as from a clean clone:

```bash
docker compose run --rm node sh -c "npm ci && npm run build && npm test"
```

Single steps:

```bash
docker compose run --rm node npm ci          # install dependencies from package-lock.json
docker compose run --rm node npm run build   # type-check (tsc --noEmit)
docker compose run --rm node npm test        # run the Vitest suite once
docker compose run --rm node npx vitest      # watch mode
```

The container runs as uid/gid `1000` by default. If your host ids differ (`id -u`, `id -g`), export them first so the files written to the repository stay yours:

```bash
export HOST_UID=$(id -u) HOST_GID=$(id -g)
```

Porting the reference design into components follows [`docs/design-port.md`](docs/design-port.md).

## Release Workflow

1. Update `"version"` in `package.json`.
2. Commit and push to `main`.
3. Create and push a matching Git tag (e.g. `git tag v0.2.1 && git push origin v0.2.1`).
4. Bump the tag in `multi-platform` and `hub-builder`.
