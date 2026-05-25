/**
 * @jest-environment jsdom
 */
import type { Gage } from "@models/Gage";
import type { Region } from "@models/Region";
import { render } from "@testing-library/react-native";
import React from "react";

import * as MapLibre from "@vis.gl/react-maplibre";
import MapLibreWebGageWebMap from "../MapLibreWebGageMap";

jest.mock("maplibre-gl/dist/maplibre-gl.css", () => {});

jest.mock("@vis.gl/react-maplibre", () => ({
  Map: jest.fn(({ children }) => children ?? null),
  Marker: jest.fn().mockReturnValue(null),
  useMap: jest.fn().mockReturnValue({ current: null }),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { mapTileUrlBase: null } } },
}));

jest.mock("../../config/config", () => ({
  __esModule: true,
  default: { DEFAULT_MAP_TILE_BASE_URL: "https://tiles.example.com" },
}));

jest.mock("../TrendIcon", () => ({
  __esModule: true,
  default: () => null,
  TREND_ICON_TYPES: { Map: "Map" },
}));

type RegionOverrides = {
  id?: number;
  defaultWebMapBounds?: [number, number, number, number];
  regionBounds?: [number, number, number, number];
};

const MockMap = MapLibre.Map as never as jest.Mock;
const MockMarker = MapLibre.Marker as never as jest.Mock;

const makeGage = (overrides: Partial<Gage> = {}): Gage =>
  ({ locationId: "test", latitude: 47.5, longitude: -121.8, ...overrides } as Gage);

const makeRegion = (overrides: RegionOverrides = {}): Region =>
  ({ id: 1, ...overrides } as never as Region);

beforeEach(() => {
  MockMap.mockClear();
  MockMarker.mockClear();
});

// ---------------------------------------------------------------------------

describe("MapLibreWebGageMap — marker filtering", () => {
  it("renders a Marker for each gage with valid latitude and longitude", () => {
    const gages = [makeGage(), makeGage({ locationId: "b" })];
    render(
      <MapLibreWebGageWebMap
        gages={gages}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={null}
      />
    );
    expect(MockMarker).toHaveBeenCalledTimes(2);
  });

  it("skips a gauge that has no latitude", () => {
    const gages = [
      makeGage({ locationId: "valid", latitude: 47.5, longitude: -121.8 }),
      makeGage({ locationId: "no-lat", latitude: undefined, longitude: -121.8 }),
    ];
    render(
      <MapLibreWebGageWebMap
        gages={gages}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={null}
      />
    );
    expect(MockMarker).toHaveBeenCalledTimes(1);
    expect(MockMarker.mock.calls[0][0].latitude).toBe(47.5);
  });

  it("skips a gage that has no longitude", () => {
    const gages = [makeGage({ locationId: "no-lng", latitude: 47.5, longitude: undefined })];
    render(
      <MapLibreWebGageWebMap
        gages={gages}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={null}
      />
    );
    expect(MockMarker).toHaveBeenCalledTimes(0);
  });

  it("renders no markers when gages array is empty", () => {
    render(
      <MapLibreWebGageWebMap
        gages={[]}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={null}
      />
    );
    expect(MockMarker).toHaveBeenCalledTimes(0);
  });
});

// ---------------------------------------------------------------------------

describe("MapLibreWebGageMap — startBounds", () => {
  const singleGageLngDelta = 0.00421;
  const singleGageLatDelta = 0.00922;

  it("uses singleGage coords when lat and lng are valid", () => {
    const singleGage = makeGage({ latitude: 47.0, longitude: -122.0 });
    render(
      <MapLibreWebGageWebMap
        gages={[singleGage]}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={singleGage}
      />
    );
    const bounds = MockMap.mock.calls[0][0].initialViewState.bounds;
    expect(bounds[0]).toBeCloseTo(-122.0 - singleGageLngDelta, 5);
    expect(bounds[1]).toBeCloseTo(47.0 - singleGageLatDelta, 5);
    expect(bounds[2]).toBeCloseTo(-122.0 + singleGageLngDelta, 5);
    expect(bounds[3]).toBeCloseTo(47.0 + singleGageLatDelta, 5);
  });

  it("falls back to region.defaultWebMapBounds when singleGage has null latitude", () => {
    const singleGage = makeGage({ latitude: undefined, longitude: -122.0 });
    const region = makeRegion({ defaultWebMapBounds: [-122.3, 46.9, -121.3, 48.3] });
    render(
      <MapLibreWebGageWebMap
        gages={[singleGage]}
        region={region}
        onGagePress={jest.fn()}
        singleGage={singleGage}
      />
    );
    const bounds = MockMap.mock.calls[0][0].initialViewState.bounds;
    expect(bounds).toEqual([-122.3, 46.9, -121.3, 48.3]);
  });

  it("falls back to region.defaultWebMapBounds when singleGage has null longitude", () => {
    const singleGage = makeGage({ latitude: 47.0, longitude: undefined });
    const region = makeRegion({ defaultWebMapBounds: [-122.3, 46.9, -121.3, 48.3] });
    render(
      <MapLibreWebGageWebMap
        gages={[singleGage]}
        region={region}
        onGagePress={jest.fn()}
        singleGage={singleGage}
      />
    );
    const bounds = MockMap.mock.calls[0][0].initialViewState.bounds;
    expect(bounds).toEqual([-122.3, 46.9, -121.3, 48.3]);
  });

  it("uses region.defaultWebMapBounds when singleGage is null", () => {
    const region = makeRegion({ defaultWebMapBounds: [-122.3, 46.9, -121.3, 48.3] });
    render(
      <MapLibreWebGageWebMap gages={[]} region={region} onGagePress={jest.fn()} singleGage={null} />
    );
    const bounds = MockMap.mock.calls[0][0].initialViewState.bounds;
    expect(bounds).toEqual([-122.3, 46.9, -121.3, 48.3]);
  });

  it("falls back to hardcoded defaultMapBounds when singleGage is null and region has no defaultWebMapBounds", () => {
    render(
      <MapLibreWebGageWebMap
        gages={[]}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={null}
      />
    );
    const bounds = MockMap.mock.calls[0][0].initialViewState.bounds;
    expect(bounds).toEqual([-122.3328, 46.9564, -121.2959, 48.3127]);
  });
});

// ---------------------------------------------------------------------------

describe("MapLibreWebGageMap — regionBounds", () => {
  it("uses region.regionBounds when available", () => {
    const region = makeRegion({ regionBounds: [122.4, -46.9, 120.9, -48.4] });
    render(
      <MapLibreWebGageWebMap gages={[]} region={region} onGagePress={jest.fn()} singleGage={null} />
    );
    const maxBounds = MockMap.mock.calls[0][0].maxBounds;
    expect(maxBounds).toEqual([122.4, -46.9, 120.9, -48.4]);
  });

  it("falls back to hardcoded defaultRegionBounds when region has no regionBounds", () => {
    render(
      <MapLibreWebGageWebMap
        gages={[]}
        region={makeRegion()}
        onGagePress={jest.fn()}
        singleGage={null}
      />
    );
    const maxBounds = MockMap.mock.calls[0][0].maxBounds;
    expect(maxBounds).toEqual([-122.4, 46.9, -120.9, 48.4]);
  });
});
