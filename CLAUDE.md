# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Floodzuki is the mobile/web client for the **Floodzilla Gauge Monitoring System**, operated by the Snoqualmie Valley Preservation Alliance (SVPA). It monitors river gauges on the Snoqualmie River and provides flood predictions and alerts. The app runs on iOS, Android, and Web via Expo/React Native.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (requires dev-client build on device)
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Export web build
npx expo export

# Serve web build locally
npx serve dist --single

# EAS mobile build (preview profile for both platforms)
eas build --profile preview --platform all

# Publish OTA update
eas update --channel production

# Run tests
npm test

# Lint
npm run lint
npm run lint:fix

# Type check
npx tsc --noEmit
```

Automated checks: `npm test` (Jest 29 via `jest-expo` preset, `@testing-library/react-native` available), `npm run lint` (ESLint flat config with `eslint-config-expo` + prettier, `curly` enforced as error), `npx tsc --noEmit`. For UI changes, also verify manually in the browser or on device.

### Environment variables for local dev

Create a `.env` file or pass inline:

```bash
BUILD_ENV="local" SENTRY_AUTH_TOKEN="" GOOGLE_RECAPTCH_SITE_KEY="" GOOGLE_AUTH_EXPO_ID="" GOOGLE_AUTH_WEB_ID="" GOOGLE_AUTH_IOS_ID="" GOOGLE_AUTH_ANDROID_ID="" GOOGLE_MAPS_IOS_API_KEY="" GOOGLE_MAPS_ANDROID_API_KEY="" GOOGLE_MAPS_WEB_API_KEY="" npx expo start
```

Google Auth only works in the browser via secure tunnel:

```bash
EXPO_TUNNEL_SUBDOMAIN="floodzuki" npx expo start --tunnel --web
```

## Architecture

### Tech stack

- **Expo SDK 55** with **React Native 0.83** and new architecture enabled (`newArchEnabled: true`)
- **Expo Router** (file-based routing under `app/`)
- **MobX State Tree** for global state management
- **apisauce** for HTTP requests
- **NativeWind** (Tailwind CSS for React Native) + custom design system in `src/common-ui/`
- **MapLibre** for maps (platform-split: `@maplibre/maplibre-react-native` on mobile, `@vis.gl/react-maplibre` on web)
- **Highcharts** (web) and **Victory Native** (mobile) for charts — the chart components are split by platform
- **i18n-js** for localization with `dayjs` for date/time

### Directory structure

```
app/                    # Expo Router screens (file-based routing)
  _layout.tsx           # Root layout — providers, fonts, splash screen, ROUTES enum
  (root)/               # Main tab group
    _layout.tsx         # Tab bar (gage, forecast, user tabs)
    gage/               # Gauge list and detail screens
    forecast/           # Forecast screens
    user/               # Auth, profile, alerts, settings screens

src/
  models/               # MobX State Tree stores
    RootStore.ts        # Root store composing all sub-stores
    Gage.ts             # Gauge data store
    GageReading.ts      # Reading/chart data store
    Forecasts.ts        # Forecast data store
    Region.ts           # Region metadata store
    LocationInfo.ts     # Location metadata store
    AuthSession.ts      # Auth token/session store
    helpers/            # useStores hook, store persistence
  services/
    api.ts              # Singleton Api class (apisauce) — all backend calls
    apiProblem.ts       # API error normalization
    expoUpdates.ts      # OTA update logic
    pushNotifications.ts
  components/           # App-specific components (charts, maps, cards)
  common-ui/            # Design system (platform-agnostic)
    components/         # Button, Text, Card, Icon, Screen, Conditional, Common (Row/Cell/Spacer)
    constants/          # Colors, Spacing, Typography
    contexts/           # AssetsContext, DatePickerContext, GoogleAuthContext, LocaleContext
    utils/              # responsive helpers, color utilities
  config/
    config.base.ts      # All API endpoints, base URLs, timing constants
    config.dev.ts       # Dev overrides
    config.prod.ts      # Prod overrides
    config.ts           # Merges base + dev/prod based on __DEV__
  i18n/                 # Translation strings
  utils/                # sentry, misc helpers
```

### Path aliases (tsconfig.json)

| Alias           | Path               |
| --------------- | ------------------ |
| `@models/*`     | `src/models/*`     |
| `@services/*`   | `src/services/*`   |
| `@components/*` | `src/components/*` |
| `@common-ui/*`  | `src/common-ui/*`  |
| `@config/*`     | `src/config/*`     |
| `@i18n/*`       | `src/i18n/*`       |
| `@utils/*`      | `src/utils/*`      |

### State management pattern

The single `RootStore` (MST) is initialized once and provided via a `useStores()` hook (from `@models/helpers/useStores`). Each sub-store has a `fetchData()` action. `RootStore.fetchMainData()` orchestrates the initial data load sequence: region → location info → gages → forecasts.

The `authSessionStore` stores the JWT and manages login/logout; the API singleton (`@services/api`) handles auth headers by calling `api.setHeader()` / `api.removeHeader()`.

### API layer

`src/services/api.ts` exports a singleton `api` instance. The `Api` class has two base URLs — `Config.BASE_URL` (floodzilla.com) and `Config.READING_BASE_URL` (Azure reading service) — and switches between them per call. All responses go through `getGeneralApiProblem()` for normalized error handling.

### Platform-split components

Several components have native/web variants:

- `GageMap.tsx` (router) → `MapLibreMobileGageMap.tsx` / `MapLibreWebGageMap.tsx`
- `ForecastChart.tsx` / `ForecastChartNative.tsx`
- `GageDetailsChart.tsx` / `GageDetailsChartNative.tsx`

Check `src/common-ui/utils/responsive.ts` for the `isWeb` flag used to branch rendering.

### Routes

All routes are defined as the `ROUTES` enum in `app/_layout.tsx`. The three main tabs are **Gages** (`/gage`), **Forecast** (`/forecast`), and **User** (`/user`). Use the `ROUTES` enum rather than hardcoded strings when navigating.

### Localization

All user-visible strings go through the `useLocale()` hook (`t("key")`). Translation files live in `src/i18n/`. `LocaleContext.tsx` wraps the app at the root level.

### Maps

Maps use MapLibre with tile URLs from `Config.DEFAULT_MAP_TILE_BASE_URL`. The `MAP_TILE_URL_BASE` env var overrides the tile source at build time (exposed via `app.config.ts` extra). Maps are not supported in standalone dev builds — only Expo Go and browser.

### OTA Updates

The app uses `expo-updates` with channel `production`. OTA updates are published with `eas update --channel production`. All environment variables must be passed at update time since EAS secrets are not available locally.

### Timezone and time display

**The gauge's timezone is the only timezone that matters anywhere in the app.** The user's device timezone is irrelevant — it must never influence what's displayed, what's interpreted from user input, what's sent to the API, or what's compared against. Readings and forecasts represent physical events at a specific location on Earth (the Snoqualmie Valley), and dates and times the user picks or types are questions _about_ that location.

The mental model: if a user asks for the time of sunrise in Cairo on May 30, the answer is in Cairo's timezone regardless of where the asker is sitting. "May 30" means May 30 in Cairo, not May 30 in the asker's tz. Same here — "March 1 to March 7" means those calendar days in the gauge's tz, the chart's "today" means today in the gauge's tz, and a time like "8:00 AM" means 8 AM at the gauge.

This applies in three directions:

- **Display (out):** every formatted timestamp must be rendered in gauge tz. Use the utility functions in `src/utils/useTimeFormat.ts` (`formatDateTime`, `formatReadingTime`) — they already follow this pattern. Get the timezone via `rootStore.getTimezone()` (from `@models/helpers/useStores`), which returns the region timezone from the API (e.g. `"America/Los_Angeles"`) with a Pacific fallback. Use `dayjs(timestamp).tz(tz)` to convert a UTC or offset-aware string to the location timezone. Do **not** use `dayjs.tz(timestamp)` (the static form) — it does not convert UTC strings correctly; it displays the raw UTC value instead of converting it.
- **User input (in):** dates and times the user picks, types, or selects must be interpreted as gauge tz, not device tz. A user picking "May 15" on a native date picker is asking for May 15 _at the gauge_, even if their phone is in another timezone. URL params (`from=2026-05-01`), date pickers, range shortcuts, and "today" comparisons must all be evaluated in gauge tz. See [SingleDatePickerNative.tsx](src/common-ui/components/SingleDatePickerNative.tsx) for the pattern: extract the device-tz calendar components from the OS-emitted Date, then rebuild as gauge-tz midnight.
- **Construction:** when building a Dayjs from a date string in code (in components, stores, tests), construct it in gauge tz from the start: `localDayJs.tz("2026-05-01", "YYYY-MM-DD", timezone)`. A bare `dayjs("2026-05-01")` is midnight in the _system_ tz and will silently produce the wrong day when system tz != gauge tz.

**Testing:** the Jest suite runs with `TZ=UTC` so any code that silently relies on system tz matching gauge tz will fail in tests. When writing tz-sensitive tests, never construct dates with bare `dayjs(string)` or `new Date(string)` — always specify the tz explicitly.
