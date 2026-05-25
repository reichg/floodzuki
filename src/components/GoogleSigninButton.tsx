import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

import { Cell } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { MediumText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useGoogleAuth } from "@common-ui/contexts/GoogleAuthContext";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useStores } from "@models/helpers/useStores";
import { ROUTES } from "app/_layout";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, ViewStyle } from "react-native";

const GoogleSigninButton = observer(function GoogleSigninButton() {
  const { authSessionStore } = useStores();
  const { t } = useLocale();
  const router = useRouter();
  const googleAuth = useGoogleAuth();

  const authorizeUser = React.useCallback(
    async (idToken: string) => {
      await authSessionStore.processGoogleToken({ idToken });

      if (!authSessionStore.isError) {
        router.push({ pathname: ROUTES.UserAlerts });
      }
    },
    [authSessionStore, router]
  );

  useEffect(() => {
    if (!!googleAuth.idToken) {
      authorizeUser(googleAuth.idToken);
    }
  }, [authorizeUser, googleAuth.idToken]);

  const loadingText = "Loading...";
  const buttonText = googleAuth.isLoading ? loadingText : t("googlesigninButton.title");
  const isButtonDisabled = googleAuth.isDisabled || googleAuth.isLoading;

  return (
    <Cell>
      <If condition={googleAuth.isError}>
        <ErrorMessage errorText={t("googlesigninButton.error")} />
      </If>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={buttonText}
        disabled={isButtonDisabled}
        onPress={googleAuth.authorize}
        style={(state) => [
          $button,
          !isButtonDisabled && state.pressed && $buttonHovered,
          !isButtonDisabled && state.hovered && $buttonHovered,
          isButtonDisabled && $buttonDisabled,
        ]}>
        <Image
          source={require("@assets/images/btn_google.png")}
          style={{ width: 48, height: 48, marginRight: 10 }}
        />
        <If condition={googleAuth.isLoading}>
          <ActivityIndicator size="small" color={Colors.white} style={$activityIndicator} />
        </If>
        <MediumText color={Colors.white}>{buttonText}</MediumText>
      </Pressable>
    </Cell>
  );
});

const $button: ViewStyle = {
  alignItems: "center",
  backgroundColor: "#4285F4",
  borderColor: "#4285F4",
  borderRadius: Spacing.micro,
  borderWidth: 0,
  flexDirection: "row",
  height: Spacing.button,
  justifyContent: "center",
  paddingLeft: Spacing.zero,
  paddingRight: Spacing.medium,
  alignSelf: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.22,
  shadowRadius: 2.22,
  elevation: 3,
};

const $activityIndicator: ViewStyle = {
  marginRight: Spacing.small,
};

const $buttonHovered: ViewStyle = {
  opacity: 0.8,
};

const $buttonDisabled: ViewStyle = {
  opacity: 0.5,
};

export default GoogleSigninButton;
