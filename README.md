# @orbit/ui

Shared visual catalog, `ThemeShell`, `SectionWrapper`, and CSS token system (`--orbit-*`) consumed by both:
- **Orbit Hub Control Plane (Symfony + Puck Editor)**
- **Orbit Hub Data Plane (Astro SSR `hub-builder`)**

## Installation

Install pinned to a release tag via Git, then import the stylesheet once in the host app:

```json
{
  "dependencies": {
    "@orbit/ui": "https://github.com/nireneko/orbit-ui.git#v0.4.0-rc.1"
  }
}
```

```ts
import '@orbit/ui/styles.css';
```

The entry stylesheet imports one sheet per component; catalog components are styled only through these sheets, so they render unstyled without it. Token contract and class naming: [`docs/design-port.md`](docs/design-port.md). Changes per version, including what each consumer must update, are listed in [`CHANGELOG.md`](CHANGELOG.md).

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

Tags are immutable: a published tag is never moved or deleted. A fix after a release is a new version.

**Prerelease** (`vX.Y.Z-rc.N`, tagged on the integration branch, e.g. `epic/15-single-engine`):

1. Set the version inside the container, which updates `package.json` and both entries in `package-lock.json`: `docker compose run --rm node npm version X.Y.Z-rc.N --no-git-tag-version`.
2. Add the `CHANGELOG.md` entry, listing every change a consumer must act on.
3. Merge the PR into the integration branch with the gate green (`docker compose run --rm node sh -c "npm ci && npm run build && npm test"`).
4. Tag that merge commit and push the tag: `git tag vX.Y.Z-rc.N <commit> && git push origin vX.Y.Z-rc.N`.
5. A correction is the next prerelease (`-rc.N+1`), never a re-tag.

**Release** (`vX.Y.Z`, tagged on `main`): the same steps with `X.Y.Z`, once the integration branch is merged into `main`.

After either, bump the tag in the consumers (`orbit-hub` and `orbit-hub-builder`).
