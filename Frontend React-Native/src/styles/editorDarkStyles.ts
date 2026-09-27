import { StyleSheet } from 'react-native';
import { SPACING, RADIUS } from './editorStyles';

// Dark color palette – mirrors light palette but with dark shades
export const DARK_COLORS = {
  background: '#1e293b', // dark slate
  surface: 'rgba(30,41,59,0.85)', // glass effect
  primary: '#3b82f6', // blue-500
  secondary: '#2563eb', // indigo-600
  accent: '#10b981', // emerald
  danger: '#ef4444',
  textPrimary: '#f1f5f9', // gray-100
  textSecondary: '#cbd5e1', // gray-300
  muted: '#94a3b8', // gray-500
  border: '#475569', // gray-600
  overlay: 'rgba(0,0,0,0.6)', // modal backdrop
};

// Dark theme editor styles – copy of light theme with dark palette overrides
export const editorDarkStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: DARK_COLORS.surface, borderBottomWidth: 1, borderColor: DARK_COLORS.border },
  backButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#334155' },
  backButtonText: { fontSize: 13, fontWeight: '600', color: DARK_COLORS.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '800', color: DARK_COLORS.textPrimary },
  headerSaveBtn: { backgroundColor: DARK_COLORS.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  headerSaveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  previewSection: { alignItems: 'center', marginBottom: 8 },
  previewHeaderRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: DARK_COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dragHintText: { fontSize: 11, color: DARK_COLORS.primary, fontWeight: '600' },
  rendererWrapper: { alignItems: 'center' },
  elementTabsContainer: { marginBottom: 8 },
  sectionSubLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  tabsScroll: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  tabChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: DARK_COLORS.border },
  tabChipActive: { backgroundColor: DARK_COLORS.primary },
  tabChipText: { fontSize: 12, fontWeight: '600', color: DARK_COLORS.textSecondary },
  tabChipTextActive: { color: '#fff', fontWeight: '700' },
  editorCard: { backgroundColor: DARK_COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: DARK_COLORS.border, marginBottom: 8, ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } },
  editorCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: DARK_COLORS.textPrimary },
  cardTypeSub: { fontSize: 11, color: DARK_COLORS.muted, marginTop: 4 },
  resetPosBtn: { backgroundColor: '#eff6ff', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe' },
  resetPosBtnText: { color: DARK_COLORS.primary, fontSize: 12, fontWeight: '600' },
  lockedNoteBox: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 4 },
  lockedNoteText: { color: DARK_COLORS.danger, fontSize: 12 },
  input: { borderWidth: 1, borderColor: DARK_COLORS.border, borderRadius: 4, padding: 8, backgroundColor: '#222', marginBottom: 8 },
  controlLabel: { fontSize: 12, fontWeight: '600', color: DARK_COLORS.textSecondary, marginBottom: 4 },
  // Image control wrapper
  imageControlBox: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  replaceBtn: { backgroundColor: DARK_COLORS.secondary, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.sm },
  replaceBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  // Resize control container
  resizeBox: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  // Preset modal styles
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  presetChoiceCard: { backgroundColor: DARK_COLORS.surface, padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: DARK_COLORS.border },
  presetChoiceText: { fontSize: 12, color: DARK_COLORS.textPrimary, textAlign: 'center' },
  chipsScroll: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  chipBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: DARK_COLORS.border },
  chipBtnActive: { backgroundColor: DARK_COLORS.primary },
  chipText: { fontSize: 12, color: DARK_COLORS.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  sizeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepBtnRow: { flexDirection: 'row', gap: 4 },
  stepBtn: { backgroundColor: DARK_COLORS.border, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  stepBtnText: { fontSize: 14, fontWeight: '600', color: DARK_COLORS.textSecondary },
  colorPaletteRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  colorDotSelected: { borderColor: DARK_COLORS.primary },
  chipsRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  actionContainer: { marginTop: 16, alignItems: 'center' },
  saveButton: { backgroundColor: DARK_COLORS.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: DARK_COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: DARK_COLORS.surface, borderRadius: 12, padding: 16, maxHeight: '80%', ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } },
  modalHeader: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: DARK_COLORS.textPrimary },
  modalSubLabel: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4, color: DARK_COLORS.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
  modalCancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, backgroundColor: DARK_COLORS.border },
  modalCancelText: { color: DARK_COLORS.textSecondary, fontWeight: '600' },
  modalApplyBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, backgroundColor: DARK_COLORS.primary },
  modalApplyText: { color: '#fff', fontWeight: '600' },
  deviceUploadBtn: { backgroundColor: DARK_COLORS.secondary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, marginBottom: 8 },
  deviceUploadBtnText: { color: '#fff', fontWeight: '600' },
  deviceUploadSubText: { fontSize: 11, color: DARK_COLORS.muted },
  exportButton: { backgroundColor: DARK_COLORS.secondary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  exportButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  shareButton: { backgroundColor: DARK_COLORS.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  shareButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
