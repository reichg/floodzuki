import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { ActivityIndicator } from "react-native";

import { Card, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { LabelText, MediumText, RegularText, SmallTitle } from "@common-ui/components/Text";

import { If } from "@common-ui/components/Conditional";
import { LargeLabel } from "@common-ui/components/Label";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import TrendIcon, { TREND_ICON_TYPES } from "@components/TrendIcon";
import { TxKeyPath } from "@i18n/i18n";
import { Gage, STATUSES } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import localDayJs from "@services/localDayJs";
import { formatReadingTime } from "@utils/useTimeFormat";
import { isNullish, useUtils } from "@utils/utils";

const CalloutReading = observer(function CalloutReadingCard({ gage }: { gage: Gage }) {
  const { gagesStore, getTimezone } = useStores();
  const tz = getTimezone();
  const { t } = useLocale();
  const { from, to } = useLocalSearchParams();

  const { formatFlow, formatHeight, formatTrend } = useUtils();

  const isNow = !!from && !!to ? to === localDayJs().tz(tz).format("YYYY-MM-DD") : true;

  const status = isNow ? gage?.status : gage?.peakStatus;
  const reading = status?.lastReading;
  const label = isNow ? t("calloutReading.lastReading") : t("calloutReading.peak");

  const roadStatus = gage?.getCalculatedRoadStatus(gage?.waterLevel);
  const floodLevel = status?.floodLevel;

  const timeAgo =
    isNow && reading?.timestamp
      ? localDayJs.tz(reading.timestamp, "YYYY-MM-DDTHH:mm:ss", tz).fromNow()
      : null;

  const hasTrendInfo =
    !!status?.levelTrend && !!status?.waterTrend && !isNullish(status?.waterTrend?.trendValue);
  const hasRoadInfo = !isNullish(gage?.roadSaddleHeight) && !!gage?.roadDisplayName;

  return (
    <Card flex>
      <CardHeader>
        <Row align="space-between" justify="flex-start">
          <SmallTitle>{label}</SmallTitle>
          <If condition={gagesStore.isFetching}>
            <ActivityIndicator />
          </If>
        </Row>
        <LabelText>
          <If condition={!!timeAgo}>
            {timeAgo}
            {" / "}
          </If>
          {reading?.timestamp ? formatReadingTime(reading.timestamp, tz) : ""}
        </LabelText>
      </CardHeader>
      <Cell flex>
        <If condition={!isNullish(reading?.waterHeight)}>
          <CardItem>
            <RegularText>{t("calloutReading.waterLevel")}</RegularText>
            <MediumText>{formatHeight(reading?.waterHeight)}</MediumText>
          </CardItem>
        </If>
        <If condition={!isNullish(reading?.waterDischarge)}>
          <CardItem>
            <RegularText>{t("calloutReading.waterFlow")}</RegularText>
            <MediumText>{formatFlow(reading?.waterDischarge)}</MediumText>
          </CardItem>
        </If>
        <CardItem noBorder={!hasRoadInfo && !hasTrendInfo}>
          <RegularText>{t("calloutReading.status")}</RegularText>
          <LargeLabel
            type={floodLevel ? STATUSES[floodLevel] : undefined}
            text={floodLevel ?? ""}
          />
        </CardItem>
        <If condition={hasTrendInfo}>
          <CardItem noBorder={!hasRoadInfo}>
            <RegularText>{t("calloutReading.trend")}</RegularText>
            <Row>
              <MediumText>{formatTrend(status?.waterTrend?.trendValue)}</MediumText>
              <Cell left={Spacing.tiny}>
                <TrendIcon gage={gage} iconType={TREND_ICON_TYPES.Trend} />
              </Cell>
            </Row>
          </CardItem>
        </If>
        <If condition={hasRoadInfo}>
          <CardItem noBorder>
            <RegularText>{t("calloutReading.road")}</RegularText>
            <MediumText>
              {roadStatus?.deltaFormatted}{" "}
              {t(`statusLevelsCard.${roadStatus?.preposition}` as TxKeyPath)}
              {t("calloutReading.roadSmall")}
            </MediumText>
          </CardItem>
        </If>
      </Cell>
    </Card>
  );
});

export default CalloutReading;
