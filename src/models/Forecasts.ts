import { api } from "@services/api";
import dayjs from "dayjs";
import { flow, Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree";

import { ChartColorsHex } from "@common-ui/constants/colors";
import Config from "@config/config";
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps";
import { LocationInfoModel } from "./LocationInfo";
import { GageSummary } from "./RootStore";

// "Forecast" Example data
// dischargeStageOne: 16500
// dischargeStageTwo: 19400
// lastReadingId: 2025024
// noData: false
// noaaForecast: {
//   county: "KING"
//   created: "2023-03-20T14:47:00"
//   currentDischarge: 2010
//   currentWaterHeight: 46.05
//   data: [
//     {
//       forecastId: 12045,
//       timestamp: "2023-03-20T17:00:00",
//       stage: 46.06,
//       discharge: 2078
//     }
//   ]
//   discharge: 2078
//   forecastId: 12045
//   stage: 46.06
//   timestamp: "2023-03-20T17:00:00"
//   description: "SNOQUALMIE - NEAR CARNATION"
//   elevation: 60
//   floodStage: 54
//   forecastId: 12045
//   latitude: 47.666111
//   longitude: 121.924167
//   noaaSiteId: "CRNW1"
//   peaks: [
//     {
//       forecastId: 12045,
//       timestamp: "2023-03-21T11:00:00",
//       stage: 46.6,
//       discharge: 3005
//     }
//   ]
//   state: "WASHINGTON"
// }
// predictedCfsPerHour: 30
// predictedFeetPerHour: 0.01999999999999602
// predictions: [
//   {
//     timestamp: "2023-03-21T08:30:00",
//     waterHeight: 46.295,
//     waterDischarge: 2407.5,
//     isDeleted: false
//   }
// ]
// readings: [
//   {
//     id: 2025024
//     isDeleted: false
//     isMissing: false
//     timestamp: "2023-03-21T08:15:00"
//     waterDischarge: 2400
//     waterHeight: 46.29
//   }
// ]

export const DataPointModel = types.model("DataPoint").props({
  reading: types.maybe(types.number),
  waterDischarge: types.maybe(types.number),
  timestamp: types.maybe(types.frozen()), // dayjs instance
  timestampMs: types.maybe(types.number), // miliseconds since epoch
  isDeleted: types.maybe(types.boolean),
});

const NOAAForecastDataModel = types.model("NOAAForecastData").props({
  forecastId: types.maybe(types.number),
  timestamp: types.maybe(types.string),
  stage: types.maybe(types.number),
  discharge: types.maybe(types.number),
});

const NOAAPeakModel = types
  .model("NOAAPeak")
  .props({
    forecastId: types.maybe(types.number),
    timestamp: types.maybe(types.string),
    stage: types.maybe(types.number),
    discharge: types.maybe(types.number),
  })
  .views((store) => ({
    get reading() {
      return store.stage;
    },

    get waterDischarge() {
      return store.discharge;
    },
  }));

export const NOAAForecastModel = types.model("NOAAForecast").props({
  county: types.maybe(types.string),
  created: types.maybe(types.string),
  currentDischarge: types.maybe(types.number),
  currentWaterHeight: types.maybe(types.number),
  data: types.array(NOAAForecastDataModel),
  discharge: types.maybe(types.number),
  forecastId: types.maybe(types.number),
  stage: types.maybe(types.number),
  timestamp: types.maybe(types.string),
  description: types.maybe(types.string),
  elevation: types.maybe(types.number),
  floodStage: types.maybe(types.number),
  latitude: types.maybe(types.number),
  longitude: types.maybe(types.number),
  noaaSiteId: types.maybe(types.string),
  peaks: types.array(NOAAPeakModel),
  state: types.maybe(types.string),
});

// API V2 Model
const ReadingModel = types.model("Reading").props({
  discharges: types.array(types.maybeNull(types.number)),
  readingIds: types.array(types.number),
  timestamps: types.array(types.string),
  trendCfsPerHour: types.maybe(types.number),
  trendFeetPerHour: types.maybe(types.number),
  waterHeights: types.array(types.number),
});

// API V2 Model
const PeakModel = types.model("Peak").props({
  discharges: types.array(types.number),
  timestamps: types.array(types.string),
  waterHeights: types.array(types.number),
});

// API V2 Model
const PredictionModel = types.model("Prediction").props({
  discharges: types.array(types.number),
  waterHeights: types.array(types.number),
  forecastCreated: types.string,
  forecastId: types.maybeNull(types.number),
  noaaSiteId: types.optional(types.string, ""),
  timestamps: types.array(types.string),
  peaks: types.maybeNull(PeakModel),
});

const ForecastModel = types
  .model("Forecast")
  .props({
    id: types.string,
    color: types.maybe(types.string),
    locationInfo: types.maybeNull(types.late(() => types.safeReference(LocationInfoModel))),
    recentReadings: types.maybeNull(ReadingModel), // API V2 Model
    predictions: types.maybeNull(PredictionModel), // API V2 Model
  })
  .views((store) => ({
    get dischargeStageOne() {
      return store.locationInfo?.dischargeStageOne || store.locationInfo?.dischargeMin;
    },

    get dischargeStageTwo() {
      return store.locationInfo?.dischargeStageTwo || store.locationInfo?.dischargeMax;
    },

    get predictedCfsPerHour() {
      return store.recentReadings?.trendCfsPerHour;
    },

    get predictedFeetPerHour() {
      return store.recentReadings?.trendFeetPerHour;
    },

    get noaaSiteId() {
      return store.predictions?.noaaSiteId;
    },
  }))
  .views((store) => ({
    get dataPoints() {
      const timestamps = store.recentReadings?.timestamps || [];
      const waterHeights = store.recentReadings?.waterHeights || [];
      const discharges = store.recentReadings?.discharges || [];

      return (timestamps || []).map((timestamp, index) => {
        const ts = dayjs(timestamp);

        return {
          reading: waterHeights[index],
          waterDischarge: discharges[index],
          timestamp: ts,
          timestampMs: ts.valueOf(),
        } as DataPoint;
      });
    },

    get forecastDataPoints() {
      const timestamps = store.predictions?.timestamps || [];
      const discharges = store.predictions?.discharges || [];
      const waterHeights = store.predictions?.waterHeights || [];

      return (timestamps || []).map((timestamp, index) => {
        const ts = dayjs(timestamp);

        return {
          reading: waterHeights[index],
          waterDischarge: discharges[index],
          timestamp: ts,
          timestampMs: ts.valueOf(),
        } as DataPoint;
      });
    },

    get peaks() {
      const timestamps = store.predictions?.peaks?.timestamps || [];
      const discharges = store.predictions?.peaks?.discharges || [];
      const waterHeights = store.predictions?.peaks?.waterHeights || [];

      return discharges.map((discharge, index) => {
        const ts = dayjs(timestamps[index]);

        return {
          timestamp: ts,
          timestampMs: ts.valueOf(),
          reading: waterHeights[index],
          waterDischarge: discharge,
        };
      });
    },
  }))
  .views((store) => {
    return {
      get latestReading() {
        return store?.dataPoints[0];
      },

      get maxReading() {
        const dataPoints = store?.dataPoints;

        if (!dataPoints.length) {
          return null;
        }

        const cutoff = dayjs().subtract(24, "hours").valueOf();
        let maxReading = dataPoints[0];
        let max = maxReading?.waterDischarge ?? Number.NEGATIVE_INFINITY;

        for (let i = 1; i < dataPoints.length; i++) {
          const reading = dataPoints[i];

          if (reading.timestampMs === undefined || reading.timestampMs < cutoff) {
            break;
          }

          if (reading.waterDischarge !== undefined && reading.waterDischarge > max) {
            maxReading = reading;
            max = reading.waterDischarge;
          }
        }

        return maxReading;
      },

      get last100Readings() {
        return store?.dataPoints.slice(0, 100);
      },

      get last100ForecastReadings() {
        return store?.forecastDataPoints.slice(0, 100);
      },

      get chartReadings() {
        return store.dataPoints
          .map((dp) => {
            return {
              x: dp.timestampMs,
              xLabel: dp.timestamp.format("ddd, MMM D, h:mm A"),
              xLabelShort: dp.timestamp.format("MMM D, h:mm A"),
              y: dp.waterDischarge,
              stage: dp.reading,
              isForecast: false,
            };
          })
          .slice()
          .reverse();
      },

      get chartForecastReadings() {
        return store.forecastDataPoints
          .map((dp) => {
            return {
              x: dp.timestampMs,
              xLabel: dp.timestamp.format("ddd, MMM D, h:mm A"),
              xLabelShort: dp.timestamp.format("MMM D, h:mm A"),
              y: dp.waterDischarge,
              stage: dp.reading,
              isForecast: true,
            };
          })
          .slice();
      },

      get forecastGage() {
        return {
          id: store.id,
          nwrfcId: store?.noaaSiteId,
          title: store?.locationInfo?.name || store?.locationInfo?.shortName,
          warningDischarge: store.dischargeStageOne,
          floodDischarge: store.dischargeStageTwo,
          isMetagage: store?.locationInfo?.isMetagage,
          color: store.color,
        } as GageSummary;
      },
    };
  });

export const ForecastStoreModel = types
  .model("ForecastStore")
  .props({
    forecasts: types.map(ForecastModel),
    maxReadingId: types.maybeNull(types.number),
    ...dataFetchingProps,
  })
  .actions(withDataFetchingActions)
  .actions((store) => {
    const buildData = (response: Record<string, Predictions | Readings>) => {
      Object.keys(response).forEach((gageId, index) => {
        const value = response[gageId];

        if (!value) {
          return;
        }

        const existingValue = store.forecasts.get(gageId);

        if (!existingValue) {
          store.forecasts.set(gageId, {
            id: gageId,
            locationInfo: gageId,
            color: ChartColorsHex[index],
            predictions: "forecastId" in value ? value : null,
            recentReadings: "forecastId" in value ? null : value,
          });

          return;
        }

        if ("forecastId" in value) {
          existingValue.predictions = value;
          return;
        }

        existingValue.recentReadings = value;
      });
    };

    const fetchRecentReadings = flow(function* () {
      store.setIsFetching(true);

      const params = {
        gageIds: Config.FORECAST_GAGE_IDS.join(","),
      };

      const response = yield api.getReadings(params);

      if (response.kind === "ok") {
        buildData(response.data?.readings);

        if (response.data?.maxReadingId) {
          store.maxReadingId = response.data.maxReadingId;
        }
      } else {
        store.setError(response.kind);
      }

      store.setIsFetching(false);
    });

    const fetchForecast = flow(function* () {
      store.setIsFetching(true);

      const response = yield api.getForecasts(
        Config.FORECAST_GAGE_IDS.join(","),
        dayjs()
          .subtract(Config.FRONT_PAGE_CHART_DURATION_NUMBER, Config.FRONT_PAGE_CHART_DURATION_UNIT)
          .toDate()
          .toISOString()
      );

      if (response.kind === "ok") {
        buildData(response.data);
      } else {
        store.setError(response.kind);
      }

      store.setIsFetching(false);
    });

    const fetchData = flow(function* () {
      store.maxReadingId = null;

      yield fetchRecentReadings();
      yield fetchForecast();
    });

    return {
      fetchData,
      fetchRecentReadings,
      fetchForecast,
    };
  })
  .views((store) => ({
    getForecast(gageId: string) {
      return store.forecasts.get(gageId);
    },
  }));

export type ForecastStore = Instance<typeof ForecastStoreModel>;
export type ForecastStoreSnapshot = SnapshotOut<typeof ForecastStoreModel>;

export type Forecast = Instance<typeof ForecastModel>;
export type NOAAForecast = Instance<typeof NOAAForecastModel>;
export type DataPoint = Instance<typeof DataPointModel>;
export type Predictions = Instance<typeof PredictionModel>;
export type Readings = Instance<typeof ReadingModel>;
export type ForecastSnapshotOut = SnapshotOut<typeof ForecastModel>;
export type ForecastSnapshotIn = SnapshotIn<typeof ForecastModel>;
