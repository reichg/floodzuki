import { useGoBack } from "@utils/useGoBack";
import { ErrorBoundaryProps, useRouter } from "expo-router";
import React from "react";

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

const CreatePasswordScreen = observer(function CreatePasswordScreen() {
  const router = useRouter();

  const { authSessionStore } = useStores();
  const { t } = useLocale();

  const onSubmit = async (params: PasswordSubmitActionProps) => {
    await authSessionStore.createPassword({
      newPassword: params.newPassword,
    });

    if (authSessionStore.isError) {
      return;
    }

    router.push({ pathname: ROUTES.UserChangeEmail });
  };

  const goBack = useGoBack(ROUTES.UserProfile);

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <TitleWithBackButton title={t("navigation.passwordCreateScreen")} onPress={goBack} />
      <Content maxWidth={Spacing.tabletWidth} scrollable>
        <ChangePasswordForm
          description={t("createpasswordScreen.title")}
          submitAction={onSubmit}
          submitActionText={t("createpasswordScreen.submit")}
          errorMessage={authSessionStore.errorMessage}
        />
      </Content>
    </Screen>
  );
});

export default CreatePasswordScreen;
