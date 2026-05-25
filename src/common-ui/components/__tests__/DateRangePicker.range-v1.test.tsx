/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import React from "react";
import { DateRangePickerRangeV1 } from "../DateRangePickerRangeV1";

type MockButtonProps = {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

// Capture the onChange handler so tests can trigger picker events
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

// Button.tsx's BaseButton swallows testID (only a fixed prop set is forwarded to its inner
// Pressable). Mock the buttons so testID and disabled state propagate to the rendered tree.
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

describe("DateRangePickerRangeV1", () => {
  it("renders a trigger pill showing both dates", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    expect(getByTestId("range-v1-trigger")).not.toBeNull();
  });

  it("renders Set and Cancel buttons after opening", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));
    expect(getByTestId("range-v1-set-button")).not.toBeNull();
    expect(getByTestId("range-v1-cancel-button")).not.toBeNull();
  });

  it("Set button is enabled on open (proposed range = initial range)", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));
    const setButton = getByTestId("range-v1-set-button");
    // accessibilityState.disabled is false or undefined when enabled
    expect(setButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  describe("Case 2a — tap within existing range", () => {
    it("disables Set button after first tap inside range", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));

      // Simulate first tap: real library reports {startDate: existing_start, endDate: tap}
      // when the click is within the existing range
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-20").toDate(),
          endDate: dayjs("2026-04-22").toDate(),
        });
      });

      const setButton = getByTestId("range-v1-set-button");
      expect(setButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("does not fire onChange after first tap inside range", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("re-enables Set button after second tap (end date selected)", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
      });
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-22").toDate(),
          endDate: dayjs("2026-04-30").toDate(),
        });
      });

      const setButton = getByTestId("range-v1-set-button");
      expect(setButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("does not fire onChange after second tap — only after Set is pressed", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
      });
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-22").toDate(),
          endDate: dayjs("2026-04-30").toDate(),
        });
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("fires onChange once with [tentativeStart, endDate] when Set is pressed", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
      });
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-22").toDate(),
          endDate: dayjs("2026-04-30").toDate(),
        });
      });
      fireEvent.press(getByTestId("range-v1-set-button"));

      expect(onChange).toHaveBeenCalledTimes(1);
      const [calledStart, calledEnd] = onChange.mock.calls[0];
      expect(calledStart.format("YYYY-MM-DD")).toBe("2026-04-22");
      expect(calledEnd.format("YYYY-MM-DD")).toBe("2026-04-30");
    });

    it("does not fire onChange when Cancel is pressed after first tap", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
      });
      fireEvent.press(getByTestId("range-v1-cancel-button"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("accepts second tap before tentativeStart when library emits a reversed complete pair", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));

      // First tap inside [Apr 20, Apr 25] → awaitingEnd, tentativeStart = Apr 22
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-20").toDate(),
          endDate: dayjs("2026-04-22").toDate(),
        });
      });

      // Second tap before tentativeStart: library reverses to {Apr 18, Apr 22}
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-18").toDate(),
          endDate: dayjs("2026-04-22").toDate(),
        });
      });

      expect(getByTestId("range-v1-set-button").props.accessibilityState?.disabled).toBeFalsy();
      fireEvent.press(getByTestId("range-v1-set-button"));
      expect(onChange).toHaveBeenCalledTimes(1);
      const [s, e] = onChange.mock.calls[0];
      expect(s.format("YYYY-MM-DD")).toBe("2026-04-18");
      expect(e.format("YYYY-MM-DD")).toBe("2026-04-22");
    });

    it("reconstructs range when library restarts selection on second tap before tentativeStart", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));

      // First tap inside [Apr 20, Apr 25] → awaitingEnd, tentativeStart = Apr 22
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-04-20").toDate(),
          endDate: dayjs("2026-04-22").toDate(),
        });
      });

      // Second tap before tentativeStart: library restarts (only startDate emitted)
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-18").toDate(), endDate: undefined });
      });

      expect(getByTestId("range-v1-set-button").props.accessibilityState?.disabled).toBeFalsy();
      fireEvent.press(getByTestId("range-v1-set-button"));
      expect(onChange).toHaveBeenCalledTimes(1);
      const [s, e] = onChange.mock.calls[0];
      expect(s.format("YYYY-MM-DD")).toBe("2026-04-18");
      expect(e.format("YYYY-MM-DD")).toBe("2026-04-22");
    });
  });

  describe("Cases 2b–2e — single-tap range update", () => {
    it("enables Set button after a single tap outside the range", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      // Case 2b: tap before prevStart
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-10").toDate(), endDate: undefined });
      });

      const setButton = getByTestId("range-v1-set-button");
      expect(setButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("does not fire onChange on tap outside range — only after Set", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-10").toDate(), endDate: undefined });
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("fires onChange with computed range when Set is pressed after a 2b tap", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-10").toDate(), endDate: undefined });
      });
      fireEvent.press(getByTestId("range-v1-set-button"));

      expect(onChange).toHaveBeenCalledTimes(1);
      const [calledStart, calledEnd] = onChange.mock.calls[0];
      expect(calledStart.format("YYYY-MM-DD")).toBe("2026-04-10");
      expect(calledEnd.format("YYYY-MM-DD")).toBe("2026-04-25"); // prevEnd kept (within 30 days)
    });

    it("does not fire onChange when Cancel is pressed after a tap outside range", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-04-10").toDate(), endDate: undefined });
      });
      fireEvent.press(getByTestId("range-v1-cancel-button"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("re-anchors after each completed tap so subsequent taps classify against the new range", () => {
      // Spec iterative example: open with [04-20, 04-25], span=5
      // Tap 2026-01-01 → Case 2c → proposed [01-01, 01-06]; anchor re-sets to [01-01, 01-06]
      // Tap 2026-01-15 → now Case 2d (9d after 01-06) against new anchor → proposed [01-01, 01-15]
      // Set → onChange([01-01, 01-15])
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));

      // First tap: far before prevStart → Case 2c, span preserved → [01-01, 01-06]
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-01-01").toDate(), endDate: undefined });
      });

      // Second tap: 9 days after the new prevEnd (01-06) → Case 2d against the re-anchored range
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-01-15").toDate(), endDate: undefined });
      });

      fireEvent.press(getByTestId("range-v1-set-button"));

      expect(onChange).toHaveBeenCalledTimes(1);
      const [calledStart, calledEnd] = onChange.mock.calls[0];
      // If re-anchoring is missing, the second tap would classify against [04-20, 04-25] (the
      // original prop range, 95 days after) and produce a Case 2c shift (span preserved from
      // 01-15), giving [01-15, 01-20] instead.
      expect(calledStart.format("YYYY-MM-DD")).toBe("2026-01-01");
      expect(calledEnd.format("YYYY-MM-DD")).toBe("2026-01-15");
    });
  });

  describe("Clear button", () => {
    it("renders a Clear button after opening", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      expect(getByTestId("range-v1-clear-button")).not.toBeNull();
    });

    it("disables Set button after pressing Clear", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      fireEvent.press(getByTestId("range-v1-clear-button"));
      const setButton = getByTestId("range-v1-set-button");
      expect(setButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("does not fire onChange when Set is pressed after Clear", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      fireEvent.press(getByTestId("range-v1-clear-button"));
      fireEvent.press(getByTestId("range-v1-set-button"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("after Clear, single tap enters awaiting-end (Set stays disabled, no onChange)", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      fireEvent.press(getByTestId("range-v1-clear-button"));

      // Library emits {startDate: tap1, endDate: undefined} on first click in a fresh range
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-05-10").toDate(), endDate: undefined });
      });

      expect(getByTestId("range-v1-set-button").props.accessibilityState?.disabled).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("after Clear, two taps complete a range and Set commits it", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      fireEvent.press(getByTestId("range-v1-clear-button"));

      // First tap: library emits {startDate: tap1, endDate: undefined}
      act(() => {
        capturedPickerOnChange!({ startDate: dayjs("2026-05-10").toDate(), endDate: undefined });
      });

      // Second tap: library emits an ordered pair {startDate: tap1, endDate: tap2}
      act(() => {
        capturedPickerOnChange!({
          startDate: dayjs("2026-05-10").toDate(),
          endDate: dayjs("2026-05-15").toDate(),
        });
      });

      expect(getByTestId("range-v1-set-button").props.accessibilityState?.disabled).toBeFalsy();
      fireEvent.press(getByTestId("range-v1-set-button"));

      expect(onChange).toHaveBeenCalledTimes(1);
      const [s, e] = onChange.mock.calls[0];
      expect(s.format("YYYY-MM-DD")).toBe("2026-05-10");
      expect(e.format("YYYY-MM-DD")).toBe("2026-05-15");
    });

    it("Cancel after Clear preserves the committed range on reopen", () => {
      const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
      fireEvent.press(getByTestId("range-v1-trigger"));
      fireEvent.press(getByTestId("range-v1-clear-button"));
      fireEvent.press(getByTestId("range-v1-cancel-button"));

      // Reopen — handleOpen resets proposed dates from props
      fireEvent.press(getByTestId("range-v1-trigger"));
      expect(getByTestId("range-v1-set-button").props.accessibilityState?.disabled).toBeFalsy();

      fireEvent.press(getByTestId("range-v1-set-button"));
      expect(onChange).toHaveBeenCalledTimes(1);
      const [s, e] = onChange.mock.calls[0];
      expect(s.format("YYYY-MM-DD")).toBe("2026-04-20");
      expect(e.format("YYYY-MM-DD")).toBe("2026-04-25");
    });
  });
});
