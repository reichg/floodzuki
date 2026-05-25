/* eslint-disable @typescript-eslint/no-require-imports */
// src/common-ui/components/__tests__/SingleDatePickerNative.test.tsx
import { act, fireEvent, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import React from "react";
import { SingleDatePickerNative } from "../SingleDatePickerNative";

type MockChildrenProps = {
  children?: React.ReactNode;
};

type MockBottomSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

type PickerEvent = {
  type: "set" | "dismissed";
  nativeEvent?: object;
};

type PickerChangeHandler = (event: PickerEvent, date?: Date) => void;

type AndroidOpenOptions = {
  onChange: PickerChangeHandler;
};

type MockDateTimePickerProps = {
  onChange: PickerChangeHandler;
};

type MockTextProps = {
  text?: string;
};

type MockButtonProps = {
  title?: string;
  onPress?: () => void;
};

// ---------------------------------------------------------------------------
// @services/localDayJs mock — extend dayjs with the timezone plugin so that
// instances have a .tz() method (the static-only shortcut is insufficient).
// ---------------------------------------------------------------------------
jest.mock("@services/localDayJs", () => {
  const dayjsModule = require("dayjs");
  const utcPlugin = require("dayjs/plugin/utc").default ?? require("dayjs/plugin/utc");
  const tzPlugin = require("dayjs/plugin/timezone").default ?? require("dayjs/plugin/timezone");
  dayjsModule.extend(utcPlugin);
  dayjsModule.extend(tzPlugin);
  return dayjsModule;
});

// ---------------------------------------------------------------------------
// @gorhom/bottom-sheet mock (same pattern as DatePicker.native.test.tsx)
// Variable names must be prefixed with "mock" to be allowed inside jest.mock()
// factory closures after babel-jest hoisting.
// ---------------------------------------------------------------------------
const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock("@gorhom/bottom-sheet", () => {
  const ReactModule: typeof React = require("react");
  const MockBottomSheetModal = ReactModule.forwardRef<MockBottomSheetHandle, MockChildrenProps>(
    ({ children }, ref) => {
      ReactModule.useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: mockDismiss,
      }));
      return ReactModule.createElement(ReactModule.Fragment, null, children);
    }
  );
  MockBottomSheetModal.displayName = "MockBottomSheetModal";
  const MockBottomSheetView = ({ children }: MockChildrenProps) =>
    ReactModule.createElement(ReactModule.Fragment, null, children);
  return {
    BottomSheetModal: MockBottomSheetModal,
    BottomSheetView: MockBottomSheetView,
  };
});

// ---------------------------------------------------------------------------
// @react-native-community/datetimepicker mock
//
// DateTimePicker (default export): captures the `onChange` prop so tests can
// trigger picker changes via capturedMockPickerOnChange.
// DateTimePickerAndroid.open: delegated through mockAndroidOpenFn so the
// reference is stable across jest-mock hoisting.
// ---------------------------------------------------------------------------
const mockAndroidOpenFn = jest.fn<void, [AndroidOpenOptions]>() as jest.MockedFunction<
  (options: AndroidOpenOptions) => void
> & {
  _capturePickerOnChange?: PickerChangeHandler;
};

jest.mock("@react-native-community/datetimepicker", () => {
  const ReactModule = require("react");

  const MockDateTimePicker = ({ onChange }: MockDateTimePickerProps) => {
    // Store the onChange via a module-level setter so tests can trigger changes.
    // We can't reference the outer let directly (not a `mock`-prefixed name),
    // but we CAN call a mock-prefixed function as a side channel.
    mockAndroidOpenFn._capturePickerOnChange = onChange;
    return ReactModule.createElement("View", { testID: "mock-datetimepicker" }, null);
  };
  MockDateTimePicker.displayName = "MockDateTimePicker";

  return {
    __esModule: true,
    default: MockDateTimePicker,
    DateTimePickerAndroid: {
      open: (options: AndroidOpenOptions) => mockAndroidOpenFn(options),
    },
  };
});

// ---------------------------------------------------------------------------
// Stub heavy UI dependencies
// ---------------------------------------------------------------------------
jest.mock("@common-ui/components/Text", () => ({
  RegularText: ({ text }: MockTextProps) => {
    const ReactModule = require("react");
    const { Text } = require("react-native");
    return ReactModule.createElement(Text, { testID: "date-text" }, text);
  },
}));

jest.mock("@common-ui/components/Button", () => ({
  SolidButton: ({ title, onPress }: MockButtonProps) => {
    const ReactModule = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return ReactModule.createElement(
      TouchableOpacity,
      { testID: "done-button", onPress },
      ReactModule.createElement(Text, null, title)
    );
  },
}));

jest.mock("@common-ui/components/Common", () => {
  const ReactModule = require("react");
  const Pass = ({ children }: MockChildrenProps) =>
    ReactModule.createElement(ReactModule.Fragment, null, children ?? null);
  return { Cell: Pass, Row: Pass };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native");
  return {
    ScrollView: RN.ScrollView,
    GestureHandlerRootView: RN.View,
  };
});

jest.mock("react-native-reanimated", () => ({
  measure: jest.fn(() => null),
  useAnimatedRef: () => ({ current: null }),
  default: { createAnimatedComponent: <T,>(component: T) => component },
}));

// Helper to get the captured onChange from the inline DateTimePicker mock.
// The mock stores it as a property on mockAndroidOpenFn as a side channel.
function getPickerOnChange(): PickerChangeHandler | null {
  return mockAndroidOpenFn._capturePickerOnChange ?? null;
}

const GAUGE_TZ = "America/Los_Angeles";

// Native OS pickers emit a JS Date for "midnight on the picked day in the
// device's tz". Production assumes device tz == gauge tz, so to keep the test
// faithful regardless of the system tz the suite runs under, build picker-
// emitted dates as midnight in the gauge tz.
const MOCK_PICKER_DATE = dayjs.tz("2026-05-15", "YYYY-MM-DD", GAUGE_TZ).toDate();
const MOCK_PICKER_EVENT: PickerEvent = { type: "set", nativeEvent: {} };

const BASE_PROPS = {
  selectedDate: dayjs.tz("2026-04-01", "YYYY-MM-DD", GAUGE_TZ),
  minDate: dayjs.tz("2026-01-01", "YYYY-MM-DD", GAUGE_TZ),
  maxDate: dayjs.tz("2026-12-31", "YYYY-MM-DD", GAUGE_TZ),
  timezone: GAUGE_TZ,
  onChange: jest.fn(),
};

// ===========================================================================
// iOS tests
// ===========================================================================
describe("SingleDatePickerNative — iOS", () => {
  beforeAll(() => {
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    mockPresent.mockClear();
    mockDismiss.mockClear();
    mockAndroidOpenFn.mockClear();
    delete mockAndroidOpenFn._capturePickerOnChange;
    BASE_PROPS.onChange.mockClear();
  });

  it("smoke: renders without crashing", () => {
    expect(() => render(<SingleDatePickerNative {...BASE_PROPS} />)).not.toThrow();
  });

  it("Done without touching picker: calls onChange with the original selectedDate", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    // Open the bottom sheet by pressing the trigger text
    fireEvent.press(getByTestId("date-text"));

    // Press Done without changing the picker value
    act(() => {
      fireEvent.press(getByTestId("done-button"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    // Should commit the same calendar day as selectedDate
    expect(result.format("YYYY-MM-DD")).toBe("2026-04-01");
  });

  it("calls onChange with new date after picker change then Done", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    // Open the sheet
    fireEvent.press(getByTestId("date-text"));

    // Simulate the inline picker emitting a new date
    act(() => {
      const pickerOnChange = getPickerOnChange();
      expect(pickerOnChange).not.toBeNull();
      pickerOnChange!(MOCK_PICKER_EVENT, MOCK_PICKER_DATE);
    });

    // Press Done
    act(() => {
      fireEvent.press(getByTestId("done-button"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    expect(result.format("YYYY-MM-DD")).toBe("2026-05-15");
  });

  it("treats picked calendar day as gauge tz, not device tz", () => {
    // Simulates a device whose system tz differs from the gauge tz.
    // The OS picker emits a Date at *device-tz* midnight (here: UTC, the test
    // runner's tz). The component must commit the picked calendar day in gauge
    // tz, regardless of device tz.
    const deviceTzMidnight = new Date(2026, 5, 10); // Jun 10 00:00 in TZ=UTC

    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    fireEvent.press(getByTestId("date-text"));

    act(() => {
      const pickerOnChange = getPickerOnChange();
      pickerOnChange!(MOCK_PICKER_EVENT, deviceTzMidnight);
    });

    act(() => {
      fireEvent.press(getByTestId("done-button"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    expect(result.tz(GAUGE_TZ).format("YYYY-MM-DD")).toBe("2026-06-10");
  });
});

// ===========================================================================
// Android tests
// ===========================================================================
describe("SingleDatePickerNative — Android", () => {
  beforeAll(() => {
    require("react-native").Platform.OS = "android";
  });

  afterAll(() => {
    // Restore platform so other suites in the same Jest run are not affected
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    mockAndroidOpenFn.mockClear();
    BASE_PROPS.onChange.mockClear();
  });

  it("calls onChange when event.type === 'set' with a date", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    // Tap the trigger to open the Android dialog
    fireEvent.press(getByTestId("date-text"));

    expect(mockAndroidOpenFn).toHaveBeenCalledTimes(1);

    // Extract the onChange callback passed to DateTimePickerAndroid.open
    const openArgs = mockAndroidOpenFn.mock.calls[0][0];
    expect(openArgs).toHaveProperty("onChange");

    // Simulate the OS calling onChange with event.type === "set"
    act(() => {
      openArgs.onChange({ type: "set" }, dayjs.tz("2026-06-10", "YYYY-MM-DD", GAUGE_TZ).toDate());
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    expect(result.format("YYYY-MM-DD")).toBe("2026-06-10");
  });

  it("does NOT call onChange when event.type === 'dismissed'", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    fireEvent.press(getByTestId("date-text"));

    const openArgs = mockAndroidOpenFn.mock.calls[0][0];

    act(() => {
      openArgs.onChange({ type: "dismissed" }, undefined);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("treats picked calendar day as gauge tz, not device tz", () => {
    // See iOS counterpart — the OS picker emits a Date at device-tz midnight,
    // and the picked calendar day must round-trip to the same day in gauge tz.
    const deviceTzMidnight = new Date(2026, 5, 10); // Jun 10 00:00 in TZ=UTC

    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    fireEvent.press(getByTestId("date-text"));
    const openArgs = mockAndroidOpenFn.mock.calls[0][0];

    act(() => {
      openArgs.onChange({ type: "set" }, deviceTzMidnight);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    expect(result.tz(GAUGE_TZ).format("YYYY-MM-DD")).toBe("2026-06-10");
  });
});
