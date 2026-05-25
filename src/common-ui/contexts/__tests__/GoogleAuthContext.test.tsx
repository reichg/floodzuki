import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, useGoogleAuth } from "../GoogleAuthContext";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        googleOAuthWebClientId: "web-client-id",
        googleOAuthAndroidClientId: "android-client-id",
        googleOAuthIOSClientId: "ios-client-id",
        googleOAuthExpoClientId: "expo-client-id",
      },
    },
  },
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "test-redirect-uri"),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: jest.fn(),
}));

jest.mock("@common-ui/utils/responsive", () => ({
  isAndroid: false,
  isWeb: true,
}));

jest.mock("@utils/sentry", () => ({
  logError: jest.fn(),
}));

const mockUseIdTokenAuthRequest = Google.useIdTokenAuthRequest as jest.Mock;

const TestConsumer = () => {
  const googleAuth = useGoogleAuth();

  return <Text testID="idToken">{googleAuth.idToken}</Text>;
};

describe("GoogleAuthProvider", () => {
  beforeEach(() => {
    mockUseIdTokenAuthRequest.mockReset();
    mockUseIdTokenAuthRequest.mockReturnValue([
      {},
      {
        type: "success",
        params: {
          id_token: "web-id-token",
        },
      },
      jest.fn(),
    ]);
  });

  it("does not pass a client secret to the web auth request and exposes the returned id token", async () => {
    const { getByTestId } = render(
      <GoogleAuthProvider>
        <TestConsumer />
      </GoogleAuthProvider>
    );

    expect(mockUseIdTokenAuthRequest).toHaveBeenCalled();

    const firstRequestConfig = mockUseIdTokenAuthRequest.mock.calls[0][0];

    expect(firstRequestConfig).toMatchObject({
      scopes: ["profile", "email"],
      selectAccount: true,
      webClientId: "web-client-id",
      androidClientId: "android-client-id",
      iosClientId: "ios-client-id",
      clientId: "expo-client-id",
    });
    expect(firstRequestConfig).not.toHaveProperty("clientSecret");

    await waitFor(() => {
      expect(getByTestId("idToken").props.children).toBe("web-id-token");
    });
  });
});
