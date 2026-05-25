/* eslint-disable @typescript-eslint/no-require-imports */
// Regression: clicking a segment shortcut must read the CURRENT range,
// not a stale one held by SegmentItem's memo bail-out.
//
// Repro:
//   1. Render with historic range [Feb 4, Feb 6] (3 days).
//   2. Click "1d" → URL becomes [Feb 5, Feb 5] (center of 3-day).
//   3. Update mockParams and rerender.
//   4. Click "2d" → must produce [Feb 5, Feb 6] (center of 1-day, +1 after),
//      NOT a window derived from the stale 3-day range.
//
// This uses the REAL SegmentControl so the SegmentItem memo path is exercised.

import type { Gage } from "@models/Gage";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { GageDetailsChart } from "../GageDetailsChart";

type MockRouteParams = {
  from?: string;
  to?: string;
  historicEventId?: string;
};

type MockChildrenProps = {
  children?: React.ReactNode;
};

type MockConditionalProps = {
  condition?: boolean;
  children?: React.ReactNode;
};

type MockTextProps = {
  children?: React.ReactNode;
  testID?: string;
};

const mockParamsBox: { current: MockRouteParams } = {
  current: {},
};
const mockSetParams = jest.fn((patch: Record<string, string | undefined>) => {
  const next: MockRouteParams = { ...mockParamsBox.current, ...patch };
  (Object.keys(patch) as (keyof MockRouteParams)[]).forEach((key) => {
    if (patch[key] === undefined) {
      delete next[key];
    }
  });
  mockParamsBox.current = next;
});

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParamsBox.current,
  useRouter: () => ({ setParams: mockSetParams }),
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: true,
    getTimezone: () => "America/Chicago",
    gagesStore: { fetchDataForGage: jest.fn(), isFetching: false },
  }),
}));

jest.mock("@common-ui/contexts/DatePickerContext", () => ({
  useDatePicker: () => ({ isVisible: false, showPicker: jest.fn(), hidePicker: jest.fn() }),
}));

jest.mock("@services/highcharts/LocalHighchartsReact", () => () => null);
jest.mock("@services/highcharts/HighchartsReactNative", () => () => null);
jest.mock("../GageDetailsChartNative", () => ({ GageDetailsChartNative: () => null }));
jest.mock("@utils/useGageChartOptions", () => ({ __esModule: true, default: () => [{}, null] }));
jest.mock("@utils/useTimeout", () => ({ useTimeout: jest.fn(), useInterval: jest.fn() }));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({
    t: (k: string, params?: { days?: number }) => (params?.days ? `${params.days} ${k}` : k),
  }),
}));
jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isMobile: false }),
  isAndroid: false,
  isIOS: false,
  isMobile: false,
  MobileScreen: () => null,
  WideScreen: () => null,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: MockChildrenProps) => children ?? null,
}));
jest.mock("@react-native-picker/picker", () => {
  function PickerMock() {
    return null;
  }
  function PickerItem() {
    return null;
  }
  PickerMock.Item = PickerItem;
  return { Picker: PickerMock };
});
jest.mock("../DatePickerVariantSwitch", () => () => null);
jest.mock("@common-ui/components/Icon", () => () => null);
jest.mock("@common-ui/components/Card", () => {
  const React = require("react");
  const Pass = ({ children }: MockChildrenProps) =>
    React.createElement(React.Fragment, null, children ?? null);
  return { Card: Pass, CardHeader: Pass, CardFooter: Pass };
});
jest.mock("@common-ui/components/Common", () => {
  const React = require("react");
  const Pass = ({ children }: MockChildrenProps) =>
    React.createElement(React.Fragment, null, children ?? null);
  return { Row: Pass, Cell: Pass, RowOrCell: Pass };
});
jest.mock("@common-ui/components/Conditional", () => {
  const React = require("react");
  return {
    If: ({ condition, children }: MockConditionalProps) =>
      condition ? React.createElement(React.Fragment, null, children) : null,
    Ternary: ({ condition, children }: MockConditionalProps) => {
      const arr = React.Children.toArray(children);
      return condition ? arr[0] ?? null : arr[1] ?? null;
    },
  };
});
jest.mock("@common-ui/components/Button", () => ({
  IconButton: () => null,
  SolidButton: () => null,
}));
// Text and Pressable are needed by the real SegmentControl, so don't mock them away.
jest.mock("@common-ui/components/Text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Pass = (props: MockTextProps) => React.createElement(Text, null, props.children ?? null);
  return {
    MediumText: Pass,
    RegularText: Pass,
    SmallerText: Pass,
    LabelText: Pass,
    MediumTitle: (props: MockTextProps) =>
      React.createElement(Text, { testID: props.testID }, props.children ?? null),
    SmallTitle: (props: MockTextProps) =>
      React.createElement(Text, { testID: props.testID }, props.children ?? null),
  };
});
jest.mock("@utils/navigation", () => ({
  normalizeSearchParams: (v: string | string[]) => (Array.isArray(v) ? v.join(", ") : v),
}));
jest.mock("@utils/useTimeFormat", () => ({ formatReadingTime: (ts: string) => ts }));
jest.mock("@config/config", () => ({
  default: { LIVE_CHART_DATA_REFRESH_INTERVAL: 60000, GAGES_WITHOUT_DISHCARGE: [] },
}));

const mockGage = {
  locationId: "USGS-NF10",
  locationInfo: {
    floodEvents: [],
    hasDischarge: false,
    locationName: "North Fork Snoqualmie River",
    dischargeMin: 0,
    dischargeMax: 0,
    yMin: 0,
    yMax: 20,
  },
  readings: [],
  actualReadings: [],
  predictions: [],
  predictedFeetPerHour: 0,
  predictedCfsPerHour: 0,
  dataPoints: [],
  actualPoints: [],
  predictedPoints: [],
  noaaForecastData: [],
  hasData: false,
} as never as Gage;

// Find a Pressable rendered by the real SegmentControl whose child text matches the given key.
// The RANGES list maps "1" → "1 day", others → "Days" pluralized. We just look at the rendered
// text containing the digit at the start.
function findSegment(getAllByText: ReturnType<typeof render>["getAllByText"], key: string) {
  // SegmentControl rendered titles look like "1 day", "2 days", "7 days", "14 days".
  // Match against the rendered title key with a word boundary so "1" doesn't also match "14".
  const candidates = getAllByText(new RegExp(`^${key}\\b`));
  // Walk up to the Pressable (the parent of the title Text).
  return candidates[0].parent;
}

describe("GageDetailsChart — segment shortcut closure freshness (regression)", () => {
  beforeEach(() => {
    mockParamsBox.current = {};
    mockSetParams.mockClear();
  });

  it("uses the CURRENT range when clicking a segment after a URL change", async () => {
    // Start with a historic 3-day range.
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-06" };
    const { getAllByText, rerender } = render(<GageDetailsChart gage={mockGage} />);

    // Click "1d" — should write the center of [Feb 4, Feb 6] = Feb 5.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "1"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-05", to: "2020-02-05" })
    );

    // mockSetParams already updated mockParamsBox. Re-render so useLocalSearchParams sees it.
    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "2d" — should now use the CURRENT range [Feb 5, Feb 5], center Feb 5,
    // producing [Feb 4, Feb 5] (1 before, 0 after). Bug would produce a window
    // computed from the stale 3-day range — also center Feb 5 → [Feb 4, Feb 5], a
    // coincidence here. The next test covers a discriminating case.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "2"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-04", to: "2020-02-05" })
    );
  });

  it("uses CURRENT range across multiple shortcut clicks (discriminating case)", async () => {
    // Initial: [Feb 1, Feb 11] (11 days) → center = Feb 1 + floor(11/2) = Feb 6.
    mockParamsBox.current = { from: "2020-02-01", to: "2020-02-11" };
    const { getAllByText, rerender } = render(<GageDetailsChart gage={mockGage} />);

    // Click "1d" — center Feb 6 → [Feb 6, Feb 6].
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "1"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-06", to: "2020-02-06" })
    );

    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "7d" — current [Feb 6, Feb 6], center Feb 6 → [Feb 3, Feb 9].
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "7"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-03", to: "2020-02-09" })
    );

    // Simulate the user navigating to an unrelated range via the date picker.
    // The shortcut math (now drift-free) preserves the center across shortcut
    // round-trips, so we need an external URL change to make stale vs. fresh
    // handlers produce different output.
    mockParamsBox.current = { from: "2020-04-10", to: "2020-04-15" }; // 6d, center Apr 13
    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "1d" — fresh handler reads [Apr 10, Apr 15], center Apr 13 → [Apr 13, Apr 13].
    // Stale handler still sees [Feb 3, Feb 9], center Feb 6 → [Feb 6, Feb 6]. Discriminates.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "1"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-04-13", to: "2020-04-13" })
    );

    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "14d" — current [Apr 13, Apr 13], center Apr 13, 14d → 7 before / 6 after →
    // [Apr 6, Apr 19]. Stale ([Feb 3, Feb 9], center Feb 6) → [Jan 30, Feb 12]. Discriminates.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "14"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-04-06", to: "2020-04-19" })
    );
  });
});
