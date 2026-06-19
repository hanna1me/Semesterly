export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  school_id: string | null;
  school_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Semester = {
  id: string;
  user_id: string;
  term: string;
  year: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  user_id: string;
  semester_id: string;
  name: string;
  course_code: string | null;
  credits: number | null;
  instructor: string | null;
  color: string;
  created_at: string;
};
