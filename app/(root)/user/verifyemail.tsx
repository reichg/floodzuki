import { ErrorBoundaryProps, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

import { SolidButton } from "@common-ui/components/Button";
import { Card, CardContent } from "@common-ui/components/Card";
import { Cell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { Content, Screen } from "@common-ui/components/Screen";
import SuccessMessage from "@common-ui/components/SuccessMessage";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { ErrorDetails } from "@components/ErrorDetails";
import TitleWithBackButton from "@components/TitleWithBackButton";
import { useStores } from "@models/helpers/useStores";
import { normalizeSearchParams } from "@utils/navigation";
import { ROUTES } from "app/_layout";
import Head from "expo-router/head";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const VerifyEmailScreen = observer(function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { authSessionStore } = useStores();

  const { userId, token } = useLocalSearchParams();

  const verifyEmail = React.useCallback(async () => {
    if (!token) {
      return;
    }

    await authSessionStore.verifyEmail({ token: normalizeSearchParams(token) });
  }, [authSessionStore, token]);

  // Clear any errors when the screen is loaded
  useEffect(() => {
    authSessionStore.clearDataFetching();

    if (!userId || !token) {
      router.push({ pathname: ROUTES.Home });
      return;
    }

    verifyEmail();
  }, [authSessionStore, router, token, userId, verifyEmail]);

  const goBack = () => {
    router.push({ pathname: ROUTES.UserAlerts });
  };

  const goHome = () => {
    router.push({ pathname: ROUTES.Home });
  };

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <TitleWithBackButton title={t("navigation.verifyemailScreen")} onPress={goBack} />
      <Content maxWidth={Spacing.tabletWidth} scrollable>
        <Card bottom={Spacing.large}>
          <CardContent>
            <If condition={!authSessionStore.isFetching}>
              <Ternary condition={authSessionStore.isError}>
                <Cell>
                  <ErrorMessage
                    errorText={authSessionStore.errorMessage ?? t("verifyemailScreen.errorMessage")}
                  />
                  <SolidButton
                    selfAlign="center"
                    title={t("verifyemailScreen.tryAgain")}
                    onPress={verifyEmail}
                  />
                </Cell>
                <Cell>
                  <SuccessMessage successText={t("verifyemailScreen.successMessage")} />
                  <SolidButton
                    selfAlign="center"
                    title={t("verifyemailScreen.continue")}
                    onPress={goHome}
                  />
                </Cell>
              </Ternary>
            </If>
          </CardContent>
        </Card>
      </Content>
    </Screen>
  );
});

export default VerifyEmailScreen;
