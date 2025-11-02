/**
 * Responsive Layout Components
 * =============================
 * Cross-platform responsive layout components with web-optimized breakpoints
 */

import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet, ScrollView, Dimensions } from 'react-native';
import PlatformUtils from '../utils/PlatformUtils';

const {
  getMaxContentWidth,
  getScreenPadding,
  responsive,
  isMobileSize,
  isDesktopSize,
} = PlatformUtils;

interface ResponsiveContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  centered?: boolean;
  fullWidth?: boolean;
}

/**
 * Container that centers content and applies max-width on larger screens
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  centered = true,
  fullWidth = false,
}) => {
  const maxWidth = fullWidth ? '100%' : getMaxContentWidth();
  const padding = getScreenPadding();

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth,
    paddingHorizontal: padding,
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
};

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: number;
  style?: ViewStyle;
}

/**
 * Responsive grid that adjusts columns based on screen size
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 16,
  style,
}) => {
  const columnCount = responsive({
    mobile: columns.mobile || 1,
    tablet: columns.tablet,
    desktop: columns.desktop,
    wide: columns.wide,
  });

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -gap / 2,
    ...style,
  };

  const childArray = React.Children.toArray(children);

  return (
    <View style={gridStyle}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / columnCount}%` as any,
            paddingHorizontal: gap / 2,
            marginBottom: gap,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveTwoColumnProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  gap?: number;
  stackOnMobile?: boolean;
  style?: ViewStyle;
}

/**
 * Two-column layout that stacks on mobile
 */
export const ResponsiveTwoColumn: React.FC<ResponsiveTwoColumnProps> = ({
  leftContent,
  rightContent,
  leftWidth = { mobile: '100%', tablet: '40%', desktop: '30%' },
  gap = 24,
  stackOnMobile = true,
  style,
}) => {
  const shouldStack = stackOnMobile && isMobileSize();
  const leftWidthValue = responsive({
    mobile: leftWidth.mobile || '100%',
    tablet: leftWidth.tablet,
    desktop: leftWidth.desktop,
  });

  if (shouldStack) {
    return (
      <View style={style}>
        <View style={{ marginBottom: gap }}>{leftContent}</View>
        <View>{rightContent}</View>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <View style={{ width: leftWidthValue as any, marginRight: gap }}>
        {leftContent}
      </View>
      <View style={{ flex: 1 }}>{rightContent}</View>
    </View>
  );
};

interface ResponsiveSidebarLayoutProps {
  sidebarContent: ReactNode;
  mainContent: ReactNode;
  sidebarWidth?: number;
  sidebarPosition?: 'left' | 'right';
  collapsible?: boolean;
  style?: ViewStyle;
}

/**
 * Sidebar layout (desktop) that becomes drawer (mobile)
 */
export const ResponsiveSidebarLayout: React.FC<ResponsiveSidebarLayoutProps> = ({
  sidebarContent,
  mainContent,
  sidebarWidth = 280,
  sidebarPosition = 'left',
  style,
}) => {
  const showSidebar = isDesktopSize();

  if (!showSidebar) {
    // On mobile, just show main content (sidebar would be in drawer)
    return <View style={[styles.container, style]}>{mainContent}</View>;
  }

  const isLeft = sidebarPosition === 'left';

  return (
    <View style={[styles.row, styles.container, style]}>
      {isLeft && (
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          {sidebarContent}
        </View>
      )}
      <View style={styles.mainContent}>{mainContent}</View>
      {!isLeft && (
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          {sidebarContent}
        </View>
      )}
    </View>
  );
};

interface ResponsiveScrollContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  horizontal?: boolean;
}

/**
 * ScrollView with responsive padding
 */
export const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  horizontal = false,
}) => {
  const padding = getScreenPadding();

  return (
    <ScrollView
      style={style}
      contentContainerStyle={[
        { padding },
        contentContainerStyle,
      ]}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={horizontal}
      showsVerticalScrollIndicator={!horizontal}
    >
      {children}
    </ScrollView>
  );
};

interface ResponsiveCardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

/**
 * Card component with responsive sizing
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  style,
  elevated = true,
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor: '#fff',
    borderRadius: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    padding: responsive({ mobile: 16, tablet: 20, desktop: 24 }),
    ...(elevated && {
      ...styles.elevated,
      shadowOpacity: responsive({ mobile: 0.1, tablet: 0.12, desktop: 0.15 }),
    }),
    ...style,
  };

  return <View style={cardStyle}>{children}</View>;
};

interface ResponsiveModalProps {
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: number;
}

/**
 * Modal that adjusts to screen size
 * Full-screen on mobile, centered on desktop
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  visible,
  onClose,
  maxWidth = 600,
}) => {
  if (!visible) return null;

  const isFullscreen = isMobileSize();
  const { width, height } = Dimensions.get('window');

  const overlayStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  };

  const modalStyle: ViewStyle = {
    backgroundColor: '#fff',
    borderRadius: isFullscreen ? 0 : 16,
    width: isFullscreen ? width : Math.min(maxWidth, width - 32),
    maxHeight: isFullscreen ? height : height - 64,
  };

  return (
    <View style={overlayStyle} onTouchEnd={onClose}>
      <View style={modalStyle} onTouchEnd={(e) => e.stopPropagation()}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  sidebar: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  mainContent: {
    flex: 1,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveTwoColumn,
  ResponsiveSidebarLayout,
  ResponsiveScrollContainer,
  ResponsiveCard,
  ResponsiveModal,
};
