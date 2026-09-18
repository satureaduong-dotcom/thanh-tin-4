import { ClassItem, StudentItem, SubjectItem, LessonItem, ActivityLog } from '../types';
import { INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_SUBJECTS, INITIAL_LESSONS, INITIAL_LOGS } from '../data/initialData';

const STORAGE_KEYS = {
  CLASSES: 'thcs_classes_v1',
  STUDENTS: 'thcs_students_v1',
  SUBJECTS: 'thcs_subjects_v1',
  LESSONS: 'thcs_lessons_v1',
  LOGS: 'thcs_logs_v1',
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

// Safe JSON writer
function safeWrite<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export function getClasses(): ClassItem[] {
  const classes = safeParse<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const students = getStudents();
  
  // Calculate studentCount dynamically
  return classes.map(c => ({
    ...c,
    studentCount: students.filter(s => s.classId === c.id || s.className === c.name).length
  }));
}

export function saveClasses(classes: ClassItem[]): void {
  safeWrite(STORAGE_KEYS.CLASSES, classes);
}

export function getStudents(): StudentItem[] {
  const students = safeParse<StudentItem[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const classes = safeParse<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  
  // Ensure className and grade are synchronized with parent class
  return students.map(s => {
    const matchedClass = classes.find(c => c.id === s.classId || c.name === s.className);
    if (matchedClass) {
      return {
        ...s,
        className: matchedClass.name,
        grade: matchedClass.grade,
        classId: matchedClass.id,
      };
    }
    return s;
  });
}

export function saveStudents(students: StudentItem[]): void {
  safeWrite(STORAGE_KEYS.STUDENTS, students);
}

export function getSubjects(): SubjectItem[] {
  const subjects = safeParse<SubjectItem[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  const lessons = getLessons();

  return subjects.map(sub => ({
    ...sub,
    lessonCount: lessons.filter(l => l.subjectId === sub.id || l.subjectId === sub.code || l.subjectName === sub.name).length
  }));
}

export function saveSubjects(subjects: SubjectItem[]): void {
  safeWrite(STORAGE_KEYS.SUBJECTS, subjects);
}

export function getLessons(): LessonItem[] {
  const lessons = safeParse<LessonItem[]>(STORAGE_KEYS.LESSONS, INITIAL_LESSONS);
  const subjects = safeParse<SubjectItem[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);

  return lessons.map(l => {
    const matchedSubject = subjects.find(sub => sub.id === l.subjectId || sub.code === l.subjectId || sub.name === l.subjectName);
    if (matchedSubject) {
      return {
        ...l,
        subjectId: matchedSubject.id,
        subjectName: matchedSubject.name,
      };
    }
    return l;
  });
}

export function saveLessons(lessons: LessonItem[]): void {
  safeWrite(STORAGE_KEYS.LESSONS, lessons);
}

export function getLogs(): ActivityLog[] {
  return safeParse<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
}

export function addLog(action: string, targetName: string, type: ActivityLog['type']): void {
  const currentLogs = getLogs();
  const newLog: ActivityLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    action,
    targetName,
    type,
    timestamp: new Date().toISOString(),
  };
  const updatedLogs = [newLog, ...currentLogs].slice(0, 50); // Keep latest 50 logs
  safeWrite(STORAGE_KEYS.LOGS, updatedLogs);
}

export function resetAllDataToDefault(): void {
  safeWrite(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  safeWrite(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  safeWrite(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  safeWrite(STORAGE_KEYS.LESSONS, INITIAL_LESSONS);
  safeWrite(STORAGE_KEYS.LOGS, INITIAL_LOGS);
}

export function exportAllDataAsJSON(): string {
  const data = {
    appName: 'HỆ THỐNG QUẢN LÝ HỌC SINH THCS',
    exportedAt: new Date().toISOString(),
    classes: getClasses(),
    students: getStudents(),
    subjects: getSubjects(),
    lessons: getLessons(),
    logs: getLogs(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.classes && Array.isArray(parsed.classes)) {
      saveClasses(parsed.classes);
    }
    if (parsed.students && Array.isArray(parsed.students)) {
      saveStudents(parsed.students);
    }
    if (parsed.subjects && Array.isArray(parsed.subjects)) {
      saveSubjects(parsed.subjects);
    }
    if (parsed.lessons && Array.isArray(parsed.lessons)) {
      saveLessons(parsed.lessons);
    }
    addLog('Nhập dữ liệu từ tệp tin', 'Khôi phục sao lưu thành công', 'system');
    return true;
  } catch (err) {
    console.error('Error importing data:', err);
    return false;
  }
}
