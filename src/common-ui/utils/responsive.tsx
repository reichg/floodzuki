import { Platform } from "react-native";
import { useMediaQuery } from "react-responsive";

// Utils to detect platform
export const isWeb = Platform.OS === "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isMobile = isIOS || isAndroid;

// Utils to detect screen size
const useDesktopMediaQuery = () => useMediaQuery({ query: "(min-width: 1280px)" });

const useTabletMediaQuery = () =>
  useMediaQuery({ query: "(min-width: 768px) and (max-width: 1279px)" });

const useWideScreenMediaQuery = () => useMediaQuery({ query: "(min-width: 768px)" });

const useMobileMediaQuery = () => useMediaQuery({ query: "(max-width: 767px)" });

export const useResponsive = () => {
  const isDesktop = useDesktopMediaQuery();
  const isTablet = useTabletMediaQuery();
  const isMobile = useMobileMediaQuery();
  const isWideScreen = useWideScreenMediaQuery();

  return {
    isDesktop,
    isTablet,
    isMobile,
    isWideScreen,
  };
};

// Utils to detect orientation
const useLandscapeMediaQuery = () => useMediaQuery({ query: "(orientation: landscape)" });

const usePortraitMediaQuery = () => useMediaQuery({ query: "(orientation: portrait)" });

export const useOrientation = () => {
  const isLandscape = useLandscapeMediaQuery();
  const isPortrait = usePortraitMediaQuery();

  return {
    isLandscape,
    isPortrait,
  };
};

// Compopnents to use in your app
export const DesktopScreen = ({ children }) => {
  const isDesktop = useDesktopMediaQuery();
  return isDesktop ? children : null;
};

export const TabletScreen = ({ children }) => {
  const isTablet = useTabletMediaQuery();
  return isTablet ? children : null;
};

export const MobileScreen = ({ children }) => {
  const isMobile = useMobileMediaQuery();
  return isMobile ? children : null;
};

export const WideScreen = ({ children }) => {
  const isWideScreen = useWideScreenMediaQuery();
  return isWideScreen ? children : null;
};
