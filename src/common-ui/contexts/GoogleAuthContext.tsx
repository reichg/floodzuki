import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

import { isAndroid, isWeb } from "@common-ui/utils/responsive";
import { logError } from "@utils/sentry";

WebBrowser.maybeCompleteAuthSession();

const googleAuthExtra = Constants.expoConfig?.extra;

const baseRequestConfig: Partial<Google.GoogleAuthRequestConfig> = {
  scopes: ["profile", "email"],
  selectAccount: true,
  webClientId: googleAuthExtra?.googleOAuthWebClientId,
  androidClientId: googleAuthExtra?.googleOAuthAndroidClientId,
  iosClientId: googleAuthExtra?.googleOAuthIOSClientId,
  clientId: googleAuthExtra?.googleOAuthExpoClientId,
};

type GoogleAuthContextType = {
  isDisabled: boolean;
  isLoading: boolean;
  isError: boolean;
  idToken: string;
  authorize: () => Promise<void>;
};

const initialState = {
  isDisabled: true,
  isLoading: false,
  isError: false,
  idToken: "",
  authorize: async () => {},
};

const GoogleAuthContext = createContext<GoogleAuthContextType>(initialState);

export const useGoogleAuth = () => useContext(GoogleAuthContext);

const GoogleAuthProviderImpl = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [idToken, setIdToken] = useState("");

  const requestConfig = isAndroid
    ? {
        ...baseRequestConfig,
        redirectUri: makeRedirectUri({
          scheme: "com.floodzilla.floodzuki",
          path: "user/login",
          isTripleSlashed: true,
        }),
      }
    : baseRequestConfig;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(requestConfig);

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params?.id_token || response.authentication?.idToken || "";

      setIdToken(idToken);
    } else if (response?.type === "error") {
      logError(response, "GoogleSigninButton.responseType");
      setIsError(true);
    }
  }, [response]);

  const authorize = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      await promptAsync();
    } catch (error) {
      logError(error, "GoogleSigninButton.authorizeUser");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync]);

  const values = useMemo(
    () => ({
      isDisabled: !request,
      isLoading,
      isError,
      idToken,
      authorize,
    }),
    [request, isLoading, isError, idToken, authorize]
  );

  return <GoogleAuthContext.Provider value={values}>{children}</GoogleAuthContext.Provider>;
};

export const GoogleAuthProvider = ({ children }) => {
  // webClientId is required on web — if missing (e.g. local dev without env vars),
  // skip the auth setup and render children with isDisabled: true
  const webClientId = Constants.expoConfig?.extra?.googleOAuthWebClientId;

  if (isWeb && !webClientId) {
    return <GoogleAuthContext.Provider value={initialState}>{children}</GoogleAuthContext.Provider>;
  }

  return <GoogleAuthProviderImpl>{children}</GoogleAuthProviderImpl>;
};
