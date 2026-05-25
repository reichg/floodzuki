import React, { useImperativeHandle, useRef } from "react";
import Recaptcha, { RecaptchaRef } from "react-native-recaptcha-that-works";

import { Ternary } from "@common-ui/components/Conditional";
import { isWeb } from "@common-ui/utils/responsive";
import { logError } from "@utils/sentry";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";

declare global {
  interface Window {
    localRecaptchaCallback?: (token: string) => void;
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: () => void;
      reset: () => void;
    };
  }
}
type RecaptchaHandles = {
  open: () => void;
  close?: () => void;
  reset?: () => void;
};

type GoogleRecaptchaProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
};

type WebRecaptchaProps = Pick<GoogleRecaptchaProps, "onVerify" | "onExpire">;

export type GoogleRecaptchaHandle = RecaptchaHandles;

const RECAPTCHA_KEY = Constants.expoConfig?.extra?.recaptchaKey ?? "";

// eslint-disable-next-line react/display-name
const WebRecaptchaInner = React.forwardRef<RecaptchaHandles, WebRecaptchaProps>(
  ({ onVerify, onExpire }: WebRecaptchaProps, ref) => {
    const isRendered = useRef(false);

    const uniqueId = Math.random().toString(36).substring(2, 15);

    useImperativeHandle(ref, () => ({
      open: () => {
        window.localRecaptchaCallback = (token: string) => {
          onVerify(token);
        };

        try {
          window.grecaptcha?.ready(function () {
            isRendered.current = true;

            window.grecaptcha?.execute();
          });
        } catch (e) {
          logError(e);
        }
      },

      reset: () => {
        if (!isRendered.current) {
          return;
        }

        window.grecaptcha?.reset();
      },
    }));

    return (
      <div
        id={`localRecaptchaContainer_${uniqueId}`}
        className="g-recaptcha"
        data-callback="localRecaptchaCallback"
        data-size="invisible"
        data-sitekey={RECAPTCHA_KEY}></div>
    );
  }
);

// eslint-disable-next-line react/display-name
const GoogleRecaptcha = React.forwardRef<GoogleRecaptchaHandle, GoogleRecaptchaProps>(
  (props: GoogleRecaptchaProps, ref) => {
    const { onVerify, onExpire } = props;

    const recaptchaWeb = useRef<RecaptchaHandles>(null);
    const recaptcha = useRef<RecaptchaRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        if (isWeb) {
          recaptchaWeb.current?.open();
          return;
        }

        recaptcha.current?.open();
      },

      reset: () => {
        if (isWeb) {
          recaptchaWeb.current?.reset?.();
        }
      },
    }));

    useFocusEffect(
      React.useCallback(() => {
        if (isWeb) {
          recaptchaWeb.current?.reset?.();
        }
      }, [])
    );

    return (
      <Ternary condition={isWeb}>
        <WebRecaptchaInner ref={recaptchaWeb} onVerify={onVerify} onExpire={onExpire} />
        <Recaptcha
          ref={recaptcha}
          siteKey={RECAPTCHA_KEY}
          baseUrl="http://floodzilla.com"
          size="invisible"
          theme="light"
          onExpire={onExpire}
          onVerify={onVerify}
        />
      </Ternary>
    );
  }
);

export default GoogleRecaptcha;
