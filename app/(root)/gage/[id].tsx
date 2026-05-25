import { ErrorBoundaryProps, Link, Stack, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

import { observer } from "mobx-react-lite";

import { IconButton, LinkButton } from "@common-ui/components/Button";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Label } from "@common-ui/components/Label";
import { Content, Screen } from "@common-ui/components/Screen";
import { LabelText, LargeTitle, MediumTitle, RegularText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { MobileScreen, WideScreen, isMobile, useResponsive } from "@common-ui/utils/responsive";

import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";

import CalloutReadingCard from "@components/CalloutReadingCard";
import { ErrorDetails } from "@components/ErrorDetails";
import { GageDetailsChart } from "@components/GageDetailsChart";
import GageImageCard from "@components/GageImageCard";
import GageInfoCard from "@components/GageInfoCard";
import StatusLevelsCard from "@components/StatusLevelsCard";

import { Card } from "@common-ui/components/Card";
import EmptyComponent from "@common-ui/components/EmptyComponent";
import Icon from "@common-ui/components/Icon";
import { Timing } from "@common-ui/constants/timing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import GageMap from "@components/GageMap";
import { useGoBack } from "@utils/useGoBack";
import { useTimeout } from "@utils/useTimeout";
import { ROUTES } from "app/_layout";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

type GageLinkProps = {
  gage: Gage;
  simple?: boolean;
};

const UpstreamGageLink = observer(function UpstreamGageLink({ gage, simple }: GageLinkProps) {
  const { getUpstreamGageLocation } = useStores();
  const { t } = useLocale();
  const { isMobile } = useResponsive();

  const upstreamGageLocation = getUpstreamGageLocation(gage?.locationId);

  if (!upstreamGageLocation) {
    return <Cell />;
  }

  const title = simple ? t("gageScreen.upstreamGage") : t("gageScreen.goToUpstreamGage");
  const iconSize = isMobile && simple ? 16 : 24;
  const Text = isMobile && simple ? LabelText : RegularText;

  return (
    <Card flex={isMobile ? 1 : 0}>
      <Link
        href={{ pathname: ROUTES.GageDetails, params: { id: upstreamGageLocation?.id } }}
        asChild>
        <TouchableOpacity>
          <Row>
            <Icon name="arrow-left" size={iconSize} color={Colors.green} />
            <Cell flex left={Spacing.extraSmall}>
              <Text>{title}</Text>
              <If condition={!simple}>
                <MediumTitle>{upstreamGageLocation?.locationName}</MediumTitle>
              </If>
            </Cell>
          </Row>
        </TouchableOpacity>
      </Link>
    </Card>
  );
});

const DownstreamGageLink = observer(function DownstreamGageLink({ gage, simple }: GageLinkProps) {
  const { getDownstreamGageLocation } = useStores();
  const { t } = useLocale();
  const { isMobile } = useResponsive();

  const downstreamGageLocation = getDownstreamGageLocation(gage?.locationId);

  if (!downstreamGageLocation) {
    return <Cell />;
  }

  const title = simple ? t("gageScreen.downstreamGage") : t("gageScreen.goToDownstreamGage");
  const iconSize = isMobile && simple ? 16 : 24;
  const Text = isMobile && simple ? LabelText : RegularText;

  return (
    <Card flex={isMobile ? 1 : 0}>
      <Link
        href={{ pathname: ROUTES.GageDetails, params: { id: downstreamGageLocation?.id } }}
        asChild>
        <TouchableOpacity>
          <Row>
            <Cell flex right={Spacing.extraSmall}>
              <Text>{title}</Text>
              <If condition={!simple}>
                <MediumTitle>{downstreamGageLocation?.locationName}</MediumTitle>
              </If>
            </Cell>
            <Icon name="arrow-right" size={iconSize} color={Colors.green} />
          </Row>
        </TouchableOpacity>
      </Link>
    </Card>
  );
});

const GageDetailsScreen = observer(function GageDetailsScreen({ gage }: { gage: Gage }) {
  const { gagesStore, regionStore } = useStores();
  const { t } = useLocale();

  const { id } = useLocalSearchParams();

  const gageId = Array.isArray(id) ? id.join("/") : id;

  const { isMobile } = useResponsive();

  const goBack = useGoBack(ROUTES.Home);
  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <Stack.Screen
        options={{
          title: `${gage?.locationInfo?.locationName} | ${t("common.title")} - ${t(
            "homeScreen.title"
          )}`,
        }}
      />
      {/* Header */}
      <Row
        horizontal={Spacing.medium}
        bottom={Spacing.extraSmall}
        top={Spacing.medium}
        justify="flex-start">
        <Row flex>
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
          <Cell flex>
            <LargeTitle>{gage?.locationInfo?.locationName ?? ""}</LargeTitle>
          </Cell>
        </Row>
        {/* Top Navigation */}
        <WideScreen>
          <Row flex align="space-between" gap={Spacing.small} right={Spacing.extraLarge}>
            <UpstreamGageLink gage={gage} simple />
            <DownstreamGageLink gage={gage} simple />
          </Row>
        </WideScreen>
        <Cell>
          <Label text={gageId ?? ""} />
        </Cell>
      </Row>
      <MobileScreen>
        <Row
          align="space-between"
          gap={Spacing.small}
          bottom={Spacing.small}
          innerHorizontal={Spacing.medium}>
          <UpstreamGageLink gage={gage} simple />
          <DownstreamGageLink gage={gage} simple />
        </Row>
      </MobileScreen>
      {/* Content */}
      <Content scrollable onRefresh={() => gagesStore.fetchData}>
        <GageDetailsChart gage={gage} />
        <Row>
          <If condition={!isMobile}>
            <Card
              flex={0.5}
              height={"98%"}
              top={Spacing.small}
              right={Spacing.small}
              innerHorizontal={Spacing.tiny}
              innerVertical={Spacing.tiny}>
              <GageMap
                region={regionStore.region}
                gages={gage ? [gage] : []}
                onGagePress={() => {}}
              />
            </Card>
          </If>
          <Cell flex gap={Spacing.small}>
            <RowOrCell
              align="flex-start"
              justify="flex-start"
              top={Spacing.small}
              gap={Spacing.small}>
              <CalloutReadingCard gage={gage} />
              <GageImageCard gage={gage} />
            </RowOrCell>
            <RowOrCell align="flex-start" justify="flex-start" gap={Spacing.small}>
              <GageInfoCard gage={gage} />
              <StatusLevelsCard gage={gage} />
            </RowOrCell>
            <If condition={isMobile}>
              <Card
                flex={1}
                height={300}
                minHeight={300}
                top={Spacing.small}
                innerHorizontal={Spacing.tiny}
                innerVertical={Spacing.tiny}>
                <GageMap
                  region={regionStore.region}
                  gages={gage ? [gage] : []}
                  onGagePress={() => {}}
                />
              </Card>
            </If>
          </Cell>
        </Row>
        <Row flex align="space-between" top={Spacing.medium} gap={Spacing.small}>
          <UpstreamGageLink gage={gage} />
          <DownstreamGageLink gage={gage} />
        </Row>
      </Content>
    </Screen>
  );
});

const GageScreen = observer(function GageScreen() {
  const { id } = useLocalSearchParams();
  const { gagesStore } = useStores();
  const { t } = useLocale();

  const gageId = Array.isArray(id) ? id.join("/") : id;

  const [hidden, setHidden] = useState(isMobile ? true : false);

  useTimeout(() => {
    setHidden(false);
  }, Timing.zero);

  const gage = hidden ? undefined : gagesStore.getGageByLocationId(gageId);

  if (!gage?.locationId) {
    return (
      <>
        <Head>
          <title>
            {t("common.title")} - {t("homeScreen.title")}
          </title>
        </Head>
        <EmptyComponent />
      </>
    );
  }

  return <GageDetailsScreen gage={gage} />;
});

export default GageScreen;
