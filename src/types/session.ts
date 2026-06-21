export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';

export type WorkType =
  | 'homework'
  | 'reading'
  | 'exam_prep'
  | 'writing'
  | 'project'
  | 'group_work'
  | 'other';

export type StudyMode = 'solo' | 'with_friends' | 'background_noise' | 'focus_music';

export type PomodoroPhase = 'work' | 'break';

export type Session = {
  id: string;
  user_id: string;
  course_id: string | null;
  semester_id: string | null;

  timer_mode: TimerMode;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;

  work_type: WorkType;
  work_type_custom: string | null;
  location: string | null;
  study_mode: StudyMode | null;

  focus_rating: number | null;
  notes: string | null;

  pomodoro_work_minutes: number;
  pomodoro_break_minutes: number;
  pomodoro_cycles_completed: number;

  countdown_target_seconds: number | null;

  created_at: string;
  updated_at: string;
};

export type SessionWithCourse = Session & {
  courses: { name: string; color: string } | null;
};
