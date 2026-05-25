import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { customFontsToLoad } from "@common-ui/constants/typography";
import { useInitialRootStore } from "@models/helpers/useStores";

import { If } from "@common-ui/components/Conditional";
import { AssetsProvider, useAppAssets } from "@common-ui/contexts/AssetsContext";
import { DatePickerProvider } from "@common-ui/contexts/DatePickerContext";
import { GoogleAuthProvider } from "@common-ui/contexts/GoogleAuthContext";
import { LocaleProvider, useLocale } from "@common-ui/contexts/LocaleContext";
import { isWeb } from "@common-ui/utils/responsive";
import { initSentry } from "@utils/sentry";
import { GestureHandlerRootView } from "react-native-gesture-handler";

initSentry();

/**
 * Root layout for Expo router (entry file for the app)
 *
 */

// All routes available in the app
export enum ROUTES {
  Home = "/",
  Forecast = "/forecast",
  ForecastDetails = "/forecast/[...id]",
  Gages = "/gage",
  GageDetails = "/gage/[id]",
  UserAlerts = "/user/alerts",
  UserProfile = "/user/profile",
  UserLogin = "/user/login",
  UserPasswordForgot = "/user/passwordForgot",
  UserSetPassword = "/user/setpassword",
  UserResetPassword = "/user/resetpassword",
  UserCreatePassword = "/user/createpassword", // Not currently used
  UserVerifyPhoneNumber = "/user/verifyPhoneNumber",
  UserVerifyEmail = "/user/verifyemail",
  UserUnsubscribe = "/user/unsubscribe",
  UserChangeEmail = "/user/changeemail", // Not currently used
  UserNew = "/user/new",
  About = "/user",
  Privacy = "/user/privacy",
  Terms = "/user/terms",
}

export const routes = {
  [ROUTES.Gages]: {
    path: ROUTES.Gages,
    icon: "activity",
    tabName: "gage",
    title: "navigation.homeScreen",
  },
  [ROUTES.Forecast]: {
    path: ROUTES.Forecast,
    icon: "trending-up",
    tabName: "forecast",
    title: "navigation.forecastScreen",
  },
  [ROUTES.UserAlerts]: {
    path: ROUTES.About,
    icon: "bell",
    tabName: "user",
    title: "navigation.alertsScreen",
  },
} as const;

export type MainRoute = (typeof routes)[keyof typeof routes];

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [areFontsLoaded] = useFonts(customFontsToLoad);
  const { rehydrated } = useInitialRootStore();

  const delayForAssets = isWeb ? false : !areFontsLoaded;

  useEffect(() => {
    if (!delayForAssets && rehydrated) {
      SplashScreen.hideAsync();
    }
  }, [delayForAssets, rehydrated]);

  if (delayForAssets || !rehydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <BottomSheetModalProvider>
            <DatePickerProvider>
              <AssetsProvider>
                <GoogleAuthProvider>
                  <App />
                  <StatusBar style="dark" />
                </GoogleAuthProvider>
              </AssetsProvider>
            </DatePickerProvider>
          </BottomSheetModalProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  const { getAsset } = useAppAssets();
  const { t } = useLocale();
  const favicon = getAsset("favicon");

  return (
    <>
      <If condition={isWeb}>
        {/** This is used to ensure that favicon is displayed on web */}
        <Head>
          <link rel="icon" href={favicon?.uri} />
          {/* Sans-serif fallback while Google Fonts loads — prevents brief serif flash */}
          <style>{`body { font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif; }`}</style>
          {/* Load custom fonts */}
          <link
            type="text/css"
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700|Open+Sans:300,400,500,600,700;lang=en"
          />
          <title>
            {t("common.title")} - {t("homeScreen.title")}
          </title>
          <meta name="description" content={t("common.metaDescription")} />
          <meta property="expo:handoff" content="true" />
          <meta name="apple-itunes-app" content="app-id=6448645748" />
          <meta name="google-play-app" content="app-id=com.floodzilla.floodzuki" />
          <link rel="apple-touch-icon" href={favicon?.uri} />
          <script async src="https://www.googletagmanager.com/gtag/js?id=UA-302444-12"></script>
          <script src="//apis.google.com/js/client:platform.js?onload=start"></script>
          <script src="//www.google.com/recaptcha/api.js" async defer></script>
          <script>
            {`
            window.dataLayer = window.dataLayer || [];

            function gtag() {
              dataLayer.push(arguments)
            }

            gtag("js", new Date())

            gtag("config", "UA-302444-12")
          `}
          </script>
          <style>
            {`
            a {
              text-decoration: none;
              color: inherit;
            }
          `}
          </style>
        </Head>
      </If>
      <Slot />
    </>
  );
}
