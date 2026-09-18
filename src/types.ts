export type GradeLevel = 6 | 7 | 8 | 9;

export interface ClassItem {
  id: string;
  code: string; // Mã lớp, ví dụ L001
  name: string; // Tên lớp, ví dụ 6A1
  grade: GradeLevel; // Khối: 6, 7, 8, 9
  schoolYear: string; // Năm học, ví dụ 2026-2027
  teacher: string; // GVCN, ví dụ Nguyễn Văn An
  studentCount?: number; // Số lượng học sinh
  note?: string; // Ghi chú
  createdAt: string;
}

export interface StudentItem {
  id: string;
  code: string; // Mã học sinh, ví dụ HS001
  fullName: string; // Họ và tên
  birthDate: string; // Ngày sinh YYYY-MM-DD hoặc DD/MM/YYYY
  gender: 'Nam' | 'Nữ'; // Giới tính
  classId: string; // ID lớp học
  className?: string; // Tên lớp học (sync)
  grade: GradeLevel; // Khối (sync theo lớp)
  parentPhone: string; // SĐT phụ huynh
  parentEmail?: string; // Email phụ huynh
  address?: string; // Địa chỉ
  note?: string; // Ghi chú
  createdAt: string;
}

export interface SubjectItem {
  id: string;
  code: string; // Mã môn, ví dụ MH001
  name: string; // Tên môn, ví dụ Toán
  grades: GradeLevel[]; // Khối áp dụng, ví dụ [6, 7, 8, 9]
  description?: string; // Mô tả
  lessonCount?: number; // Số bài học (tự động tính)
  color?: string; // Màu nhận diện môn học
  createdAt: string;
}

export interface LessonItem {
  id: string;
  code: string; // Mã bài học, ví dụ BH001
  title: string; // Tên bài học, ví dụ Số tự nhiên
  subjectId: string; // ID hoặc mã môn học
  subjectName?: string; // Tên môn học (sync)
  grade: GradeLevel; // Khối
  chapter: string; // Chương, ví dụ Chương 1
  order: number; // Thứ tự bài
  shortDescription?: string; // Mô tả ngắn
  note?: string; // Ghi chú
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  targetName: string;
  type: 'class' | 'student' | 'subject' | 'lesson' | 'system';
  timestamp: string;
  iconType?: string;
}

export type ActiveTab = 'dashboard' | 'classes' | 'students' | 'subjects_lessons';

export type SubjectLessonSubTab = 'subjects' | 'lessons';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export type UserRole = 'admin' | 'principal' | 'teacher_homeroom' | 'teacher_subject' | 'staff';

export interface UserAccount {
  id: string;
  username: string; // Tên đăng nhập (duy nhất)
  fullName: string; // Họ và tên
  email?: string; // Email liên hệ
  phone?: string; // Số điện thoại
  password?: string; // Mật khẩu lưu trữ
  role: UserRole; // Quyền hạn
  roleTitle: string; // Tên hiển thị: Quản trị viên, Ban Giám Hiệu, GV Chủ nhiệm...
  subject?: string; // Môn giảng dạy chính
  assignedClass?: string; // Lớp chủ nhiệm (nếu có)
  avatar?: string; // Ảnh đại diện hoặc link
  createdAt: string;
  lastLogin?: string;
}
