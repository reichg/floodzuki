import * as Application from "expo-application";
import { ErrorBoundaryProps, Redirect, Stack, useRouter } from "expo-router";
import React from "react";

import { OutlinedButton, SimpleLinkButton } from "@common-ui/components/Button";
import { Card, CardListLinkItem } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { Content, Screen } from "@common-ui/components/Screen";
import { LabelText, LargeTitle, RegularText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { ErrorDetails } from "@components/ErrorDetails";
import Config from "@config/config";
import { openLinkInBrowser } from "@utils/navigation";
import { ROUTES } from "app/_layout";

import { Ternary } from "@common-ui/components/Conditional";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isWeb } from "@common-ui/utils/responsive";
import LocaleChange from "@components/LocaleChange";
import { useStores } from "@models/helpers/useStores";
import Head from "expo-router/head";
import { observer } from "mobx-react-lite";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const AboutScreen = observer(function AboutScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { authSessionStore } = useStores();

  if (isWeb) {
    return <Redirect href={ROUTES.UserAlerts} />;
  }

  const openSvpaWebsite = () => {
    openLinkInBrowser(Config.SVPA_URL);
  };

  const openPrivacyPolicy = () => {
    router.push({ pathname: ROUTES.Privacy });
  };

  const openTermsOfService = () => {
    router.push({ pathname: ROUTES.Terms });
  };

  const openLogin = () => {
    router.push({ pathname: ROUTES.UserLogin });
  };

  const openNewAccount = () => {
    router.push({ pathname: ROUTES.UserNew });
  };

  const openAlerts = () => {
    router.push({ pathname: ROUTES.UserAlerts });
  };

  const openProfile = () => {
    router.push({ pathname: ROUTES.UserProfile });
  };

  const logout = () => {
    authSessionStore.logOut();
  };

  const makeAPhoneCall = () => {
    openLinkInBrowser(`tel:${Config.SVPA_PHONE}`);
  };

  const sendAnEmail = () => {
    openLinkInBrowser(`mailto:${Config.SVPA_EMAIL}`);
  };

  const openSVPASupportPage = () => {
    openLinkInBrowser(Config.DONATION_URL);
  };

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
      {/* Header */}
      <Cell horizontal={Spacing.medium} bottom={Spacing.extraSmall} top={Spacing.medium}>
        <Row align="space-between">
          <LargeTitle>{t("navigation.aboutScreen")}</LargeTitle>
          <LocaleChange />
        </Row>
      </Cell>
      {/* Content */}
      <Content scrollable>
        <Ternary condition={authSessionStore.isLoggedIn}>
          <>
            <LabelText>{t("aboutScreen.manageNotitifications")}</LabelText>
            <Card top={Spacing.small} innerVertical={Spacing.zero}>
              <CardListLinkItem text={t("navigation.alertsScreen")} onPress={openAlerts} />
              <CardListLinkItem text={t("navigation.profileScreen")} onPress={openProfile} />
              <CardListLinkItem text={t("navigation.logout")} onPress={logout} />
            </Card>
          </>
          <>
            <LabelText>{t("aboutScreen.logIn")}</LabelText>
            <Card top={Spacing.small} innerVertical={Spacing.zero}>
              <CardListLinkItem text={t("navigation.alertsScreen")} onPress={openAlerts} />
              <CardListLinkItem text={t("navigation.loginScreen")} onPress={openLogin} />
              <CardListLinkItem text={t("navigation.newAccountScreen")} onPress={openNewAccount} />
            </Card>
          </>
        </Ternary>
        <Cell top={Spacing.large} align="center" justify="center">
          <OutlinedButton
            selfAlign="center"
            onPress={openSVPASupportPage}
            type="primary"
            title={`${t("donation.title")} ❤️`}
          />
        </Cell>
        {/*  */}
        <Cell top={Spacing.large} bottom={Spacing.small}>
          <LabelText>{t("aboutScreen.details")}</LabelText>
        </Cell>
        <Card bottom={Spacing.larger} innerVertical={Spacing.zero}>
          <CardListLinkItem text={t("navigation.aboutScreen")} onPress={openSvpaWebsite} />
          <CardListLinkItem
            text={t("navigation.privacyPolicyScreen")}
            onPress={openPrivacyPolicy}
          />
          <CardListLinkItem
            text={t("navigation.termsOfServiceScreen")}
            onPress={openTermsOfService}
          />
          <CardListLinkItem
            text={`${t("common.tel")} ${Config.SVPA_PHONE}`}
            onPress={makeAPhoneCall}
          />
          <CardListLinkItem
            text={`${t("common.email")} ${Config.SVPA_EMAIL}`}
            onPress={sendAnEmail}
            noBorder
          />
        </Card>
        <Cell top={Spacing.large}>
          <RegularText color={Colors.lightDark} align="justify">
            {t("footer.description1")}
            <SimpleLinkButton text={t("footer.svpaTitle")} onPress={openSvpaWebsite} />
            {t("footer.description2")}
          </RegularText>
        </Cell>
        <Cell top={Spacing.large}>
          <RegularText color={Colors.lightDark} align="justify">
            {t("footer.addressLine1")}: 4621 Tolt Avenue, Carnation, WA 98014{"\n"}
            {t("footer.addressLine2")}: P.O. Box 1148, Carnation, WA 98014{"\n\n"}
            {t("footer.copyright")}
          </RegularText>
        </Cell>
        <Cell top={Spacing.large} align="center">
          <LabelText>
            {t("aboutScreen.appVersion")}: {Application?.nativeApplicationVersion}
          </LabelText>
        </Cell>
      </Content>
    </Screen>
  );
});

export default AboutScreen;
