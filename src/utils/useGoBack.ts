import { Href, useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";

export function useGoBack(fallbackPathname: Href): () => void {
  const navigation = useNavigation();
  const router = useRouter();

  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push(fallbackPathname);
    }
  }, [navigation, router, fallbackPathname]);
}
