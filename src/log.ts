import { DEBUG_KEY } from "./config/constants";

function isDebugEnabled(): boolean {
  try {
    return GM_getValue(DEBUG_KEY, undefined) === true;
  } catch {
    return false;
  }
}

export const log = {
  debug(message: string, ...details: unknown[]): void {
    if (!isDebugEnabled()) {
      return;
    }
    console.debug(`[ruledesk-web] ${message}`, ...details);
  },
  info(message: string, ...details: unknown[]): void {
    if (!isDebugEnabled()) {
      return;
    }
    console.info(`[ruledesk-web] ${message}`, ...details);
  },
  warn(message: string, ...details: unknown[]): void {
    console.warn(`[ruledesk-web] ${message}`, ...details);
  },
  error(message: string, ...details: unknown[]): void {
    console.error(`[ruledesk-web] ${message}`, ...details);
  },
};
