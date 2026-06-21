import type { StudyMode, WorkType } from '../types/session';

export const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: 'homework', label: 'Homework' },
  { value: 'reading', label: 'Reading' },
  { value: 'exam_prep', label: 'Exam Prep' },
  { value: 'writing', label: 'Writing' },
  { value: 'project', label: 'Project' },
  { value: 'group_work', label: 'Group Work' },
  { value: 'other', label: 'Other' },
];

export const STUDY_MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: 'with_friends', label: 'With Friends' },
  { value: 'background_noise', label: 'Background Noise' },
  { value: 'focus_music', label: 'Focus Music' },
];

export function getWorkTypeLabel(value: WorkType, custom?: string | null): string {
  if (value === 'other' && custom) return custom;
  return WORK_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getStudyModeLabel(value: StudyMode): string {
  return STUDY_MODE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
