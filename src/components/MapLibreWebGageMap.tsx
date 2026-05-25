import { InternalGageMapProps } from "@models/MapModels";
import { Map, Marker } from "@vis.gl/react-maplibre";
import Constants from "expo-constants";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Config from "../config/config";
import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";

const mapStyleBaseUrl =
  Constants.expoConfig?.extra?.mapTileUrlBase || Config.DEFAULT_MAP_TILE_BASE_URL;

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  marker: {
    width: 50,
    height: 50,
    cursor: "pointer",
  },
  markerImage: {
    width: 50,
    height: 50,
    cursor: "pointer",
  },
});

// These should never get used, since the region should have them, but we should have a
// fallback.  This map library expects bounds to be in [west, south, east, north] order.
const defaultRegionBounds = [-122.4, 46.9, -120.9, 48.4];
const defaultMapBounds = [-122.3328, 46.9564, -121.2959, 48.3127];

const singleGageLatDelta = 0.00922;
const singleGageLngDelta = 0.00421;

const MapLibreWebGageWebMap = ({
  gages,
  region,
  onGagePress,
  singleGage,
}: InternalGageMapProps) => {
  const mapStyleUrl = useMemo(() => {
    if (!region) {
      return "";
    }
    let url = mapStyleBaseUrl;
    if (!url.endsWith("/")) {
      url += "/";
    }
    return url + region.id + "/webstyles";
  }, [region]);

  const markers = useMemo(() => {
    return gages.map(
      (g, index) =>
        g.latitude &&
        g.longitude && (
          <Marker
            style={styles.marker}
            longitude={g.longitude}
            latitude={g.latitude}
            anchor="bottom"
            onClick={() => {
              onGagePress(g);
            }}
            key={"marker" + index}>
            <TrendIcon gage={g} iconType={TREND_ICON_TYPES.Map} />
          </Marker>
        )
    );
  }, [gages, onGagePress]);

  const regionBounds: [number, number, number, number] = useMemo(() => {
    if (region && region.regionBounds) {
      return [
        region.regionBounds[0],
        region.regionBounds[1],
        region.regionBounds[2],
        region.regionBounds[3],
      ];
    }
    return defaultRegionBounds as [number, number, number, number];
  }, [region]);

  const startBounds: [number, number, number, number] = useMemo(() => {
    if (singleGage && singleGage.longitude && singleGage.latitude) {
      return [
        singleGage.longitude - singleGageLngDelta,
        singleGage.latitude - singleGageLatDelta,
        singleGage.longitude + singleGageLngDelta,
        singleGage.latitude + singleGageLatDelta,
      ];
    }
    if (region && region.defaultWebMapBounds) {
      return [
        region.defaultWebMapBounds[0],
        region.defaultWebMapBounds[1],
        region.defaultWebMapBounds[2],
        region.defaultWebMapBounds[3],
      ];
    }
    return defaultMapBounds as [number, number, number, number];
  }, [region, singleGage]);

  return (
    <Map
      initialViewState={{
        bounds: startBounds,
      }}
      maxBounds={regionBounds}
      mapStyle={mapStyleUrl}
      style={styles.map}>
      {markers}
    </Map>
  );
};

export default MapLibreWebGageWebMap;
