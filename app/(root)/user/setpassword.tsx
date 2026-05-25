import { useGoBack } from "@utils/useGoBack";
import { ErrorBoundaryProps } from "expo-router";
import React, { useState } from "react";

import { Content, Screen } from "@common-ui/components/Screen";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import ChangePasswordForm, { PasswordSubmitActionProps } from "@components/ChangePasswordForm";
import { ErrorDetails } from "@components/ErrorDetails";
import TitleWithBackButton from "@components/TitleWithBackButton";
import { useStores } from "@models/helpers/useStores";
import { ROUTES } from "app/_layout";
import Head from "expo-router/head";
import { observer } from "mobx-react-lite";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const SetPasswordScreen = observer(function SetPasswordScreen() {
  const { t } = useLocale();

  const { authSessionStore } = useStores();

  const [successMessage, setSuccessMessage] = useState<string>("");

  const onSubmit = async (params: PasswordSubmitActionProps) => {
    setSuccessMessage("");

    await authSessionStore.setPassword(params);

    if (authSessionStore.isError) {
      return;
    }

    setSuccessMessage(t("setpasswordScreen.successMessage"));
  };

  const goBack = useGoBack(ROUTES.UserProfile);

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <TitleWithBackButton title={t("navigation.passwordSetScreen")} onPress={goBack} />
      <Content maxWidth={Spacing.tabletWidth} scrollable>
        <ChangePasswordForm
          showOldPasswordForm
          submitAction={onSubmit}
          submitActionText={t("setpasswordScreen.submit")}
          successMessage={successMessage}
          errorMessage={authSessionStore.errorMessage}
        />
      </Content>
    </Screen>
  );
});

export default SetPasswordScreen;
