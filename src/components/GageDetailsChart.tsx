import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

import HighchartsReactNative from "@services/highcharts/HighchartsReactNative";
import LocalHighchartsReact from "@services/highcharts/LocalHighchartsReact";

import { Card, CardFooter, CardHeader } from "@common-ui/components/Card";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Spacing } from "@common-ui/constants/spacing";
import { isAndroid, isIOS, isMobile, useResponsive } from "@common-ui/utils/responsive";
import { Gage, GageChartDataType } from "@models/Gage";

import { IconButton, SolidButton } from "@common-ui/components/Button";
import { Cell, Row } from "@common-ui/components/Common";
import Icon from "@common-ui/components/Icon";
import { SegmentControl } from "@common-ui/components/SegmentControl";
import { LabelText, MediumText, RegularText, SmallerText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { useDatePicker } from "@common-ui/contexts/DatePickerContext";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import Config from "@config/config";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { DataPoint } from "@models/Forecasts";
import { useStores } from "@models/helpers/useStores";
import { FloodEvent } from "@models/LocationInfo";
import { Picker } from "@react-native-picker/picker";
import localDayJs from "@services/localDayJs";
import { CHART_DEFAULT_RANGE_DAYS, deriveRange, NOW_LITERAL } from "@utils/deriveRange";
import { normalizeSearchParams } from "@utils/navigation";
import { formatUrlDate, UTC_ISO_FORMAT } from "@utils/urlDates";
import useGageChartOptions from "@utils/useGageChartOptions";
import { formatReadingTime } from "@utils/useTimeFormat";
import { useInterval } from "@utils/useTimeout";
import { Dayjs } from "dayjs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePickerVariantSwitch from "./DatePickerVariantSwitch";

interface GageDetailsChartProps {
  gage: Gage;
  hideChart?: boolean;
}

interface ChartsProps {
  options: Highcharts.Options;
}

// Ranges available for selection
const RANGES = (t, showLive: boolean) => [
  {
    key: "14",
    title: t("forecastChart.rangeDays", { days: 14 }),
  },
  {
    key: "7",
    title: t("forecastChart.rangeDays", { days: 7 }),
  },
  {
    key: "2",
    title: t("forecastChart.rangeDays", { days: 2 }),
  },
  {
    key: "1",
    title: `1 ${t("forecastChart.rangeDay")}`,
  },
  ...(showLive
    ? [
        {
          key: "live",
          title: t("forecastChart.live"),
        },
      ]
    : []),
];

// Possible chart data types
const CHART_DATA_TYPES = (t) => [
  {
    key: GageChartDataType.LEVEL,
    title: t("gageDetailsChart.waterLevel"),
  },
  {
    key: GageChartDataType.DISCHARGE,
    title: t("gageDetailsChart.discharge"),
  },
];

const SELECT_EVENT = "gageDetailsChart._selectEvent";

const Charts = React.memo(function Charts({ options }: ChartsProps) {
  return (
    <Cell height={320}>
      <Ternary condition={isMobile}>
        <HighchartsReactNative options={options} styles={{ height: 320 }} />
        <LocalHighchartsReact options={options} />
      </Ternary>
    </Cell>
  );
});

const PickerSelector = ({
  floodEvents = [],
  historicEventId,
  onHistoricEventSelected,
}: {
  floodEvents: FloodEvent[];
  historicEventId?: string | string[];
  onHistoricEventSelected: (historicEventId: string) => void;
}) => {
  const { t } = useLocale();
  const eventId = Array.isArray(historicEventId) ? historicEventId[0] : historicEventId;

  const width = isAndroid ? { width: 200 } : {};

  return (
    <Picker
      selectedValue={eventId ?? SELECT_EVENT}
      onValueChange={onHistoricEventSelected}
      style={[$pickerStyle, width]}>
      <Picker.Item label={t(SELECT_EVENT)} value={SELECT_EVENT} />
      {floodEvents?.map((event, index) => (
        <Picker.Item key={event.id} label={event.eventName} value={event.id} />
      ))}
    </Picker>
  );
};

/** Historic Flooding events picker */
const HistoricEvents = observer(function HistoricEvents({
  floodEvents = [],
}: {
  floodEvents: FloodEvent[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const { historicEventId } = useLocalSearchParams();
  const { hidePicker } = useDatePicker();
  const { getTimezone } = useStores();
  const tz = getTimezone();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const urlEventId = Array.isArray(historicEventId) ? historicEventId[0] : historicEventId;

  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(urlEventId);

  // Keep the iOS bottom-sheet's pending selection in sync with the URL.
  // Without this, clearing `historicEventId` via a range change leaves the
  // sheet showing the previously-selected event the next time it opens.
  useEffect(() => {
    setSelectedEvent(urlEventId);
  }, [urlEventId]);

  // Update chart when historic event selected
  const onHistoricEventSelected = (historicEventId: string) => {
    // Clear params when no event selected
    if (!historicEventId) {
      return;
    }

    if (historicEventId === SELECT_EVENT) {
      router.setParams({
        historicEventId: undefined,
        from: undefined,
        to: undefined,
      });
      hidePicker();
      return;
    }

    const historicEventIdNum = parseInt(historicEventId);
    const event = floodEvents.find((e) => e.id === historicEventIdNum);

    if (!event) {
      return;
    }

    router.setParams({
      historicEventId,
      from: formatUrlDate(localDayJs(event.fromDate), tz),
      to: formatUrlDate(localDayJs(event.toDate), tz),
    });

    hidePicker();
    bottomSheetModalRef.current?.dismiss();
  };

  const openModal = () => {
    bottomSheetModalRef.current?.present();
  };

  const historicEventIdNum = parseInt(urlEventId);
  const title =
    floodEvents.find((e) => e.id === historicEventIdNum)?.eventName ??
    t("gageDetailsChart.selectEvent");

  return (
    <If condition={!!floodEvents.length}>
      <Row>
        <RegularText muted>{t("gageDetailsChart.historicalEvents")}: </RegularText>
        <Ternary condition={isIOS}>
          <>
            <TouchableOpacity onPress={openModal}>
              <View style={$pickerSelectorStyle}>
                <RegularText muted>{title}</RegularText>
                <Icon left={Spacing.tiny} name="chevron-down" color={Colors.darkGrey} />
              </View>
            </TouchableOpacity>
            <BottomSheetModal
              index={0}
              detached={true}
              ref={bottomSheetModalRef}
              snapPoints={["50%"]}
              style={$bottomSheetStyle}>
              <BottomSheetView style={{ paddingBottom: insets.bottom + Spacing.medium }}>
                <PickerSelector
                  historicEventId={selectedEvent ?? historicEventId}
                  floodEvents={floodEvents}
                  onHistoricEventSelected={setSelectedEvent}
                />
                <Cell horizontal={Spacing.large}>
                  <SolidButton
                    fullWidth
                    title={t("common.confirm")}
                    onPress={() => onHistoricEventSelected(selectedEvent ?? SELECT_EVENT)}
                  />
                </Cell>
              </BottomSheetView>
            </BottomSheetModal>
          </>
          <PickerSelector
            historicEventId={historicEventId}
            floodEvents={floodEvents}
            onHistoricEventSelected={onHistoricEventSelected}
          />
        </Ternary>
      </Row>
    </If>
  );
});

/** Water level rate of change */
const RateOfChange = observer(function RateOfChange({ gage }: { gage: Gage }) {
  const { t } = useLocale();
  const { getTimezone } = useStores();
  const tz = getTimezone();

  // set rate of change
  let rate = gage?.predictedFeetPerHour;
  if (rate != null && rate > -0.01 && rate < 0.01) {
    rate = undefined;
  }

  const crossingTime = useMemo<Dayjs | null>(() => {
    let crossingTime: Dayjs | null = null;

    if (!gage?.roadSaddleHeight) {
      return null;
    }

    const toGaugeTime = (s: string) => localDayJs.tz(s, "YYYY-MM-DDTHH:mm:ss", tz);

    for (let i = 0; i < gage.predictions?.length - 1; i++) {
      const p = gage.predictions[i];
      const pNext = gage.predictions[i + 1];

      if (
        !p?.timestamp ||
        !pNext?.timestamp ||
        p.waterHeight == null ||
        pNext.waterHeight == null
      ) {
        continue;
      }

      if (pNext.waterHeight === gage.roadSaddleHeight) {
        crossingTime = toGaugeTime(pNext.timestamp);
        break;
      }

      if (
        (pNext.waterHeight > gage.roadSaddleHeight && gage.roadSaddleHeight > p.waterHeight) ||
        (pNext.waterHeight < gage.roadSaddleHeight && gage.roadSaddleHeight < p.waterHeight)
      ) {
        let waterDelta =
          (gage.roadSaddleHeight - p.waterHeight) / (pNext.waterHeight - p.waterHeight);
        let msec = toGaugeTime(pNext.timestamp).diff(toGaugeTime(p.timestamp)) * waterDelta;
        crossingTime = toGaugeTime(p.timestamp).add(msec, "milliseconds");
        break;
      }
    }

    return crossingTime;
  }, [gage?.predictions, gage?.roadSaddleHeight, tz]);

  if (!gage?.locationId) {
    return null;
  }

  if (!rate) {
    return null;
  }

  const rateText = `${rate > 0 ? "+" : ""}${rate.toFixed(2)} ${t("measure.feet")}/${t(
    "measure.hour"
  )}`;

  return (
    <Row align="center" bottom={Spacing.extraSmall}>
      <MediumText muted>{t("gageDetailsChart.rateOfChange")}: </MediumText>
      <RegularText muted>{rateText}</RegularText>
      <If condition={!!crossingTime}>
        <LabelText>
          {" "}
          {t("gageDetailsChart.roadLevel")} @{" "}
          <SmallerText>{crossingTime?.format("llll")}</SmallerText>
        </LabelText>
      </If>
    </Row>
  );
});

/** Crest Info */
const CrestInfo = observer(function CrestInfo({ crest }: { crest: DataPoint }) {
  const { t } = useLocale();
  const { getTimezone } = useStores();
  const tz = getTimezone();

  if (!crest) {
    return null;
  }

  return (
    <Row align="center" bottom={Spacing.extraSmall}>
      <MediumText muted>{t("measure.max")}: </MediumText>
      <RegularText muted>
        {crest?.reading?.toFixed(2)} {t("measure.ft")}. / {formatReadingTime(crest?.timestamp, tz)}
      </RegularText>
    </Row>
  );
});

export const GageDetailsChart = observer(function GageDetailsChart(props: GageDetailsChartProps) {
  const { gage, hideChart } = props;

  const router = useRouter();
  const { t } = useLocale();
  const { from, to } = useLocalSearchParams();
  const { gagesStore, isDataFetched, getTimezone } = useStores();
  const { hidePicker } = useDatePicker();

  const { isMobile } = useResponsive();

  const tz = getTimezone();
  const fromStr = normalizeSearchParams(from);
  const toStr = normalizeSearchParams(to);

  const range = useMemo(() => deriveRange(fromStr, toStr, tz), [fromStr, toStr, tz]);

  const rangeOption = useMemo(() => {
    const diff = Math.round(range.chartEndDate.diff(range.chartStartDate, "day", true));
    return (["1", "2", "7", "14"] as const).find((k) => parseInt(k) === diff) ?? "";
  }, [range]);

  const [showRangeWarning, setShowRangeWarning] = useState(false);
  const [chartDataType, setChartDataType] = useState<GageChartDataType>(GageChartDataType.LEVEL);

  // Single fetch effect: re-runs whenever the gage, data-readiness, or the
  // derived range changes. Replaces the previous mount-effect + dateRange-effect split.
  // includeLastReading=false → REPLACE readings array; the polling tick below
  // is the only call that appends incrementally.
  useEffect(() => {
    if (!gage?.locationId || !isDataFetched) {
      return;
    }
    gagesStore.fetchDataForGage(
      gage.locationId,
      range.chartStartDate.utc().format(UTC_ISO_FORMAT),
      range.chartEndDate.utc().format(UTC_ISO_FORMAT),
      range.isNow,
      false
    );
  }, [gage?.locationId, gagesStore, isDataFetched, range]);

  // Live polling while in "now" mode.
  // Each tick re-anchors the window to the current moment so the chart's
  // visible range advances with wall time. The window width is the gap
  // captured in `range` at memo time; the end is recomputed as `now()` on
  // every tick.
  useInterval(
    () => {
      if (!gage?.locationId) {
        return;
      }
      const now = localDayJs();
      const windowMs = range.chartEndDate.diff(range.chartStartDate);
      const start = now.subtract(windowMs, "millisecond");
      gagesStore.fetchDataForGage(
        gage.locationId,
        start.utc().format(UTC_ISO_FORMAT),
        now.utc().format(UTC_ISO_FORMAT),
        true,
        true
      );
    },
    gage?.locationId && isDataFetched && range.isNow
      ? Config.LIVE_CHART_DATA_REFRESH_INTERVAL
      : null
  );

  // Auto-dismiss the range-too-wide warning after 10 seconds.
  useEffect(() => {
    if (!showRangeWarning) {
      return undefined;
    }
    const id = setTimeout(() => setShowRangeWarning(false), 10_000);
    return () => clearTimeout(id);
  }, [showRangeWarning]);

  // Manual refresh button. In live mode, re-anchor to the current moment
  // so "refresh" actually advances the window (matching polling behavior).
  // In historic mode, refetch the same bounds.
  const refetchData = () => {
    if (!gage?.locationId) {
      return;
    }
    let start = range.chartStartDate;
    let end = range.chartEndDate;
    if (range.isNow) {
      const now = localDayJs();
      const windowMs = end.diff(start);
      start = now.subtract(windowMs, "millisecond");
      end = now;
    }
    gagesStore.fetchDataForGage(
      gage.locationId,
      start.utc().format(UTC_ISO_FORMAT),
      end.utc().format(UTC_ISO_FORMAT),
      range.isNow,
      false
    );
  };

  // Segment shortcut.
  //   Live mode  → write the relative live form (`from=-N&to=now`).
  //   Historic   → rebuild an N-day absolute-date window centered on the
  //                current range's center day, later-biased when N or the
  //                current span is even. If the new window extends past
  //                today in gauge tz, flip to live mode instead.
  const onRangeChange = (key: string) => {
    hidePicker();

    if (key === "live") {
      router.setParams({
        historicEventId: undefined,
        from: `-${CHART_DEFAULT_RANGE_DAYS}`,
        to: NOW_LITERAL,
      });
      return;
    }

    const days = parseInt(key, 10);

    if (range.isNow) {
      router.setParams({
        historicEventId: undefined,
        from: `-${key}`,
        to: NOW_LITERAL,
      });
      return;
    }

    const startDay = range.chartStartDate.tz(tz).startOf("day");
    const endDay = range.chartEndDate.tz(tz).startOf("day");
    const totalDays = endDay.diff(startDay, "day") + 1;
    const centerDay = startDay.add(Math.floor(totalDays / 2), "day");

    const before = Math.floor(days / 2);
    const after = Math.floor((days - 1) / 2);
    const newStart = centerDay.subtract(before, "day");
    const newEnd = centerDay.add(after, "day");

    const todayStart = localDayJs().tz(tz).startOf("day");
    if (newEnd.valueOf() >= todayStart.valueOf()) {
      router.setParams({
        historicEventId: undefined,
        from: `-${key}`,
        to: NOW_LITERAL,
      });
      return;
    }

    router.setParams({
      historicEventId: undefined,
      from: formatUrlDate(newStart, tz),
      to: formatUrlDate(newEnd, tz),
    });
  };

  // Custom range from the date picker.
  const onDateRangeChange = (pickedFrom: Dayjs, pickedTo: Dayjs) => {
    hidePicker();
    router.setParams({
      historicEventId: undefined,
      from: formatUrlDate(pickedFrom, tz),
      to: formatUrlDate(pickedTo, tz),
    });
  };

  const onChartDataTypeChange = (key: GageChartDataType) => {
    setChartDataType(key);
  };

  const [chartOptions, crest] = useGageChartOptions(
    gage,
    "gageDetailsOptions",
    chartDataType,
    range
  );

  const hasDischargeControl =
    gage?.locationInfo?.hasDischarge && !Config.GAGES_WITHOUT_DISHCARGE.includes(gage?.locationId);

  return (
    <Card innerHorizontal={Spacing.extraSmall} innerVertical={Spacing.extraSmall}>
      <CardHeader horizontal={-Spacing.extraSmall}>
        <If condition={hasDischargeControl}>
          <SegmentControl
            bottom={Spacing.small}
            segments={CHART_DATA_TYPES(t)}
            selectedSegment={chartDataType}
            onChange={onChartDataTypeChange}
          />
        </If>
        <Row align="space-between">
          <Cell flex />
          <Cell flex>
            <SegmentControl
              bottom={Spacing.zero}
              segments={RANGES(t, !range.isNow)}
              selectedSegment={rangeOption}
              onChange={onRangeChange}
            />
          </Cell>
          <Cell flex align="flex-end">
            <If condition={!isMobile}>
              <DatePickerVariantSwitch
                locationId={gage?.locationId}
                startDate={range.chartStartDate}
                endDate={range.chartEndDate}
                timezone={tz}
                onChange={onDateRangeChange}
                onRangeRestricted={() => setShowRangeWarning(true)}
              />
            </If>
          </Cell>
        </Row>
        <If condition={isMobile}>
          <Cell align="center" top={Spacing.tiny}>
            <DatePickerVariantSwitch
              locationId={gage?.locationId}
              startDate={range.chartStartDate}
              endDate={range.chartEndDate}
              timezone={tz}
              onChange={onDateRangeChange}
              onRangeRestricted={() => setShowRangeWarning(true)}
            />
          </Cell>
        </If>
      </CardHeader>
      {showRangeWarning && (
        <View
          style={{
            backgroundColor: Colors.softYellow,
            borderRadius: Spacing.tiny,
            paddingHorizontal: Spacing.extraSmall,
            paddingVertical: Spacing.extraSmall,
            alignItems: "center",
          }}>
          <RegularText style={{ textAlign: "center" }}>
            {t("gageDetailsChart.rangeWarning", { maxRange: Config.MAX_DATE_PICKER_RANGE })}
          </RegularText>
        </View>
      )}
      <Ternary condition={!Object.keys(chartOptions).length || hideChart}>
        <Cell height={320} flex>
          <ActivityIndicator animating />
        </Cell>
        <Charts options={chartOptions} />
      </Ternary>
      <CardFooter horizontal={-Spacing.extraSmall}>
        <Row align="space-between">
          <Cell />
          <Cell>
            {crest ? <CrestInfo crest={crest} /> : null}
            <RateOfChange gage={gage} />
            <HistoricEvents floodEvents={gage?.locationInfo?.floodEvents ?? []} />
          </Cell>
          {/* Refresh Icon */}
          <Ternary condition={isMobile}>
            <Cell />
            <Ternary condition={gagesStore.isFetching}>
              <Cell width={Spacing.larger} height={Spacing.larger} align="center">
                <ActivityIndicator animating />
              </Cell>
              <IconButton
                small
                icon="rotate-cw"
                iconSize={Spacing.large}
                onPress={refetchData}
                textColor={Colors.midGrey}
              />
            </Ternary>
          </Ternary>
        </Row>
      </CardFooter>
    </Card>
  );
});

const $pickerStyle: TextStyle = {
  paddingVertical: Spacing.tiny,
  paddingHorizontal: Spacing.small,
  borderColor: Colors.lightGrey,
  color: Colors.lightDark,
  borderRadius: Spacing.tiny,
};

const $pickerSelectorStyle: ViewStyle = {
  paddingVertical: Spacing.tiny,
  paddingLeft: Spacing.small,
  paddingRight: Spacing.tiny,
  borderColor: Colors.lightGrey,
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
};

const $bottomSheetStyle: ViewStyle = {
  borderTopLeftRadius: Spacing.small,
  borderTopRightRadius: Spacing.small,
  backgroundColor: Colors.white,
  shadowColor: Colors.midGrey,
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: -8,
  shadowOffset: {
    width: 0,
    height: -4,
  },
};
