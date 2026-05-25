import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isWeb } from "@common-ui/utils/responsive";
import * as Notifications from "expo-notifications";
import { Href, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { registerForPushNotificationsAsync } from "./pushNotifications";

function getNotificationPath(notification: Notifications.Notification): Href | null {
  const { data } = notification.request.content;

  if (typeof data?.url === "string") {
    return data.url as Href;
  }

  if (typeof data?.path === "string") {
    return data.path as Href;
  }

  return null;
}

export function useRegisterPushNotificationsListener(requestPermissions: boolean) {
  const router = useRouter();
  const { t } = useLocale();
  const initialRequestPermissionsRef = useRef(requestPermissions);
  const translateRef = useRef(t);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  useEffect(() => {
    registerForPushNotificationsAsync(initialRequestPermissionsRef.current, translateRef.current);
    Notifications.setBadgeCountAsync(0);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isWeb) {
      return () => {};
    }

    function redirect(notification: Notifications.Notification) {
      const url = getNotificationPath(notification);

      if (url) {
        router.push(url);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);
}
