// Adapted from https://github.com/highcharts/highcharts-react-native

import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, ViewStyle } from "react-native";
import { WebView, WebViewMessageEvent, WebViewProps } from "react-native-webview";
import { buildLayoutHtml } from "./HighchartsLayout";

export interface HighchartsReactNativeProps {
  options: Highcharts.Options;
  modules?: string[];
  styles?: ViewStyle;
  webviewProps?: WebViewProps;
  onMessage?: (data: string) => void;
  startInLoadingState?: boolean;
  webviewStyles?: ViewStyle;
  setOptions?: Highcharts.Options;
}

type AndroidWebViewProps = Partial<WebViewProps> & {
  androidHardwareAccelerationDisabled?: boolean;
};

// Serialize Highcharts options to a JSON string, converting functions to
// string representations so they survive the RN→WebView boundary.
const serialize = (chartOptions: Highcharts.Options, isUpdate?: boolean): string => {
  const hcFunctions: Record<string, string> = {};
  let i = 0;

  let serialized = JSON.stringify(chartOptions, function (_key, value) {
    if (typeof value === "function") {
      const fcId = "###HCF" + i + "###";
      hcFunctions[fcId] = value.toString();
      i++;
      return isUpdate ? value.toString() : fcId;
    }
    return value;
  });

  if (!isUpdate) {
    Object.keys(hcFunctions).forEach((key) => {
      serialized = serialized.replace('"' + key + '"', hcFunctions[key]);
    });
  }

  return serialized;
};

const HighchartsReactNative = React.memo((props: HighchartsReactNativeProps) => {
  const {
    styles,
    onMessage,
    startInLoadingState = true,
    webviewStyles,
    webviewProps = {},
    modules = [],
    options,
    setOptions = {},
  } = props;

  const webviewRef = useRef<WebView>(null);
  const [chartReady, setChartReady] = useState(false);
  const androidWebViewProps: AndroidWebViewProps = {
    androidHardwareAccelerationDisabled: true,
  };
  const modulesKey = modules.join(",");

  // Build HTML once per modules list — changes to modules force a WebView reload.
  const html = useMemo(
    () => buildLayoutHtml(modulesKey ? modulesKey.split(",") : []),
    [modulesKey]
  );

  // Send updated options to the already-rendered chart via postMessage.
  useEffect(() => {
    if (!chartReady) {
      return;
    }
    webviewRef.current?.postMessage(serialize(options, true));
  }, [options, chartReady]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    if (data === "chart-ready") {
      setChartReady(true);
      return;
    }
    onMessage?.(data);
  };

  // Highcharts is loaded by the HTML via <script src>. This script only
  // initializes the chart — it is small enough to inject safely.
  const initScript = `
    (function() {
      try {
        Highcharts.setOptions(${serialize(setOptions)});
        Highcharts.chart('container', ${serialize(options)});
        window.ReactNativeWebView.postMessage('chart-ready');
      } catch (e) {
        window.ReactNativeWebView.postMessage('error:' + e.message);
      }
      return true;
    })();
  `;

  return (
    <View style={styles}>
      <WebView
        ref={webviewRef}
        onMessage={handleMessage}
        source={{ html, baseUrl: "https://code.highcharts.com/" }}
        injectedJavaScript={initScript}
        originWhitelist={["*"]}
        automaticallyAdjustContentInsets={true}
        allowFileAccess={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        mixedContentMode="always"
        allowFileAccessFromFileURLs={true}
        startInLoadingState={startInLoadingState}
        style={webviewStyles}
        {...androidWebViewProps}
        {...webviewProps}
      />
    </View>
  );
});

HighchartsReactNative.displayName = "HighchartsReactNative";

export default HighchartsReactNative;
