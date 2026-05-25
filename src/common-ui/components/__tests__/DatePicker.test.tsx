/* eslint-disable @typescript-eslint/no-require-imports */
// src/common-ui/components/__tests__/DatePicker.test.tsx
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

type WebPlatformSelectOptions<T> = {
  web?: T;
  default?: T;
};

const selectWeb = <T,>(obj: WebPlatformSelectOptions<T>) => obj.web ?? obj.default;

jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  default: {
    OS: "web",
    select: selectWeb,
    isTesting: true,
  },
  OS: "web",
  select: selectWeb,
  isTesting: true,
}));

jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isMobile: true }), // mobile viewport, web platform
  isMobile: false,
  isIOS: false,
  isAndroid: false,
}));

jest.mock("react-native-reanimated", () => ({
  measure: jest.fn(() => ({ pageX: 50, pageY: 100, x: 50, y: 100, width: 200, height: 40 })),
  useAnimatedRef: () => ({ current: null }),
  default: { createAnimatedComponent: <T,>(component: T) => component },
}));

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
jest.mock("@gorhom/bottom-sheet", () => {
  const ReactModule: typeof React = require("react");
  const MockBottomSheetModal = ReactModule.forwardRef<MockBottomSheetHandle, MockChildrenProps>(
    (_props, ref) => {
      ReactModule.useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: mockDismiss,
      }));
      return null;
    }
  );
  MockBottomSheetModal.displayName = "MockBottomSheetModal";
  return { BottomSheetModal: MockBottomSheetModal };
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

describe("DatePickerComponent on web with mobile viewport", () => {
  beforeEach(() => {
    mockShowPicker.mockClear();
    mockHidePicker.mockClear();
    mockPresent.mockClear();
    mockDismiss.mockClear();
  });

  it("calls showPicker (popover) when opened — not BottomSheetModal.present()", () => {
    const ref = React.createRef<DatePickerHandle>();
    render(<DatePickerComponent ref={ref} selectedDate={selectedDate} onChange={jest.fn()} />);

    act(() => {
      ref.current?.open();
    });

    expect(mockShowPicker).toHaveBeenCalledTimes(1);
    expect(mockPresent).not.toHaveBeenCalled();
  });

  it("calls hidePicker (popover) when closed — not BottomSheetModal.dismiss()", () => {
    const ref = React.createRef<DatePickerHandle>();
    render(<DatePickerComponent ref={ref} selectedDate={selectedDate} onChange={jest.fn()} />);

    act(() => {
      ref.current?.open();
    });
    act(() => {
      ref.current?.close();
    });

    expect(mockHidePicker).toHaveBeenCalledTimes(1);
    expect(mockDismiss).not.toHaveBeenCalled();
  });
});
