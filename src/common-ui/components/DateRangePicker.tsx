import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import Config from "@config/config";
import localDayJs from "@services/localDayJs";
import { Dayjs } from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ViewStyle } from "react-native";
import { Cell } from "./Common";
import DatePicker from "./DatePicker";
import Icon from "./Icon";
import { RegularText } from "./Text";

type DateRangePickerProps = {
  startDate: Dayjs;
  endDate: Dayjs;
  timezone: string;
  maxRange?: number; // in days
  minYear?: number;
  maxYear?: number;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
};

type DatePickerHandle = {
  open: () => void;
  close: () => void;
  isPickerOpen: () => boolean;
};

const DateRangePicker = (props: DateRangePickerProps) => {
  const {
    startDate,
    endDate,
    timezone,
    maxRange = Config.MAX_DATE_PICKER_RANGE,
    minYear = 2001,
    maxYear = localDayJs().tz(timezone).year(),
    onChange,
  } = props;

  const { t } = useLocale();

  const startRef = useRef<DatePickerHandle | null>(null);
  const endRef = useRef<DatePickerHandle | null>(null);

  const [start, setStart] = useState<Dayjs>(startDate);
  const [end, setEnd] = useState<Dayjs>(endDate);
  const mode = useRef<"start" | "end">("start");

  useEffect(() => {
    setStart(startDate);
  }, [startDate]);

  useEffect(() => {
    setEnd(endDate);
  }, [endDate]);

  const openDateSelector = () => {
    if (mode.current === "start") {
      if (startRef.current?.isPickerOpen()) {
        startRef.current?.close();
      } else {
        startRef.current?.open();
      }
    } else {
      if (endRef.current?.isPickerOpen()) {
        endRef.current?.close();
      } else {
        endRef.current?.open();
      }
    }
  };

  const handleStartDateChange = (date: Dayjs) => {
    const today = localDayJs().tz(timezone).endOf("day");
    let dateStart = date;

    mode.current = "end";

    if (date.isAfter(today)) {
      dateStart = today.subtract(1, "day");
    }

    setStart(dateStart);
    openDateSelector();
  };

  const handleEndDateChange = (date: Dayjs) => {
    const today = localDayJs().tz(timezone).endOf("day");

    let dateEnd = date;

    if (date.isAfter(today)) {
      dateEnd = today;
    }

    const daysDiff = Math.abs(dateEnd.clone().diff(start, "day"));

    mode.current = "start";

    if (daysDiff > maxRange) {
      dateEnd = start.clone().add(maxRange, "day");
    }

    setEnd(dateEnd);

    onChange(start, dateEnd);
  };

  return (
    <Pressable style={$viewStyle} onPress={openDateSelector}>
      <Icon
        name="calendar"
        color={Colors.darkGrey}
        size={Spacing.medium}
        right={Spacing.extraSmall}
      />
      <DatePicker
        title={t("datePicker.startDate")}
        ref={startRef}
        selectedDate={start}
        minYear={minYear}
        maxYear={maxYear}
        onChange={handleStartDateChange}
      />
      <Cell left={Spacing.tiny} right={Spacing.tiny}>
        <RegularText>-</RegularText>
      </Cell>
      <DatePicker
        title={t("datePicker.endDate")}
        ref={endRef}
        selectedDate={end}
        minYear={minYear}
        maxYear={maxYear}
        onChange={handleEndDateChange}
      />
    </Pressable>
  );
};

const $viewStyle: ViewStyle = {
  flexDirection: "row",
  borderWidth: 1,
  borderRadius: Spacing.tiny,
  borderColor: Colors.lightGrey,
  paddingVertical: Spacing.extraSmall,
  paddingHorizontal: Spacing.small,
};

export default DateRangePicker;
