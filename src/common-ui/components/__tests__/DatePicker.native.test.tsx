/* eslint-disable @typescript-eslint/no-require-imports */
// src/common-ui/components/__tests__/DatePicker.native.test.tsx
import { act, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import React from "react";
import DatePickerComponent from "../DatePicker";

type DatePickerHandle = {
  open: () => void;
  close: () => void;
  isPickerOpen: () => boolean;
};

type MockBottomSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

type MockChildrenProps = {
  children?: React.ReactNode;
};

type MockConditionalProps = {
  condition?: boolean;
  children?: React.ReactNode;
};

type NativePlatformSelectOptions<T> = {
  ios?: T;
  native?: T;
  default?: T;
};

const selectNative = <T,>(obj: NativePlatformSelectOptions<T>) =>
  obj.ios ?? obj.native ?? obj.default;

jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  default: {
    OS: "ios",
    select: selectNative,
    isTesting: true,
  },
  OS: "ios",
  select: selectNative,
  isTesting: true,
}));

jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isMobile: true }),
  isMobile: true,
  isIOS: true,
  isAndroid: false,
}));

jest.mock("react-native-reanimated", () => ({
  measure: jest.fn(() => null),
  useAnimatedRef: () => ({ current: null }),
  default: { createAnimatedComponent: <T,>(component: T) => component },
}));

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
let bottomSheetViewRendered = false;
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
  const MockBottomSheetView = ({ children }: MockChildrenProps) => {
    bottomSheetViewRendered = true;
    return ReactModule.createElement(ReactModule.Fragment, null, children);
  };
  return {
    BottomSheetModal: MockBottomSheetModal,
    BottomSheetView: MockBottomSheetView,
  };
});

const mockShowPicker = jest.fn();
const mockHidePicker = jest.fn();
jest.mock("@common-ui/contexts/DatePickerContext", () => ({
  useDatePicker: () => ({
    isVisible: false,
    showPicker: mockShowPicker,
    hidePicker: mockHidePicker,
  }),
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native");
  return {
    ScrollView: RN.ScrollView,
    GestureHandlerRootView: RN.View,
  };
});

jest.mock("@common-ui/components/Text", () => ({
  SmallTitle: () => null,
  RegularText: () => null,
}));

jest.mock("@common-ui/components/Common", () => {
  const ReactModule = require("react");
  const Pass = ({ children }: MockChildrenProps) =>
    ReactModule.createElement(ReactModule.Fragment, null, children ?? null);
  return {
    AbsoluteContainer: Pass,
    Cell: Pass,
    Row: Pass,
    Separator: () => null,
  };
});

jest.mock("@common-ui/components/Conditional", () => {
  const ReactModule = require("react");
  return {
    If: ({ condition, children }: MockConditionalProps) =>
      condition ? ReactModule.createElement(ReactModule.Fragment, null, children) : null,
    Ternary: ({ condition, children }: MockConditionalProps) => {
      const arr = ReactModule.Children.toArray(children);
      return condition ? arr[0] ?? null : arr[1] ?? null;
    },
  };
});

jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: () => null,
}));

jest.mock("@common-ui/components/Card", () => {
  const ReactModule = require("react");
  const Pass = ({ children }: MockChildrenProps) =>
    ReactModule.createElement(ReactModule.Fragment, null, children ?? null);
  return { Card: Pass };
});

jest.mock("@services/localDayJs", () => {
  const dayjsModule = require("dayjs");
  return Object.assign(dayjsModule, { tz: dayjsModule });
});

const selectedDate = dayjs("2026-04-01");

describe("DatePickerComponent on native iOS", () => {
  beforeEach(() => {
    mockShowPicker.mockClear();
    mockHidePicker.mockClear();
    mockPresent.mockClear();
    mockDismiss.mockClear();
    bottomSheetViewRendered = false;
  });

  it("renders BottomSheetView as a child of BottomSheetModal", () => {
    const ref = React.createRef<DatePickerHandle>();
    render(<DatePickerComponent ref={ref} selectedDate={selectedDate} onChange={jest.fn()} />);

    expect(bottomSheetViewRendered).toBe(true);
  });

  it("calls BottomSheetModal.present() when opened — not the popover showPicker()", () => {
    const ref = React.createRef<DatePickerHandle>();
    render(<DatePickerComponent ref={ref} selectedDate={selectedDate} onChange={jest.fn()} />);

    act(() => {
      ref.current?.open();
    });

    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(mockShowPicker).not.toHaveBeenCalled();
  });

  it("calls BottomSheetModal.dismiss() when closed — not the popover hidePicker()", () => {
    const ref = React.createRef<DatePickerHandle>();
    render(<DatePickerComponent ref={ref} selectedDate={selectedDate} onChange={jest.fn()} />);

    act(() => {
      ref.current?.open();
    });
    act(() => {
      ref.current?.close();
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockHidePicker).not.toHaveBeenCalled();
  });
});
