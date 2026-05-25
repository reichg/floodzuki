import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

import { Gage, GageChartDataType } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import { useTimeout } from "./useTimeout";

import { Colors } from "@common-ui/constants/colors";
import { Timing } from "@common-ui/constants/timing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import Config from "@config/config";
import { DataPoint } from "@models/Forecasts";
import localDayJs from "@services/localDayJs";

declare module "highcharts" {
  interface Options {
    _now?: Dayjs;
  }
  interface Point {
    isPrediction?: boolean;
  }
}

interface Range {
  chartStartDate: dayjs.Dayjs;
  chartEndDate: dayjs.Dayjs;
  isNow?: boolean;
}

interface BuildOptionsProps {
  timezone: string;
  gage: Gage;
  chartDataType: GageChartDataType;
}

type GageChartPoint = Highcharts.PointOptionsObject & {
  x: number;
  y: number;
  name: string;
  ts?: string;
  isPrediction?: boolean;
};

type TimedPoint = DataPoint & { timestamp: Dayjs };
type TimedReadingPoint = TimedPoint & { reading: number };
type TimedDischargePoint = TimedPoint & { waterDischarge: number };

const hasTimestamp = (point: DataPoint): point is TimedPoint => point.timestamp != null;

const hasReadingPoint = (point: DataPoint): point is TimedReadingPoint => {
  return hasTimestamp(point) && typeof point.reading === "number";
};

const hasDischargePoint = (point: DataPoint): point is TimedDischargePoint => {
  return hasTimestamp(point) && typeof point.waterDischarge === "number";
};

const ensureXAxis = (options: Highcharts.Options) => {
  const xAxis = (Array.isArray(options.xAxis) ? options.xAxis[0] : options.xAxis) ?? {};
  options.xAxis = xAxis;
  return xAxis as Highcharts.XAxisOptions;
};

const ensureYAxis = (options: Highcharts.Options) => {
  const yAxis = (Array.isArray(options.yAxis) ? options.yAxis[0] : options.yAxis) ?? {};
  options.yAxis = yAxis;
  return yAxis as Highcharts.YAxisOptions;
};

const DEBUGGING_TIMESPAN_MARGIN = 0; // 300;
const PREDICTION_WINDOW_MINUTES = 60 * 6; // 6 hours of predictions

export const CHART_OPTIONS = {
  dashboardOptions: (options: Highcharts.Options, gage: Gage, range: Range, t) => {
    const chart = options.chart ?? (options.chart = {});
    const xAxis = ensureXAxis(options);
    const yAxis = ensureYAxis(options);
    const now = options._now ?? localDayJs();

    options._now = now;

    chart.height = 182;
    xAxis.labels = { enabled: false };
    xAxis.tickLength = 0;
    yAxis.labels = { enabled: false };
    yAxis.gridLineWidth = 0;
    yAxis.title = undefined;

    for (const line of yAxis.plotLines || []) {
      if (!line.label) {
        continue;
      }

      line.label.style = { ...(line.label.style ?? {}), fontSize: "11px" };
      line.label.align = "center";
      line.label.x = 0;
    }

    xAxis.max = now.valueOf();

    const chartBeginTime = now
      .clone()
      .subtract(Config.FRONT_PAGE_CHART_DURATION_NUMBER, Config.FRONT_PAGE_CHART_DURATION_UNIT);

    xAxis.min = chartBeginTime.clone().subtract(20, "m").valueOf();
    xAxis.plotLines = xAxis.plotLines ?? [];

    xAxis.plotLines.push({
      value: chartBeginTime.valueOf(),
      dashStyle: "Dot",
      color: "#9a9a9a",
      label: {
        text: t("gageChart.dashboardDurationLabel"),
        style: { color: "#9a9a9a" },
        align: "left",
      },
    });

    return [options, null] as const;
  },

  gageDetailsOptions: (options: Highcharts.Options, gage: Gage, range: Range, t) => {
    const xAxis = ensureXAxis(options);

    let predictionWindow = 0;

    if (gage?.predictedPoints?.length && range.isNow !== false) {
      predictionWindow = PREDICTION_WINDOW_MINUTES;
    }

    xAxis.max = range.chartEndDate
      .clone()
      .add(predictionWindow, "m")
      .add(DEBUGGING_TIMESPAN_MARGIN, "m")
      .valueOf();

    xAxis.min = range.chartStartDate.clone().subtract(DEBUGGING_TIMESPAN_MARGIN, "m").valueOf();

    const crest = calculateCrest(gage?.dataPoints ?? [], {
      startDate: range.chartStartDate,
    });

    if (crest && typeof crest.reading === "number") {
      xAxis.plotLines = xAxis.plotLines || [];
      xAxis.plotLines.push(
        makePlotLine({
          value: crest.timestamp.valueOf(),
          label: `${t("measure.max")} ${crest.reading.toFixed(2)} ${t("measure.ft")}`,
        })
      );
    }

    return [options, crest] as const;
  },
};

function calculateCrest(
  dataPoints: DataPoint[],
  { startDate = localDayJs("1970-01-01"), endDate = localDayJs() } = {}
) {
  const points = dataPoints.filter(
    (point): point is TimedReadingPoint =>
      hasReadingPoint(point) && point.timestamp >= startDate && point.timestamp <= endDate
  );

  if (points.length < 3) {
    return null;
  }

  const [min, max] = points.reduce<[number, number]>(
    (mm, d) => [Math.min(d.reading, mm[0]), Math.max(d.reading, mm[1])],
    [+Infinity, -Infinity]
  );

  // max has to be 1' greater than min
  if (max < min + 1) {
    return null;
  }

  //has to be greater then 1st and last points
  if (max === points[0].reading || max === points[points.length - 1].reading) {
    return null;
  }

  const dur = localDayJs.duration(120, "m").asMilliseconds();

  for (let i = points.length - 2; i > 0; i--) {
    const next = points[i - 1];
    const point = points[i];
    const prev = points[i + 1];

    if (
      point.reading === max &&
      point.timestamp - prev.timestamp < dur &&
      next.timestamp - point.timestamp < dur
    ) {
      return point;
    }
  }

  return null;
}

function dataPointPopup(gage: Gage, t, tz: string) {
  return function (this: Highcharts.TooltipFormatterContextObject) {
    const yValue = typeof this.y === "number" ? this.y : undefined;
    const roadStatus = yValue !== undefined ? gage?.getCalculatedRoadStatus(yValue) : null;
    const pointTime = typeof this.x === "number" ? localDayJs(this.x).tz(tz) : null;

    let roadDesc = "";

    if (roadStatus) {
      roadDesc = `<br />
        <span class="data-point-content">${roadStatus.deltaFormatted}</span>
        <span class="data-point-title"> ${t(`statusLevelsCard.${roadStatus?.preposition}`)} ${t(
        "calloutReading.roadSmall"
      )}</span>`;
    }
    return ` <div class="data-point">
        <span class="data-point-title">${
          this.point.isPrediction ? t("statusLevelsCard.predicted") : t("statusLevelsCard.water")
        } ${t("statusLevelsCard.level")}: </span>
        <span class="data-point-content">
          ${yValue?.toFixed(2) ?? "--"} ${t("measure.ft")}.
        </span>
        <br />
        <span class="data-point-content">
          ${pointTime ? pointTime.format("ddd, MMM D, h:mm A") : ""}
        </span>
        ${roadDesc}
      </div>`;
  };
}

function makePlotLine({ value, label, color = "#9a9a9a" }): Highcharts.XAxisPlotLinesOptions {
  return {
    value,
    dashStyle: "Dot",
    color,
    label: {
      text: label,
      style: { color },
      align: "right",
      x: -5,
    },
  };
}

function createPredictionSeries(
  dataPoints: DataPoint[],
  t,
  groundHeight: number,
  color: string
): Highcharts.SeriesAreaOptions {
  return {
    type: "area",
    animation: false,
    name: "predicted gage height",
    data: dataPoints.filter(hasReadingPoint).map(
      (d): GageChartPoint => ({
        x: d.timestamp.valueOf(),
        y: d.reading,
        name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        isPrediction: true,
      })
    ),
    fillOpacity: 0,
    color: color,
    threshold: groundHeight || 0,
    lineWidth: 1,
    states: {
      hover: {
        lineWidth: 1,
      },
    },
  };
}

function createActualDataSeries(
  dataPoints: DataPoint[],
  t,
  groundHeight: number,
  color: string
): Highcharts.SeriesAreaOptions {
  return {
    type: "area",
    animation: false,
    name: "actual gage height",
    data: dataPoints.filter(hasReadingPoint).map(
      (d): GageChartPoint => ({
        x: d.timestamp.valueOf(),
        y: d.reading,
        ts: d.timestamp.format(),
        name: `${t("statusLevelsCard.water")} ${t("statusLevelsCard.level")}: `,
        isPrediction: false,
      })
    ),
    fillOpacity: 0,
    color: color,
    threshold: groundHeight || 0,
    lineWidth: 1,
    states: {
      hover: {
        lineWidth: 1,
      },
    },
  };
}

function createForecastDataSeries(
  dataPoints: DataPoint[],
  t,
  groundHeight: number,
  color: string
): Highcharts.SeriesAreaOptions {
  return {
    type: "area",
    animation: false,
    name: "forecast gage height",
    data: dataPoints.filter(hasReadingPoint).map(
      (d): GageChartPoint => ({
        x: d.timestamp.valueOf(),
        y: d.reading,
        name: `${t("statusLevelsCard.predicted")} ${t("statusLevelsCard.level")}: `,
        isPrediction: true,
      })
    ),
    fillOpacity: 0,
    color: color,
    threshold: groundHeight || 0,
    lineWidth: 1,
    states: {
      hover: {
        lineWidth: 1,
      },
    },
  };
}

function createSeriesAndReturnMin(
  dataPoints: DataPoint[],
  gage: Gage,
  t,
  color: string,
  setIsPrediction: boolean,
  chartDataType: GageChartDataType
): readonly [Highcharts.SeriesAreaOptions[], number] {
  const validPoints =
    chartDataType === GageChartDataType.DISCHARGE
      ? dataPoints.filter(hasDischargePoint)
      : dataPoints.filter(hasReadingPoint);

  const values = validPoints.map((point) =>
    chartDataType === GageChartDataType.DISCHARGE ? point.waterDischarge : point.reading
  );
  const min = values.length > 0 ? Math.min(...values) : 0;

  const data: GageChartPoint[] = validPoints.map((point) => ({
    x: point.timestamp.valueOf(),
    y: chartDataType === GageChartDataType.DISCHARGE ? point.waterDischarge : point.reading,
    name: `${t(setIsPrediction ? "statusLevelsCard.water" : "statusLevelsCard.predicted")} ${t(
      "statusLevelsCard.level"
    )}: `,
    ts: setIsPrediction ? point.timestamp.format() : undefined,
    isPrediction: !setIsPrediction,
  }));

  const series: Highcharts.SeriesAreaOptions[] = [];

  series.push({
    type: "area",
    animation: false,
    name: "gage height",
    data: data,
    color: color,
    fillOpacity: 0.5,
    threshold: gage?.groundHeight,
    lineWidth: 2,
    gapUnit: "value",
    gapSize: localDayJs.duration(2, "hours").asMilliseconds(),
    states: {
      hover: {
        lineWidth: 3,
      },
    },
    marker: {
      enabled: true,
      radius: 2,
      states: {
        hover: {
          enabled: true,
        },
      },
    },
  });

  return [series, min] as const;
}

function createDataAndReturnMin(gage: Gage, chartDataType: GageChartDataType, t) {
  let hasPredictions = false;
  const chartData: Highcharts.SeriesAreaOptions[] = [];

  // Get predicted points
  if (gage?.predictedPoints?.length > 0) {
    chartData.push(
      createPredictionSeries(
        gage.predictedPoints,
        t,
        gage.groundHeight,
        Colors.gageChartPredictionsLineColor
      )
    );
    hasPredictions = true;
  }

  // Get actual points
  if (gage?.actualPoints?.length > 0) {
    chartData.push(
      createActualDataSeries(
        gage.actualPoints,
        t,
        gage.groundHeight,
        Colors.gageChartActualDataLineColor
      )
    );
  }

  // Get forecast points
  if (gage?.noaaForecastData?.length > 0) {
    chartData.push(
      createForecastDataSeries(
        gage.noaaForecastData,
        t,
        gage.groundHeight,
        Colors.gageChartForecastDataLineColor
      )
    );
  }

  // Get readings
  const dataPoints = gage.dataPoints;

  let min = 0;

  const readings = dataPoints
    .slice()
    .filter((d) => !d.isDeleted)
    .reverse();
  const deletedReadings = dataPoints
    .slice()
    .filter((d) => d.isDeleted)
    .reverse();

  const [readingsSeries, seriesMin] = createSeriesAndReturnMin(
    readings,
    gage,
    t,
    Colors.gageChartColor,
    hasPredictions,
    chartDataType
  );
  min = seriesMin;

  chartData.push(...readingsSeries);

  if (deletedReadings.length > 0) {
    const [deletedReadingsSeries, deletedSeriesMin] = createSeriesAndReturnMin(
      deletedReadings,
      gage,
      t,
      Colors.gageChartDeletedLineColor,
      false,
      chartDataType
    );
    chartData.push(...deletedReadingsSeries);
    min = Math.min(seriesMin, deletedSeriesMin);
  }

  return [chartData, min] as const;
}

const buildBasicOptions = (props: BuildOptionsProps, t) => {
  const { gage, chartDataType } = props;

  const options: Highcharts.Options = {
    chart: {
      height: 300,
      type: "area",
      spacingLeft: 0,
      spacingRight: 5,
      animation: false,
    },
    title: {
      text: undefined,
    },
    time: {
      timezone: props.timezone,
    },
    legend: { enabled: false },
    plotOptions: {
      series: {
        animation: { duration: 0 },
        states: {
          inactive: { opacity: 1 },
        },
        turboThreshold: 2000,
      },
      area: { fillOpacity: 0.5, animation: false },
    },
    tooltip: {
      useHTML: true,
      formatter: dataPointPopup(gage, t, props.timezone),
    },
    xAxis: {
      type: "datetime",
      ordinal: false,
      dateTimeLabelFormats: {
        second: "%H:%M:%S",
        minute: "%a, %l:%M %p",
        hour: "%a, %l %p",
        day: "%a, %b %e",
        week: "%e. %b",
        month: "%b '%y",
      },
    },
    yAxis: {
      type: chartDataType === GageChartDataType.DISCHARGE ? "logarithmic" : "linear",
      startOnTick: false,
      endOnTick: false,
      title: {
        text:
          chartDataType === GageChartDataType.DISCHARGE
            ? `${t("gageChart.discharge")} (${t("measure.cfs")})`
            : `${t("gageChart.waterLevel")} (${t("measure.ft")}.)`,
      },
    },
  };

  const [series, minVal] = createDataAndReturnMin(gage, chartDataType, t);

  const { yMaximum, yMinimum } = gage.getChartMinAndMax(chartDataType);

  options.series = series;
  const yAxis = options.yAxis as Highcharts.YAxisOptions;
  const xAxis = options.xAxis as Highcharts.XAxisOptions;
  const yAxisMin = Math.max(gage.groundHeight || 0, yMinimum);
  yAxis.min = Math.min(minVal, yAxisMin);
  yAxis.max = yMaximum;

  yAxis.plotLines = gage.roads
    .filter((cat): cat is { elevation: number; name: string } => {
      return cat.elevation != null && typeof cat.name === "string";
    })
    .map((cat) => {
      return {
        value: cat.elevation,
        label: {
          text: cat.name,
          style: {
            color: Colors.primary,
            fontFamily: "'Open Sans', sans-serif",
            fontSize: "14px",
          },
          align: "right",
          x: -10,
        },
        color: Colors.primary,
        dashStyle: "Dot" as Highcharts.DashStyleValue,
      };
    });

  options._now = localDayJs();

  xAxis.plotLines = [
    makePlotLine({
      value: options._now.valueOf(),
      label: t("gageChart.Now"),
    }),
  ];

  return options;
};

const useGageChartOptions = (
  gage: Gage,
  optionType: string,
  chartDataType: GageChartDataType,
  range?: Range
) => {
  const rootStore = useStores();
  const { t } = useLocale();
  const timezone = rootStore.getTimezone();

  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<[Highcharts.Options, DataPoint | null]>([{}, null]);
  const gageRef = useRef(gage);

  useEffect(() => {
    gageRef.current = gage;
  }, [gage]);

  // Move chart calculations to the next tick to prevent blocking the UI
  useTimeout(() => {
    setIsVisible(true);
  }, Timing.instant);

  const chartInputSignature = useMemo(
    () =>
      JSON.stringify({
        actualPoints: gage?.actualPoints,
        dataPoints: gage?.dataPoints,
        dischargeMax: gage?.locationInfo?.dischargeMax,
        dischargeMin: gage?.locationInfo?.dischargeMin,
        groundHeight: gage?.groundHeight,
        locationId: gage?.locationId,
        noaaForecastData: gage?.noaaForecastData,
        predictedPoints: gage?.predictedPoints,
        roads: gage?.roads,
        timezone,
        yMax: gage?.locationInfo?.yMax,
        yMin: gage?.locationInfo?.yMin,
      }),
    [
      gage?.actualPoints,
      gage?.dataPoints,
      gage?.locationInfo?.dischargeMax,
      gage?.locationInfo?.dischargeMin,
      gage?.groundHeight,
      gage?.locationId,
      gage?.noaaForecastData,
      gage?.predictedPoints,
      gage?.roads,
      timezone,
      gage?.locationInfo?.yMax,
      gage?.locationInfo?.yMin,
    ]
  );

  useEffect(() => {
    if (!isVisible || !chartInputSignature) {
      return;
    }

    const currentGage = gageRef.current;

    if (!currentGage?.locationId) {
      return;
    }

    setOptions(
      CHART_OPTIONS[optionType](
        buildBasicOptions(
          {
            timezone,
            gage: currentGage,
            chartDataType,
          },
          t
        ),
        currentGage,
        range,
        t
      )
    );
  }, [chartDataType, chartInputSignature, isVisible, optionType, range, t, timezone]);

  return options;
};

export default useGageChartOptions;
