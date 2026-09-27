import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { AuthUser } from '../../api/services/authService';
import {
  Category,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '../../api/services/categoryService';
import { RoleGuard } from '../../components/common/RoleGuard';

type CategoriesScreenProps = {
  user: AuthUser;
  onNavigateHome?: () => void;
};

export function CategoriesScreen({ user, onNavigateHome }: CategoriesScreenProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('folder-outline');
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load categories.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIcon('folder-outline');
    setModalVisible(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setIcon(cat.icon || 'folder-outline');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('validation'), t('categoryNameRequired'));
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim(),
          icon: icon.trim()
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        Alert.alert(t('success'), t('categoryUpdated'));
      } else {
        const created = await createCategory({
          name: name.trim(),
          description: description.trim(),
          icon: icon.trim()
        });
        setCategories((prev) => [...prev, created]);
        Alert.alert(t('success'), t('categoryCreated'));
      }
      setModalVisible(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save category.';
      Alert.alert(t('actionFailed'), msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    Alert.alert(t('confirmDelete'), `Are you sure you want to delete category "${catName}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(id);
            setCategories((prev) => prev.filter((c) => c.id !== id));
            Alert.alert(t('deleted'), t('categoryDeleted'));
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete category.';
            Alert.alert(t('deleteFailed'), msg);
          }
        }
      }
    ]);
  };

  return (
    <RoleGuard user={user} allowedRoles={['ADMIN', 'SUPER_ADMIN']} onNavigateHome={onNavigateHome}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('categories')}</Text>
            <Text style={styles.subtitle}>{t('manageCategoryTaxonomy')}</Text>
          </View>
          <Pressable style={styles.addButton} onPress={openCreateModal}>
            <Text style={styles.addButtonText}>{t('addCategory')}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadCategories}>
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {categories.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>📂</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.slugText}>slug: /{item.slug}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  ) : null}
                </View>
                <View style={styles.actionColumn}>
                  <Pressable style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>{t('edit')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Text style={styles.deleteBtnText}>{t('delete')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Create / Edit Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>
                {editingCategory ? t('editCategory') : t('newCategory')}
              </Text>

              <Text style={styles.fieldLabel}>{t('nameRequired')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('categoryNamePlaceholder')}
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.fieldLabel}>{t('description')}</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                multiline
                placeholder={t('categoryDescriptionPlaceholder')}
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingCategory ? t('update') : t('create')}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    marginBottom: 12
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  iconText: {
    fontSize: 20
  },
  cardInfo: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  slugText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18
  },
  actionColumn: {
    gap: 6,
    marginLeft: 10
  },
  editBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600'
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    minWidth: 90,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
