const isLocalBuild = process.env.BUILD_ENV === "local";

process.env.EXPO_TUNNEL_SUBDOMAIN = "floodzuki";
const ngrokUrl = `${process.env.EXPO_TUNNEL_SUBDOMAIN}.ngrok.io`;

/** @type {import('expo/config').ExpoConfig} */
export default {
  name: "Floodzilla",
  slug: "floodzuki",
  scheme: "floodzuki",
  jsEngine: "hermes",
  icon: "./assets/app-icon/ios-universal.png",
  newArchEnabled: true,
  userInterfaceStyle: "light",

  web: {
    bundler: "metro",
    favicon: "./assets/favicon-180.png",
    title: "Floodzilla Gauge Network - SVPA",
    description:
      "A network of river gauges on the Snoqualmie River deployed and managed by The Snoqualmie Valley Preservation Alliance",
    splash: {
      image: "./assets/splash-screen/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
  },
  ios: {
    bundleIdentifier: "com.floodzilla.floodzuki",
    supportsTablet: true,
    usesAppleSignIn: true,
    associatedDomains: [
      "applinks:floodzilla.com",
      "activitycontinuation:floodzilla.com",
      "webcredentials:floodzilla.com",
      "applinks:fzbeta.azurewebsites.net",
      "activitycontinuation:fzbeta.azurewebsites.net",
      "webcredentials:fzbeta.azurewebsites.net",
      `applinks:${ngrokUrl}`,
      `activitycontinuation:${ngrokUrl}`,
      `webcredentials:${ngrokUrl}`,
    ],
    icon: "./assets/app-icon/ios-universal.png",
    splash: {
      image: "./assets/app-icon/android-adaptive-foreground.png",
      tabletImage: "./assets/app-icon/android-adaptive-foreground.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    config: {
      usesNonExemptEncryption: false,
    },
    userInterfaceStyle: "light",
  },
  android: {
    package: "com.floodzilla.floodzuki",
    googleServicesFile: isLocalBuild ? "./google-services.json" : process.env.GOOGLE_SERVICES_JSON,
    intentFilters: [
      {
        action: "VIEW",
        data: {
          scheme: "https",
          host: "floodzuki.ngrok.io",
        },
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: {
          scheme: "https",
          host: "fzbeta.azurewebsites.net",
        },
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: {
          scheme: "https",
          host: "floodzilla.com",
        },
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    icon: "./assets/app-icon/android-adaptive-foreground.png",
    adaptiveIcon: {
      foregroundImage: "./assets/app-icon/android-adaptive-foreground.png",
      backgroundImage: "./assets/app-icon/android-adaptive-background.png",
    },
    splash: {
      image: "./assets/app-icon/android-adaptive-foreground.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    userInterfaceStyle: "light",
  },
  updates: {
    url: "https://u.expo.dev/0f52b777-109a-423d-a18b-1ccfb5dea8e0",
    requestHeaders: {
      "expo-channel-name": "production",
    },
  },
  plugins: [
    "@react-native-community/datetimepicker",
    "@maplibre/maplibre-react-native",
    "expo-localization",
    "expo-router",
    "expo-font",
    "expo-image",
    "expo-web-browser",
    "expo-system-ui",
    "expo-apple-authentication",
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "floodzilla-testing",
        organization: "snoqualmie-valley-preservation",
      },
    ],
    "expo-asset",
    [
      "expo-notifications",
      {
        icon: "./assets/favicon-96.png",
        color: "#ffffff",
      },
    ],
    [
      "expo-updates",
      {
        username: "floodzilla-svpa",
      },
    ],
    ["./plugins/withForceLightModeThemeAndroid.js", {}],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: "https://floodzilla.com/",
    },
    eas: {
      projectId: "0f52b777-109a-423d-a18b-1ccfb5dea8e0",
    },
    mapTileUrlBase: process.env.MAP_TILE_URL_BASE,
    recaptchaKey: process.env.GOOGLE_RECAPTCH_SITE_KEY,
    googleMapsWebApiKey: process.env.GOOGLE_MAPS_WEB_API_KEY,
    googleOAuthWebClientId: process.env.GOOGLE_AUTH_WEB_ID,
    googleOAuthAndroidClientId: process.env.GOOGLE_AUTH_ANDROID_ID,
    googleOAuthIOSClientId: process.env.GOOGLE_AUTH_IOS_ID,
    googleOAuthExpoClientId: process.env.GOOGLE_AUTH_EXPO_ID,
  },
  owner: "floodzilla-svpa",
};
