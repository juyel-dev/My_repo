import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';

function DangerRow({ label, desc, actionLabel, onPress, color = '#ef4444' }: {
  label: string; desc: string; actionLabel: string; onPress: () => void; color?: string;
}) {
  return (
    <View style={styles.dangerRow}>
      <View style={styles.dangerLeft}>
        <Text style={styles.dangerLabel}>{label}</Text>
        <Text style={styles.dangerDesc}>{desc}</Text>
      </View>
      <TouchableOpacity style={[styles.dangerBtn, { borderColor: `${color}60`, backgroundColor: `${color}10` }]} onPress={onPress} activeOpacity={0.8}>
        <Text style={[styles.dangerBtnText, { color }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DangerZoneScreen() {
  const insets = useSafeAreaInsets();
  const { deleteAllConversations, clearAllData, resetAllSettings, updateSettings } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');

  const confirm = (title: string, action: () => Promise<void>) => {
    setPendingTitle(title);
    setPendingAction(() => action);
    setConfirmText('');
    setConfirmModal(true);
  };

  const executeConfirm = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    await pendingAction?.();
    setConfirmModal(false);
    Alert.alert('Done', 'Action completed successfully.');
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Danger Zone</Text>
          <Feather name="alert-triangle" size={14} color="#ef4444" />
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning */}
        <View style={styles.warningCard}>
          <Feather name="alert-triangle" size={16} color="#ef4444" />
          <View>
            <Text style={styles.warningTitle}>{'// IRREVERSIBLE ACTIONS'}</Text>
            <Text style={styles.warningDesc}>{'// these actions cannot be undone. proceed with extreme caution.'}</Text>
          </View>
        </View>

        {/* Clear Data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="trash-2" size={12} color="#ef4444" />
            <Text style={styles.sectionLabel}>{'// CLEAR DATA'}</Text>
          </View>
          <View style={[styles.card, styles.cardDanger]}>
            <DangerRow
              label="Clear All Chat History"
              desc="// permanently deletes all conversations"
              actionLabel="CLEAR"
              onPress={() => confirm('Clear All Chat History', deleteAllConversations)}
            />
            <View style={styles.sep} />
            <DangerRow
              label="Clear Model Configs"
              desc="// removes all saved model configurations"
              actionLabel="CLEAR"
              onPress={() => {
                Alert.alert('Clear Models', 'This will remove all models. Add providers again to restore them.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Not implemented in demo') },
                ]);
              }}
            />
            <View style={styles.sep} />
            <DangerRow
              label="Clear Agent Configs"
              desc="// removes all configured agents"
              actionLabel="CLEAR"
              onPress={() => Alert.alert('Clear Agents', 'This resets agents to default. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Not implemented in demo') },
              ])}
            />
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="rotate-ccw" size={12} color="#ef4444" />
            <Text style={styles.sectionLabel}>{'// RESET APP'}</Text>
          </View>
          <View style={[styles.card, styles.cardDanger]}>
            <DangerRow
              label="Reset All Settings"
              desc="// restores all settings to factory defaults"
              actionLabel="RESET"
              color="#fbbf24"
              onPress={() => Alert.alert('Reset Settings', 'Restore default settings?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetAllSettings },
              ])}
            />
            <View style={styles.sep} />
            <DangerRow
              label="Reset Onboarding"
              desc="// re-runs the first-time setup flow"
              actionLabel="RESET"
              color="#a1a1a1"
              onPress={() => Alert.alert('Reset Onboarding', 'This will show the setup screens again on next launch.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset', onPress: async () => {
                    await updateSettings({ onboardingComplete: false });
                    router.replace('/(onboarding)');
                  }
                },
              ])}
            />
          </View>
        </View>

        {/* Nuclear */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-triangle" size={12} color="#ef4444" />
            <Text style={styles.sectionLabel}>{'// NUKE EVERYTHING'}</Text>
          </View>
          <View style={[styles.card, styles.cardDanger]}>
            <DangerRow
              label="Erase All Data"
              desc="// deletes all providers, models, agents, chats, and settings"
              actionLabel="ERASE ALL"
              onPress={() => confirm('Erase All Data', clearAllData)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={confirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconRow}>
              <View style={styles.modalDangerIcon}>
                <Feather name="alert-triangle" size={28} color="#ef4444" />
              </View>
            </View>
            <Text style={styles.modalTitle}>{pendingTitle}</Text>
            <Text style={styles.modalDesc}>{'// This action is irreversible. Type DELETE to confirm.'}</Text>
            <View style={styles.confirmWarnings}>
              <View style={styles.warnItem}>
                <Feather name="x" size={11} color="#ef4444" />
                <Text style={styles.warnText}>This cannot be undone</Text>
              </View>
              <View style={styles.warnItem}>
                <Feather name="x" size={11} color="#ef4444" />
                <Text style={styles.warnText}>All associated data will be lost</Text>
              </View>
            </View>
            <Text style={styles.confirmLabel}>{'// type DELETE to confirm'}</Text>
            <View style={styles.confirmInput}>
              <TextInput
                style={styles.confirmInputText}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="// DELETE"
                placeholderTextColor="#525252"
                autoCapitalize="characters"
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, confirmText.trim().toUpperCase() !== 'DELETE' && styles.confirmBtnDisabled]}
                onPress={executeConfirm}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={14} color="#ef4444" />
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmModal(false)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
  },
  titleRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  warningCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', padding: 14,
  },
  warningTitle: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 12, fontWeight: '700' },
  warningDesc: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10, marginTop: 2 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  card: { backgroundColor: '#171717', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardDanger: { borderColor: 'rgba(239,68,68,0.15)' },
  dangerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12 },
  dangerLeft: { flex: 1 },
  dangerLabel: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13 },
  dangerDesc: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10, marginTop: 2 },
  dangerBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, flexShrink: 0,
  },
  dangerBtnText: { fontFamily: MONO_FONT, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#171717', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingBottom: 32,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#404040', alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalDangerIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  modalTitle: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 24 },
  modalDesc: { fontFamily: MONO_FONT, color: '#737373', fontSize: 11, textAlign: 'center', paddingHorizontal: 24, marginTop: 8, lineHeight: 16 },
  confirmWarnings: { marginHorizontal: 24, marginTop: 16, gap: 6, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  warnItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warnText: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 11 },
  confirmLabel: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10, paddingHorizontal: 24, marginTop: 16 },
  confirmInput: {
    marginHorizontal: 24, marginTop: 8, borderRadius: 12,
    backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  confirmInputText: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 14 },
  modalActions: { paddingHorizontal: 24, marginTop: 16, gap: 10 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
  },
  confirmBtnDisabled: { opacity: 0.3 },
  confirmBtnText: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 14 },
});
