/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import Config from "@config/config";
import { ApiResponse, ApisauceInstance, create } from "apisauce";
import { ApiProblemData, GeneralApiProblem, getGeneralApiProblem } from "./apiProblem";

interface ApiConfig {
  url: string; // The URL of the api.
  timeout: number; // Milliseconds before we timeout the request.
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type RequestParams = { [key: string]: JsonValue } | string;

export type LogInParams = {
  username: string;
  password: string;
  rememberMe: boolean;
  captchaToken: string;
};

export type CreateAccountParams = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  password: string;
  rememberMe: boolean;
  captchaToken: string;
};

export type ForgotPasswordParams = {
  email: string;
  captchaToken: string;
};

export type SetPasswordParams = {
  oldPassword: string;
  newPassword: string;
};

export type CreatePasswordParams = {
  newPassword: string;
};

export type ResetPasswordParams = {
  newPassword: string;
  userId: string;
  code: string;
};

export type UpdateProfileParams = {
  firstName: string;
  lastName: string;
  email: string;
};

export type ChangeEmailParams = {
  email: string;
};

export type VerifyEmailParams = {
  token: string;
};

export type SendPhoneVerificationCodeParams = {
  phone: string;
};

export type VerifyPhoneParams = {
  phone: string;
  code: string;
};

export type ProcessGoogleTokenParams = {
  idToken: string;
};

export type ProcessAppleTokenParams = {
  idToken: string;
  firstName: string;
  lastName: string;
};

export type PushTokenParams = {
  token: string;
  platform: "ios" | "android";
  language: string;
  deviceId?: string;
};

export type NewSettingsParams = {
  notifyViaEmail: boolean;
  notifyViaSms: boolean;
  notifyForecastAlerts: boolean;
  notifyDailyForecasts: boolean;
};

export type GetGageReadingsParams = {
  gageIds: string;
  minutes?: number; // 2 days
  prevMaxReadingId?: number;
};

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.BASE_URL,
  timeout: 10000,
};

async function genericRequest<T>(
  requestType: "get" | "post" | "put" | "delete",
  api: ApisauceInstance,
  url: string,
  params?: RequestParams
): Promise<{ kind: "ok"; data: T } | GeneralApiProblem> {
  const response: ApiResponse<T> = await api[requestType](url, params);

  if (!response.ok) {
    const normalizedProblem = getGeneralApiProblem(response as ApiResponse<ApiProblemData>);
    if (normalizedProblem) {
      return normalizedProblem;
    }

    return { kind: "bad-data", data: null };
  }

  try {
    const rawData = response.data;

    if (rawData === undefined) {
      return { kind: "bad-data", data: null };
    }

    return { kind: "ok", data: rawData };
  } catch (e) {
    if (__DEV__) {
      console.error(`Bad data: ${e.message}\n${response.data}`, e.stack);
    }

    return { kind: "bad-data", data: null };
  }
}

async function genericGetRequest<T>(
  api: ApisauceInstance,
  url: string,
  params?: Exclude<RequestParams, string>
) {
  return await genericRequest<T>("get", api, url, params);
}

async function genericPostRequest<T>(api: ApisauceInstance, url: string, params?: RequestParams) {
  return await genericRequest<T>("post", api, url, JSON.stringify(params));
}

async function genericPutRequest<T>(api: ApisauceInstance, url: string, params?: RequestParams) {
  return await genericRequest<T>("put", api, url, params);
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance;
  config: ApiConfig;
  regionId: string | null = null;

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.regionId = String(Config.SVPA_REGION_ID);
    this.config = config;
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    });
  }

  setRegionId(regionId: string) {
    this.regionId = regionId;
  }

  setHeader(key: string, value: string) {
    this.apisauce.setHeader(key, value);
  }

  removeHeader(key: string) {
    this.apisauce.deleteHeader(key);
  }

  async getRegion<T>() {
    this.apisauce.setBaseURL(Config.BASE_URL);
    return await genericGetRequest<T>(this.apisauce, Config.API.client.GET_REGION_URL, {
      regionId: this.regionId,
    });
  }

  async getMetagages<T>() {
    this.apisauce.setBaseURL(Config.BASE_URL);
    return await genericGetRequest<T>(this.apisauce, Config.API.client.GET_METAGAGES_URL, {
      regionId: this.regionId,
    });
  }

  async getLocationInfo<T>() {
    this.apisauce.setBaseURL(Config.BASE_URL);
    return await genericGetRequest<T>(this.apisauce, Config.API.client.GET_GAGE_LIST_URL, {
      regionId: this.regionId,
    });
  }

  async getStatusAndRecentReadings<T>(fromDateTime: string, toDateTime: string) {
    this.apisauce.setBaseURL(Config.READING_BASE_URL);

    return await genericGetRequest<T>(this.apisauce, Config.API.reading.GET_STATUS_URL, {
      regionId: this.regionId,
      fromDateTime,
      toDateTime,
    });
  }

  async getGageReadings<T>(
    gageId: string,
    fromDateTime?: string,
    toDateTime?: string,
    lastReadingId?: number,
    includeStatus?: boolean,
    includePredictions?: boolean
  ) {
    this.apisauce.setBaseURL(Config.READING_BASE_URL);

    const params = {
      regionId: this.regionId,
      id: gageId,
    };

    if (fromDateTime) {
      params["fromDateTime"] = fromDateTime;
    }

    if (toDateTime) {
      params["toDateTime"] = toDateTime;
    }

    if (lastReadingId) {
      params["lastReadingId"] = lastReadingId;
    } else {
      params["getMinimalReadings"] = true;
    }

    if (includeStatus) {
      params["includeStatus"] = includeStatus;
    }

    if (includePredictions) {
      params["includePredictions"] = includePredictions;
    }

    return await genericGetRequest<T>(this.apisauce, Config.API.reading.GET_READINGS_URL, params);
  }

  async getForecastsUTC<T>(gageIds: string, fromDateTime?: string, toDateTime?: string) {
    this.apisauce.setBaseURL(Config.READING_BASE_URL);

    const params = {
      regionId: this.regionId,
      includePredictions: true,
      gageIds,
    };

    if (fromDateTime) {
      params["fromDateTime"] = fromDateTime;
    }

    if (toDateTime) {
      params["toDateTime"] = toDateTime;
    }

    return await genericGetRequest<T>(this.apisauce, Config.API.reading.GET_FORECAST_URL, params);
  }

  async getReadings<T>(params: GetGageReadingsParams) {
    this.apisauce.setBaseURL(Config.BASE_URL);

    const props = {
      regionId: this.regionId,
      gaugeIds: params.gageIds,
    };

    props["minutes"] = params.minutes || 5760;
    props["prevMaxReadingId"] = params.prevMaxReadingId || 0;

    return await genericGetRequest<T>(this.apisauce, Config.API.reading.GET_READINGS_V2_URL, props);
  }

  async getForecasts<T>(gageIds: string, fromDateTime?: string) {
    this.apisauce.setBaseURL(Config.BASE_URL);

    const params = {
      regionId: this.regionId,
      gaugeIds: gageIds,
    };

    if (fromDateTime) {
      params["ifNewerThan"] = fromDateTime;
    }

    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.reading.GET_FORECAST_V2_URL,
      params
    );
  }

  async login<T>(params: LogInParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.AUTHENTICATE_URL, params);
  }

  async createAccount<T>(params: CreateAccountParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.CREATEACCOUNT_URL, params);
  }

  async forgotPassword<T>(params: ForgotPasswordParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.FORGOTPASSWORD_URL, params);
  }

  async setPassword<T>(params: SetPasswordParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.SETPASSWORD_URL, params);
  }

  async createPassword<T>(params: CreatePasswordParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.CREATEPASSWORD_URL, params);
  }

  async resetPassword<T>(params: ResetPasswordParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.RESETPASSWORD_URL, params);
  }

  async updateProfile<T>(params: UpdateProfileParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.UPDATEACCOUNT_URL, params);
  }

  async changeEmail<T>(params: ChangeEmailParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.UPDATEACCOUNT_URL, {
      Username: params.email,
    });
  }

  async reauthenticate<T>() {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericGetRequest<T>(this.apisauce, Config.API.auth.REAUTHENTICATE_URL);
  }

  async sendVerificationEmail<T>() {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericGetRequest<T>(this.apisauce, Config.API.auth.SENDVERIFICATIONEMAIL_URL);
  }

  async verifyEmail<T>(params: VerifyEmailParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(
      this.apisauce,
      Config.API.auth.VERIFYEMAIL_URL,
      params.token
    );
  }

  async sendPhoneVerificationCode<T>(params: SendPhoneVerificationCodeParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(
      this.apisauce,
      Config.API.auth.SENDPHONEVERIFICATION_URL,
      params.phone
    );
  }

  async verifyPhoneCode<T>(params: VerifyPhoneParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.VERIFYPHONE_URL, params);
  }

  async processGoogleToken<T>(params: ProcessGoogleTokenParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(
      this.apisauce,
      Config.API.auth.AUTHENTICATE_WITH_GOOGLE_URL,
      params.idToken
    );
  }

  async processAppleToken<T>(params: ProcessAppleTokenParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(
      this.apisauce,
      Config.API.auth.AUTHENTICATE_WITH_APPLE_URL,
      params
    );
  }

  async getSettings<T>() {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericGetRequest<T>(this.apisauce, Config.API.subscriptions.SETTINGS_URL);
  }

  async updateSettings<T>(params: NewSettingsParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(
      this.apisauce,
      Config.API.subscriptions.SETTINGS_URL,
      params
    );
  }

  async getSubscribedGages<T>() {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.subscriptions.SUBSCRIPTIONS_URL + `/${this.regionId}`
    );
  }

  async setGageSubscription<T>(gageId: string, enabled: boolean) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPutRequest<T>(
      this.apisauce,
      Config.API.subscriptions.SUBSCRIPTIONS_URL + `/${this.regionId}/${gageId}`,
      JSON.stringify(enabled)
    );
  }

  async unsubscribeFromNotifications<T>(userId: string) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.subscriptions.UNSUBEMAIL_URL, {
      userId,
    });
  }

  async registerDevicePushToken<T>(params: PushTokenParams) {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.SET_PUSH_TOKEN_URL, params);
  }

  async deleteAccount<T>() {
    this.apisauce.setBaseURL(Config.AUTH_BASE_URL);

    return await genericPostRequest<T>(this.apisauce, Config.API.auth.DELETE_ACCOUNT_URL);
  }
}

// Singleton instance of the API for convenience
export const api = new Api();
