import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TransformHandlesProps = {
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRotateStart?: () => void;
  onResizeStart?: () => void;
};

export const TransformHandles: React.FC<TransformHandlesProps> = ({
  width,
  height,
  rotation = 0,
  locked = false,
  onDelete,
  onDuplicate
}) => {
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          width,
          height
        }
      ]}
    >
      {/* Selection Border */}
      <View style={[styles.border, locked && styles.lockedBorder]} />

      {/* Action Handle: Delete (Top Left) */}
      {!locked && onDelete ? (
        <Pressable
          style={[styles.handleButton, styles.topLeft, styles.deleteBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={8}
        >
          <Text style={styles.handleIcon}>✕</Text>
        </Pressable>
      ) : null}

      {/* Action Handle: Duplicate (Bottom Left) */}
      {!locked && onDuplicate ? (
        <Pressable
          style={[styles.handleButton, styles.bottomLeft, styles.duplicateBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          hitSlop={8}
        >
          <Text style={styles.handleIcon}>⧉</Text>
        </Pressable>
      ) : null}

      {/* Corner indicators */}
      <View style={[styles.cornerDot, styles.topRightDot]} />
      <View style={[styles.cornerDot, styles.bottomRightDot]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 4
  },
  lockedBorder: {
    borderColor: '#EAB308',
    borderStyle: 'solid'
  },
  handleButton: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    zIndex: 999
  },
  topLeft: {
    top: -11,
    left: -11
  },
  bottomLeft: {
    bottom: -11,
    left: -11
  },
  deleteBtn: {
    backgroundColor: '#EF4444'
  },
  duplicateBtn: {
    backgroundColor: '#3B82F6'
  },
  handleIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  cornerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB'
  },
  topRightDot: {
    top: -4,
    right: -4
  },
  bottomRightDot: {
    bottom: -4,
    right: -4
  }
});
