/* eslint-disable react/no-unescaped-entities */
import { ErrorBoundaryProps, useRouter } from "expo-router";
import React from "react";

import { IconButton, SimpleLinkButton } from "@common-ui/components/Button";
import { Row, Spacer } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import { Content, Screen } from "@common-ui/components/Screen";
import { HugeTitle, MediumTitle, RegularText } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isMobile } from "@common-ui/utils/responsive";
import { ErrorDetails } from "@components/ErrorDetails";
import { openLinkInBrowser } from "@utils/navigation";
import { ROUTES } from "app/_layout";
import Head from "expo-router/head";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export const SVPALink = () => {
  return <SimpleLinkButton text="svpa.us" onPress={() => openLinkInBrowser("https://svpa.us")} />;
};

export const FloodzillaLink = () => {
  return (
    <SimpleLinkButton
      text="floodzilla.com"
      onPress={() => openLinkInBrowser("https://floodzilla.com")}
    />
  );
};

const PrivacyPolicyScreen = () => {
  const router = useRouter();
  const { t } = useLocale();

  const goBack = () => {
    router.push({ pathname: ROUTES.About });
  };

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <Content scrollable>
        {/* SECTION */}
        <Row>
          <If condition={isMobile}>
            <IconButton left={-Spacing.medium} icon="chevron-left" onPress={goBack} />
          </If>
          <HugeTitle>Privacy Policy</HugeTitle>
        </Row>
        <Spacer size={Spacing.small} />
        <RegularText>
          The Snoqualmie Valley Preservation Alliance (SVPA) places a high priority on protecting
          your privacy. This privacy policy was created in order to demonstrate the SVPA's firm
          commitment to the privacy of our website users. This policy explains what types of
          information is collected by the SVPA's <SVPALink /> and <FloodzillaLink /> websites, and
          how this information is used.{"\n\n"}
          What Personally Identifiable Information is Collected SVPA supporters and website users
          that register for our web services, events and individuals that sign up to receive SVPA
          e-communications voluntarily provide us with contact information (such as name, address,
          phone, and e-mail address). We may use this information for specific, limited purposes.
          You may always "opt out," either now or at any time in the future, if you do not wish to
          receive our messages.
        </RegularText>
        <Spacer size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>IP addresses</MediumTitle>
        <Spacer size={Spacing.small} />
        <RegularText>
          The SVPA uses your IP address to help diagnose problems with our server, to administer{" "}
          <SVPALink /> and <FloodzillaLink />, and for statistical metrics used to track website
          visitor traffic.
        </RegularText>
        <Spacer size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>Cookies</MediumTitle>
        <Spacer size={Spacing.small} />
        <RegularText>
          <SVPALink /> and <FloodzillaLink /> uses "cookie" messages to automatically help provide
          better services. They remind us who you are and your preferences for our website based on
          what you've done and told us before. The "cookie" is placed in your computer and is read
          when you come back to our website. Cookies let us take you to the information and features
          you're particularly interested in. They also let us track your usage of <SVPALink /> and{" "}
          <FloodzillaLink /> so we know which parts of our sites are most popular. You can reject
          cookies or cancel them by instructing your Web browser accordingly.
        </RegularText>
        <Spacer size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>How Your Information May Be Used</MediumTitle>
        <Spacer size={Spacing.small} />
        <RegularText>
          We use your personal information to provide you with personalized service; to send e-mail
          alerts to you; to answer your requests; etc. You may choose to opt out at any time, which
          will cease all communications from us. We may also use your information to track visitor
          of our website. This lets us see which of our features are the most popular so we can
          better serve our users' needs. It also lets us provide aggregate data about our traffic
          (not identifying you personally, but showing how many visitors used which features, for
          example) to outside parties.
        </RegularText>
        <Spacer size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>Email Privacy</MediumTitle>
        <Spacer size={Spacing.small} />
        <RegularText>
          The SVPA does not provide, sell, or rent email addresses to anyone outside the
          organization.
        </RegularText>
        <Spacer size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>External Links</MediumTitle>
        <Spacer size={Spacing.small} />
        <RegularText>
          <SVPALink /> and <FloodzillaLink /> include links to external websites. These links do not
          fall under the <SVPALink /> and <FloodzillaLink /> domain, and the SVPA is not responsible
          for the privacy practices or the content of external websites. Your use of any linked
          website is solely at your own risk.
        </RegularText>
        <Spacer size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>Modifications</MediumTitle>
        <Spacer size={Spacing.small} />
        <RegularText>
          We may amend this privacy policy from time to time; please review it periodically. We
          maintain the option to modify this privacy at any time by electronic notice posted on our
          website. Your continued use of our website after the date that such notices are posted
          will be deemed to be your agreement to the changed terms.
        </RegularText>
        <Spacer size={Spacing.large} />
      </Content>
    </Screen>
  );
};

export default PrivacyPolicyScreen;
