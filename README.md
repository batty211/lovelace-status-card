# lovelace-status-card

Rule-based Lovelace custom cards for Home Assistant.

## HACS install

1. Push this folder as its own public GitHub repository.
2. Add the repository to HACS as a custom repository of type `Dashboard`.
3. Install it from HACS.
4. Add the Lovelace resource that HACS provides, or use:

```yaml
url: /hacsfiles/lovelace-status-card/status-card.js
type: module
```

## What is inside

- `status-card.js` is the HACS entrypoint
- `dist/status-card.js` contains the built card code

## Card types

- `custom:status-metric-card`
- `custom:status-chip-card`
