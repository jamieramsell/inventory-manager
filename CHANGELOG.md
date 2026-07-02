# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/)

## [Unreleased]

## [0.1.0] - 2026-07-02

### M0 — Project setup and scaffolding

- Repository structure with branch model (`<milestone>/<label>/<name>` →
  `stable-<milestone>` → `main`), issue/PR templates, and label system
  (`feature`, `bug`, `blocked`, and the standard GitHub defaults)
- Spring Boot 3.x backend skeleton: package-per-context layout (`org`,
  `catalog`, `stock`, `pos`, `ledger`, `rota`, `labels`, `reporting`),
  `/ping` liveness endpoint
- PostgreSQL via Docker Compose; Flyway owns the schema (`ddl-auto=validate`);
  baseline migration (`V1__baseline.sql`) in place
- Testcontainers context-load test verifies the Spring context starts against a
  real PostgreSQL instance
- Google Java Style Guide enforced by `maven-checkstyle-plugin`
  (`google_checks.xml`); Javadoc doclint (`all,-missing`) validates references
- TypeScript PWA till skeleton (Vite + React); trivial till page calls `/ping`
  via a dev proxy; web-app manifest included
- Google TypeScript Style Guide enforced by `gts` (Prettier + ESLint)
- GitHub Actions CI (`build.yml`): `backend` job runs `./mvnw -B verify`;
  `till-client` job runs `npm ci`, `npm run lint`, `npm run build`; both run
  on every pull request with concurrency cancel on push
- `manage-blocked-label.yml` workflow keeps the `blocked` label in sync with
  open issue dependencies
