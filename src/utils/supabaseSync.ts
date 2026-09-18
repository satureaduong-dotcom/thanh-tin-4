import { getSupabase } from './supabase';
import {
  getClasses,
  saveClasses,
  getStudents,
  saveStudents,
  getSubjects,
  saveSubjects,
  getLessons,
  saveLessons,
} from './storage';
import { getStoredAccounts, saveAccounts } from './auth';
import { ClassItem, StudentItem, SubjectItem, LessonItem, UserAccount } from '../types';

// =========================================================================
// SQL SCHEMA SCRIPT TO GENERATE TABLES COMPATIBLE WITH CURRENT TYPES
// =========================================================================
export const SUPABASE_SQL_SETUP_SCRIPT = `-- =================================================================
-- BẢNG DỮ LIỆU HỆ THỐNG QUẢN LÝ GIÁO DỤC THCS LÊ LỢI (SUPABASE POSTGRES)
-- =================================================================

-- 1. Bảng Tài Khoản Người Dùng (Accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'teacher_homeroom',
  role_title TEXT DEFAULT 'Giáo Viên',
  subject TEXT,
  assigned_class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 2. Bảng Lớp Học (Classes)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  school_year TEXT DEFAULT '2026-2027',
  teacher TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Học Sinh (Students)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  birth_date TEXT,
  gender TEXT CHECK (gender IN ('Nam', 'Nữ')),
  class_id TEXT NOT NULL,
  class_name TEXT,
  grade INTEGER NOT NULL,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Môn Học (Subjects)
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  grades INTEGER[] DEFAULT ARRAY[6,7,8,9],
  description TEXT,
  lesson_count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#0284c7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Bài Học (Lessons)
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subject_name TEXT,
  grade INTEGER NOT NULL,
  chapter TEXT NOT NULL,
  "order" INTEGER DEFAULT 1,
  short_description TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security (RLS) & Cho phép truy cập
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access accounts') THEN
    CREATE POLICY "Public Access accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access classes') THEN
    CREATE POLICY "Public Access classes" ON classes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access students') THEN
    CREATE POLICY "Public Access students" ON students FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access subjects') THEN
    CREATE POLICY "Public Access subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access lessons') THEN
    CREATE POLICY "Public Access lessons" ON lessons FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

// -------------------------------------------------------------
// PUSH ALL LOCAL DATA TO SUPABASE (Full Backup/Seed)
// -------------------------------------------------------------
export async function pushAllLocalDataToSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình Supabase Client' };
  }

  try {
    // 1. Accounts
    const accounts = getStoredAccounts();
    if (accounts.length > 0) {
      const dbAccounts = accounts.map((a) => ({
        id: a.id,
        username: a.username,
        full_name: a.fullName,
        email: a.email || null,
        phone: a.phone || null,
        password: a.password || '',
        role: a.role || 'teacher_homeroom',
        role_title: a.roleTitle || 'Giáo Viên',
        subject: a.subject || null,
        assigned_class: a.assignedClass || null,
        created_at: a.createdAt || new Date().toISOString(),
        last_login: a.lastLogin || null,
      }));
      const { error } = await supabase.from('accounts').upsert(dbAccounts, { onConflict: 'id' });
      if (error && error.code !== '42P01') console.warn('Supabase accounts upsert:', error);
    }

    // 2. Classes
    const classes = getClasses();
    if (classes.length > 0) {
      const dbClasses = classes.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        grade: c.grade,
        school_year: c.schoolYear || '2026-2027',
        teacher: c.teacher,
        student_count: c.studentCount || 0,
        note: c.note || null,
        created_at: c.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('classes').upsert(dbClasses, { onConflict: 'id' });
      if (error && error.code !== '42P01') console.warn('Supabase classes upsert:', error);
    }

    // 3. Students
    const students = getStudents();
    if (students.length > 0) {
      const dbStudents = students.map((s) => ({
        id: s.id,
        code: s.code,
        full_name: s.fullName,
        birth_date: s.birthDate,
        gender: s.gender,
        class_id: s.classId,
        class_name: s.className || null,
        grade: s.grade,
        parent_phone: s.parentPhone,
        parent_email: s.parentEmail || null,
        address: s.address || null,
        note: s.note || null,
        created_at: s.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('students').upsert(dbStudents, { onConflict: 'id' });
      if (error && error.code !== '42P01') console.warn('Supabase students upsert:', error);
    }

    // 4. Subjects
    const subjects = getSubjects();
    if (subjects.length > 0) {
      const dbSubjects = subjects.map((sub) => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
        grades: sub.grades,
        description: sub.description || null,
        lesson_count: sub.lessonCount || 0,
        color: sub.color || '#0284c7',
        created_at: sub.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('subjects').upsert(dbSubjects, { onConflict: 'id' });
      if (error && error.code !== '42P01') console.warn('Supabase subjects upsert:', error);
    }

    // 5. Lessons
    const lessons = getLessons();
    if (lessons.length > 0) {
      const dbLessons = lessons.map((l) => ({
        id: l.id,
        code: l.code,
        title: l.title,
        subject_id: l.subjectId,
        subject_name: l.subjectName || null,
        grade: l.grade,
        chapter: l.chapter,
        order: l.order || 1,
        short_description: l.shortDescription || null,
        note: l.note || null,
        created_at: l.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('lessons').upsert(dbLessons, { onConflict: 'id' });
      if (error && error.code !== '42P01') console.warn('Supabase lessons upsert:', error);
    }

    return { success: true, message: 'Đã tải toàn bộ dữ liệu lên cơ sở dữ liệu Supabase thành công!' };
  } catch (err: any) {
    return { success: false, message: `Lỗi đồng bộ lên Supabase: ${err.message || err}` };
  }
}

// -------------------------------------------------------------
// PULL ALL DATA FROM SUPABASE TO LOCAL STORAGE
// -------------------------------------------------------------
export async function pullAllDataFromSupabase(): Promise<{
  success: boolean;
  message: string;
  hasData?: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình Supabase Client' };
  }

  try {
    let pulledCount = 0;

    // 1. Pull Accounts
    const { data: accountsData, error: accountsErr } = await supabase.from('accounts').select('*');
    if (!accountsErr && accountsData && accountsData.length > 0) {
      const formattedAccounts: UserAccount[] = accountsData.map((a: any) => ({
        id: a.id,
        username: a.username,
        fullName: a.full_name,
        email: a.email || `${a.username}@thcs.edu.vn`,
        phone: a.phone || undefined,
        password: a.password,
        role: a.role,
        roleTitle: a.role_title,
        subject: a.subject || undefined,
        assignedClass: a.assigned_class || undefined,
        createdAt: a.created_at,
        lastLogin: a.last_login || undefined,
      }));
      saveAccounts(formattedAccounts);
      pulledCount += formattedAccounts.length;
    }

    // 2. Pull Classes
    const { data: classesData, error: classesErr } = await supabase.from('classes').select('*');
    if (!classesErr && classesData && classesData.length > 0) {
      const formattedClasses: ClassItem[] = classesData.map((c: any) => ({
        id: c.id,
        code: c.code || 'L000',
        name: c.name,
        grade: Number(c.grade) as any,
        schoolYear: c.school_year || '2026-2027',
        teacher: c.teacher,
        studentCount: c.student_count || 0,
        note: c.note || undefined,
        createdAt: c.created_at,
      }));
      saveClasses(formattedClasses);
      pulledCount += formattedClasses.length;
    }

    // 3. Pull Students
    const { data: studentsData, error: studentsErr } = await supabase.from('students').select('*');
    if (!studentsErr && studentsData && studentsData.length > 0) {
      const formattedStudents: StudentItem[] = studentsData.map((s: any) => ({
        id: s.id,
        code: s.code || 'HS000',
        fullName: s.full_name,
        birthDate: s.birth_date,
        gender: s.gender || 'Nam',
        classId: s.class_id,
        className: s.class_name || undefined,
        grade: Number(s.grade) as any,
        parentPhone: s.parent_phone || '',
        parentEmail: s.parent_email || undefined,
        address: s.address || undefined,
        note: s.note || undefined,
        createdAt: s.created_at,
      }));
      saveStudents(formattedStudents);
      pulledCount += formattedStudents.length;
    }

    // 4. Pull Subjects
    const { data: subjectsData, error: subjectsErr } = await supabase.from('subjects').select('*');
    if (!subjectsErr && subjectsData && subjectsData.length > 0) {
      const formattedSubjects: SubjectItem[] = subjectsData.map((sub: any) => ({
        id: sub.id,
        code: sub.code || 'MH000',
        name: sub.name,
        grades: Array.isArray(sub.grades) ? sub.grades : [6, 7, 8, 9],
        description: sub.description || undefined,
        lessonCount: sub.lesson_count || 0,
        color: sub.color || '#0284c7',
        createdAt: sub.created_at,
      }));
      saveSubjects(formattedSubjects);
      pulledCount += formattedSubjects.length;
    }

    // 5. Pull Lessons
    const { data: lessonsData, error: lessonsErr } = await supabase.from('lessons').select('*');
    if (!lessonsErr && lessonsData && lessonsData.length > 0) {
      const formattedLessons: LessonItem[] = lessonsData.map((l: any) => ({
        id: l.id,
        code: l.code || 'BH000',
        title: l.title,
        subjectId: l.subject_id,
        subjectName: l.subject_name || undefined,
        grade: Number(l.grade) as any,
        chapter: l.chapter || 'Chương 1',
        order: l.order || 1,
        shortDescription: l.short_description || undefined,
        note: l.note || undefined,
        createdAt: l.created_at,
      }));
      saveLessons(formattedLessons);
      pulledCount += formattedLessons.length;
    }

    return {
      success: true,
      hasData: pulledCount > 0,
      message:
        pulledCount > 0
          ? `Đã tải và đồng bộ ${pulledCount} bản ghi từ Supabase về hệ thống!`
          : 'Cơ sở dữ liệu Supabase hiện chưa có dữ liệu. Bạn có thể bấm "Tải dữ liệu mẫu lên Supabase" để đồng bộ.',
    };
  } catch (err: any) {
    return { success: false, message: `Lỗi tải dữ liệu Supabase: ${err.message || err}` };
  }
}

// -------------------------------------------------------------
// REAL-TIME HELPERS FOR INDIVIDUAL ENTITY CHANGES
// -------------------------------------------------------------
export async function syncAccountToSupabase(account: UserAccount) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('accounts').upsert(
      {
        id: account.id,
        username: account.username,
        full_name: account.fullName,
        email: account.email || null,
        phone: account.phone || null,
        password: account.password || '',
        role: account.role || 'teacher_homeroom',
        role_title: account.roleTitle || 'Giáo Viên',
        subject: account.subject || null,
        assigned_class: account.assignedClass || null,
        created_at: account.createdAt || new Date().toISOString(),
        last_login: account.lastLogin || null,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Sync account to supabase background error:', err);
  }
}

export async function syncClassToSupabase(c: ClassItem, isDelete: boolean = false) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    if (isDelete) {
      await supabase.from('classes').delete().eq('id', c.id);
    } else {
      await supabase.from('classes').upsert(
        {
          id: c.id,
          code: c.code,
          name: c.name,
          grade: c.grade,
          school_year: c.schoolYear || '2026-2027',
          teacher: c.teacher,
          student_count: c.studentCount || 0,
          note: c.note || null,
          created_at: c.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
  } catch (err) {
    console.warn('Sync class error:', err);
  }
}

export async function syncStudentToSupabase(s: StudentItem, isDelete: boolean = false) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    if (isDelete) {
      await supabase.from('students').delete().eq('id', s.id);
    } else {
      await supabase.from('students').upsert(
        {
          id: s.id,
          code: s.code,
          full_name: s.fullName,
          birth_date: s.birthDate,
          gender: s.gender,
          class_id: s.classId,
          class_name: s.className || null,
          grade: s.grade,
          parent_phone: s.parentPhone,
          parent_email: s.parentEmail || null,
          address: s.address || null,
          note: s.note || null,
          created_at: s.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
  } catch (err) {
    console.warn('Sync student error:', err);
  }
}

export async function syncSubjectToSupabase(sub: SubjectItem, isDelete: boolean = false) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    if (isDelete) {
      await supabase.from('subjects').delete().eq('id', sub.id);
    } else {
      await supabase.from('subjects').upsert(
        {
          id: sub.id,
          code: sub.code,
          name: sub.name,
          grades: sub.grades,
          description: sub.description || null,
          lesson_count: sub.lessonCount || 0,
          color: sub.color || '#0284c7',
          created_at: sub.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
  } catch (err) {
    console.warn('Sync subject error:', err);
  }
}

export async function syncLessonToSupabase(l: LessonItem, isDelete: boolean = false) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    if (isDelete) {
      await supabase.from('lessons').delete().eq('id', l.id);
    } else {
      await supabase.from('lessons').upsert(
        {
          id: l.id,
          code: l.code,
          title: l.title,
          subject_id: l.subjectId,
          subject_name: l.subjectName || null,
          grade: l.grade,
          chapter: l.chapter,
          order: l.order || 1,
          short_description: l.shortDescription || null,
          note: l.note || null,
          created_at: l.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
  } catch (err) {
    console.warn('Sync lesson error:', err);
  }
}
