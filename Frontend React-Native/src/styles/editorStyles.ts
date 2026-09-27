import { StyleSheet } from 'react-native';

// Premium color palette
export const COLORS = {
  background: '#f8fafc', // light gray
  surface: 'rgba(255,255,255,0.85)', // glass effect
  primary: '#2563eb', // indigo
  secondary: '#3b82f6', // blue
  accent: '#10b981', // emerald
  danger: '#ef4444', // red
  textPrimary: '#0f172a', // dark
  textSecondary: '#334155', // gray-700
  muted: '#64748b', // gray-500
  border: '#e2e8f0', // gray-200
  overlay: 'rgba(0,0,0,0.4)', // modal backdrop
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

export const SHADOW = {
  // iOS shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  // Android elevation
  elevation: 3,
};

export const editorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  headerSaveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // Export button styles
  exportButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // Share button styles
  shareButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dragHintText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  rendererWrapper: {
    alignItems: 'center',
  },
  elementTabsContainer: {
    marginBottom: SPACING.md,
  },
  sectionSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: SPACING.sm,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  tabChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  editorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOW,
  },
  editorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardTypeSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  resetPosBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  resetPosBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  lockedNoteBox: {
    backgroundColor: '#fef2f2',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  lockedNoteText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    backgroundColor: '#fff',
    marginBottom: SPACING.sm,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  // Image control wrapper
  imageControlBox: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  replaceBtn: { backgroundColor: COLORS.secondary, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.sm },
  replaceBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  // Resize control container
  resizeBox: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  // Preset modal styles
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  presetChoiceCard: { backgroundColor: COLORS.surface, padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  presetChoiceText: { fontSize: 12, color: COLORS.textPrimary, textAlign: 'center' },
  chipsScroll: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chipBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  chipBtnActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  stepBtn: {
    backgroundColor: COLORS.border,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  colorDotSelected: {
    borderColor: COLORS.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  actionContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
    ...SHADOW,
  },
  modalHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
  },
  modalSubLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  modalCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalApplyBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  modalApplyText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceUploadBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  deviceUploadBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceUploadSubText: {
    fontSize: 11,
    color: COLORS.muted,
  },
});
