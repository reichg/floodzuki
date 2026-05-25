/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from "@testing-library/react-native";
import dayjs from "dayjs";
import React from "react";
import DatePickerVariantSwitch from "../DatePickerVariantSwitch";

jest.mock("@config/config", () => ({
  DATE_PICKER_VARIANT: {
    default: "legacy",
    byLocationId: {
      "USGS-38": "split-v1",
      "USGS-22": "range-v1",
      "USGS-MF11": "range-v2",
    },
  },
}));

jest.mock("@common-ui/components/DateRangePicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  function MockDateRangePicker() {
    return React.createElement(View, { testID: "legacy-picker" });
  }
  return MockDateRangePicker;
});
jest.mock("@common-ui/components/SplitDateRangePicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SplitDateRangePicker: function MockSplitDateRangePicker() {
      return React.createElement(View, { testID: "split-picker" });
    },
  };
});
jest.mock("@common-ui/components/DateRangePickerRangeV1", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    DateRangePickerRangeV1: function MockRangeV1() {
      return React.createElement(View, { testID: "range-v1-picker" });
    },
  };
});
jest.mock("@common-ui/components/DateRangePickerRangeV2", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    DateRangePickerRangeV2: function MockRangeV2() {
      return React.createElement(View, { testID: "range-v2-picker" });
    },
  };
});

const baseProps = {
  startDate: dayjs("2026-04-20"),
  endDate: dayjs("2026-04-25"),
  timezone: "America/Los_Angeles",
  onChange: jest.fn(),
};

describe("DatePickerVariantSwitch", () => {
  it("renders SplitDateRangePicker for locationId mapped to split-v1", () => {
    const { queryByTestId } = render(
      <DatePickerVariantSwitch locationId="USGS-38" {...baseProps} />
    );

    expect(queryByTestId("split-picker")).not.toBeNull();
    expect(queryByTestId("legacy-picker")).toBeNull();
  });

  it("renders DateRangePicker for a locationId not in the map", () => {
    const { queryByTestId } = render(
      <DatePickerVariantSwitch locationId="USGS-9" {...baseProps} />
    );

    expect(queryByTestId("legacy-picker")).not.toBeNull();
    expect(queryByTestId("split-picker")).toBeNull();
    expect(queryByTestId("range-v1-picker")).toBeNull();
    expect(queryByTestId("range-v2-picker")).toBeNull();
  });

  it("renders DateRangePicker when locationId is undefined (falls back to default)", () => {
    const { queryByTestId } = render(
      <DatePickerVariantSwitch locationId={undefined} {...baseProps} />
    );

    expect(queryByTestId("legacy-picker")).not.toBeNull();
    expect(queryByTestId("split-picker")).toBeNull();
    expect(queryByTestId("range-v1-picker")).toBeNull();
    expect(queryByTestId("range-v2-picker")).toBeNull();
  });

  it("renders DateRangePickerRangeV1 for locationId mapped to range-v1", () => {
    const { queryByTestId } = render(
      <DatePickerVariantSwitch locationId="USGS-22" {...baseProps} />
    );

    expect(queryByTestId("range-v1-picker")).not.toBeNull();
    expect(queryByTestId("split-picker")).toBeNull();
    expect(queryByTestId("legacy-picker")).toBeNull();
  });

  it("renders DateRangePickerRangeV2 for locationId mapped to range-v2", () => {
    const { queryByTestId } = render(
      <DatePickerVariantSwitch locationId="USGS-MF11" {...baseProps} />
    );

    expect(queryByTestId("range-v2-picker")).not.toBeNull();
    expect(queryByTestId("range-v1-picker")).toBeNull();
    expect(queryByTestId("split-picker")).toBeNull();
    expect(queryByTestId("legacy-picker")).toBeNull();
  });
});
