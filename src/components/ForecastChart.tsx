import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native";

import HighchartsReactNative from "@services/highcharts/HighchartsReactNative";
import LocalHighchartsReact from "@services/highcharts/LocalHighchartsReact";

import { Card } from "@common-ui/components/Card";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Spacing } from "@common-ui/constants/spacing";
import { isMobile, isWeb } from "@common-ui/utils/responsive";
import { GageSummary } from "@models/RootStore";

import { Cell } from "@common-ui/components/Common";
import { SegmentControl } from "@common-ui/components/SegmentControl";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import useForecastOptions from "@utils/useForecastOptions";
import { CHART_HEIGHT } from "./forecastChartConstants";

interface ForecastChartProps {
  gages: GageSummary[];
  hideChart?: boolean;
}

interface ChartsProps {
  options: Highcharts.Options;
}

const RANGES = (t) => [
  {
    key: "DF",
    title: t("forecastChart.fullRangeTitle"),
    before: 3,
    after: 10,
  },
  {
    key: "D8",
    title: t("forecastChart.rangeDays", { days: 8 }),
    before: 4,
    after: 4,
  },
  {
    key: "D6",
    title: t("forecastChart.rangeDays", { days: 6 }),
    before: 3,
    after: 3,
  },
  {
    key: "D4",
    title: t("forecastChart.rangeDays", { days: 4 }),
    before: 2,
    after: 2,
  },
  {
    key: "D2",
    title: t("forecastChart.rangeDays", { days: 2 }),
    before: 1,
    after: 1,
  },
];

const Charts = (props: ChartsProps) => {
  const { options } = props;

  return (
    <Ternary condition={isMobile}>
      <HighchartsReactNative options={options} styles={{ height: CHART_HEIGHT }} />
      <LocalHighchartsReact options={options} />
    </Ternary>
  );
};

export const ForecastChart = observer(function ForecastChart(props: ForecastChartProps) {
  const { t } = useLocale();
  const { gages } = props;

  const [range, setRange] = useState("DF");
  const ranges = RANGES(t);

  const selectedRange = ranges.find((r) => r.key === range) ?? ranges[0];

  const chartOptions = useForecastOptions(gages, selectedRange.before, selectedRange.after);
  const isLoading = !chartOptions?.series?.length;

  return (
    <>
      <If condition={isWeb}>
        <SegmentControl segments={ranges} selectedSegment={range} onChange={setRange} />
      </If>
      <Card
        innerHorizontal={Spacing.extraSmall}
        innerVertical={Spacing.extraSmall}
        height={CHART_HEIGHT}>
        <Ternary condition={isLoading}>
          <Cell flex>
            <ActivityIndicator />
          </Cell>
          <Charts options={chartOptions} />
        </Ternary>
      </Card>
      <If condition={isMobile}>
        <Cell top={Spacing.medium}>
          <SegmentControl segments={ranges} selectedSegment={range} onChange={setRange} />
        </Cell>
      </If>
    </>
  );
});
