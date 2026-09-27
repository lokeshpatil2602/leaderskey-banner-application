import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AuthUser, AuthUserRole } from '../api/services/authService';
import { Template } from '../api/services/templateService';
import { AccessDeniedScreen } from '../screens/app/AccessDeniedScreen';
import { BannerEditorScreen } from '../screens/app/BannerEditorScreen';
import { CategoriesScreen } from '../screens/app/CategoriesScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { ManageTemplatesScreen } from '../screens/app/ManageTemplatesScreen';
import { MyBannersScreen } from '../screens/app/MyBannersScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { TemplatesScreen } from '../screens/app/TemplatesScreen';
import { UserManagementScreen } from '../screens/app/UserManagementScreen';
import UploadImage from '../components/UploadImage';
import { useTranslation } from '../i18n/I18nContext';

type NavTab = {
  key: string;
  label: string;
  icon: string;
  allowedRoles: AuthUserRole[];
};

const ALL_TABS: NavTab[] = [
  { key: 'home', label: 'Home', icon: '🏠', allowedRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
  { key: 'templates', label: 'Templates', icon: '🎨', allowedRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
  { key: 'manage-templates', label: 'Manage Templates', icon: '⚙️', allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
  { key: 'categories', label: 'Categories', icon: '📂', allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
  { key: 'banners', label: 'My Banners', icon: '🖼️', allowedRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
  { key: 'users', label: 'Users', icon: '👥', allowedRoles: ['SUPER_ADMIN'] },
  { key: 'profile', label: 'Profile', icon: '👤', allowedRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
  { key: 'upload', label: 'Upload', icon: '📤', allowedRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'] }
];

const TAB_TRANSLATION_KEYS = {
  home: 'home',
  templates: 'templates',
  'manage-templates': 'manageTemplates',
  categories: 'categories',
  banners: 'myBanners',
  users: 'users',
  profile: 'profile',
  upload: 'upload'
} as const;

type AppNavigatorProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
};

export function AppNavigator({ user, onLogout }: AppNavigatorProps) {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = useState<string>('home');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Filter tabs strictly based on current user role
  const allowedTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => tab.allowedRoles.includes(user.role));
  }, [user.role]);

  // Current selected tab definition
  const currentTab = ALL_TABS.find((t) => t.key === activeTabKey);
  const isCurrentTabAllowed = currentTab ? currentTab.allowedRoles.includes(user.role) : false;

  const getRolePillColor = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'ADMIN':
        return { bg: '#ede9fe', text: '#6d28d9' };
      default:
        return { bg: '#e0f2fe', text: '#0369a1' };
    }
  };

  const rolePill = getRolePillColor();

  const handleSelectTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const renderActiveScreen = () => {
    // If in banner editor mode, show the editor directly
    if (editingTemplate) {
      return (
        <BannerEditorScreen
          template={editingTemplate}
          onCancel={() => setEditingTemplate(null)}
          onSaved={() => {
            setEditingTemplate(null);
            setActiveTabKey('banners');
          }}
        />
      );
    }

    if (!isCurrentTabAllowed) {
      return (
        <AccessDeniedScreen
          userRole={user.role}
          onNavigateHome={() => setActiveTabKey('home')}
        />
      );
    }

    switch (activeTabKey) {
      case 'home':
        return <HomeScreen user={user} onNavigate={setActiveTabKey} />;
      case 'templates':
        return <TemplatesScreen onSelectTemplate={handleSelectTemplate} />;
      case 'banners':
        return (
          <MyBannersScreen
            user={user}
            onNavigateToTemplates={() => setActiveTabKey('templates')}
          />
        );
      case 'manage-templates':
        return (
          <ManageTemplatesScreen
            user={user}
            onNavigateHome={() => setActiveTabKey('home')}
          />
        );
      case 'categories':
        return (
          <CategoriesScreen
            user={user}
            onNavigateHome={() => setActiveTabKey('home')}
          />
        );
      case 'users':
        return (
          <UserManagementScreen
            user={user}
            onNavigateHome={() => setActiveTabKey('home')}
          />
        );
      case 'profile':
        return <ProfileScreen user={user} onLogout={onLogout} />;
      case 'upload':
        return <UploadImage />;
      default:
        return <HomeScreen user={user} onNavigate={setActiveTabKey} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Application Bar (hidden while editing banner for full-screen focus) */}
      {!editingTemplate ? (
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.appLogo}>BannerCraft</Text>
            <View style={[styles.roleBadge, { backgroundColor: rolePill.bg }]}>
              <Text style={[styles.roleBadgeText, { color: rolePill.text }]}>{user.role}</Text>
            </View>
          </View>

          <Pressable style={styles.headerLogoutBtn} onPress={onLogout}>
            <Text style={styles.headerLogoutText}>{t('logout')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Screen Body */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Dynamic Role-Based Navigation Bar (hidden during editing) */}
      {!editingTemplate ? (
        <View style={styles.bottomNavContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomNavScroll}
          >
            {allowedTabs.map((tab) => {
              const isActive = tab.key === activeTabKey;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => {
                    setEditingTemplate(null);
                    setActiveTabKey(tab.key);
                  }}
                >
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {t(TAB_TRANSLATION_KEYS[tab.key as keyof typeof TAB_TRANSLATION_KEYS])}
                  </Text>
                  {isActive ? <View style={styles.activeIndicator} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  appLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  headerLogoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  headerLogoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  bottomNavContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8
  },
  bottomNavScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 64
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff'
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  tabLabelActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  activeIndicator: {
    width: 14,
    height: 3,
    backgroundColor: '#2563eb',
    borderRadius: 2,
    marginTop: 3
  }
});
