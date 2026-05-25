import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useState } from "react";

import { LinkButton, SolidButton } from "@common-ui/components/Button";
import { Card, CardContent, CardFooter } from "@common-ui/components/Card";
import { If } from "@common-ui/components/Conditional";
import { MediumText, RegularText } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { useStores } from "@models/helpers/useStores";

import { Cell, RowOrCell } from "@common-ui/components/Common";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { Input } from "@common-ui/components/Input";
import SuccessMessage from "@common-ui/components/SuccessMessage";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import Config from "@config/config";
import { useValidations } from "@utils/useValidations";
import { ROUTES } from "app/_layout";
import { useRouter } from "expo-router";

export type PasswordSubmitActionProps = {
  oldPassword: string;
  newPassword: string;
};

type ChangePasswordFormProps = {
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  showOldPasswordForm?: boolean;
  submitAction: (data: PasswordSubmitActionProps) => void;
  submitActionText: string;
};

const ChangePasswordForm = observer(function ChangePasswordForm(props: ChangePasswordFormProps) {
  const {
    description,
    errorMessage,
    successMessage,
    showOldPasswordForm,
    submitAction,
    submitActionText,
  } = props;

  const router = useRouter();
  const { t } = useLocale();
  const { authSessionStore } = useStores();

  const [oldPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const fieldsToValidate = useMemo(() => {
    const fields = {
      newPassword,
      confirmPassword,
    };

    if (showOldPasswordForm) {
      fields["oldPassword"] = oldPassword;
    }

    return fields;
  }, [oldPassword, newPassword, confirmPassword, showOldPasswordForm]);

  const [isValid] = useValidations(fieldsToValidate);

  useEffect(() => {
    setPasswordError("");

    // Validate Password
    if (newPassword && newPassword.length < Config.PASSWORD_MIN_LENGTH) {
      setPasswordError(t("validations.passwordLength", { length: Config.PASSWORD_MIN_LENGTH }));
    }

    // Validate Password Confirmation
    if (newPassword && confirmPassword && confirmPassword !== newPassword) {
      setPasswordError(t("validations.passwordsDontMatch"));
    }
  }, [confirmPassword, newPassword, t]);

  const onSumbit = () => {
    if (!isValid || passwordError) {
      return;
    }

    submitAction({
      oldPassword,
      newPassword,
    });
  };

  const goToHomeScreen = () => {
    router.push({ pathname: ROUTES.Home });
  };

  const error = passwordError || errorMessage;

  return (
    <Card>
      <If condition={!!description}>
        <RegularText>{description}</RegularText>
      </If>
      <CardContent>
        <If condition={showOldPasswordForm}>
          <RowOrCell vertical={Spacing.small}>
            <Cell flex={1}>
              <MediumText>{t("changePasswordForm.currentPassword")}:</MediumText>
            </Cell>
            <Cell flex={4}>
              <Input
                value=""
                secureTextEntry
                placeholder={t("changePasswordForm.currentPassword")}
                onChangeText={setCurrentPassword}
              />
            </Cell>
          </RowOrCell>
        </If>
        <RowOrCell vertical={Spacing.small}>
          <Cell flex={1}>
            <MediumText>{t("changePasswordForm.newPassword")}:</MediumText>
          </Cell>
          <Cell flex={4}>
            <Input
              value=""
              secureTextEntry
              placeholder={t("changePasswordForm.newPassword")}
              onChangeText={setNewPassword}
            />
          </Cell>
        </RowOrCell>
        <RowOrCell vertical={Spacing.small}>
          <Cell flex={1}>
            <MediumText>{t("changePasswordForm.confirmPassword")}:</MediumText>
          </Cell>
          <Cell flex={4}>
            <Input
              value=""
              secureTextEntry
              placeholder={t("changePasswordForm.confirmPassword")}
              onChangeText={setConfirmPassword}
            />
          </Cell>
        </RowOrCell>
        <If condition={!!error}>
          <ErrorMessage errorText={error ?? ""} />
        </If>
        <If condition={!!successMessage && !error}>
          <SuccessMessage successText={successMessage ?? ""} />
          <LinkButton
            selfAlign="center"
            title={t("changePasswordForm.proceed")}
            onPress={goToHomeScreen}
          />
        </If>
      </CardContent>
      <CardFooter>
        <SolidButton
          disabled={!isValid || !!passwordError}
          isLoading={authSessionStore.isFetching}
          minWidth={Spacing.extraExtraHuge}
          selfAlign="center"
          title={submitActionText}
          onPress={onSumbit}
        />
      </CardFooter>
    </Card>
  );
});

export default ChangePasswordForm;
