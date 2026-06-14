import { getCardDefaults, normalizeConfig, resolvePresentation } from './core.js';
import './editor.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSparkline(points, color) {
  if (!Array.isArray(points) || points.length < 2) {
    return '<svg viewBox="0 0 100 24" aria-hidden="true" focusable="false" class="sparkline"></svg>';
  }

  const width = 100;
  const height = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 2 - ((point - min) / range) * (height - 4);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false" class="sparkline">
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}

function getHistory(entityId, currentValue, limit = 10) {
  const store = window.__statusCardHistory ?? (window.__statusCardHistory = {});
  const key = entityId || 'status-card';
  const existing = Array.isArray(store[key]) ? store[key] : [];

  if (!Number.isFinite(currentValue)) {
    return existing;
  }

  if (existing[existing.length - 1] === currentValue) {
    return existing;
  }

  const next = [...existing, currentValue].slice(-limit);
  store[key] = next;
  return next;
}

function formatAction(config) {
  if (!config || typeof config !== 'object') {
    return { action: 'more-info' };
  }
  return config;
}

function applyAction(hass, config, actionConfig, event) {
  const action = formatAction(actionConfig);
  const entityId = config.entity;
  const serviceData = typeof action.service_data === 'string'
    ? safeParseJson(action.service_data)
    : action.service_data;

  switch (String(action.action ?? 'more-info')) {
    case 'none':
      return;
    case 'more-info':
      event?.stopPropagation?.();
      this.dispatchEvent(
        new CustomEvent('hass-more-info', {
          detail: { entityId },
          bubbles: true,
          composed: true
        })
      );
      return;
    case 'toggle':
      if (entityId) {
        hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      }
      return;
    case 'call-service':
      if (action.service) {
        const [domain, service] = action.service.split('.');
        hass.callService(domain, service, serviceData ?? {});
      }
      return;
    case 'navigate':
      if (action.navigation_path) {
        window.history.pushState(null, '', action.navigation_path);
        window.dispatchEvent(new Event('location-changed', { bubbles: true }));
      }
      return;
    case 'url':
      if (action.navigation_path) {
        window.open(action.navigation_path, '_blank', 'noopener,noreferrer');
      }
      return;
    default:
      return;
  }
}

function safeParseJson(value) {
  try {
    return JSON.parse(String(value));
  } catch (error) {
    return {};
  }
}

class StatusCardBase extends HTMLElement {
  constructor(defaultVariant = 'metric') {
    super();
    this._defaultVariant = defaultVariant;
    this.attachShadow({ mode: 'open' });
    this._config = normalizeConfig({ variant: defaultVariant });
    this._hass = null;
    this._holdTimer = null;
    this._holdTriggered = false;
  }

  set hass(value) {
    this._hass = value;
    this._render();
  }

  setConfig(config) {
    this._config = normalizeConfig({
      variant: this._defaultVariant,
      ...config
    });
    this._render();
  }

  getCardSize() {
    return this._config.variant === 'chip' ? 1 : 2;
  }

  getStubConfig() {
    return this.constructor.getStubConfig();
  }

  renderMetric(presentation, entity, config) {
    const value = Number(entity?.state);
    const history = getHistory(config.entity, value, config.trend_window ?? 10);
    const accessory = config.accessory === 'sparkline' ? renderSparkline(history, presentation.accentColor) : '';
    const badge = config.accessory === 'badge'
      ? `<div class="badge">${escapeHtml(config.badge_text ?? presentation.secondaryText ?? '')}</div>`
      : '';

    return `
      <div class="frame frame--metric">
        <div class="left">
          ${presentation.icon && config.show_icon !== false ? `
            <div class="icon-box" style="background:${presentation.iconBackground}; color:${presentation.iconColor}; border-color:${presentation.borderColor};">
              <ha-icon icon="${presentation.icon}" style="width:22px; height:22px; color:inherit;"></ha-icon>
            </div>
          ` : ''}
          <div class="copy">
            <div class="label">${escapeHtml(presentation.label)}</div>
            ${presentation.hideValue ? '' : `<div class="value" style="color:${presentation.valueColor};">${escapeHtml(presentation.valueText)}</div>`}
            ${presentation.secondaryText ? `<div class="secondary" style="color:${presentation.secondaryColor};">${escapeHtml(presentation.secondaryText)}</div>` : ''}
          </div>
        </div>
        <div class="right">
          ${badge}
          ${accessory}
        </div>
      </div>
    `;
  }

  renderChip(presentation, entity, config) {
    const badge = config.accessory === 'badge'
      ? `<span class="chip-badge">${escapeHtml(config.badge_text ?? presentation.secondaryText ?? '')}</span>`
      : '';
    return `
      <div class="frame frame--chip">
        <div class="chip-body">
          ${presentation.icon && config.show_icon !== false ? `
            <div class="icon-box icon-box--chip" style="background:${presentation.iconBackground}; color:${presentation.iconColor}; border-color:${presentation.borderColor};">
              <ha-icon icon="${presentation.icon}" style="width:18px; height:18px; color:inherit;"></ha-icon>
            </div>
          ` : ''}
          <div class="copy copy--chip">
            <div class="label label--chip">${escapeHtml(presentation.label)}</div>
            ${presentation.hideValue ? '' : `<div class="value value--chip" style="color:${presentation.valueColor};">${escapeHtml(presentation.valueText)}</div>`}
          </div>
          ${badge}
        </div>
      </div>
    `;
  }

  _render() {
    if (!this.shadowRoot || !this._config) {
      return;
    }

    const config = this._config;
    const entity = config.entity ? this._hass?.states?.[config.entity] : undefined;
    const presentation = resolvePresentation(config, entity, this._hass);
    const defaults = getCardDefaults(config.variant);
    const background = presentation.backgroundColor || defaults.background;
    const borderColor = presentation.borderColor || defaults.borderColor;
    const rendered = config.variant === 'chip'
      ? this.renderChip(presentation, entity, config)
      : this.renderMetric(presentation, entity, config);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--primary-text-color, #ffffff);
          --status-card-radius: 26px;
        }
        ha-card {
          display: block;
          border-radius: var(--status-card-radius);
          background: ${background};
          border: 1px solid ${borderColor};
          box-shadow: 0 18px 42px rgba(2, 8, 23, 0.26), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
          cursor: pointer;
        }
        .frame {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: ${config.variant === 'chip' ? '12px 14px' : '16px 18px'};
          box-sizing: border-box;
          min-height: ${config.variant === 'chip' ? '56px' : '92px'};
        }
        .frame--metric {
          align-items: stretch;
        }
        .left,
        .chip-body {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .left {
          flex: 1 1 auto;
          justify-content: space-between;
        }
        .copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .copy--chip {
          flex-direction: row;
          align-items: baseline;
          gap: 10px;
        }
        .label {
          font-size: 14px;
          line-height: 1.1;
          font-weight: 650;
          color: rgba(226, 232, 240, 0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .label--chip {
          font-size: 13px;
        }
        .value {
          font-size: 34px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .value--chip {
          font-size: 18px;
          font-weight: 750;
          line-height: 1.1;
        }
        .secondary {
          font-size: 12px;
          line-height: 1.2;
          color: rgba(226, 232, 240, 0.7);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .icon-box {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          box-shadow: 0 10px 22px rgba(2, 8, 23, 0.22);
        }
        .icon-box--chip {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          border-radius: 999px;
        }
        .right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex: 0 0 auto;
        }
        .sparkline {
          width: 104px;
          height: 24px;
          overflow: visible;
        }
        .badge,
        .chip-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.94);
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        .chip-badge {
          padding: 5px 9px;
        }
      </style>
      <ha-card>
        ${rendered}
      </ha-card>
    `;

    this._bindInteractions();
  }

  _bindInteractions() {
    const card = this.shadowRoot?.querySelector('ha-card');
    if (!card) {
      return;
    }

    card.addEventListener('click', (event) => {
      if (this._holdTriggered) {
        this._holdTriggered = false;
        event.preventDefault();
        return;
      }
      this._handleTap(event);
    });

    card.addEventListener('pointerdown', () => {
      if (!this._config || !this._hass) {
        return;
      }

      clearTimeout(this._holdTimer);
      if (!this._config.hold_action || this._config.hold_action.action === 'none') {
        return;
      }

      this._holdTimer = window.setTimeout(() => {
        this._holdTriggered = true;
        applyAction.call(this, this._hass, this._config, this._config.hold_action);
      }, 550);
    });

    const clearHold = () => {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    };

    card.addEventListener('pointerup', clearHold);
    card.addEventListener('pointercancel', clearHold);
    card.addEventListener('mouseleave', clearHold);
    card.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  _handleTap(event) {
    if (!this._config || !this._hass) {
      return;
    }

    if (event.type === 'touchend') {
      event.preventDefault();
    }

    applyAction.call(this, this._hass, this._config, this._config.tap_action, event);
  }

  static getConfigElement() {
    return document.createElement('status-card-editor');
  }

  static getStubConfig() {
    return {
      type: 'custom:status-metric-card',
      entity: 'sensor.example',
      label: 'Status',
      icon: 'mdi:chart-timeline-variant',
      unit: '',
      variant: 'metric',
      accessory: 'sparkline',
      rules: []
    };
  }
}

export class StatusMetricCard extends StatusCardBase {
  constructor() {
    super('metric');
  }

  static getStubConfig() {
    return {
      type: 'custom:status-metric-card',
      entity: 'sensor.example',
      label: 'Status',
      icon: 'mdi:chart-timeline-variant',
      unit: '',
      variant: 'metric',
      accessory: 'sparkline',
      rules: []
    };
  }
}

export class StatusChipCard extends StatusCardBase {
  constructor() {
    super('chip');
  }

  static getStubConfig() {
    return {
      type: 'custom:status-chip-card',
      entity: 'sensor.example',
      label: 'Status',
      icon: 'mdi:shape',
      unit: '',
      variant: 'chip',
      accessory: 'none',
      rules: []
    };
  }
}

if (!customElements.get('status-metric-card')) {
  customElements.define('status-metric-card', StatusMetricCard);
}

if (!customElements.get('status-chip-card')) {
  customElements.define('status-chip-card', StatusChipCard);
}

const customCards = (window.customCards ??= []);
customCards.push(
  {
    type: 'status-metric-card',
    name: 'Status Metric Card',
    description: 'Rule-based metric card with an editor and optional template fallback.'
  },
  {
    type: 'status-chip-card',
    name: 'Status Chip Card',
    description: 'Compact status chip for badges and source tags.'
  }
);
