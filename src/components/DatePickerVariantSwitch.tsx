import DateRangePicker from "@common-ui/components/DateRangePicker";
import { DateRangePickerRangeV1 } from "@common-ui/components/DateRangePickerRangeV1";
import { DateRangePickerRangeV2 } from "@common-ui/components/DateRangePickerRangeV2";
import { SplitDateRangePicker } from "@common-ui/components/SplitDateRangePicker";
import Config from "@config/config";
import { Dayjs } from "dayjs";

// react-native-ui-datepicker installs a side-effect polyfill that replaces
// Date.prototype.toLocaleString with a non-en-US format. Dayjs's timezone
// plugin parses the original en-US format internally, so the override breaks
// every .tz() call app-wide. The polyfill stashes the original at
// _toLocaleString — restore it now that the package's imports have evaluated.
const proto = Date.prototype as Date & { _toLocaleString?: Date["toLocaleString"] };
if (proto._toLocaleString) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Date.prototype, "toLocaleString", {
    value: proto._toLocaleString,
    configurable: true,
    writable: true,
  });
  Reflect.deleteProperty(proto, "_toLocaleString");
}

type DatePickerVariantSwitchProps = {
  locationId: string | undefined;
  startDate: Dayjs;
  endDate: Dayjs;
  timezone: string;
  onChange: (startDate: Dayjs, endDate: Dayjs) => void;
  onRangeRestricted?: () => void;
};

const DatePickerVariantSwitch = (props: DatePickerVariantSwitchProps) => {
  const { locationId, startDate, endDate, timezone, onChange, onRangeRestricted } = props;

  const variant =
    (locationId ? Config.DATE_PICKER_VARIANT.byLocationId[locationId] : undefined) ??
    Config.DATE_PICKER_VARIANT.default;

  if (variant === "split-v1") {
    return (
      <SplitDateRangePicker
        startDate={startDate}
        endDate={endDate}
        timezone={timezone}
        onChange={onChange}
        onRangeRestricted={onRangeRestricted}
      />
    );
  }

  if (variant === "range-v1") {
    return (
      <DateRangePickerRangeV1
        startDate={startDate}
        endDate={endDate}
        timezone={timezone}
        onChange={onChange}
        onRangeRestricted={onRangeRestricted}
      />
    );
  }

  if (variant === "range-v2") {
    return (
      <DateRangePickerRangeV2
        startDate={startDate}
        endDate={endDate}
        timezone={timezone}
        onChange={onChange}
        onRangeRestricted={onRangeRestricted}
      />
    );
  }

  return (
    <DateRangePicker
      startDate={startDate}
      endDate={endDate}
      timezone={timezone}
      onChange={onChange}
    />
  );
};

export default DatePickerVariantSwitch;
