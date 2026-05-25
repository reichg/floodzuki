import { Cell } from "@common-ui/components/Common";
import Icon from "@common-ui/components/Icon";
import { SingleDatePicker } from "@common-ui/components/SingleDatePicker";
import { SingleDatePickerNative } from "@common-ui/components/SingleDatePickerNative";
import { RegularText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { applyRangeRules } from "@common-ui/utils/dateRangeRules";
import Config from "@config/config";
import localDayJs from "@services/localDayJs";
import { Dayjs } from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, View, ViewStyle } from "react-native";

export type SplitDateRangePickerProps = {
  startDate: Dayjs;
  endDate: Dayjs;
  maxRange?: number; // default MAX_DATE_PICKER_RANGE
  minDate?: Dayjs; // default 2019-10-01 start-of-day in timezone
  maxDate?: Dayjs; // default today end-of-day in chart tz
  timezone: string;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
  onRangeRestricted?: () => void;
};

const isNative = Platform.OS !== "web";

export const SplitDateRangePicker = (props: SplitDateRangePickerProps) => {
  const {
    startDate,
    endDate,
    maxRange = Config.MAX_DATE_PICKER_RANGE,
    minDate,
    maxDate,
    timezone,
    onChange,
    onRangeRestricted,
  } = props;

  // ---------------------------------------------------------------------------
  // Local state — synced from props
  // ---------------------------------------------------------------------------
  const [start, setStart] = useState<Dayjs>(startDate);
  const [end, setEnd] = useState<Dayjs>(endDate);

  useEffect(() => {
    setStart(startDate);
  }, [startDate]);

  useEffect(() => {
    setEnd(endDate);
  }, [endDate]);

  // ---------------------------------------------------------------------------
  // Bounds
  // ---------------------------------------------------------------------------
  const resolvedMinDate = useMemo(
    () => minDate ?? localDayJs.tz("2019-10-01", "YYYY-MM-DD", timezone).startOf("day"),
    [minDate, timezone]
  );
  const resolvedMaxDate = useMemo(
    () => maxDate ?? localDayJs().tz(timezone).endOf("day"),
    [maxDate, timezone]
  );

  // ---------------------------------------------------------------------------
  // Pick handler — applies range rules, updates state, fires onChange
  // ---------------------------------------------------------------------------
  const handlePick = (picked: Dayjs, side: "start" | "end") => {
    const bounds = {
      minDate: resolvedMinDate,
      maxDate: resolvedMaxDate,
      maxRange,
    };
    const result = applyRangeRules({ start, end }, picked, side, bounds);
    setStart(result.start);
    setEnd(result.end);
    onChange(result.start, result.end);
    if (result.wasRestricted) {
      onRangeRestricted?.();
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const PickerComponent = isNative ? SingleDatePickerNative : SingleDatePicker;

  return (
    <View style={$containerStyle}>
      {/* Start date pill */}
      <View style={$pillStyle}>
        <Icon
          name="calendar"
          color={Colors.darkGrey}
          size={Spacing.medium}
          right={Spacing.extraSmall}
        />
        <PickerComponent
          selectedDate={start}
          minDate={resolvedMinDate}
          maxDate={resolvedMaxDate}
          timezone={timezone}
          onChange={(picked) => handlePick(picked, "start")}
        />
      </View>

      {/* Separator */}
      <Cell left={Spacing.tiny} right={Spacing.tiny}>
        <RegularText>-</RegularText>
      </Cell>

      {/* End date pill */}
      <View style={$pillStyle}>
        <Icon
          name="calendar"
          color={Colors.darkGrey}
          size={Spacing.medium}
          right={Spacing.extraSmall}
        />
        <PickerComponent
          selectedDate={end}
          minDate={resolvedMinDate}
          maxDate={resolvedMaxDate}
          timezone={timezone}
          onChange={(picked) => handlePick(picked, "end")}
        />
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const $containerStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
};

const $pillStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  borderColor: Colors.lightGrey,
  paddingVertical: Spacing.extraSmall,
  paddingHorizontal: Spacing.small,
};

export default SplitDateRangePicker;
