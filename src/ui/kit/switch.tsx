import type { JSX } from "preact";

import { KIT_FOCUS_CSS, KIT_MIN_TARGET_PX } from "./shared";

export type SwitchProps = {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
};

export const SWITCH_CSS = `
${KIT_FOCUS_CSS}
.rdw-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: ${KIT_MIN_TARGET_PX}px;
}
.rdw-switch {
  position: relative;
  box-sizing: border-box;
  width: 36px;
  height: ${KIT_MIN_TARGET_PX}px;
  min-width: 36px;
  min-height: ${KIT_MIN_TARGET_PX}px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.rdw-switch__track {
  display: block;
  width: 30px;
  height: 17px;
  margin: 0 auto;
  border-radius: 9px;
  background: var(--rdw-border);
  position: relative;
  transition: background 0.15s ease;
}
.rdw-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--rdw-surface);
  transition: left 0.15s ease;
}
.rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: var(--rdw-accent);
}
.rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  left: 15px;
}
.rdw-switch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-switch__label {
  font-size: 12.5px;
  color: var(--rdw-text);
}
`;

export function Switch(props: SwitchProps): JSX.Element {
  const className = ["rdw-switch-row", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{SWITCH_CSS}</style>
      <div className={className}>
        <button
          type="button"
          id={props.id}
          className="rdw-switch rdw-kit-focusable"
          role="switch"
          aria-checked={props.checked}
          aria-label={props.label}
          disabled={props.disabled}
          onClick={() => {
            props.onChange(!props.checked);
          }}
        >
          <span className="rdw-switch__track">
            <span className="rdw-switch__thumb" />
          </span>
        </button>
        {props.label !== undefined ? (
          <span className="rdw-switch__label">{props.label}</span>
        ) : null}
      </div>
    </>
  );
}
