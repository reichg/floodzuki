/* eslint-disable @typescript-eslint/no-require-imports */
// src/components/__tests__/GageDetailsChart.live-button.test.tsx
import type { Gage } from "@models/Gage";
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

type MockSegment = {
  key: string;
  title: string;
};

type MockSegmentControlProps = {
  segments: MockSegment[];
  onChange: (key: string) => void;
};

// --- Mocks ---
const mockParamsBox: { current: { from?: string; to?: string; historicEventId?: string } } = {
  current: {},
};
const mockSetParams = jest.fn();

let capturedSegments: { key: string; title: string }[] | undefined;
let capturedRangeOnChange: ((key: string) => void) | undefined;
jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: ({ segments, onChange }: MockSegmentControlProps) => {
    capturedSegments = segments;
    capturedRangeOnChange = onChange;
    return null;
  },
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParamsBox.current,
  useRouter: () => ({ setParams: mockSetParams }),
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: true,
    getTimezone: () => "America/Los_Angeles",
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
jest.mock("@common-ui/components/Text", () => ({
  MediumText: () => null,
  RegularText: () => null,
  SmallerText: () => null,
  LabelText: () => null,
}));
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

describe("GageDetailsChart — Live segment", () => {
  beforeEach(() => {
    mockParamsBox.current = {};
    mockSetParams.mockClear();
    capturedSegments = undefined;
    capturedRangeOnChange = undefined;
  });

  it("omits the live segment when range.isNow is true (to=now)", () => {
    mockParamsBox.current = { from: "-2", to: "now" };
    render(<GageDetailsChart gage={mockGage} />);
    const keys = capturedSegments?.map((s) => s.key);
    expect(keys).toEqual(["14", "7", "2", "1"]);
  });

  it("omits the live segment on cold-load (no params → live default)", () => {
    mockParamsBox.current = {};
    render(<GageDetailsChart gage={mockGage} />);
    const keys = capturedSegments?.map((s) => s.key);
    expect(keys).toEqual(["14", "7", "2", "1"]);
  });

  it("includes the live segment as the last item when in historic mode", () => {
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
    render(<GageDetailsChart gage={mockGage} />);
    const keys = capturedSegments?.map((s) => s.key);
    expect(keys).toEqual(["14", "7", "2", "1", "live"]);
  });

  it("resets the URL properly when selecting the live segment", async () => {
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
    render(<GageDetailsChart gage={mockGage} />);

    await act(async () => {
      capturedRangeOnChange?.("live");
    });

    expect(mockSetParams).toHaveBeenCalledWith({
      historicEventId: undefined,
      from: "-2",
      to: "now",
    });
  });
});
