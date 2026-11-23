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

## Development

```bash
npm install
npm run build
npm test
```

## Release Workflow

1. Update `"version"` in `package.json`.
2. Commit and push to `main`.
3. Create and push a matching Git tag (e.g. `git tag v0.2.1 && git push origin v0.2.1`).
4. Bump the tag in `multi-platform` and `hub-builder`.
