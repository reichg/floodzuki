/* eslint-disable @typescript-eslint/no-require-imports */
// src/common-ui/components/__tests__/SplitDateRangePicker.test.tsx
import { act, render } from "@testing-library/react-native";
import dayjs, { Dayjs } from "dayjs";
import React from "react";

// ---------------------------------------------------------------------------
// Import SUT after all mocks are registered
// ---------------------------------------------------------------------------
import { applyRangeRules } from "@common-ui/utils/dateRangeRules";
import { SplitDateRangePicker } from "../SplitDateRangePicker";

type MockChildrenProps = {
  children?: React.ReactNode;
};

type MockSingleDatePickerProps = {
  selectedDate?: Dayjs;
  onChange: (date: Dayjs) => void;
};

// ---------------------------------------------------------------------------
// applyRangeRules mock — deterministic: picked date wins for the chosen side
// ---------------------------------------------------------------------------
jest.mock("@common-ui/utils/dateRangeRules", () => ({
  applyRangeRules: jest.fn(
    (prev: { start: Dayjs; end: Dayjs }, picked: Dayjs, side: "start" | "end") => ({
      start: side === "start" ? picked : prev.start,
      end: side === "end" ? picked : prev.end,
    })
  ),
}));

// ---------------------------------------------------------------------------
// @services/localDayJs mock
// Extend dayjs with tz support so .tz() works on both instances and static.
// ---------------------------------------------------------------------------
jest.mock("@services/localDayJs", () => {
  const dayjsModule = require("dayjs");
  const utcPlugin = require("dayjs/plugin/utc").default ?? require("dayjs/plugin/utc");
  const tzPlugin = require("dayjs/plugin/timezone").default ?? require("dayjs/plugin/timezone");
  dayjsModule.extend(utcPlugin);
  dayjsModule.extend(tzPlugin);
  // Attach a static .tz() that matches localDayJs.tz(str, fmt, tz) usage
  dayjsModule.tz = (str: string, fmt: string, tz: string) => dayjsModule(str, fmt).tz(tz, true);
  return dayjsModule;
});

// ---------------------------------------------------------------------------
// @common-ui/contexts/LocaleContext mock
// ---------------------------------------------------------------------------
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

// ---------------------------------------------------------------------------
// Icon mock
// ---------------------------------------------------------------------------
jest.mock("../Icon", () => () => null);

// ---------------------------------------------------------------------------
// Text mock
// ---------------------------------------------------------------------------
jest.mock("../Text", () => ({
  RegularText: () => null,
}));

// ---------------------------------------------------------------------------
// Common mock
// ---------------------------------------------------------------------------
jest.mock("../Common", () => {
  const ReactModule = require("react");
  return {
    Cell: ({ children }: MockChildrenProps) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

// ---------------------------------------------------------------------------
// SingleDatePicker mock — captures onChange per selectedDate key
// ---------------------------------------------------------------------------
const pickerOnChangeMap: Record<string, (d: Dayjs) => void> = {};

jest.mock("../SingleDatePicker", () => {
  const ReactModule = require("react");
  return {
    SingleDatePicker: ({ selectedDate, onChange }: MockSingleDatePickerProps) => {
      const key = selectedDate?.format("YYYY-MM-DD") ?? "unknown";
      pickerOnChangeMap[key] = onChange;
      return ReactModule.createElement("Text", { testID: `picker-${key}` }, key);
    },
  };
});

// ---------------------------------------------------------------------------
// SingleDatePickerNative mock — same shape
// ---------------------------------------------------------------------------
jest.mock("../SingleDatePickerNative", () => {
  const ReactModule = require("react");
  return {
    SingleDatePickerNative: ({ selectedDate, onChange }: MockSingleDatePickerProps) => {
      const key = selectedDate?.format("YYYY-MM-DD") ?? "unknown";
      pickerOnChangeMap[key] = onChange;
      return ReactModule.createElement("Text", { testID: `picker-${key}` }, key);
    },
  };
});

const mockApplyRangeRules = applyRangeRules as jest.Mock;

const TIMEZONE = "America/Los_Angeles";
const startDate = dayjs("2022-01-01");
const endDate = dayjs("2022-01-31");

const DEFAULT_PROPS = {
  startDate,
  endDate,
  timezone: TIMEZONE,
  onChange: jest.fn(),
};

describe("SplitDateRangePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(pickerOnChangeMap).forEach((k) => delete pickerOnChangeMap[k]);
  });

  // -------------------------------------------------------------------------
  // Test 1: renders formatted start and end dates
  // -------------------------------------------------------------------------
  it("renders the formatted start and end dates in the two picker components", () => {
    const { getByTestId } = render(<SplitDateRangePicker {...DEFAULT_PROPS} />);

    expect(getByTestId("picker-2022-01-01")).toBeTruthy();
    expect(getByTestId("picker-2022-01-31")).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Test 2: start picker fires onChange → applyRangeRules called with "start"
  // -------------------------------------------------------------------------
  it("calls applyRangeRules with side='start' and notifies parent onChange when start picker fires", () => {
    const onChange = jest.fn();
    render(<SplitDateRangePicker {...DEFAULT_PROPS} onChange={onChange} />);

    const picked = dayjs("2022-01-15");
    act(() => {
      pickerOnChangeMap["2022-01-01"]?.(picked);
    });

    expect(mockApplyRangeRules).toHaveBeenCalledTimes(1);
    const [, calledPicked, calledSide] = mockApplyRangeRules.mock.calls[0];
    expect(calledSide).toBe("start");
    expect(calledPicked.format("YYYY-MM-DD")).toBe("2022-01-15");

    expect(onChange).toHaveBeenCalledTimes(1);
    const [newStart, newEnd] = onChange.mock.calls[0] as [Dayjs, Dayjs];
    expect(newStart.format("YYYY-MM-DD")).toBe("2022-01-15");
    expect(newEnd.format("YYYY-MM-DD")).toBe("2022-01-31");
  });

  // -------------------------------------------------------------------------
  // Test 3: end picker fires onChange → applyRangeRules called with "end"
  // -------------------------------------------------------------------------
  it("calls applyRangeRules with side='end' and notifies parent onChange when end picker fires", () => {
    const onChange = jest.fn();
    render(<SplitDateRangePicker {...DEFAULT_PROPS} onChange={onChange} />);

    const picked = dayjs("2022-01-28");
    act(() => {
      pickerOnChangeMap["2022-01-31"]?.(picked);
    });

    expect(mockApplyRangeRules).toHaveBeenCalledTimes(1);
    const [, calledPicked, calledSide] = mockApplyRangeRules.mock.calls[0];
    expect(calledSide).toBe("end");
    expect(calledPicked.format("YYYY-MM-DD")).toBe("2022-01-28");

    expect(onChange).toHaveBeenCalledTimes(1);
    const [newStart, newEnd] = onChange.mock.calls[0] as [Dayjs, Dayjs];
    expect(newStart.format("YYYY-MM-DD")).toBe("2022-01-01");
    expect(newEnd.format("YYYY-MM-DD")).toBe("2022-01-28");
  });

  // -------------------------------------------------------------------------
  // Test 4: updates displayed start when startDate prop changes externally
  // -------------------------------------------------------------------------
  it("updates displayed start when startDate prop changes externally", () => {
    const onChange = jest.fn();
    const { rerender, getByTestId } = render(
      <SplitDateRangePicker {...DEFAULT_PROPS} onChange={onChange} />
    );

    rerender(
      <SplitDateRangePicker
        {...DEFAULT_PROPS}
        startDate={dayjs("2021-11-15")}
        onChange={onChange}
      />
    );

    expect(getByTestId("picker-2021-11-15")).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Test 5: updates displayed end when endDate prop changes externally
  // -------------------------------------------------------------------------
  it("updates displayed end when endDate prop changes externally", () => {
    const onChange = jest.fn();
    const { rerender, getByTestId } = render(
      <SplitDateRangePicker {...DEFAULT_PROPS} onChange={onChange} />
    );

    rerender(
      <SplitDateRangePicker {...DEFAULT_PROPS} endDate={dayjs("2022-03-15")} onChange={onChange} />
    );

    expect(getByTestId("picker-2022-03-15")).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Test 6: resolvedMinDate falls back to 2019-10-01 when minDate not provided
  // -------------------------------------------------------------------------
  it("resolvedMinDate falls back to 2019-10-01 when minDate prop is not provided", () => {
    const onChange = jest.fn();
    render(<SplitDateRangePicker {...DEFAULT_PROPS} onChange={onChange} />);

    // Trigger a pick so applyRangeRules is called with the bounds
    const picked = dayjs("2022-01-15");
    act(() => {
      pickerOnChangeMap["2022-01-01"]?.(picked);
    });

    expect(mockApplyRangeRules).toHaveBeenCalledTimes(1);
    const [, , , bounds] = mockApplyRangeRules.mock.calls[0];
    expect(bounds.minDate.format("YYYY-MM-DD")).toBe("2019-10-01");
  });
});
