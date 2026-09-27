import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthUser, AuthUserRole } from '../../api/services/authService';
import { getUsers, updateUserRole, updateUserStatus } from '../../api/services/userService';
import { RoleGuard } from '../../components/common/RoleGuard';

type UserManagementScreenProps = {
  user: AuthUser;
  onLogout?: () => Promise<void>;
  onNavigateHome?: () => void;
};

const roleOptions: AuthUserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export function UserManagementScreen({ user, onLogout, onNavigateHome }: UserManagementScreenProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await getUsers();
      setUsers(response);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load users.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (targetUser: AuthUser, nextRole: AuthUserRole) => {
    try {
      setUpdatingId(targetUser.id);
      const updatedUser = await updateUserRole(targetUser.id, nextRole);
      setUsers((currentUsers) =>
        currentUsers.map((row) => (row.id === updatedUser.id ? updatedUser : row))
      );
      Alert.alert(t('roleUpdated'), `${targetUser.name}'s role is now ${nextRole}.`);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update role.';
      Alert.alert(t('roleUpdateFailed'), message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (targetUser: AuthUser) => {
    try {
      setUpdatingId(targetUser.id);
      const updatedUser = await updateUserStatus(targetUser.id, !targetUser.isActive);
      setUsers((currentUsers) =>
        currentUsers.map((row) => (row.id === updatedUser.id ? updatedUser : row))
      );
      Alert.alert(
        'Status Changed',
        `${targetUser.name} is now ${updatedUser.isActive ? 'Active' : 'Inactive'}.`
      );
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update account status.';
      Alert.alert(t('statusUpdateFailed'), message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <RoleGuard user={user} allowedRoles={['SUPER_ADMIN']} onNavigateHome={onNavigateHome}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('userManagement')}</Text>
            <Text style={styles.subtitle}>{t('userManagementSubtitle')}</Text>
          </View>
          {onLogout ? (
            <Pressable style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>{t('logout')}</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadUsers}>
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {users.map((item) => (
              <View key={item.id} style={styles.userCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      item.isActive ? styles.statusPillActive : styles.statusPillInactive
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.isActive ? styles.statusPillTextActive : styles.statusPillTextInactive
                      ]}
                    >
                      {item.isActive ? t('activeStatusValue') : t('inactiveStatusValue')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.roleLabel}>{t('roleAssignment')}</Text>
                <View style={styles.roleRow}>
                  {roleOptions.map((role) => {
                    const selected = item.role === role;
                    const isSelf = item.id === user.id;
                    return (
                      <Pressable
                        key={role}
                        style={[
                          styles.roleButton,
                          selected && styles.roleButtonSelected,
                          isSelf && styles.roleButtonDisabled
                        ]}
                        onPress={() => handleRoleChange(item, role)}
                        disabled={updatingId === item.id || isSelf}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            selected && styles.roleButtonTextSelected
                          ]}
                        >
                          {role}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {item.id === user.id ? (
                  <Text style={styles.selfNotice}>{t('selfAccountNotice')}</Text>
                ) : (
                  <Pressable
                    style={[
                      styles.statusButton,
                      item.isActive ? styles.statusActive : styles.statusInactive
                    ]}
                    onPress={() => handleStatusToggle(item)}
                    disabled={updatingId === item.id}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.statusButtonText}>
                        {item.isActive ? t('deactivateAccount') : t('activateAccount')}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerRow: {
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
  logoutButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a'
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  statusPillActive: {
    backgroundColor: '#dcfce7'
  },
  statusPillInactive: {
    backgroundColor: '#fee2e2'
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusPillTextActive: {
    color: '#15803d'
  },
  statusPillTextInactive: {
    color: '#b91c1c'
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  roleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  roleButtonSelected: {
    backgroundColor: '#2563eb'
  },
  roleButtonDisabled: {
    opacity: 0.6
  },
  roleButtonText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12
  },
  roleButtonTextSelected: {
    color: '#ffffff'
  },
  selfNotice: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4
  },
  statusButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4
  },
  statusActive: {
    backgroundColor: '#ef4444'
  },
  statusInactive: {
    backgroundColor: '#10b981'
  },
  statusButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
