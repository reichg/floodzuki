import * as Sentry from "@sentry/react-native";

type SentryExtra = Record<string, string | number | boolean | null | object>;

type LoggedError = Error | string | object;

export const initSentry = () => {
  Sentry.init({
    dsn: "https://7580ac526eb64f2f811ba952bb9409f1@o4505126543360000.ingest.sentry.io/4505132726681600",
    debug: false,
  });
};

export const logError = (error: LoggedError, errorInfo: string | SentryExtra | null = null) => {
  const extra = typeof errorInfo === "string" ? { context: errorInfo } : errorInfo;

  Sentry.captureException(error, extra ? { extra } : undefined);
};
