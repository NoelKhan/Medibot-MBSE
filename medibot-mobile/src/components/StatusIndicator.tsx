/**
 * Status Indicator Component
 * ==========================
 * Shows banner when app is in offline/mock mode
 * Displays last sync time and connection status
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useBackendStatus } from '../contexts/BackendStatusContext';

interface StatusIndicatorProps {
  showOnline?: boolean; // Show indicator even when online
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ showOnline = false }) => {
  const { colors, isDark } = useTheme();
  const { status, isOnline, lastSyncTime } = useBackendStatus();
  const styles = createStyles(colors);

  // Don't show anything if online and showOnline is false
  if (isOnline && !showOnline) {
    return null;
  }

  const getStatusIcon = (): keyof typeof MaterialIcons.glyphMap => {
    switch (status) {
      case 'online':
        return 'cloud-done';
      case 'offline':
        return 'cloud-off';
      case 'mock':
        return 'cloud-queue';
      default:
        return 'cloud-off';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'online':
        return 'Connected to backend';
      case 'offline':
        return 'Offline - Using cached data';
      case 'mock':
        return 'Mock Mode - Using sample data';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'online':
        return colors.success;
      case 'offline':
        return colors.warning;
      case 'mock':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const formatLastSync = (): string => {
    if (!lastSyncTime) {
      return 'Never synced';
    }

    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, { backgroundColor: `${statusColor}15` }]}>
      <View style={styles.content}>
        <MaterialIcons name={getStatusIcon()} size={20} color={statusColor} />
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: statusColor }]}>{getStatusText()}</Text>
          {lastSyncTime && (
            <Text style={styles.syncText}>Last sync: {formatLastSync()}</Text>
          )}
        </View>
      </View>
      
      
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 999,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default StatusIndicator;
