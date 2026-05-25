/* eslint-disable @typescript-eslint/no-require-imports */
// src/components/__tests__/GageDetailsChart.range-highlight.test.tsx
import type { Gage } from "@models/Gage";
import { render } from "@testing-library/react-native";
import React from "react";
import { GageDetailsChart } from "../GageDetailsChart";

type MockChildrenProps = {
  children?: React.ReactNode;
};

type MockConditionalProps = {
  condition?: boolean;
  children?: React.ReactNode;
};

// Capture the selectedSegment prop passed to the range SegmentControl.
// The chart-data-type SegmentControl only renders when hasDischargeControl=true
// (requires hasDischarge=true on the gage). With the mock gage below
// (hasDischarge: false), only the range SegmentControl renders, so every
// SegmentControl call here is the range one.
let capturedSelectedSegment = "";
jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: ({ selectedSegment }: { selectedSegment: string }) => {
    capturedSelectedSegment = selectedSegment;
    return null;
  },
}));

let mockParams: { from?: string; to?: string; historicEventId?: string } = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ setParams: jest.fn() }),
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: false,
    getTimezone: () => "America/New_York",
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

describe("GageDetailsChart — range shortcut highlight", () => {
  beforeEach(() => {
    capturedSelectedSegment = "";
    mockParams = {};
  });

  it("highlights the 2-day shortcut when the date span is exactly 2 days", () => {
    mockParams = { from: "2020-05-01", to: "2020-05-02" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("2");
  });

  it("highlights no shortcut when the date span is 3 days (not a valid shortcut)", () => {
    mockParams = { from: "2020-05-01", to: "2020-05-03" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("");
  });

  it("highlights the 7-day shortcut when the date span is exactly 7 days", () => {
    mockParams = { from: "2020-05-01", to: "2020-05-07" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("7");
  });

  it("highlights the 14-day shortcut when the date span is exactly 14 days", () => {
    mockParams = { from: "2020-05-01", to: "2020-05-14" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("14");
  });

  it("highlights the 1-day shortcut when the date span is exactly 1 day", () => {
    mockParams = { from: "2020-05-01", to: "2020-05-01" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("1");
  });

  it("highlights no shortcut when the date span is 10 days (not a valid shortcut)", () => {
    mockParams = { from: "2020-05-01", to: "2020-05-10" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("");
  });

  it("highlights the 2-day shortcut for from=-2&to=now (live relative format)", () => {
    mockParams = { from: "-2", to: "now" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("2");
  });

  it("highlights the 7-day shortcut for from=-7&to=now (live relative format)", () => {
    mockParams = { from: "-7", to: "now" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("7");
  });

  it("highlights the 1-day shortcut for from=-1&to=now (live relative format)", () => {
    mockParams = { from: "-1", to: "now" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("1");
  });

  it("highlights the 14-day shortcut for from=-14&to=now (live relative format)", () => {
    mockParams = { from: "-14", to: "now" };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedSelectedSegment).toBe("14");
  });
});
