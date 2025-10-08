/**
 *
 */

type LogLevel = "debug" | "error" | "info" | "warn";

const GILL_LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  error: 3,
  info: 1,
  warn: 2,
};

declare global {
  /**
   * Whether or not to enable debug mode. When enabled, default log level of `info`
   */
  var __GILL_DEBUG__: boolean | undefined;
  /**
   * Set the a desired level of logs to be output in the application
   *
   * - Default: `info`
   * - Options: `debug` | `info` | `warn` | `error`
   */
  var __GILL_DEBUG_LEVEL__: LogLevel | undefined;
}

const getMinLogLevel = (): LogLevel =>
  (process.env.GILL_DEBUG_LEVEL as LogLevel) ||
  global.__GILL_DEBUG_LEVEL__ ||
  (typeof window !== "undefined" && (window as any).__GILL_DEBUG_LEVEL__) ||
  "info";

/**
 * Check if the `gill` debug logger is enabled or not
 */
export const isDebugEnabled = (): boolean =>
  Boolean(
    process.env.GILL_DEBUG_LEVEL ||
      global.__GILL_DEBUG_LEVEL__ ||
      process.env.GILL_DEBUG === "true" ||
      process.env.GILL_DEBUG === "1" ||
      global.__GILL_DEBUG__ === true ||
      (typeof window !== "undefined" && (window as any).__GILL_DEBUG__ === true),
  );

/**
 * Log debug messages based on the desired application's logging level.
 *
 * @param message - the message contents to be logged
 * @param level - default: `info` (see: {@link GILL_LOG_LEVELS})
 * @param prefix - default: `[GILL]`
 *
 * To enable gill's debug logger, set any of the following to `true`:
 * - `process.env.GILL_DEBUG`
 * - `global.__GILL_DEBUG__`
 * - `window.__GILL_DEBUG__`
 *
 * To set a desired level of logs to be output in the application, set the value of one of the following:
 * - `process.env.GILL_DEBUG_LEVEL`
 * - `global.__GILL_DEBUG_LEVEL__`
 * - `window.__GILL_DEBUG_LEVEL__`
 */
export function debug(message: unknown, level: LogLevel = "info", prefix: string = "[GILL]") {
  if (!isDebugEnabled()) return;

  if (GILL_LOG_LEVELS[level] < GILL_LOG_LEVELS[getMinLogLevel()]) return;

  const formattedMessage = typeof message === "string" ? message : JSON.stringify(message, null, 2);

  switch (level) {
    case "debug":
      console.log(prefix, formattedMessage);
      break;
    case "info":
      console.info(prefix, formattedMessage);
      break;
    case "warn":
      console.warn(prefix, formattedMessage);
      break;
    case "error":
      console.error(prefix, formattedMessage);
      break;
  }
}
