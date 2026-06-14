/*
 * Status Card for Home Assistant
 * Generated file. Edit src/ and run npm run build.
 */
const StatusCardCore = (() => {
const UNAVAILABLE_STATES = new Set(['unknown', 'unavailable', 'offline', 'none', 'null']);

const DEFAULTS = {
  metric: {
    accentColor: 'var(--primary-color)',
    background:
      'linear-gradient(135deg, rgba(19, 48, 118, 0.98), rgba(11, 23, 55, 0.98))',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    iconBg: 'rgba(8, 18, 42, 0.34)',
    iconColor: '#ffffff',
    valueColor: '#ffffff',
    secondaryColor: 'rgba(226, 232, 240, 0.80)'
  },
  chip: {
    accentColor: 'var(--primary-color)',
    background: 'rgba(8, 18, 42, 0.70)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    iconBg: 'rgba(255, 255, 255, 0.08)',
    iconColor: '#ffffff',
    valueColor: '#ffffff',
    secondaryColor: 'rgba(226, 232, 240, 0.80)'
  }
};

function isUnavailable(entity) {
  const state = String(entity?.state ?? '').trim().toLowerCase();
  return !state || UNAVAILABLE_STATES.has(state);
}

function getFriendlyName(entity, entityId) {
  return (
    entity?.attributes?.friendly_name ||
    entity?.attributes?.name ||
    entityId?.split('.')?.[1]?.replace(/_/g, ' ') ||
    'Status'
  );
}

function getSourceValue(entity, source = 'state') {
  if (!entity) {
    return undefined;
  }

  if (!source || source === 'state') {
    return entity.state;
  }

  if (source.startsWith('attribute.')) {
    const path = source.slice('attribute.'.length);
    return getPath(entity.attributes ?? {}, path);
  }

  return getPath(entity, source);
}

function getPath(source, path) {
  if (!source || !path) {
    return undefined;
  }

  return String(path)
    .split('.')
    .reduce((value, key) => {
      if (value == null) {
        return undefined;
      }
      return value[key];
    }, source);
}

function toNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  return NaN;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  if (value == null || value === '') {
    return fallback;
  }

  return Boolean(value);
}

function getCardType(variant) {
  return variant === 'chip'
    ? 'custom:status-chip-card'
    : 'custom:status-metric-card';
}

function normalizeConfig(input = {}) {
  const inputType = String(input.type ?? '').replace(/^custom:/, '');
  const variant = input.variant || (inputType === 'status-chip-card' ? 'chip' : 'metric');
  return {
    ...input,
    type: getCardType(variant),
    variant,
    label: input.label ?? input.name ?? '',
    entity: input.entity ?? '',
    icon: input.icon ?? '',
    unit: input.unit ?? '',
    digits: Number.isFinite(Number(input.digits)) ? Number(input.digits) : 1,
    value_source: input.value_source ?? 'state',
    accessory: input.accessory ?? (variant === 'metric' ? 'sparkline' : 'none'),
    show_icon: toBoolean(input.show_icon, true),
    show_value: toBoolean(input.show_value, true),
    accent_color: input.accent_color ?? '',
    background_color: input.background_color ?? '',
    border_color: input.border_color ?? '',
    rules: Array.isArray(input.rules) ? input.rules : [],
    advanced: {
      template: input?.advanced?.template ?? input?.template ?? ''
    },
    tap_action: input.tap_action ?? { action: 'more-info' },
    hold_action: input.hold_action ?? { action: 'none' }
  };
}

function matchRule(rule, entity, sourceValue) {
  const type = String(rule?.type ?? '').toLowerCase();

  if (type === 'unavailable' || type === 'availability') {
    return isUnavailable(entity);
  }

  if (type === 'state') {
    if (Array.isArray(rule.values)) {
      return rule.values.map(String).includes(String(sourceValue));
    }
    return String(sourceValue) === String(rule.value ?? '');
  }

  if (type === 'numeric') {
    const numeric = toNumber(sourceValue);
    if (!Number.isFinite(numeric)) {
      return false;
    }

    const operator = String(rule.operator ?? 'gte').toLowerCase();
    const compareValue = toNumber(rule.value);
    const min = toNumber(rule.min);
    const max = toNumber(rule.max);

    switch (operator) {
      case '>':
      case 'gt':
        return numeric > compareValue;
      case '>=':
      case 'gte':
        return numeric >= compareValue;
      case '<':
      case 'lt':
        return numeric < compareValue;
      case '<=':
      case 'lte':
        return numeric <= compareValue;
      case '!=':
      case 'ne':
        return numeric !== compareValue;
      case '=':
      case '==':
      case 'eq':
        return numeric === compareValue;
      case 'between':
        return numeric >= min && numeric <= max;
      default:
        return false;
    }
  }

  if (type === 'range') {
    const numeric = toNumber(sourceValue);
    if (!Number.isFinite(numeric)) {
      return false;
    }
    const min = toNumber(rule.min);
    const max = toNumber(rule.max);
    return numeric >= min && numeric <= max;
  }

  return false;
}

function evaluateRules(config, entity, hass) {
  const sourceValue = getSourceValue(entity, config.value_source);
  const presentation = {
    label: config.label || getFriendlyName(entity, config.entity),
    valueText: config.text ?? '',
    secondaryText: config.secondary_text ?? '',
    accentColor: config.accent_color || DEFAULTS[config.variant]?.accentColor || 'var(--primary-color)',
    backgroundColor: config.background_color || DEFAULTS[config.variant]?.background || '',
    borderColor: config.border_color || DEFAULTS[config.variant]?.borderColor || '',
    icon: config.icon || '',
    iconColor: DEFAULTS[config.variant]?.iconColor || '#ffffff',
    iconBackground: DEFAULTS[config.variant]?.iconBg || 'rgba(255, 255, 255, 0.08)',
    valueColor: DEFAULTS[config.variant]?.valueColor || '#ffffff',
    secondaryColor: DEFAULTS[config.variant]?.secondaryColor || 'rgba(255, 255, 255, 0.75)',
    hideValue: !config.show_value ? true : false,
    variant: config.variant,
    accessory: config.accessory
  };

  if (!config.label && entity) {
    presentation.label = getFriendlyName(entity, config.entity);
  }

  if (entity && !isUnavailable(entity)) {
    const numeric = toNumber(sourceValue);
    if (Number.isFinite(numeric)) {
      const digits = Number.isFinite(Number(config.digits)) ? Number(config.digits) : 1;
      presentation.valueText = `${numeric.toFixed(digits)}${config.unit ? ` ${config.unit}` : ''}`;
    } else if (sourceValue != null && sourceValue !== '') {
      presentation.valueText = config.unit ? `${sourceValue} ${config.unit}` : String(sourceValue);
    }
  }

  if (config.advanced?.template) {
    const advancedResult = runAdvancedTemplate(config.advanced.template, {
      entity,
      hass,
      config,
      sourceValue
    });
    Object.assign(presentation, advancedResult);
  }

  for (const rule of config.rules ?? []) {
    if (!matchRule(rule, entity, sourceValue)) {
      continue;
    }

    applyRuleOverrides(presentation, rule);
    break;
  }

  if (isUnavailable(entity)) {
    const unavailableRule = (config.rules ?? []).find((rule) => {
      const type = String(rule?.type ?? '').toLowerCase();
      return type === 'unavailable' || type === 'availability';
    });
    if (!unavailableRule) {
      presentation.accentColor = presentation.accentColor || 'rgba(148, 163, 184, 0.8)';
      presentation.valueText = entity?.state ?? 'unavailable';
    }
  }

  if (!presentation.icon) {
    presentation.icon = config.variant === 'chip' ? 'mdi:shape' : 'mdi:chart-timeline-variant';
  }

  if (presentation.accentColor && !config.border_color) {
    presentation.borderColor = presentation.accentColor;
  }

  presentation.iconBackground = presentation.accentColor || presentation.iconBackground;

  return presentation;
}

function resolvePresentation(config, entity, hass) {
  return evaluateRules(normalizeConfig(config), entity, hass);
}

function runAdvancedTemplate(templateSource, context) {
  const helpers = {
    isUnavailable,
    getFriendlyName,
    getSourceValue,
    getPath,
    toNumber
  };

  try {
    const fn = new Function('entity', 'states', 'hass', 'config', 'helpers', `
      ${String(templateSource)}
    `);
    const result = fn(
      context.entity,
      context.hass?.states ?? {},
      context.hass,
      context.config,
      helpers
    );

    if (typeof result === 'string') {
      return { valueText: result };
    }

    if (result && typeof result === 'object') {
      return result;
    }
  } catch (error) {
    return {
      errorText: error instanceof Error ? error.message : String(error)
    };
  }

  return {};
}

function applyRuleOverrides(target, rule) {
  const mapping = [
    ['accentColor', ['accent_color', 'accent', 'color']],
    ['backgroundColor', ['background_color', 'background']],
    ['borderColor', ['border_color', 'border']],
    ['icon', ['icon']],
    ['label', ['label', 'text']],
    ['valueText', ['value_text']],
    ['secondaryText', ['secondary_text']],
    ['iconColor', ['icon_color']],
    ['iconBackground', ['icon_background']],
    ['valueColor', ['value_color']],
    ['secondaryColor', ['secondary_color']],
    ['hideValue', ['hide_value']],
    ['accessory', ['accessory']]
  ];

  for (const [targetKey, sourceKeys] of mapping) {
    for (const sourceKey of sourceKeys) {
      if (rule[sourceKey] !== undefined && rule[sourceKey] !== null && rule[sourceKey] !== '') {
        target[targetKey] = rule[sourceKey];
        break;
      }
    }
  }
}

function getCardDefaults(variant) {
  return DEFAULTS[variant] ?? DEFAULTS.metric;
}

return { isUnavailable, getFriendlyName, getSourceValue, getPath, toNumber, toBoolean, getCardType, normalizeConfig, matchRule, evaluateRules, resolvePresentation, runAdvancedTemplate, getCardDefaults };
})();

(() => {
const { normalizeConfig } = StatusCardCore;

const RULE_TYPES = [
  { value: 'state', label: 'State match' },
  { value: 'numeric', label: 'Numeric compare' },
  { value: 'range', label: 'Range / band' },
  { value: 'unavailable', label: 'Unavailable' }
];

const ACTION_TYPES = [
  { value: 'more-info', label: 'More info' },
  { value: 'none', label: 'None' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'call-service', label: 'Call service' },
  { value: 'navigate', label: 'Navigate' },
  { value: 'url', label: 'Open URL' }
];

const PATHS = {
  label: 'label',
  entity: 'entity',
  icon: 'icon',
  unit: 'unit',
  variant: 'variant',
  accessory: 'accessory',
  digits: 'digits',
  accent_color: 'accent_color',
  background_color: 'background_color',
  border_color: 'border_color',
  show_value: 'show_value',
  show_icon: 'show_icon',
  value_source: 'value_source',
  template: 'advanced.template'
};

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function setPath(object, path, value) {
  const clone = deepClone(object) ?? {};
  const segments = String(path).split('.');
  let cursor = clone;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!cursor[segment] || typeof cursor[segment] !== 'object') {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }

  cursor[segments[segments.length - 1]] = value;
  return clone;
}

function eventValue(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    if (target.type === 'checkbox') {
      return target.checked;
    }
    if (target.dataset?.number === 'true') {
      const parsed = Number(target.value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return target.value;
  }
  return undefined;
}

function createOptionList(selected, options) {
  return options
    .map(
      (option) =>
        `<option value="${option.value}" ${option.value === selected ? 'selected' : ''}>${option.label}</option>`
    )
    .join('');
}

function ruleTemplate(rule, index) {
  const type = rule.type ?? 'state';
  return `
    <div class="rule-row" data-rule-index="${index}">
      <div class="rule-top">
        <label>
          <span>Type</span>
          <select data-path="rules.${index}.type">${createOptionList(type, RULE_TYPES)}</select>
        </label>
        <label>
          <span>Accent</span>
          <input data-path="rules.${index}.accent_color" type="text" value="${escapeHtml(rule.accent_color ?? '')}" placeholder="#4ade80">
        </label>
        <label>
          <span>Icon</span>
          <input data-path="rules.${index}.icon" type="text" value="${escapeHtml(rule.icon ?? '')}" placeholder="mdi:check">
        </label>
      </div>
      <div class="rule-grid">
        ${renderRuleFields(rule, index)}
      </div>
      <div class="rule-actions">
        <button type="button" data-action="remove-rule" data-rule-index="${index}">Remove rule</button>
      </div>
    </div>
  `;
}

function renderRuleFields(rule, index) {
  const type = rule.type ?? 'state';

  if (type === 'numeric') {
    return `
      <label>
        <span>Operator</span>
        <select data-path="rules.${index}.operator">
          ${createOptionList(rule.operator ?? 'gte', [
            { value: 'gt', label: '>' },
            { value: 'gte', label: '>=' },
            { value: 'lt', label: '<' },
            { value: 'lte', label: '<=' },
            { value: 'eq', label: '=' },
            { value: 'ne', label: '!=' },
            { value: 'between', label: 'Between' }
          ])}
        </select>
      </label>
      <label>
        <span>Value</span>
        <input data-number="true" data-path="rules.${index}.value" type="number" value="${escapeHtml(rule.value ?? '')}" placeholder="30">
      </label>
      <label>
        <span>Min</span>
        <input data-number="true" data-path="rules.${index}.min" type="number" value="${escapeHtml(rule.min ?? '')}" placeholder="10">
      </label>
      <label>
        <span>Max</span>
        <input data-number="true" data-path="rules.${index}.max" type="number" value="${escapeHtml(rule.max ?? '')}" placeholder="40">
      </label>
      <label class="span-2">
        <span>Label override</span>
        <input data-path="rules.${index}.label" type="text" value="${escapeHtml(rule.label ?? '')}" placeholder="Hot">
      </label>
    `;
  }

  if (type === 'range') {
    return `
      <label>
        <span>Min</span>
        <input data-number="true" data-path="rules.${index}.min" type="number" value="${escapeHtml(rule.min ?? '')}" placeholder="10">
      </label>
      <label>
        <span>Max</span>
        <input data-number="true" data-path="rules.${index}.max" type="number" value="${escapeHtml(rule.max ?? '')}" placeholder="40">
      </label>
      <label class="span-2">
        <span>Label override</span>
        <input data-path="rules.${index}.label" type="text" value="${escapeHtml(rule.label ?? '')}" placeholder="Comfort band">
      </label>
    `;
  }

  if (type === 'unavailable') {
    return `
      <label class="span-2">
        <span>Label override</span>
        <input data-path="rules.${index}.label" type="text" value="${escapeHtml(rule.label ?? '')}" placeholder="Unavailable">
      </label>
      <label class="span-2">
        <span>Value text</span>
        <input data-path="rules.${index}.value_text" type="text" value="${escapeHtml(rule.value_text ?? '')}" placeholder="unavailable">
      </label>
    `;
  }

  return `
    <label>
      <span>Match value</span>
      <input data-path="rules.${index}.value" type="text" value="${escapeHtml(rule.value ?? '')}" placeholder="on">
    </label>
    <label class="span-2">
      <span>Label override</span>
      <input data-path="rules.${index}.label" type="text" value="${escapeHtml(rule.label ?? '')}" placeholder="Active">
    </label>
  `;
}

function actionTemplate(action, key) {
  const normalized = action ?? { action: 'more-info' };
  return `
    <div class="action-block" data-action-block="${key}">
      <div class="action-top">
        <label>
          <span>Type</span>
          <select data-path="${key}.action">${createOptionList(normalized.action ?? 'more-info', ACTION_TYPES)}</select>
        </label>
        <label>
          <span>Service</span>
          <input data-path="${key}.service" type="text" value="${escapeHtml(normalized.service ?? '')}" placeholder="light.turn_on">
        </label>
      </div>
      <div class="action-grid">
        <label>
          <span>Navigation / URL</span>
          <input data-path="${key}.navigation_path" type="text" value="${escapeHtml(normalized.navigation_path ?? normalized.url ?? '')}" placeholder="/lovelace/energy">
        </label>
        <label>
          <span>Service data</span>
          <textarea data-path="${key}.service_data" rows="3" placeholder='{"entity_id":"switch.kitchen"}'>${escapeHtml(
            typeof normalized.service_data === 'string'
              ? normalized.service_data
              : normalized.service_data
              ? JSON.stringify(normalized.service_data, null, 2)
              : ''
          )}</textarea>
        </label>
      </div>
    </div>
  `;
}

class StatusCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = normalizeConfig();
    this._boundOnChange = this._onInput.bind(this);
    this._boundOnClick = this._onInput.bind(this);
    this._boundOnEntityChanged = this._onEntityChanged.bind(this);
  }

  set hass(value) {
    this._hass = value;
    this._updateEntityPicker();
  }

  set config(value) {
    this.setConfig(value);
  }

  setConfig(value) {
    this._config = normalizeConfig(value);
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener('change', this._boundOnChange);
    this.shadowRoot?.removeEventListener('click', this._boundOnClick);
    this.shadowRoot
      ?.querySelector('ha-entity-picker')
      ?.removeEventListener('value-changed', this._boundOnEntityChanged);
  }

  _emit(nextConfig) {
    this._config = normalizeConfig(nextConfig);
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }

  _onInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.tagName === 'HA-ENTITY-PICKER') {
      return;
    }

    const action = target.dataset.action;
    if (action === 'add-rule') {
      const rules = [...(this._config.rules ?? []), { type: 'state', value: '' }];
      this._emit({ ...this._config, rules });
      this._render();
      return;
    }

    if (action === 'remove-rule') {
      const index = Number(target.dataset.ruleIndex);
      const rules = [...(this._config.rules ?? [])];
      rules.splice(index, 1);
      this._emit({ ...this._config, rules });
      this._render();
      return;
    }

    const path = target.dataset.path;
    if (!path) {
      return;
    }

    const value = eventValue(event);
    let nextConfig = setPath(this._config, path, value);

    if (path === 'rules') {
      nextConfig.rules = Array.isArray(value) ? value : [];
    }

    if (path === 'advanced.template' && typeof value === 'string') {
      nextConfig = setPath(nextConfig, 'advanced.template', value);
    }

    if (path === 'tap_action.service_data' || path === 'hold_action.service_data') {
      try {
        const parsed = value ? JSON.parse(String(value)) : {};
        nextConfig = setPath(nextConfig, path, parsed);
      } catch (error) {
        nextConfig = setPath(nextConfig, `${path}_raw`, String(value ?? ''));
      }
    }

    this._emit(nextConfig);

    if (target instanceof HTMLSelectElement) {
      this._render();
    }
  }

  _onEntityChanged(event) {
    event.stopPropagation?.();
    this._emit({
      ...this._config,
      entity: event.detail?.value ?? ''
    });
  }

  _updateEntityPicker() {
    const picker = this.shadowRoot?.querySelector('ha-entity-picker');
    if (!picker) {
      return;
    }

    picker.hass = this._hass;
    picker.value = this._config.entity ?? '';
    picker.label = 'Entity';
    picker.placeholder = 'Search entities';
    picker.allowCustomEntity = true;
    picker.showEntityId = true;
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    const config = this._config;
    const rules = config.rules ?? [];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--primary-text-color, #e5e7eb);
          font-family: var(--paper-font-body1_-_font-family, Roboto, Arial, sans-serif);
        }
        .panel {
          display: grid;
          gap: 18px;
          padding: 16px;
        }
        h3 {
          margin: 0 0 8px;
          font-size: 16px;
          line-height: 1.2;
        }
        .section {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.28);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }
        .grid,
        .rule-top,
        .rule-grid,
        .action-top,
        .action-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .rule-grid, .action-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .span-2 {
          grid-column: 1 / -1;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: var(--secondary-text-color, #cbd5e1);
        }
        input,
        select,
        textarea,
        button {
          font: inherit;
          color: inherit;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(3, 7, 18, 0.55);
          padding: 10px 12px;
          box-sizing: border-box;
        }
        textarea {
          min-height: 110px;
          resize: vertical;
        }
        ha-entity-picker {
          display: block;
          width: 100%;
          align-self: end;
        }
        .toolbar,
        .rule-actions {
          display: flex;
          justify-content: flex-end;
        }
        button {
          cursor: pointer;
        }
        .hint {
          color: var(--secondary-text-color, #94a3b8);
          font-size: 12px;
          line-height: 1.4;
        }
      </style>
      <div class="panel">
        <div class="section">
          <h3>Basic</h3>
          <div class="grid">
            <label>
              <span>Card type</span>
              <select data-path="variant">
                ${createOptionList(config.variant, [
                  { value: 'metric', label: 'Metric' },
                  { value: 'chip', label: 'Chip' }
                ])}
              </select>
            </label>
            <ha-entity-picker data-path="entity"></ha-entity-picker>
            <label>
              <span>Label</span>
              <input data-path="label" type="text" value="${escapeHtml(config.label ?? '')}" placeholder="อุณหภูมิ">
            </label>
            <label>
              <span>Icon</span>
              <input data-path="icon" type="text" value="${escapeHtml(config.icon ?? '')}" placeholder="mdi:thermometer">
            </label>
            <label>
              <span>Unit</span>
              <input data-path="unit" type="text" value="${escapeHtml(config.unit ?? '')}" placeholder="°C">
            </label>
            <label>
              <span>Digits</span>
              <input data-number="true" data-path="digits" type="number" value="${escapeHtml(config.digits ?? 1)}" min="0" step="1">
            </label>
            <label>
              <span>Value source</span>
              <input data-path="value_source" type="text" value="${escapeHtml(config.value_source ?? 'state')}" placeholder="state / attribute.value">
            </label>
            <label>
              <span>Accessory</span>
              <select data-path="accessory">
                ${createOptionList(config.accessory ?? 'sparkline', [
                  { value: 'sparkline', label: 'Sparkline' },
                  { value: 'badge', label: 'Badge' },
                  { value: 'none', label: 'None' }
                ])}
              </select>
            </label>
          </div>
          <div class="hint">Start here for the common cases. Use rules for state / threshold / range changes, and use the advanced template only when the simple rules are not enough.</div>
        </div>

        <div class="section">
          <h3>Appearance</h3>
          <div class="grid">
            <label>
              <span>Accent color</span>
              <input data-path="accent_color" type="text" value="${escapeHtml(config.accent_color ?? '')}" placeholder="#4ade80">
            </label>
            <label>
              <span>Background color</span>
              <input data-path="background_color" type="text" value="${escapeHtml(config.background_color ?? '')}" placeholder="rgba(8, 18, 42, 0.70)">
            </label>
            <label>
              <span>Border color</span>
              <input data-path="border_color" type="text" value="${escapeHtml(config.border_color ?? '')}" placeholder="rgba(255,255,255,0.14)">
            </label>
            <label>
              <span>Show icon</span>
              <select data-path="show_icon">
                ${createOptionList(String(Boolean(config.show_icon ?? true)), [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' }
                ])}
              </select>
            </label>
            <label>
              <span>Show value</span>
              <select data-path="show_value">
                ${createOptionList(String(Boolean(config.show_value ?? true)), [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' }
                ])}
              </select>
            </label>
          </div>
        </div>

        <div class="section">
          <h3>Rules</h3>
          <div class="toolbar">
            <button type="button" data-action="add-rule">Add rule</button>
          </div>
          <div style="display:grid; gap:12px;">
            ${rules.length ? rules.map((rule, index) => ruleTemplate(rule, index)).join('') : '<div class="hint">No rules yet. Add one when you want the card color or label to react to the state.</div>'}
          </div>
        </div>

        <div class="section">
          <h3>Actions</h3>
          ${actionTemplate(config.tap_action, 'tap_action')}
          ${actionTemplate(config.hold_action, 'hold_action')}
        </div>

        <div class="section">
          <h3>Advanced</h3>
          <label class="span-2">
            <span>Template / JS escape hatch</span>
            <textarea data-path="advanced.template" spellcheck="false" placeholder="return { accentColor: '#f59e0b' };">${escapeHtml(
              config.advanced?.template ?? ''
            )}</textarea>
          </label>
          <div class="hint">The template can return an object like <code>{ accentColor, label, icon, valueText }</code> or a string for the value text. Keep it for the few cases that rules cannot express cleanly.</div>
        </div>
      </div>
    `;

    this.shadowRoot.removeEventListener('change', this._boundOnChange);
    this.shadowRoot.removeEventListener('click', this._boundOnClick);
    this.shadowRoot.addEventListener('change', this._boundOnChange);
    this.shadowRoot.addEventListener('click', this._boundOnClick);

    const entityPicker = this.shadowRoot.querySelector('ha-entity-picker');
    entityPicker?.removeEventListener('value-changed', this._boundOnEntityChanged);
    entityPicker?.addEventListener('value-changed', this._boundOnEntityChanged);
    this._updateEntityPicker();
  }

  static getStubConfig() {
    return normalizeConfig({
      type: 'status-metric-card',
      entity: 'sensor.example',
      label: 'Status',
      icon: 'mdi:chart-timeline-variant',
      unit: '',
      rules: []
    });
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (!customElements.get('status-card-editor')) {
  customElements.define('status-card-editor', StatusCardEditor);
}

})();

(() => {
const { getCardDefaults, normalizeConfig, resolvePresentation } = StatusCardCore;


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

class StatusMetricCard extends StatusCardBase {
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

class StatusChipCard extends StatusCardBase {
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

})();
