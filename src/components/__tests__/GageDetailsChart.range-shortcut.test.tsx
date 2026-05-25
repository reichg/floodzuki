/* eslint-disable @typescript-eslint/no-require-imports */
// src/components/__tests__/GageDetailsChart.range-shortcut.test.tsx
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

type MockSegmentControlProps = {
  onChange: (key: string) => void;
};

// --- Mocks ---
const mockParamsBox: { current: { from?: string; to?: string; historicEventId?: string } } = {
  current: {},
};
const mockSetParams = jest.fn();

let capturedRangeOnChange: ((key: string) => void) | undefined;
jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: ({ onChange }: MockSegmentControlProps) => {
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
    getTimezone: () => "Australia/Sydney",
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

describe("GageDetailsChart — segment shortcut behavior", () => {
  beforeEach(() => {
    mockParamsBox.current = {};
    mockSetParams.mockClear();
    capturedRangeOnChange = undefined;
  });

  describe("live mode (to=now)", () => {
    it("writes the relative live URL form when clicking 7d in live mode", async () => {
      mockParamsBox.current = { from: "-2", to: "now" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("7");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "-7", to: "now", historicEventId: undefined })
      );
    });

    it("writes the relative live URL form from cold-load (no params) state", async () => {
      mockParamsBox.current = {};
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("14");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "-14", to: "now" })
      );
    });
  });

  describe("historic mode — center & extend", () => {
    // Current range Feb 4–13, 2020 (10 days). Center = startDay + floor(10/2) = Feb 9 (later-bias).
    it("centers a 7d window on Feb 9 → Feb 6 to Feb 12 (symmetric 3 before / 3 after)", async () => {
      mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("7");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "2020-02-06", to: "2020-02-12" })
      );
    });

    it("centers a 14d window on Feb 9 with earlier-bias → Feb 2 to Feb 15 (7 before / 6 after)", async () => {
      mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("14");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "2020-02-02", to: "2020-02-15" })
      );
    });

    it("centers a 2d window on Feb 9 with earlier-bias → Feb 8 to Feb 9", async () => {
      mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("2");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "2020-02-08", to: "2020-02-09" })
      );
    });

    it("collapses 1d to a single center day → Feb 9", async () => {
      mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("1");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "2020-02-09", to: "2020-02-09" })
      );
    });

    // Odd-day current range → exact center.
    it("uses exact center when current span is odd (Feb 4–12 → center Feb 8)", async () => {
      mockParamsBox.current = { from: "2020-02-04", to: "2020-02-12" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("7");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "2020-02-05", to: "2020-02-11" })
      );
    });
  });

  describe("historic mode that extends into the future → flips to live", () => {
    // System "today" varies by when the test runs. To make this deterministic,
    // we set up a historic range whose center is close enough to "today" that
    // expanding by 14 days will push newEnd past today. We then assert that
    // setParams is called with the relative live form rather than absolute dates.
    it("flips to live (-N/now) when extending past today in gauge tz", async () => {
      // Pick a historic range ending yesterday-ish — guaranteed to push past today on 14d expand.
      const localDayJs = require("@services/localDayJs").default;
      const tz = "Australia/Sydney";
      const today = localDayJs().tz(tz).startOf("day");
      const yesterday = today.subtract(1, "day");
      const twoDaysAgo = today.subtract(2, "day");

      mockParamsBox.current = {
        from: twoDaysAgo.format("YYYY-MM-DD"),
        to: yesterday.format("YYYY-MM-DD"),
      };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("14");
      });

      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ from: "-14", to: "now", historicEventId: undefined })
      );
    });

    it("stays absolute when extension does NOT cross today (deep historic range)", async () => {
      mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
      render(<GageDetailsChart gage={mockGage} />);

      await act(async () => {
        capturedRangeOnChange?.("14");
      });

      // The call should be absolute YYYY-MM-DD, not the relative live form.
      const call = mockSetParams.mock.calls[0][0];
      expect(call.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(call.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
