import { ErrorBoundaryProps, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import { SolidButton } from "@common-ui/components/Button";
import { Card, CardContent } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { Input } from "@common-ui/components/Input";
import { Content, Screen } from "@common-ui/components/Screen";
import { MediumText } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { ErrorDetails } from "@components/ErrorDetails";
import TitleWithBackButton from "@components/TitleWithBackButton";
import { useStores } from "@models/helpers/useStores";
import { useValidations } from "@utils/useValidations";
import { ROUTES } from "app/_layout";
import Head from "expo-router/head";
import { observer } from "mobx-react-lite";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ChangeEmailScreen = observer(function ChangeEmailScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { authSessionStore } = useStores();

  const [email, setEmail] = useState("");

  const fieldsToValidate = useMemo(() => ({ email }), [email]);
  const [isValid] = useValidations(fieldsToValidate);

  // Clear any errors when the screen is loaded
  useEffect(() => {
    authSessionStore.clearDataFetching();
  }, [authSessionStore]);

  const submit = async () => {
    if (!isValid) {
      return;
    }

    await authSessionStore.changeEmail({ email });
  };

  const goBack = () => {
    router.push({ pathname: ROUTES.UserProfile });
  };

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <TitleWithBackButton title={t("navigation.changeemailScreen")} onPress={goBack} />
      <Content maxWidth={Spacing.tabletWidth} scrollable>
        <Card bottom={Spacing.large}>
          <CardContent>
            <RowOrCell vertical={Spacing.small}>
              <Cell flex={1}>
                <MediumText>{t("changeemailScreen.newEmailAddress")}</MediumText>
              </Cell>
              <Cell flex={5}>
                <Input
                  value={email}
                  keyboardType="email-address"
                  placeholder={t("changeemailScreen.enterEmail")}
                  onChangeText={setEmail}
                />
              </Cell>
            </RowOrCell>
            <If condition={authSessionStore.isError}>
              <ErrorMessage errorText={authSessionStore.errorMessage} />
            </If>
            <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
              <SolidButton
                isLoading={authSessionStore.isFetching}
                minWidth={Spacing.extraExtraHuge}
                selfAlign="center"
                title={t("changeemailScreen.button")}
                onPress={submit}
              />
            </Row>
          </CardContent>
        </Card>
      </Content>
    </Screen>
  );
});

export default ChangeEmailScreen;
