import { Image } from "expo-image";
import { Link, Slot, Tabs, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { Pressable } from "react-native";

import "@expo/match-media";

import { Cell, Row, RowOrCell, Separator } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import Icon from "@common-ui/components/Icon";
import {
  LabelText,
  LargeTitle,
  RegularLargeText,
  SmallerText,
  SmallText,
  TinyText,
} from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useAppAssets } from "@common-ui/contexts/AssetsContext";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isWeb, useResponsive } from "@common-ui/utils/responsive";
import AppStoreBanner from "@components/AppStoreBanner";
import LocaleChange from "@components/LocaleChange";
import TasteOfTheValleyBanner from "@components/TasteOfTheValleyBanner";
import { useStores } from "@models/helpers/useStores";
import { useCheckForUpdates } from "@services/expoUpdates";
import { useRegisterPushNotificationsListener } from "@services/usePushNotificationsListener";
import { openLinkInBrowser } from "@utils/navigation";
import { MainRoute, ROUTES, routes } from "app/_layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GAGE_ICONS = {
  active: require("@assets/images/floodzuki.png"),
  inactive: require("@assets/images/floodzuki-gray.png"),
};

// Main App Layout
export default function AppLayout() {
  const store = useStores();

  // Fetch data on app start
  useEffect(() => {
    const getAllData = async () => {
      await store.fetchMainData();

      if (store.authSessionStore.isLoggedIn) {
        await store.authSessionStore.reauthenticate();
      }
    };

    getAllData();
  }, [store, store.authSessionStore.isLoggedIn]);

  // Check for updates
  // Disable updates check due to bug in Expo
  useCheckForUpdates();

  // Register for Push Notifications
  useRegisterPushNotificationsListener(store.authSessionStore.isPushNotificationsEnabled);

  return (
    <Ternary condition={isWeb}>
      <>
        <AppStoreBanner />
        <Header />
        <TasteOfTheValleyBanner />
        <Slot />
      </>
      <TabView />
    </Ternary>
  );
}

const useIsLinkActive = (path: string) => {
  const pathname = usePathname();

  return pathname.includes(path);
};

function HeaderLink({ href, children }) {
  const { isMobile } = useResponsive();
  const isActive = useIsLinkActive(href);

  const $color = isActive ? Colors.primary : Colors.lightDark;

  const Title = isMobile ? LabelText : LargeTitle;
  const spacing = isMobile ? Spacing.small : Spacing.large;

  return (
    <Link href={href} asChild>
      <Pressable>
        {({ pressed, hovered }) => (
          <Cell horizontal={spacing} vertical={Spacing.extraSmall}>
            <Title color={hovered ? Colors.primary : $color}>{children}</Title>
          </Cell>
        )}
      </Pressable>
    </Link>
  );
}

function FooterLink({ route, children }: { route: MainRoute; children: string }) {
  const isActive = useIsLinkActive(route.path);

  const imageSize = 32;

  const $color = isActive ? Colors.primary : Colors.darkGrey;
  const $imageStyle = { width: imageSize, height: imageSize, marginBottom: -2, marginTop: -6 };

  const gageImageIconSource = isActive ? GAGE_ICONS.active : GAGE_ICONS.inactive;

  return (
    <Link href={route.path} asChild>
      <Pressable>
        {({ pressed }) => (
          <Cell align="center">
            <Ternary condition={route.path === ROUTES.Gages}>
              <Image source={gageImageIconSource} style={$imageStyle} />
              <Icon name={route?.icon} color={$color} />
            </Ternary>
            <LabelText color={pressed ? Colors.primary : $color}>{children}</LabelText>
          </Cell>
        )}
      </Pressable>
    </Link>
  );
}

function Header() {
  const { isMobile, isWideScreen } = useResponsive();
  const { getAsset } = useAppAssets();
  const { t } = useLocale();

  const openSVPA = () => {
    openLinkInBrowser("https://svpa.us/floodzilla-gage-network/");
  };

  const Title = isMobile ? SmallText : RegularLargeText;
  const Subtitle = isMobile ? TinyText : SmallerText;

  const imageSize = isMobile ? 36 : 40;
  const offsetLeft = isMobile ? Spacing.extraSmall : Spacing.medium;
  const $imageStyle = { width: imageSize, height: imageSize };

  return (
    <Cell>
      <RowOrCell
        top={isWideScreen ? Spacing.small : Spacing.extraSmall}
        bottom={isWideScreen ? Spacing.small : Spacing.tiny}
        align="space-between"
        justify="center">
        <Row flex left={Spacing.small}>
          <Image source={getAsset("logo")} style={$imageStyle} />
          <Cell left={offsetLeft} flex>
            <Link href={ROUTES.Home}>
              <Title>{t("common.title")}</Title>
            </Link>
            <Pressable onPress={openSVPA}>
              <Subtitle muted>{t("common.subtitle")}</Subtitle>
            </Pressable>
          </Cell>
        </Row>
        <Row flex align="center" right={Spacing.mediumXL}>
          {Object.values(routes).map((route) => (
            <HeaderLink key={route.path} href={route.path}>
              {t(route.title)}
            </HeaderLink>
          ))}
        </Row>
        <If condition={!isMobile}>
          <Cell flex align="flex-end" right={Spacing.medium}>
            <LocaleChange />
          </Cell>
        </If>
      </RowOrCell>
      <Separator size={Spacing.micro} />
    </Cell>
  );
}

function TabBar() {
  const { bottom } = useSafeAreaInsets();
  const { t } = useLocale();

  const $bottomOffset = bottom || Spacing.medium;

  return (
    <Cell>
      <Separator size={Spacing.micro} />
      <Row top={Spacing.small} bottom={$bottomOffset} align="space-evenly" justify="center">
        {Object.values(routes).map((route) => (
          <FooterLink key={route.path} route={route}>
            {t(route.title)}
          </FooterLink>
        ))}
      </Row>
    </Cell>
  );
}

function TabView() {
  return (
    <Tabs
      tabBar={() => <TabBar />}
      screenOptions={{
        headerShown: false,
      }}>
      {Object.values(routes).map((route) => (
        <Tabs.Screen
          key={route.path}
          name={route.tabName}
          options={{
            href: route.path,
          }}
        />
      ))}
    </Tabs>
  );
}
