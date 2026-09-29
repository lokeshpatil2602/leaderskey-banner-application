import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TransformHandlesProps = {
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRotate?: () => void;
  onResize?: () => void;
};

export const TransformHandles: React.FC<TransformHandlesProps> = ({
  width,
  height,
  rotation = 0,
  locked = false,
  onDelete,
  onDuplicate,
  onRotate,
  onResize
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

      {/* Action Handle: Rotate (Top Right) */}
      {!locked && onRotate ? (
        <Pressable
          style={[styles.handleButton, styles.topRight, styles.rotateBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          hitSlop={8}
        >
          <Text style={styles.handleIcon}>↻</Text>
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

      {/* Action Handle: Resize (Bottom Right) */}
      {!locked && onResize ? (
        <Pressable
          style={[styles.handleButton, styles.bottomRight, styles.resizeBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onResize();
          }}
          hitSlop={8}
        >
          <Text style={styles.handleIcon}>⤡</Text>
        </Pressable>
      ) : null}
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
  topRight: {
    top: -11,
    right: -11
  },
  bottomLeft: {
    bottom: -11,
    left: -11
  },
  bottomRight: {
    bottom: -11,
    right: -11
  },
  deleteBtn: {
    backgroundColor: '#EF4444'
  },
  rotateBtn: {
    backgroundColor: '#8B5CF6'
  },
  duplicateBtn: {
    backgroundColor: '#3B82F6'
  },
  resizeBtn: {
    backgroundColor: '#10B981'
  },
  handleIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  }
});
