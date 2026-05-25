import { ErrorBoundaryProps, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import { OutlinedButton, SimpleLinkButton, SolidButton } from "@common-ui/components/Button";
import { Card, CardContent } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { Content, Screen } from "@common-ui/components/Screen";
import SuccessMessage from "@common-ui/components/SuccessMessage";
import { MediumText, RegularText } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { ErrorDetails } from "@components/ErrorDetails";
import TitleWithBackButton from "@components/TitleWithBackButton";
import { useStores } from "@models/helpers/useStores";
import { normalizeSearchParams, openLinkInBrowser } from "@utils/navigation";
import { ROUTES } from "app/_layout";
import Head from "expo-router/head";
import { observer } from "mobx-react-lite";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const UnsubscribeScreen = observer(function UnsubscribeScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { authSessionStore } = useStores();

  const { userId, email } = useLocalSearchParams();

  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  const unsubscribe = async () => {
    await authSessionStore.unsubscribeFromNotifications(normalizeSearchParams(userId));

    if (!authSessionStore.isError) {
      setIsUnsubscribed(true);
    }
  };

  // Clear any errors when the screen is loaded
  useEffect(() => {
    authSessionStore.clearDataFetching();

    if (!userId || !email) {
      router.replace({ pathname: ROUTES.Home });
    }
  }, [authSessionStore, email, router, userId]);

  const goBack = () => {
    router.push({ pathname: ROUTES.UserAlerts });
  };

  const goHome = () => {
    router.push({ pathname: ROUTES.Home });
  };

  const contactUs = () => {
    openLinkInBrowser("mailto:floodzilla.support@svpa.us");
  };

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <TitleWithBackButton title={t("navigation.unsubscribeScreen")} onPress={goBack} />
      <Content maxWidth={Spacing.tabletWidth} scrollable>
        <Card bottom={Spacing.large}>
          <CardContent>
            <If condition={!authSessionStore.isFetching}>
              <Ternary condition={authSessionStore.isError}>
                <Cell>
                  <ErrorMessage
                    errorText={authSessionStore.errorMessage ?? t("unsubscribeScreen.errorMessage")}
                  />
                  <RegularText>
                    {t("unsubscribeScreen.please")}{" "}
                    <SimpleLinkButton text={t("unsubscribeScreen.contactUs")} onPress={contactUs} />{" "}
                    {t("unsubscribeScreen.soWeCanRemove")}.
                  </RegularText>
                  <SolidButton
                    selfAlign="center"
                    title={t("unsubscribeScreen.tryAgain")}
                    onPress={unsubscribe}
                  />
                </Cell>
                <Ternary condition={isUnsubscribed}>
                  <Cell>
                    <SuccessMessage successText={t("unsubscribeScreen.successMessage")} />
                    <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                      <OutlinedButton
                        minWidth={Spacing.extraExtraHuge}
                        selfAlign="center"
                        title={t("unsubscribeScreen.manageAlerts")}
                        onPress={goBack}
                      />
                      <SolidButton
                        minWidth={Spacing.extraExtraHuge}
                        selfAlign="center"
                        title={t("unsubscribeScreen.continue")}
                        onPress={goHome}
                      />
                    </Row>
                  </Cell>
                  <Cell>
                    <RegularText align="center">
                      {t("unsubscribeScreen.description")} <MediumText>{email}</MediumText>.
                    </RegularText>
                    <SolidButton
                      top={Spacing.medium}
                      selfAlign="center"
                      title={t("unsubscribeScreen.unsubscribeAll")}
                      onPress={unsubscribe}
                    />
                  </Cell>
                </Ternary>
              </Ternary>
            </If>
          </CardContent>
        </Card>
      </Content>
    </Screen>
  );
});

export default UnsubscribeScreen;
