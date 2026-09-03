# Grocify Web architecture

## Boundaries

- `assets/`: static brand assets.
- `components/ui.jsx`: shared UI primitives used by customer and admin features.
- `context/`: client-side application state and actions.
- `data/`: mock fixtures split by business domain. No UI component owns catalogue arrays.
- `layouts/`: customer and admin application shells.
- `pages/customer/` and `pages/admin/`: route-level feature views split into focused files, with local helpers kept beside their owning feature.
- `services/`: the stable data-access boundary used when replacing mocks with HTTP calls.
- `config/`: environment-driven runtime configuration.

## Backend integration

Set `VITE_API_BASE_URL`, then replace the implementation inside the relevant service without changing page components or route URLs. `httpClient.js` already provides JSON handling, typed errors in JavaScript, and request timeouts. Keep response normalization inside services so UI models remain stable.

## State ownership

Transient UI state stays inside pages/components. Cart, favourites, session, location, addresses and demo orders live in `AppContext`. Persistence is isolated in `storage.service.js` and can later be replaced with authenticated API mutations.
