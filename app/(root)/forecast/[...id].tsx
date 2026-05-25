import { ErrorBoundaryProps, Stack, useGlobalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";

import { Cell, Row } from "@common-ui/components/Common";
import { Content, Screen } from "@common-ui/components/Screen";
import { LargeTitle } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { ExtendedGageSummaryCard, GageSummaryCard } from "@components/GageSummaryCard";

import { IconButton, LinkButton } from "@common-ui/components/Button";
import { Ternary } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { Timing } from "@common-ui/constants/timing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useResponsive } from "@common-ui/utils/responsive";
import ForecastFooter from "@components/ForecastFooter";
import { useStores } from "@models/helpers/useStores";
import { useGoBack } from "@utils/useGoBack";
import { useTimeout } from "@utils/useTimeout";
import { ROUTES } from "app/_layout";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ForecastDetailsScreen = observer(function ForecastDetailsScreen() {
  const { id } = useGlobalSearchParams();
  const { t } = useLocale();
  const store = useStores();

  const { isMobile } = useResponsive();

  // Pathname id can either be a simple gage like "USGS-38"
  // or a nested gage like "USGS-SF17/USGS-38-0001" which will be
  // represented as an array of strings ["USGS-SF17", "USGS-38-0001"]
  const gageId = Array.isArray(id) ? id.join("/") : id;

  const [hidden, setHidden] = React.useState(isMobile ? true : false);

  const fetchData = React.useCallback(async () => {
    store.locationInfoStore.fetchData();
    store.forecastsStore.fetchData();
  }, [store]);

  // Fetch data on mount
  useEffect(() => {
    if (store.isFetched) {
      fetchData();
    }
  }, [fetchData, store.isFetched]);

  useTimeout(() => {
    setHidden(false);
  }, Timing.zero);

  const goBack = useGoBack(ROUTES.Forecast);

  const forecastGage = hidden ? undefined : store.getForecastGage(gageId);

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("forecastScreen.title")}
        </title>
      </Head>
      <Stack.Screen
        options={{
          title: `${t("common.title")} - ${t("forecastScreen.title")}: ${forecastGage?.title}`,
        }}
      />
      <Row left={Spacing.medium} bottom={Spacing.extraSmall} top={Spacing.medium}>
        <Ternary condition={isMobile}>
          <IconButton left={-Spacing.medium} icon="chevron-left" onPress={goBack} />
          <LinkButton
            left={-Spacing.medium}
            title={t("navigation.back")}
            leftIcon="chevron-left"
            textColor={Colors.blue}
            onPress={goBack}
          />
        </Ternary>
        <LargeTitle>{forecastGage?.title}</LargeTitle>
      </Row>
      <Content scrollable onRefresh={fetchData}>
        {forecastGage ? (
          <>
            <ForecastChart gages={[forecastGage]} />
            <Cell top={Spacing.mediumXL}>
              <GageSummaryCard firstItem noDetails gage={forecastGage} />
            </Cell>
            <Cell top={Spacing.mediumXL}>
              <ExtendedGageSummaryCard gage={forecastGage} />
            </Cell>
            <ForecastFooter />
          </>
        ) : null}
      </Content>
    </Screen>
  );
});

export default ForecastDetailsScreen;
