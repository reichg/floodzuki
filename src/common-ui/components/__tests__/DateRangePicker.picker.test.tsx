/* eslint-disable @typescript-eslint/no-require-imports */
import localDayJs from "@services/localDayJs";
import { act, fireEvent, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import React from "react";
import { DateRangePickerRangeV1 } from "../DateRangePickerRangeV1";

type PickerChangeParams = {
  startDate?: Date;
  endDate?: Date;
};

type MockDatePickerProps = {
  startDate?: string;
  endDate?: string;
  minDate?: string;
  maxDate?: string;
  onChange?: (params: PickerChangeParams) => void;
};

type MockButtonProps = {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

let capturedProps: {
  startDate?: string;
  endDate?: string;
  minDate?: string;
  maxDate?: string;
  onChange?: (params: { startDate?: Date; endDate?: Date }) => void;
} = {};

jest.mock("react-native-ui-datepicker", () => ({
  __esModule: true,
  default: (props: MockDatePickerProps) => {
    capturedProps = props;
    return null;
  },
  useDefaultStyles: () => ({}),
}));

jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BottomSheetView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@common-ui/contexts/DatePickerContext", () => ({
  useDatePicker: () => ({ showPicker: jest.fn(), hidePicker: jest.fn() }),
}));

// Button.tsx's BaseButton swallows testID. Mock so testID propagates to the rendered tree.
jest.mock("@common-ui/components/Button", () => {
  const ReactModule = require("react");
  const { Pressable } = require("react-native");
  const renderButton = ({ title, onPress, disabled, testID }: MockButtonProps) =>
    ReactModule.createElement(
      Pressable,
      {
        onPress,
        disabled: !!disabled,
        testID,
        accessibilityRole: "button",
        accessibilityLabel: title,
        accessibilityState: { disabled: !!disabled },
      },
      null
    );
  return {
    SolidButton: renderButton,
    OutlinedButton: renderButton,
  };
});

jest.mock("@common-ui/components/Icon", () => () => null);

jest.mock("@common-ui/components/Text", () => ({
  RegularText: () => null,
}));

const startDate = dayjs("2026-04-20");
const endDate = dayjs("2026-04-25");
const onChange = jest.fn();
const baseProps = { startDate, endDate, timezone: "America/Los_Angeles", onChange };

beforeEach(() => {
  capturedProps = {};
  onChange.mockClear();
});

describe("DateRangePickerRangeV1 — picker props", () => {
  it("passes startDate and endDate as YYYY-MM-DD strings matching initial props", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    expect(capturedProps.startDate).toBe("2026-04-20");
    expect(capturedProps.endDate).toBe("2026-04-25");
  });

  it("passes minDate = 2019-10-01 by default", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    expect(capturedProps.minDate).toBe("2019-10-01");
  });

  it("passes maxDate = today by default", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    // "today" must be compared in the gauge tz, not the system tz — otherwise
    // this test flakes when real-world UTC date != gauge tz date (e.g. early
    // UTC morning vs late evening in LA).
    // capturedProps.maxDate is already a "YYYY-MM-DD" string in the gauge tz,
    // so compare directly to today in the gauge tz.
    const todayInGaugeTz = localDayJs().tz(baseProps.timezone).format("YYYY-MM-DD");
    expect(capturedProps.maxDate).toBe(todayInGaugeTz);
  });

  it("updates maxDate prop to clamped tapped+30 after a Case 2a first tap", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    // First tap inside range → maxDate should be min(tapped + 30, today)
    act(() => {
      capturedProps.onChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });

    // After re-render: maxDate prop should update
    // tapped + 30 = 2026-05-22, today = ~2026-05-03 → clamped to today
    // maxDate must not exceed today in the gauge tz (see flakiness note above).
    const todayInGaugeTz = localDayJs().tz(baseProps.timezone).format("YYYY-MM-DD");
    expect(capturedProps.maxDate).toBeDefined();
    expect(capturedProps.maxDate && capturedProps.maxDate <= todayInGaugeTz).toBe(true);
  });

  it("renders Set and Cancel buttons below the calendar", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));
    expect(getByTestId("range-v1-set-button")).not.toBeNull();
    expect(getByTestId("range-v1-cancel-button")).not.toBeNull();
  });

  it("onChange fires only when Set is pressed, not on picker tap", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));
    // Tap outside range (Case 2d)
    act(() => {
      capturedProps.onChange!({ startDate: dayjs("2026-04-29").toDate(), endDate: undefined });
    });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("range-v1-set-button"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
