import { getSnapshot } from "mobx-state-tree";
import { useMemo } from "react";

import { Forecast } from "@models/Forecasts";
import { GageSummary } from "@models/RootStore";
import { useStores } from "@models/helpers/useStores";

import { Colors, lightenHexColor } from "@common-ui/constants/colors";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isMobile } from "@common-ui/utils/responsive";
import dayjs from "dayjs";
import localDayJs from "../services/localDayJs";

declare module "highcharts" {
  interface PointOptionsObject {
    stage?: number;
  }
}

const STAGE_TWO_YAXIS_MARGIN = 500;

type ForecastChartGage = Pick<GageSummary, "id" | "title" | "color">;

interface BuildOptionsProps {
  daysBefore: number;
  daysAfter: number;
  forecasts: Forecast[];
  gages: ForecastChartGage[];
  timezone: string;
}

type ForecastSeriesPoint = Highcharts.PointOptionsObject & {
  x: number;
  y: number;
  xLabel: string;
  xLabelShort: string;
  name: string;
  shortName?: string;
  isForecast: boolean;
};

const shouldShowFloodLine = (forecast: Forecast, isCombinedForecast: boolean) => {
  if (!isCombinedForecast) {
    return true;
  }

  // For the combined forecast, only show Falls.
  return forecast?.noaaSiteId === "SQUW1";
};

const getFloodStageLabel = (forecast: Forecast, isCombinedForecast: boolean) => {
  switch (forecast?.noaaSiteId) {
    default:
      return "";
    case "SQUW1":
      return isCombinedForecast ? "Falls/Carnation" : "Falls";
    case "CRNW1":
      return "Carnation";

    case "":
      return "Forks";
  }
};

const buildSeries = (forecasts: Forecast[], gages: ForecastChartGage[], softMax: number, t) => {
  const series: Highcharts.SeriesSplineOptions[] = [];
  let maxValue = softMax;

  forecasts.forEach((forecast) => {
    const gage = gages.find((g) => g.id === forecast.id);
    const gageColor = gage?.color ?? Colors.gageChartColor;

    const dataPoints = forecast.chartReadings;

    const seriesName = `${t("forecastChart.observed")}: ${gage?.title}`;

    const normalizedDataPoints: ForecastSeriesPoint[] = [];

    dataPoints.forEach((p) => {
      if (p.x === undefined || p.y === undefined) {
        return;
      }

      if (p.y > maxValue) {
        maxValue = p.y;
      }

      normalizedDataPoints.push({
        x: p.x,
        y: p.y,
        xLabel: String(p.xLabel ?? ""),
        xLabelShort: String(p.xLabelShort ?? ""),
        stage: p.stage,
        isForecast: p.isForecast,
        name: seriesName,
        shortName: gage?.title,
      });
    });

    // Data Points
    series.push({
      type: "spline",
      animation: false,
      name: seriesName,
      data: normalizedDataPoints,
      color: gageColor,
      threshold: 0,
      lineWidth: 2,
      states: {
        hover: {
          lineWidth: 3,
        },
      },

      //$ todo
      marker: {
        enabled: false,
        radius: 2,
        states: {
          hover: {
            enabled: true,
          },
        },
      },
    });

    const forecastDataPoints = forecast.chartForecastReadings;

    const forecastName = `${t("forecastChart.forecast")}: ${gage?.title}`;

    const normalizedForecastDataPoints: ForecastSeriesPoint[] = [];

    forecastDataPoints.forEach((p) => {
      if (p.x === undefined || p.y === undefined) {
        return;
      }

      if (p.y > maxValue) {
        maxValue = p.y;
      }

      normalizedForecastDataPoints.push({
        x: p.x,
        y: p.y,
        xLabel: String(p.xLabel ?? ""),
        xLabelShort: String(p.xLabelShort ?? ""),
        stage: p.stage,
        isForecast: p.isForecast,
        name: forecastName,
        shortName: gage?.title,
      });
    });

    // Forecast Data Points
    series.push({
      type: "spline",
      animation: false,
      name: `${t("forecastChart.forecast")}: ${gage?.title}`,
      data: normalizedForecastDataPoints,
      color: isMobile ? lightenHexColor(gageColor) : gageColor,
      threshold: 0,
      lineWidth: 2,
      states: {
        hover: {
          lineWidth: 3,
        },
      },
      marker: {
        symbol: "circle",
      },
    });
  });

  return [series, maxValue] as const;
};

const buildOptions = (props: BuildOptionsProps, t) => {
  const { daysBefore, daysAfter, forecasts, gages, timezone } = props;

  let stageTwo = 0;
  const isCombinedForecast = forecasts.length > 1;
  const floodLines: Highcharts.YAxisPlotLinesOptions[] = [];

  const now = dayjs();

  const min = now.clone().subtract(daysBefore, "days");
  const max = now.clone().add(daysAfter, "days");

  // Find appropriate flood/warning levels for this chart.  For the combined chart we want to
  // find the highest available levels for the warning bands; we will go ahead and show a flood-stage line
  // for every available forecast.
  forecasts.forEach((f) => {
    if (f.dischargeStageTwo) {
      if (f.dischargeStageTwo > stageTwo) {
        stageTwo = f.dischargeStageTwo;
      }

      const showFloodLine = shouldShowFloodLine(f, isCombinedForecast);

      if (showFloodLine) {
        floodLines.push({
          color: "#999",
          width: 1,
          value: f.dischargeStageTwo,
          dashStyle: "Dash",
          label: {
            text: `${t("forecastChart.floodStage")}: ${getFloodStageLabel(f, isCombinedForecast)}`,
            style: {
              color: "#606060",
            },
          },
        });
      }
    }
  });

  // Display flooding level
  const floodBands: Highcharts.YAxisPlotBandsOptions[] = [
    {
      from: stageTwo,
      to: 10000000,
      color: "rgba(68, 170, 213, 0.1)",
    },
  ];

  const [series, chartMax] = buildSeries(forecasts, gages, stageTwo, t);

  const options: Highcharts.Options = {
    chart: {
      type: "spline",
      spacingLeft: 0,
      spacingRight: 5,
      animation: false,
    },
    time: {
      timezone: timezone,
    },
    title: {
      text: undefined,
    },
    plotOptions: {
      series: {
        animation: { duration: 0 },
        states: {
          inactive: { opacity: 1 },
        },
        turboThreshold: 2000,
      },
    },
    tooltip: {
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        let stageDisplay = "";

        if (this.point?.options?.stage) {
          stageDisplay = `/ ${this.point?.options?.stage} ft`;
        }
        const timeLabel = localDayJs.tz(this.x, timezone).format("MMM D, h:mm A");

        return `<b>${this.series.name}</b><br/>${timeLabel}: ${this.y} cfs ${stageDisplay}`;
      },
    },
    xAxis: {
      type: "datetime",
      min: min.valueOf(),
      max: max.valueOf(),
      dateTimeLabelFormats: {
        second: "%H:%M:%S",
        minute: "%a, %l:%M %p",
        hour: "%a, %l %p",
        day: "%a, %b %e",
        week: "%e. %b",
        month: "%b '%y",
      },
      plotLines: [
        {
          color: "#999",
          dashStyle: "Dot",
          width: 1,
          value: now.valueOf(),
          label: {
            text: t("forecastChart.now"),
            style: {
              color: Colors.darkGrey,
            },
            rotation: 90,
          },
        },
      ],
    },
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      plotBands: floodBands,
      plotLines: floodLines,
      softMax: stageTwo + STAGE_TWO_YAXIS_MARGIN,
      max: chartMax + STAGE_TWO_YAXIS_MARGIN,
      title: {
        text: `${t("forecastChart.discharge")} (${t("measure.cfs")})`,
      },
    },
    series: series,
  };

  return options;
};

const useForecastOptions = (gages: GageSummary[], daysBefore: number, daysAfter: number) => {
  const { t } = useLocale();
  const rootStore = useStores();
  const timezone = rootStore.getTimezone();
  const gageSignature = JSON.stringify(
    gages.map((gage) => ({ id: gage.id, title: gage.title, color: gage.color }))
  );
  const stableGages = useMemo(
    () => JSON.parse(gageSignature) as ForecastChartGage[],
    [gageSignature]
  );

  const forecastSignature = stableGages
    .map((gage) => {
      const forecast = rootStore.forecastsStore.getForecast(gage?.id);

      return forecast ? JSON.stringify(getSnapshot(forecast)) : gage?.id ?? "";
    })
    .join("|");

  const forecastInputs = useMemo(
    () => ({
      signature: forecastSignature,
      forecasts: rootStore.getForecasts(stableGages.map((gage) => gage.id)),
    }),
    [forecastSignature, rootStore, stableGages]
  );

  const options = useMemo(
    () =>
      buildOptions(
        {
          daysBefore,
          daysAfter,
          forecasts: forecastInputs.forecasts,
          gages: stableGages,
          timezone,
        },
        t
      ),
    [daysAfter, daysBefore, forecastInputs, stableGages, t, timezone]
  );

  return options;
};

export default useForecastOptions;
