/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import React from "react";
import { DateRangePickerRangeV2 } from "../DateRangePickerRangeV2";

type MockButtonProps = {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

let capturedPickerOnChange: ((params: { startDate?: Date; endDate?: Date }) => void) | null = null;

jest.mock("react-native-ui-datepicker", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (params: { startDate?: Date; endDate?: Date }) => void }) => {
    capturedPickerOnChange = onChange;
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
  capturedPickerOnChange = null;
  onChange.mockClear();
});

describe("DateRangePickerRangeV2", () => {
  it("renders a trigger pill", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    expect(getByTestId("range-v2-trigger")).not.toBeNull();
  });

  it("renders Set and Cancel buttons after opening", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    expect(getByTestId("range-v2-set-button")).not.toBeNull();
    expect(getByTestId("range-v2-cancel-button")).not.toBeNull();
  });

  it("Set is enabled on open (proposed range = initial range)", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBeFalsy();
  });

  it("Set without tapping commits the unchanged range", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    fireEvent.press(getByTestId("range-v2-set-button"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [s, e] = onChange.mock.calls[0];
    expect(s.format("YYYY-MM-DD")).toBe("2026-04-20");
    expect(e.format("YYYY-MM-DD")).toBe("2026-04-25");
  });

  it("Cancel without tapping does not commit", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    fireEvent.press(getByTestId("range-v2-cancel-button"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables Set when picker reports an incomplete range (endDate undefined)", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBe(true);
  });

  it("does not fire onChange when picker reports an incomplete range", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("re-enables Set when picker reports a complete range", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    act(() => {
      capturedPickerOnChange!({
        startDate: dayjs("2026-04-22").toDate(),
        endDate: dayjs("2026-04-30").toDate(),
      });
    });
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBeFalsy();
  });

  it("does not fire onChange when picker reports a complete range — only after Set", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({
        startDate: dayjs("2026-04-22").toDate(),
        endDate: dayjs("2026-04-30").toDate(),
      });
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Set commits the picker-reported range", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    act(() => {
      capturedPickerOnChange!({
        startDate: dayjs("2026-04-22").toDate(),
        endDate: dayjs("2026-04-30").toDate(),
      });
    });
    fireEvent.press(getByTestId("range-v2-set-button"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [s, e] = onChange.mock.calls[0];
    expect(s.format("YYYY-MM-DD")).toBe("2026-04-22");
    expect(e.format("YYYY-MM-DD")).toBe("2026-04-30");
  });

  it("renders a Clear button after opening", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    expect(getByTestId("range-v2-clear-button")).not.toBeNull();
  });

  it("Clear disables Set and removes the proposed range", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    fireEvent.press(getByTestId("range-v2-clear-button"));
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBe(true);
  });

  it("Clear does not commit", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    fireEvent.press(getByTestId("range-v2-clear-button"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("after Clear, picking a start keeps Set disabled", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    fireEvent.press(getByTestId("range-v2-clear-button"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBe(true);
  });

  it("after Clear, picking a full range re-enables Set and commits correctly", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    fireEvent.press(getByTestId("range-v2-clear-button"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    act(() => {
      capturedPickerOnChange!({
        startDate: dayjs("2026-04-22").toDate(),
        endDate: dayjs("2026-04-30").toDate(),
      });
    });
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBeFalsy();
    fireEvent.press(getByTestId("range-v2-set-button"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const [s, e] = onChange.mock.calls[0];
    expect(s.format("YYYY-MM-DD")).toBe("2026-04-22");
    expect(e.format("YYYY-MM-DD")).toBe("2026-04-30");
  });

  it("Cancel after intermediate taps does not commit", () => {
    const { getByTestId } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });
    act(() => {
      capturedPickerOnChange!({
        startDate: dayjs("2026-04-22").toDate(),
        endDate: dayjs("2026-04-30").toDate(),
      });
    });
    fireEvent.press(getByTestId("range-v2-cancel-button"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("re-opening after a Set shows the freshly committed range with Set enabled", () => {
    // Drive a full Set cycle, then re-open and verify the proposed state mirrors
    // the (now identical) props on re-open.
    const { getByTestId, rerender } = render(<DateRangePickerRangeV2 {...baseProps} />);
    fireEvent.press(getByTestId("range-v2-trigger"));
    act(() => {
      capturedPickerOnChange!({
        startDate: dayjs("2026-05-01").toDate(),
        endDate: dayjs("2026-05-05").toDate(),
      });
    });
    fireEvent.press(getByTestId("range-v2-set-button"));

    // Caller would update props on commit; simulate that.
    rerender(
      <DateRangePickerRangeV2
        {...baseProps}
        startDate={dayjs("2026-05-01")}
        endDate={dayjs("2026-05-05")}
      />
    );

    onChange.mockClear();
    fireEvent.press(getByTestId("range-v2-trigger"));
    expect(getByTestId("range-v2-set-button").props.accessibilityState?.disabled).toBeFalsy();
    fireEvent.press(getByTestId("range-v2-set-button"));
    const [s, e] = onChange.mock.calls[0];
    expect(s.format("YYYY-MM-DD")).toBe("2026-05-01");
    expect(e.format("YYYY-MM-DD")).toBe("2026-05-05");
  });
});
