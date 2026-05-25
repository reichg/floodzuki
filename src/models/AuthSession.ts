import { i18n } from "@i18n/i18n";
import {
  ChangeEmailParams,
  CreateAccountParams,
  CreatePasswordParams,
  ForgotPasswordParams,
  LogInParams,
  NewSettingsParams,
  ProcessAppleTokenParams,
  ProcessGoogleTokenParams,
  ResetPasswordParams,
  SendPhoneVerificationCodeParams,
  SetPasswordParams,
  UpdateProfileParams,
  VerifyEmailParams,
  VerifyPhoneParams,
  api,
} from "@services/api";
import { registerForPushNotificationsAsync } from "@services/pushNotifications";
import { logError } from "@utils/sentry";
import { unregisterForNotificationsAsync } from "expo-notifications";
import { Instance, SnapshotOut, flow, types } from "mobx-state-tree";
import { Platform } from "react-native";
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps";
import { withSetPropAction } from "./helpers/withSetPropsAction";

// AuthSession

const SessionStateEnum = types.enumeration(["loggedIn", "notLoggedIn", "loggingIn", "loggingOut"]);
const AuthProvidersEnum = types.enumeration(["google", "apple", "email"]);

export const SessionState = {
  loggedIn: "loggedIn",
  notLoggedIn: "notLoggedIn",
  loggingIn: "loggingIn",
  loggingOut: "loggingOut",
} as const;

export const AuthProviders = {
  google: "google",
  apple: "apple",
  email: "email",
} as const;

type AuthResult = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  token: string;
  isAdmin: boolean;
  loginProvider: string;
  hasPassword: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
};

const UserSettingsModel = types.model("UserSettings").props({
  notifyDailyForecasts: types.maybe(types.boolean),
  notifyForecastAlerts: types.maybe(types.boolean),
  notifyViaEmail: types.maybe(types.boolean),
  notifyViaSms: types.maybe(types.boolean),
});

export const UserModel = types
  .model("User")
  .props({
    username: types.identifier,
    firstName: types.maybeNull(types.string),
    lastName: types.maybeNull(types.string),
    phone: types.maybeNull(types.string),
    loginProvider: types.maybeNull(types.string),
    token: types.maybeNull(types.string),
    isAdmin: types.maybe(types.boolean),
    hasPassword: types.maybe(types.boolean),
    emailVerified: types.maybe(types.boolean),
    phoneVerified: types.maybe(types.boolean),
  })
  .views((store) => ({
    get email() {
      return store.username;
    },
  }));

export const AuthSessionStoreModel = types
  .model("AuthSessionStore")
  .props({
    sessionState: types.maybe(SessionStateEnum),
    user: types.maybe(UserModel),
    userSettings: types.maybeNull(UserSettingsModel),
    authToken: types.maybe(types.string),
    loginProvider: types.maybeNull(types.string),
    gageSubscriptions: types.optional(types.array(types.string), []),
    isPushNotificationsEnabled: types.optional(types.boolean, false),
    pushToken: types.maybe(types.string),
    authenticatedWith: types.maybe(AuthProvidersEnum), // Options are "google", "apple", "email"
    locale: types.optional(types.string, i18n.locale), // Locale that we get from device
    preferredLocale: types.optional(types.string, ""), // Locale that user selected
    ...dataFetchingProps,
  })
  .actions(withDataFetchingActions)
  .actions(withSetPropAction)
  .views((store) => ({
    get userLocale() {
      return store.preferredLocale || store.locale;
    },

    get isNotificationsEnabled() {
      return (
        (store.userSettings?.notifyViaEmail && store.user?.emailVerified) ||
        (store.userSettings?.notifyViaSms && store.user?.phoneVerified) ||
        store.isPushNotificationsEnabled
      );
    },

    get isLoggedIn() {
      return store.sessionState === SessionState.loggedIn;
    },

    get hasLoginProvider() {
      return !!store.loginProvider;
    },

    get isEmailVerified() {
      return store.user?.emailVerified;
    },

    get isPhoneVerified() {
      return store.user?.phoneVerified;
    },

    get userPhone() {
      return store.user?.phone;
    },

    get userEmail() {
      return store.user?.username;
    },

    get userFirstName() {
      return store.user?.firstName;
    },

    get userLastName() {
      return store.user?.lastName;
    },

    get isAuthneticatedWithGoogle() {
      return store.authenticatedWith === AuthProviders.google;
    },

    get isAuthneticatedWithApple() {
      return store.authenticatedWith === AuthProviders.apple;
    },
  }))
  .actions((store) => {
    const onAuthenticate = (result: AuthResult) => {
      api.setHeader("Authorization", `Bearer ${result.token}`);

      store.setProp("authToken", result.token);
      store.setProp("loginProvider", result.loginProvider);
      store.setProp("user", result);
      store.setProp("sessionState", SessionState.loggedIn);
    };

    const removeAuthToken = () => {
      store.setProp("authToken", "");
      api.removeHeader("Authorization");
      store.setProp("pushToken", "");
      store.setProp("isPushNotificationsEnabled", false);
    };

    const onAuthFail = () => {
      removeAuthToken();
      store.setProp("sessionState", SessionState.notLoggedIn);
    };

    const logIn = flow(function* (params: LogInParams) {
      store.setIsFetching(true);

      const response = yield api.login(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        onAuthFail();
        store.setError(response.data ?? "Failed to log in");
      }

      store.setIsFetching(false);
    });

    const createAccount = flow(function* (params: CreateAccountParams) {
      store.setIsFetching(true);

      const response = yield api.createAccount(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        onAuthFail();
        store.setError(response.data ?? "Failed to create account. Please try again.");
      }

      store.setIsFetching(false);
    });

    const forgotPassword = flow(function* (params: ForgotPasswordParams) {
      store.setIsFetching(true);

      const response = yield api.forgotPassword(params);

      if (response.kind !== "ok") {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const setPassword = flow(function* (params: SetPasswordParams) {
      store.setIsFetching(true);

      const response = yield api.setPassword(params);

      if (response.kind !== "ok") {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    // Not currently used
    const createPassword = flow(function* (params: CreatePasswordParams) {
      store.setIsFetching(true);

      const response = yield api.createPassword(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const resetPassword = flow(function* (params: ResetPasswordParams) {
      store.setIsFetching(true);

      const response = yield api.resetPassword(params);

      if (response.kind !== "ok") {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const updateProfile = flow(function* (params: UpdateProfileParams) {
      store.setIsFetching(true);

      const response = yield api.updateProfile(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    // Not currently used
    const changeEmail = flow(function* (params: ChangeEmailParams) {
      store.setIsFetching(true);

      const response = yield api.changeEmail(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const reauthenticate = flow(function* () {
      store.setIsFetching(true);

      if (!store.authToken) {
        store.setIsFetching(false);
        return;
      }

      const response = yield api.reauthenticate();

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        onAuthFail();
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const sendVerificationEmail = flow(function* () {
      store.setIsFetching(true);

      if (!store.authToken) {
        store.setIsFetching(false);
        return;
      }

      const response = yield api.sendVerificationEmail();

      if (response.kind !== "ok") {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const verifyEmail = flow(function* (params: VerifyEmailParams) {
      store.setIsFetching(true);

      if (!store.authToken) {
        store.setIsFetching(false);
        return;
      }

      const response = yield api.verifyEmail(params);

      if (response.kind === "ok") {
        if (store.user) {
          store.user.emailVerified = true;
        }
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const sendPhoneVerificationCode = flow(function* (params: SendPhoneVerificationCodeParams) {
      store.setIsFetching(true);

      if (!store.authToken) {
        store.setIsFetching(false);
        return;
      }

      const response = yield api.sendPhoneVerificationCode(params);

      if (response.kind !== "ok") {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const verifyPhoneCode = flow(function* (params: VerifyPhoneParams) {
      store.setIsFetching(true);

      if (!store.authToken) {
        store.setIsFetching(false);
        return;
      }

      const response = yield api.verifyPhoneCode(params);

      if (response.kind === "ok") {
        if (store.user) {
          store.user.phone = params.phone;
          store.user.phoneVerified = true;
        }
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const processGoogleToken = flow(function* (params: ProcessGoogleTokenParams) {
      store.setIsFetching(true);

      const response = yield api.processGoogleToken(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        onAuthFail();
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const processAppleToken = flow(function* (params: ProcessAppleTokenParams) {
      store.setIsFetching(true);

      const response = yield api.processAppleToken(params);

      if (response.kind === "ok") {
        onAuthenticate(response.data);
      } else {
        onAuthFail();
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const logOut = flow(function* () {
      removeAuthToken();

      store.setProp("sessionState", SessionState.notLoggedIn);
    });

    const deleteAccount = flow(function* () {
      const response = yield api.deleteAccount();

      if (response.kind === "ok") {
        logOut();
      } else {
        logError(response);
      }
    });

    const getSettings = flow(function* () {
      if (!store.authToken) {
        return;
      }

      store.setIsFetching(true);

      const response = yield api.getSettings();

      if (response.kind === "ok") {
        store.setProp("userSettings", response.data);
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const updateSettings = flow(function* (params: NewSettingsParams) {
      store.setIsFetching(true);

      const response = yield api.updateSettings(params);

      if (response.kind === "ok") {
        yield getSettings();
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const getSubscribedGages = flow(function* () {
      if (!store.authToken) {
        return;
      }

      store.setIsFetching(true);

      const response = yield api.getSubscribedGages();

      if (response.kind === "ok") {
        store.setProp("gageSubscriptions", response.data);
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const setGageSubscription = flow(function* (gageId: string, isSubscribed: boolean) {
      store.setIsFetching(true);

      const response = yield api.setGageSubscription(gageId, isSubscribed);

      if (response.kind === "ok") {
        yield getSubscribedGages();
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const unsubscribeFromNotifications = flow(function* (userId: string) {
      store.setIsFetching(true);

      const response = yield api.unsubscribeFromNotifications(userId);

      if (response.kind === "ok") {
        yield getSettings();
      } else {
        store.setError(response.data);
      }

      store.setIsFetching(false);
    });

    const registerPushToken = flow(function* (token: string, locale?: string) {
      const response = yield api.registerDevicePushToken({
        token,
        platform: Platform.OS === "ios" ? "ios" : "android",
        language: locale || store.userLocale,
      });

      if (response.kind !== "ok") {
        store.setProp("pushToken", "");
        store.setProp("isPushNotificationsEnabled", false);
      }
    });

    const togglePushNotificationsEnabled = flow(function* (t) {
      const nextState = !store.isPushNotificationsEnabled;
      const token = store.pushToken;

      store.setProp("isPushNotificationsEnabled", nextState);

      // If nextState is true, we need to register the token
      if (nextState) {
        const newToken = yield registerForPushNotificationsAsync(true, t);

        if (!token || (token !== newToken && newToken)) {
          store.setProp("pushToken", newToken);
          yield registerPushToken(newToken);
        }
      } else {
        // If nextState is false, we need to remove the token
        store.setProp("pushToken", "");
        yield unregisterForNotificationsAsync();
      }
    });

    const setPrefferedLocale = flow(function* (locale: string) {
      store.setProp("preferredLocale", locale);

      if (!store.authToken || !store.pushToken) {
        return;
      }

      yield registerPushToken(store.pushToken, locale);
    });

    return {
      logIn,
      createAccount,
      forgotPassword,
      setPassword,
      createPassword,
      resetPassword,
      updateProfile,
      changeEmail,
      reauthenticate,
      sendVerificationEmail,
      verifyEmail,
      sendPhoneVerificationCode,
      verifyPhoneCode,
      processGoogleToken,
      processAppleToken,
      logOut,
      deleteAccount,
      getSettings,
      updateSettings,
      getSubscribedGages,
      setGageSubscription,
      unsubscribeFromNotifications,
      togglePushNotificationsEnabled,
      setPrefferedLocale,
    };
  });

export type AuthSessionStore = Instance<typeof AuthSessionStoreModel>;
export type AuthSessionStoreSnapshot = SnapshotOut<typeof AuthSessionStoreModel>;

export type User = Instance<typeof UserModel>;
