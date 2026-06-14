# lovelace-status-card

Rule-based Lovelace custom cards for Home Assistant.

## Install With HACS

1. Open HACS in Home Assistant.
2. Open the menu and choose `Custom repositories`.
3. Add `https://github.com/batty211/lovelace-status-card`.
4. Select category `Dashboard`.
5. Search for `Status Card` and install it.
6. Refresh the browser after HACS finishes.

HACS normally creates the Lovelace resource automatically. If it does not, add this resource manually:

```text
/hacsfiles/lovelace-status-card/status-card.js
```

Set its type to `JavaScript Module`.

## Card types

- `custom:status-metric-card`
- `custom:status-chip-card`

## First Card

Add a card through the Home Assistant dashboard editor and search for `Status Metric Card`, or paste:

```yaml
type: custom:status-metric-card
entity: sensor.temp_nangeln_temperature
label: อุณหภูมิ
icon: mdi:thermometer
unit: "°C"
digits: 1
accessory: sparkline
rules:
  - type: numeric
    operator: gt
    value: 30
    accent_color: "#ff6b5c"
    label: ร้อน
  - type: unavailable
    accent_color: "#94a3b8"
    label: ไม่พร้อมใช้งาน
```

## Rules

- `state` matches a state such as `on` or `off`
- `numeric` supports `gt`, `gte`, `lt`, `lte`, `eq`, `ne`, and `between`
- `range` matches an inclusive numeric range
- `unavailable` handles `unknown`, `unavailable`, and `offline`

The visual editor covers common settings. Advanced JavaScript remains available in `advanced.template` for conditions that cannot be expressed cleanly as rules.
