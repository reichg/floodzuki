import { Dayjs } from "dayjs";
import localDayJs from "@services/localDayJs";

// Explicit ISO-8601 formats. We can't rely on dayjs default format strings
// because react-native-ui-datepicker globally extends dayjs with the
// `localizedFormat` plugin, which changes default `.format()` output.
export const UTC_ISO_FORMAT = "YYYY-MM-DDTHH:mm:ss[Z]";
export const LOCAL_ISO_FORMAT = "YYYY-MM-DDTHH:mm:ss";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
// Full ISO (with Z or ±hh:mm offset) — used to gate the permissive fallback.
const FULL_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parse a URL-supplied date string and return it as a Dayjs in the gauge
 * timezone. Supports three formats:
 *   - "YYYY-MM-DD"                  → midnight in `tz`
 *   - "YYYY-MM-DDTHH:mm:ss"         → wall clock in `tz`
 *   - "YYYY-MM-DDTHH:mm:ss[Z|±hh:mm]" → instant, converted to `tz`
 */
export const parseUrlDate = (str: string, tz: string): Dayjs => {
  if (DATE_ONLY_RE.test(str)) {
    return localDayJs.tz(str, "YYYY-MM-DD", tz);
  }
  if (LOCAL_ISO_RE.test(str)) {
    return localDayJs.tz(str, "YYYY-MM-DDTHH:mm:ss", tz);
  }
  if (FULL_ISO_RE.test(str)) {
    return localDayJs(str).tz(tz);
  }
  // Anything else is malformed — return an invalid Dayjs so callers can
  // detect it via .isValid(). dayjs's default parser is too permissive
  // (e.g. "7" parses as a valid date).
  return localDayJs(null);
};

/** Format a Dayjs as YYYY-MM-DD in the gauge timezone (URL-safe, day-precision). */
export const formatUrlDate = (d: Dayjs, tz: string): string => d.tz(tz).format("YYYY-MM-DD");
