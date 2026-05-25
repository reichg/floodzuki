import { flow, Instance, SnapshotOut, types } from "mobx-state-tree";
import { AuthSessionStoreModel } from "./AuthSession";
import { Forecast, ForecastStoreModel } from "./Forecasts";
import { Gage, GageStoreModel } from "./Gage";
import { GageReadingStoreModel } from "./GageReading";
import { LocationInfoModelStore } from "./LocationInfo";
import { RegionModelStore } from "./Region";

/**
 * A RootStore model.
 */
export const RootStoreModel = types
  .model("RootStore")
  .props({
    isFetched: types.optional(types.boolean, false),
    gagesStore: types.optional(GageStoreModel, {}),
    gageReadingsStore: types.optional(GageReadingStoreModel, {}),
    regionStore: types.optional(RegionModelStore, {}),
    locationInfoStore: types.optional(LocationInfoModelStore, {}),
    forecastsStore: types.optional(ForecastStoreModel, {}),
    authSessionStore: types.optional(AuthSessionStoreModel, {}),
  })
  .actions((store) => {
    const setIsFetched = (isFetching: boolean) => {
      store.isFetched = isFetching;
    };

    const fetchMainData = flow(function* () {
      setIsFetched(false);

      yield store.regionStore.fetchData();
      yield store.locationInfoStore.fetchData();
      yield store.gagesStore.fetchData();
      yield store.forecastsStore.fetchData();

      setIsFetched(true);
    });

    return {
      fetchMainData,
    };
  })
  .views((store) => {
    const getForecastGage = (gageId: string) => {
      const gage = store.forecastsStore.forecasts.get(gageId);

      if (gage) {
        return gage?.forecastGage;
      }

      return null;
    };

    const getForecastGages = (gageIds: string[]) => {
      return gageIds
        .map((id) => getForecastGage(id))
        .filter((gage): gage is GageSummary => gage !== null);
    };

    const getForecasts = (gageIds: string[]) => {
      return gageIds
        .map((id) => store.forecastsStore.getForecast(id))
        .filter((forecast): forecast is Forecast => forecast !== undefined);
    };

    const getTimezone = () => {
      return store.regionStore?.region?.timezone || "America/Los_Angeles";
    };

    const filterLocationsWithGages = () => {
      const gages = store.gagesStore.gages;
      const gageIds = gages.map((gage) => gage.locationId);

      return store.locationInfoStore.locationInfos.filter((location) =>
        gageIds.includes(location.id)
      );
    };

    const getLocationsWithGages = () => {
      const gages = store.gagesStore.gages;
      const gageIds = gages.map((gage) => gage.locationId);

      return store.locationInfoStore.locationInfos
        .filter((location) => gageIds.includes(location.id))
        .map((location) => gages.find((gage) => gage.locationId === location.id))
        .filter((gage): gage is Gage => gage !== undefined);
    };

    const getLocationWithGagesIds = () => {
      const gages = store.gagesStore.gages.map((gage) => gage.locationId);
      return store.locationInfoStore.locationInfos
        .filter((location) => gages.includes(location.id))
        .map((location) => location.id);
    };

    const getUpstreamGageLocation = (locationId: string) => {
      if (!locationId) {
        return null;
      }

      const locations = filterLocationsWithGages();

      const gageIndex = locations.findIndex((location) => location.id === locationId);

      return gageIndex > 0 ? locations[gageIndex - 1] : null;
    };

    const getDownstreamGageLocation = (locationId: string) => {
      if (!locationId) {
        return null;
      }

      const locations = filterLocationsWithGages();

      const gageIndex = locations.findIndex((location) => location.id === locationId);

      return gageIndex >= 0 && gageIndex + 1 < locations.length ? locations[gageIndex + 1] : null;
    };

    return {
      getForecastGage,
      getForecastGages,
      getForecasts,
      getTimezone,
      getLocationsWithGages,
      getLocationWithGagesIds,
      getUpstreamGageLocation,
      getDownstreamGageLocation,

      get isDataFetched() {
        return store.isFetched;
      },
    };
  });

/**
 * Common interfaces used across stores and app
 */

export interface GageSummary {
  id: string;
  nwrfcId: string;
  title: string;
  warningDischarge: number;
  floodDischarge: number;
  isMetagage: boolean;
  color?: string;
}

/**
 * The RootStore instance.
 */
export type RootStore = Instance<typeof RootStoreModel>;
/**
 * The data of a RootStore.
 */
export type RootStoreSnapshot = SnapshotOut<typeof RootStoreModel>;
