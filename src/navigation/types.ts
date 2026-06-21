export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

export type OnboardingStackParamList = {
  SchoolSearch: undefined;
  SemesterSelect: { schoolName: string };
  CourseSetup: { schoolName: string; semesterId: string };
};

export type AppTabsParamList = {
  Schedule: undefined;
  Study: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type StudyStackParamList = {
  Timer: undefined;
  SessionHistory: undefined;
};
