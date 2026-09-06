/**
 * One JSON line per event, which is what CloudWatch Logs Insights parses
 * without configuration. Tests pass `silentLogger`.
 */
export type Logger = {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};

const describeError = (value: unknown): Record<string, unknown> =>
  value instanceof Error
    ? { name: value.name, message: value.message, stack: value.stack }
    : { value };

/** Normalises an `{ error }` field so an Error survives JSON.stringify. */
const normalise = (meta?: Record<string, unknown>) =>
  meta && "error" in meta
    ? { ...meta, error: describeError(meta.error) }
    : meta;

const line = (level: string, message: string, meta?: Record<string, unknown>) =>
  JSON.stringify({ level, message, ...normalise(meta) });

export const consoleLogger: Logger = {
  info: (message, meta) => console.log(line("info", message, meta)),
  warn: (message, meta) => console.warn(line("warn", message, meta)),
  error: (message, meta) => console.error(line("error", message, meta)),
};

export const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};
