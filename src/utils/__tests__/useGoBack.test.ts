import { act, renderHook } from "@testing-library/react-native";
import { useNavigation, useRouter } from "expo-router";
import { useGoBack } from "../useGoBack";

jest.mock("expo-router", () => ({
  useNavigation: jest.fn(),
  useRouter: jest.fn(),
}));

describe("useGoBack", () => {
  it("calls navigation.goBack() when canGoBack returns true", () => {
    const goBack = jest.fn();
    const push = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      canGoBack: () => true,
      goBack,
    });
    (useRouter as jest.Mock).mockReturnValue({ push });

    const { result } = renderHook(() => useGoBack("/home"));
    act(() => result.current());

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("calls router.push with the fallback pathname when canGoBack returns false", () => {
    const goBack = jest.fn();
    const push = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      canGoBack: () => false,
      goBack,
    });
    (useRouter as jest.Mock).mockReturnValue({ push });

    const { result } = renderHook(() => useGoBack("/user/profile"));
    act(() => result.current());

    expect(push).toHaveBeenCalledWith("/user/profile");
    expect(goBack).not.toHaveBeenCalled();
  });

  it("returns a stable function reference across re-renders", () => {
    (useNavigation as jest.Mock).mockReturnValue({
      canGoBack: () => true,
      goBack: jest.fn(),
    });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

    const { result, rerender } = renderHook(() => useGoBack("/home"));
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });
});
