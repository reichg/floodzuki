/* eslint-disable @typescript-eslint/no-require-imports */
// src/components/__tests__/GageDetailsChart.historical.test.tsx
import type { Gage } from "@models/Gage";
import localDayJs from "@services/localDayJs";
import { act, render } from "@testing-library/react-native";
import React from "react";
import { GageDetailsChart } from "../GageDetailsChart";

type MockChildrenProps = {
  children?: React.ReactNode;
};

type MockConditionalProps = {
  condition?: boolean;
  children?: React.ReactNode;
};

const GAUGE_TZ = "Asia/Tokyo";

// --- Mutable mock state ---
let mockIsDataFetched = false;
const mockFetchDataForGage = jest.fn();

// --- Store mock ---
jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: mockIsDataFetched,
    getTimezone: () => "Asia/Tokyo",
    gagesStore: {
      fetchDataForGage: mockFetchDataForGage,
      isFetching: false,
    },
  }),
}));

// --- Expo Router mock: simulate page load with historical URL params ---
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    from: "2020-02-04",
    to: "2020-02-13",
    historicEventId: "22",
  }),
  useRouter: () => ({ setParams: jest.fn() }),
}));

// --- UI/infrastructure mocks ---
jest.mock("@services/highcharts/LocalHighchartsReact", () => () => null);
jest.mock("@services/highcharts/HighchartsReactNative", () => () => null);

jest.mock("../GageDetailsChartNative", () => ({
  GageDetailsChartNative: () => null,
}));

jest.mock("@utils/useGageChartOptions", () => ({
  __esModule: true,
  default: () => [{}, null],
}));

jest.mock("@utils/useTimeout", () => ({
  useTimeout: jest.fn(),
  useInterval: jest.fn(),
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
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

jest.mock("@react-native-picker/picker", () => ({
  Picker: () => null,
}));

jest.mock("../DatePickerVariantSwitch", () => () => null);

jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: () => null,
}));

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

jest.mock("@common-ui/components/Text", () => ({
  MediumText: () => null,
  RegularText: () => null,
  SmallerText: () => null,
  LabelText: () => null,
}));

jest.mock("@utils/navigation", () => ({
  normalizeSearchParams: (v: string | string[]) => (Array.isArray(v) ? v.join(", ") : v),
}));

jest.mock("@utils/useTimeFormat", () => ({
  formatReadingTime: (ts: string) => ts,
}));

jest.mock("@config/config", () => ({
  default: {
    LIVE_CHART_DATA_REFRESH_INTERVAL: 60000,
    GAGES_WITHOUT_DISHCARGE: [],
  },
}));

// --- Minimal mock gage ---
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

const undefinedGage = undefined as never as Gage;

describe("GageDetailsChart — historical data fetch on page load", () => {
  beforeEach(() => {
    mockIsDataFetched = false;
    mockFetchDataForGage.mockClear();
  });

  it("does not fetch historical data when isDataFetched is false, even with a valid gage prop", () => {
    // Gage is available but main data hasn't loaded yet
    render(<GageDetailsChart gage={mockGage} />);

    // Broken code calls fetchDataForGage immediately on mount (no isDataFetched guard).
    // Fixed code returns early from the guard.
    expect(mockFetchDataForGage).not.toHaveBeenCalled();
  });

  it("does not fetch with the correct locationId when gage is undefined on mount (real page-refresh start state)", () => {
    // Real page-refresh: store is empty, gage is not yet available
    render(<GageDetailsChart gage={undefinedGage} />);

    // The broken code calls fetchDataForGage(undefined, ...) — a silent no-op in the real
    // store but still a call. Verify the correct locationId was never used.
    expect(mockFetchDataForGage).not.toHaveBeenCalledWith(
      "USGS-NF10",
      expect.any(String),
      expect.any(String),
      expect.any(Boolean),
      expect.any(Boolean)
    );
  });

  it("fetches historical data with correct args once gage and isDataFetched become available (the bug scenario)", () => {
    mockIsDataFetched = false;

    // Start with gage=undefined: real page-refresh, store is initially empty.
    // Broken code fires the effect immediately but with gage.locationId=undefined (no-op in real store).
    const { rerender } = render(<GageDetailsChart gage={undefinedGage} />);

    // Clear any spurious calls made with undefined locationId before the store is ready.
    mockFetchDataForGage.mockClear();

    // Simulate fetchMainData() completing: gage becomes available + isDataFetched → true.
    mockIsDataFetched = true;
    act(() => {
      rerender(<GageDetailsChart gage={mockGage} />);
    });

    // Broken code: effect deps are [dateRange.from, dateRange.to] — those haven't changed
    //   → effect does NOT re-fire → fetchDataForGage is never called with a real locationId
    //   → this assertion FAILS ✗
    // Fixed code: new deps [gage?.locationId, isDataFetched] both changed
    //   → effect re-fires → fetchDataForGage called with correct historical args
    //   → this assertion PASSES ✓
    expect(mockFetchDataForGage).toHaveBeenCalledTimes(1);
    const [locationId, fromStr, , includePredictions, includeLastReading] =
      mockFetchDataForGage.mock.calls[0];

    expect(locationId).toBe("USGS-NF10");
    // The from-date param is a UTC ISO string representing Feb 4 midnight in
    // the gauge tz. Asserting against the UTC string prefix is fragile when
    // the gauge tz is east of UTC (e.g. Tokyo's Feb 4 00:00 = Feb 3 15:00 UTC),
    // so we round-trip through the gauge tz and assert the gauge-tz wall clock.
    expect(localDayJs(fromStr).tz(GAUGE_TZ).format("YYYY-MM-DD HH:mm:ss")).toBe(
      "2020-02-04 00:00:00"
    );
    expect(includePredictions).toBe(false);
    expect(includeLastReading).toBe(false);
  });
});
