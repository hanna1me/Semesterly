import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import SessionCard from '../../components/SessionCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { WORK_TYPE_OPTIONS } from '../../constants/workTypes';
import { formatDuration, formatDateTime } from '../../lib/format';
import type { SessionWithCourse, WorkType } from '../../types/session';

const PAGE_SIZE = 20;
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const FOCUS_OPTIONS: { value: number; emoji: string }[] = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🔥' },
];

function formatTotalHours(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function SessionHistoryScreen() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<SessionWithCourse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);

  const [editingSession, setEditingSession] = useState<SessionWithCourse | null>(null);
  const [editFocusRating, setEditFocusRating] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editWorkType, setEditWorkType] = useState<WorkType | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAggregate = useCallback(async () => {
    if (!user) return;

    const { data, count } = await supabase
      .from('sessions')
      .select('duration_seconds', { count: 'exact' })
      .eq('user_id', user.id);

    setTotalCount(count ?? 0);
    setTotalSeconds((data ?? []).reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0));
  }, [user]);

  const loadPage = useCallback(
    async (pageIndex: number) => {
      if (!user) return;

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('sessions')
        .select('*, courses(name, color)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching sessions:', error.message);
        return;
      }

      const rows = (data ?? []) as SessionWithCourse[];
      setSessions((prev) => (pageIndex === 0 ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      await Promise.all([loadAggregate(), loadPage(0)]);
      setLoading(false);
    };

    init();
  }, [user, loadAggregate, loadPage]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadPage(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const openEditModal = (session: SessionWithCourse) => {
    setEditingSession(session);
    setEditFocusRating(session.focus_rating);
    setEditNotes(session.notes ?? '');
    setEditWorkType(session.work_type);
    setEditLocation(session.location ?? '');
  };

  const isEditWindowClosed = (session: SessionWithCourse) =>
    Date.now() - new Date(session.created_at).getTime() > EDIT_WINDOW_MS;

  const handleSaveEdit = async () => {
    if (!editingSession || !editWorkType) return;

    setSaving(true);
    const { error } = await supabase
      .from('sessions')
      .update({
        focus_rating: editFocusRating,
        notes: editNotes.trim() || null,
        work_type: editWorkType,
        location: editLocation.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingSession.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === editingSession.id
          ? {
              ...s,
              focus_rating: editFocusRating,
              notes: editNotes.trim() || null,
              work_type: editWorkType,
              location: editLocation.trim() || null,
            }
          : s
      )
    );
    setEditingSession(null);
  };

  const handleDelete = () => {
    if (!editingSession) return;

    Alert.alert('Delete session?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', editingSession.id);

          if (error) {
            Alert.alert('Error', error.message);
            return;
          }

          setSessions((prev) => prev.filter((s) => s.id !== editingSession.id));
          setEditingSession(null);
          loadAggregate();
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const editWindowClosed = editingSession ? isEditWindowClosed(editingSession) : false;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {totalCount ?? 0} sessions · {formatTotalHours(totalSeconds ?? 0)} total
        </Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionCard session={item} onPress={openEditModal} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No sessions yet.</Text>}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
              <Text style={styles.loadMoreText}>{loadingMore ? 'Loading...' : 'Load more'}</Text>
            </Pressable>
          ) : null
        }
      />

      <Modal visible={!!editingSession} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {editingSession && (
              <>
                <Text style={styles.modalTitle}>
                  {editingSession.courses?.name ?? 'No course'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatDateTime(editingSession.started_at)} ·{' '}
                  {formatDuration(editingSession.duration_seconds ?? 0)}
                </Text>

                {editWindowClosed && (
                  <Text style={styles.editClosedNotice}>Editing window has closed</Text>
                )}

                <Text style={styles.sectionLabel}>Work type</Text>
                <View style={styles.workTypeGroup}>
                  {WORK_TYPE_OPTIONS.map((option) => {
                    const selected = editWorkType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.workTypePill,
                          selected && styles.workTypePillSelected,
                          editWindowClosed && styles.disabledField,
                        ]}
                        disabled={editWindowClosed}
                        onPress={() => setEditWorkType(option.value)}
                      >
                        <Text
                          style={[
                            styles.workTypePillText,
                            selected && styles.workTypePillTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>Focus</Text>
                <View style={styles.focusRow}>
                  {FOCUS_OPTIONS.map((option) => {
                    const selected = editFocusRating === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.focusButton,
                          selected && styles.focusButtonSelected,
                          editWindowClosed && styles.disabledField,
                        ]}
                        disabled={editWindowClosed}
                        onPress={() => setEditFocusRating(selected ? null : option.value)}
                      >
                        <Text style={styles.focusEmoji}>{option.emoji}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>Location</Text>
                <TextInput
                  style={[styles.input, editWindowClosed && styles.disabledField]}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  editable={!editWindowClosed}
                  placeholder="Location"
                  placeholderTextColor={colors.subtext}
                />

                <Text style={styles.sectionLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput, editWindowClosed && styles.disabledField]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  editable={!editWindowClosed}
                  multiline
                  maxLength={500}
                  placeholder="Notes"
                  placeholderTextColor={colors.subtext}
                />

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelButton} onPress={() => setEditingSession(null)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  {!editWindowClosed && (
                    <Pressable
                      style={[styles.saveButton, saving && styles.disabledField]}
                      onPress={handleSaveEdit}
                      disabled={saving}
                    >
                      <Text style={styles.saveButtonText}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <Pressable onPress={handleDelete}>
                  <Text style={styles.deleteText}>Delete session</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summary: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.subtext,
    marginTop: 40,
  },
  loadMoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 10,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.subtext,
    marginBottom: 4,
  },
  editClosedNotice: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtext,
    marginTop: 6,
  },
  workTypeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workTypePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  workTypePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  workTypePillText: {
    fontSize: 12,
    color: colors.text,
  },
  workTypePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  focusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  focusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  focusButtonSelected: {
    borderColor: colors.primary,
  },
  focusEmoji: {
    fontSize: 18,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  disabledField: {
    opacity: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteText: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 13,
    marginTop: 8,
  },
});
