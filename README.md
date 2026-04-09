# @ngxs-labs/effects

[![CI](https://github.com/fl0bauer/ngxs-effects/actions/workflows/ci.yml/badge.svg)](https://github.com/fl0bauer/ngxs-effects/actions/workflows/ci.yml)

Declarative side-effect handling for [NGXS](https://www.ngxs.io/) — react to action lifecycle events (dispatch, success, error, canceled) with a clean, class-based API.

📖 **Full documentation:** [`libs/effects/README.md`](libs/effects/README.md)

---

## Quick Start

```bash
# Install dependencies
yarn install

# Run library tests
yarn nx test effects

# Build the library
yarn nx build effects

# Serve the integration app
yarn nx serve integration
```

## Project Structure

- **`libs/effects/`** — The `@ngxs-labs/effects` publishable library
- **`apps/integration/`** — Minimal Angular app to verify the library
