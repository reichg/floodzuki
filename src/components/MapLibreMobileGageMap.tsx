import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import { InternalGageMapProps } from "@models/MapModels";
import Constants from "expo-constants";
import { useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { Spacing } from "../common-ui/constants/spacing";
import Config from "../config/config";
import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";

const mapStyleBaseUrl =
  Constants.expoConfig!.extra!.mapTileUrlBase || Config.DEFAULT_MAP_TILE_BASE_URL;

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
    borderRadius: Spacing.tiny,
    overflow: "hidden",
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

const singleGageLatDelta = 0.00421;
const singleGageLngDelta = 0.00421;

const MapLibreMobileGageMap = ({
  gages,
  region,
  onGagePress,
  singleGage,
}: InternalGageMapProps) => {
  const mapRef = useRef(null);

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
    if (!gages) {
      return null;
    }
    return gages.map((g, index) => (
      <Marker
        lngLat={[g.longitude!, g.latitude!]}
        anchor="bottom"
        key={"marker" + index}
        onPress={() => {
          onGagePress(g);
        }}>
        <TrendIcon gage={g} iconType={TREND_ICON_TYPES.Map} />
      </Marker>
    ));
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
    if (singleGage) {
      return [
        singleGage.longitude! - singleGageLngDelta,
        singleGage.latitude! - singleGageLatDelta,
        singleGage.longitude! + singleGageLngDelta,
        singleGage.latitude! + singleGageLatDelta,
      ];
    }
    if (region && region.defaultMobileMapBounds) {
      return [
        region.defaultMobileMapBounds[0],
        region.defaultMobileMapBounds[1],
        region.defaultMobileMapBounds[2],
        region.defaultMobileMapBounds[3],
      ];
    }
    return defaultMapBounds as [number, number, number, number];
  }, [region, singleGage]);

  return (
    <Map ref={mapRef} style={styles.map} mapStyle={mapStyleUrl} touchRotate={false}>
      <Camera maxBounds={regionBounds} bounds={startBounds} />
      {markers}
    </Map>
  );
};

export default MapLibreMobileGageMap;
