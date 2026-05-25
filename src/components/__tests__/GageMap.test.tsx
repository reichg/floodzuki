/**
 * @jest-environment jsdom
 */
import type { Gage } from "@models/Gage";
import type { Region } from "@models/Region";
import { render } from "@testing-library/react-native";
import React from "react";

import GageMap from "../GageMap";
import MapLibreMobileGageMap from "../MapLibreMobileGageMap";
import MapLibreWebGageMap from "../MapLibreWebGageMap";

// Must be mocked before GageMap is imported so Platform.select picks up the mock.
jest.mock("../MapLibreWebGageMap", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(null),
}));

jest.mock("../MapLibreMobileGageMap", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(null),
}));

jest.mock("mobx-react-lite", () => ({
  observer: <T extends (...args: never[]) => React.JSX.Element>(fn: T) => fn,
}));

// With __esModule: true + default export mock, the default import IS the jest.fn().

const MockWebMap = jest.mocked(MapLibreWebGageMap);

const MockMobileMap = jest.mocked(MapLibreMobileGageMap);

function getRenderedMock(): jest.Mock {
  // Return whichever mock received calls this render cycle.
  return MockMobileMap.mock.calls.length > 0 ? MockMobileMap : MockWebMap;
}

// Plain objects cast to `any` — avoids instantiating MST models in tests.
const makeGage = (id: string, overrides: Partial<Gage> = {}): Gage =>
  ({ locationId: id, latitude: 47.5, longitude: -121.8, ...overrides } as Gage);

const region = { id: 1 } as Region;
const onGagePress = jest.fn();

beforeEach(() => {
  MockWebMap.mockClear();
  MockMobileMap.mockClear();
});

// ---------------------------------------------------------------------------

describe("GageMap — reverseGages", () => {
  it("passes gages in reversed order to the underlying map", () => {
    const gages = [makeGage("a"), makeGage("b"), makeGage("c")];
    render(<GageMap gages={gages} region={region} onGagePress={onGagePress} />);
    const mock = getRenderedMock();
    const receivedIds = mock.mock.calls[0][0].gages.map((g: Gage) => g.locationId);
    expect(receivedIds).toEqual(["c", "b", "a"]);
  });

  it("passes an empty array when given an empty array", () => {
    render(<GageMap gages={[]} region={region} onGagePress={onGagePress} />);
    expect(getRenderedMock().mock.calls[0][0].gages).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("GageMap — singleGage", () => {
  it("passes null singleGage when given zero gages", () => {
    render(<GageMap gages={[]} region={region} onGagePress={onGagePress} />);
    expect(getRenderedMock().mock.calls[0][0].singleGage).toBeNull();
  });

  it("passes the gage as singleGage when given exactly one gage", () => {
    const gage = makeGage("only");
    render(<GageMap gages={[gage]} region={region} onGagePress={onGagePress} />);
    expect(getRenderedMock().mock.calls[0][0].singleGage).toBe(gage);
  });

  it("passes null singleGage when given two or more gages", () => {
    const gages = [makeGage("a"), makeGage("b")];
    render(<GageMap gages={gages} region={region} onGagePress={onGagePress} />);
    expect(getRenderedMock().mock.calls[0][0].singleGage).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("GageMap — null safety (regression)", () => {
  it("does not crash when gages is an empty array (guards the removed early-return)", () => {
    expect(() =>
      render(<GageMap gages={[]} region={region} onGagePress={onGagePress} />)
    ).not.toThrow();
  });
});
