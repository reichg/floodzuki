import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";

import { LinkButton } from "@common-ui/components/Button";
import { Card, CardFooter, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import { LargeLabel } from "@common-ui/components/Label";
import { RegularText, SmallText, SmallTitle } from "@common-ui/components/Text";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import { useUtils } from "@utils/utils";
import { ROUTES } from "app/_layout";

const formatToRoadText = (diff: number, t) => {
  if (Math.abs(diff) < 0.1) {
    return `(${t("statusLevelsCard.roadSaddle")} ${t("statusLevelsCard.level")})`;
  }
  return `(${Math.abs(diff).toFixed(1)} ${t("measure.ft")} ${
    diff > 0 ? t("statusLevelsCard.below") : t("statusLevelsCard.above")
  } ${t("statusLevelsCard.roadSaddle")})`;
};

const StatusLevelsCard = observer(function StatusLevelsCard({ gage }: { gage: Gage }) {
  const router = useRouter();
  const { authSessionStore } = useStores();
  const { formatHeight } = useUtils();
  const { t } = useLocale();

  const isLoggedIn = authSessionStore.isLoggedIn;
  const isSubscribed = isLoggedIn && authSessionStore.gageSubscriptions.includes(gage?.locationId);

  const handleManageLinkPress = () => {
    if (isSubscribed) {
      router.push({ pathname: ROUTES.UserAlerts });
      return;
    } else if (isLoggedIn) {
      router.push({ pathname: ROUTES.UserAlerts, params: { add: gage?.locationId } });
      return;
    }

    router.push({ pathname: ROUTES.UserLogin });
  };

  let manageText = t("statusLevelsCard.logInToGetAlerts");

  if (isSubscribed) {
    // If subscribed, show "Manage Alerts" instead
    manageText = t("statusLevelsCard.manageAlerts");
  } else if (isLoggedIn) {
    // If logged in, show "Get Alerts when status changes" instead
    manageText = t("statusLevelsCard.getAlerts");
  }

  return (
    <Card flex>
      <CardHeader>
        <SmallTitle>{t("statusLevelsCard.statusLevels")}</SmallTitle>
      </CardHeader>
      <Cell flex>
        <CardItem>
          <LargeLabel type="success" text={t("status.normal")} />
          <RegularText>
            {t("statusLevelsCard.Below")} {formatHeight(gage?.yellowStage ?? gage?.redStage)}
          </RegularText>
        </CardItem>
        <CardItem>
          <LargeLabel type="warning" text={t("status.nearFlooding")} />
          <RegularText>
            {t("statusLevelsCard.atAndAbove")} {formatHeight(gage?.yellowStage)}
            {"\n"}
            <If condition={gage?.roadToYellowStage != null}>
              <SmallText>{formatToRoadText(gage?.roadToYellowStage ?? 0, t)}</SmallText>
            </If>
          </RegularText>
        </CardItem>
        <CardItem noBorder>
          <LargeLabel type="danger" text={t("status.flooding")} />
          <RegularText>
            {t("statusLevelsCard.atAndAbove")} {formatHeight(gage?.redStage)}
            {"\n"}
            <If condition={gage?.roadToRedStage != null}>
              <SmallText>{formatToRoadText(gage?.roadToRedStage ?? 0, t)}</SmallText>
            </If>
          </RegularText>
        </CardItem>
        <CardFooter>
          <Cell flex align="center">
            <LinkButton selfAlign="center" title={manageText} onPress={handleManageLinkPress} />
          </Cell>
        </CardFooter>
      </Cell>
    </Card>
  );
});

export default StatusLevelsCard;
