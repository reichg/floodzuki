import React from "react";
import { ColorValue, View, ViewStyle } from "react-native";

import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useResponsive } from "@common-ui/utils/responsive";
import { OffsetProps, useOffsetStyles } from "@common-ui/utils/useOffset";

type RowProps = {
  children?: React.ReactNode;
  wrap?: boolean;
  reverseColumns?: boolean;
  flex?: boolean | number | string;
  gap?: number;
  align?: "center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end";
  justify?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline";
  ref?: React.RefObject<View>;
} & OffsetProps;

type CellProps = {
  children?: React.ReactNode;
  flex?: boolean | number | string;
  gap?: number;
  wrap?: boolean;
  align?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline";
  justify?:
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "flex-start"
    | "flex-end";
  bgColor?: ColorValue;
  ref?: React.RefObject<View>;
  borderRadius?: number;
} & OffsetProps;

type BottomContainerProps = {
  children?: React.ReactNode;
  withGradient?: boolean;
} & OffsetProps;

type AbsoluteContainerProps = {
  children?: React.ReactNode;
  zIndex?: number;
  sticks?: ("top" | "bottom" | "left" | "right")[];
} & OffsetProps;

/**
 * Row is a flexbox container that lays out its children in a row.
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean} wrap - Whether to wrap the children if they don't fit in a row.
 * @param {boolean | number} flex - Whether to use flexbox to layout the children.
 * @param {number} gap - default gap between elements
 * @param {"center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"} align - How to align the children in the row.
 * @param {"center" | "flex-start" | "flex-end" | "stretch" | "baseline"} justify - How to align vertically the children in the row.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <Row align="space-between">
 *   <Text>Text</Text>
 * </Row>
 */
export const Row = ({
  children,
  align,
  justify,
  flex,
  gap,
  wrap,
  ref,
  ...offsetProps
}: RowProps) => {
  let styles: ViewStyle[] = [{ flexDirection: "row", alignItems: "center" }];

  styles = useOffsetStyles(styles, offsetProps);

  if (align) {
    styles.push({ justifyContent: align });
  }

  if (justify) {
    styles.push({ alignItems: justify });
  }

  if (flex) {
    const flexValue =
      typeof flex === "boolean" ? 1 : typeof flex === "string" ? parseFloat(flex) : flex;
    styles.push({ flex: flexValue });
  }

  if (gap) {
    styles.push({ gap });
  }

  if (wrap) {
    styles.push({ flexWrap: "wrap" });
  }

  return (
    <View ref={ref} style={styles}>
      {children}
    </View>
  );
};

/**
 * Separator is a thin horizontal line that can be used to separate content.
 * @example
 * <Separator />
 */
const $seprator: ViewStyle = { width: "100%", backgroundColor: Colors.lightGrey };
export const Separator = ({ size }: { size?: number }) => (
  <View style={[$seprator, { height: size || 1 }]} />
);

/**
 * Spacer is an empty block that can be used to add space between content.
 * @param {number} size - The height of the spacer (default 16px).
 * @example
 * <Spacer size={Spacing.medium} />
 */
export const Spacer = ({ size }: { size?: number }) => (
  <View style={{ height: size || Spacing.medium }} />
);

/**
 * Cell is a flexbox container lays out children in a stack
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean | number} flex - Whether to use flexbox to layout the children.
 * @param {number} gap - default gap between elements
 * @param {boolean} wrap - Whether to wrap the children if they don't fit in a row.
 * @param {"center" | "flex-start" | "flex-end" | "stretch" | "baseline"} align - How to align the children in the column.
 * @param {"center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"} justify - How to align the children in the column.
 * @param {ColorValue} bgColor - The background color of the cell.
 * @param {number} borderRadius - The border radius of the cell.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <Cell align="stretch">
 *   <Text>Text</Text>
 * </Cell>
 */
export const Cell = ({
  children,
  align,
  wrap,
  justify,
  flex,
  gap,
  bgColor,
  borderRadius,
  ref,
  ...offsetProps
}: CellProps) => {
  let styles: ViewStyle[] = [{ flexDirection: "column", justifyContent: "center" }];

  styles = useOffsetStyles(styles, offsetProps);

  if (align) {
    styles.push({ alignItems: align });
  }

  if (justify) {
    styles.push({ justifyContent: justify });
  }

  if (flex) {
    const flexValue =
      typeof flex === "boolean" ? 1 : typeof flex === "string" ? parseFloat(flex) : flex;
    styles.push({ flex: flexValue });
  }

  if (gap) {
    styles.push({ gap });
  }

  if (wrap) {
    styles.push({ flexWrap: "wrap" });
  }

  if (bgColor) {
    styles.push({ backgroundColor: bgColor });
  }

  if (borderRadius) {
    styles.push({ borderRadius });
  }

  return (
    <View ref={ref} style={styles}>
      {children}
    </View>
  );
};

/**
 * RowOrCell is a flexbox container that lays out its children in a row or a column depending on the screen size.
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean} reverseColumns - Whether to reverse the order of the children when rendering as a column.
 * @param {boolean} wrap - Whether to wrap the children if they don't fit in a row.
 * @param {boolean | number} flex - Whether to use flexbox to layout the children.
 * @param {"center" | "space-between" | "space-around" | "space-evenly" | "flex-start" | "flex-end"} align - How to align the children in the row.
 * @param {"center" | "flex-start" | "flex-end" | "stretch" | "baseline"} justify - How to align vertically the children in the row.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <RowOrCell align="space-between">
 *  <Text>Text</Text>
 * </RowOrCell>
 */
export const RowOrCell = (props: RowProps) => {
  const { isWideScreen } = useResponsive();

  const { children, align, justify, reverseColumns, ...rest } = props;

  if (isWideScreen) {
    return (
      <Row align={align} justify={justify} {...rest}>
        {children}
      </Row>
    );
  }

  let columnChildren: React.ReactNode[] = [];

  if (Array.isArray(children)) {
    columnChildren = [...children];

    if (reverseColumns) {
      columnChildren.reverse();
    }
  } else {
    columnChildren = [children];
  }

  return <Cell {...rest}>{columnChildren}</Cell>;
};

/**
 * BottomContainer is a flexbox container that sticks content to the bottom.
 * @param {React.ReactNode} children - The children to render.
 * @param {boolean} withGradient - Whether to add a gradient to the bottom of the container.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <BottomContainer>
 *  <Text>Text</Text>
 * </BottomContainer>
 */
export const BottomContainer = ({
  children,
  withGradient,
  ...offsetProps
}: BottomContainerProps) => {
  let styles: ViewStyle[] = [$bottomContainer];

  styles = useOffsetStyles(styles, offsetProps);

  return <View style={styles}>{children}</View>;
};

const $bottomContainer: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
};

/**
 * AbsoluteContainer is a flexbox container that sticks content to some direction ("left", "right", "top", "bottom").
 * @param {React.ReactNode} children - The children to render.
 * @param {"left" | "right" | "top" | "bottom"} sticks - The position of the container.
 * @param {number} zIndex - The z-index of the container.
 * @param {OffsetProps} props - The offset props.
 * @example
 * <AbsoluteContainer positions=["right", "top"]>
 *  <Text>Text</Text>
 * </AbsoluteContainer>
 */
export const AbsoluteContainer = ({
  children,
  sticks,
  zIndex,
  ...offsetProps
}: AbsoluteContainerProps) => {
  let styles: ViewStyle[] = [{ position: "absolute" }];
  const stickPositions = sticks ?? [];

  styles = useOffsetStyles(styles, offsetProps);

  if (stickPositions.includes("left")) {
    styles.push({ left: 0 });
  }

  if (stickPositions.includes("right")) {
    styles.push({ right: 0 });
  }

  if (stickPositions.includes("top")) {
    styles.push({ top: 0 });
  }

  if (stickPositions.includes("bottom")) {
    styles.push({ bottom: 0 });
  }

  if (zIndex) {
    styles.push({ zIndex });
  }

  return <View style={styles}>{children}</View>;
};
