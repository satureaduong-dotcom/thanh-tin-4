import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { StudentItem, ClassItem, GradeLevel } from '../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  FileCheck,
  AlertCircle,
  RefreshCw,
  Info,
  HelpCircle,
  School,
  ArrowRight,
} from 'lucide-react';

interface ParsedStudentRow {
  index: number;
  code: string;
  fullName: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ';
  rawClassName: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  note?: string;
  status: 'valid' | 'update' | 'error';
  errorMessage?: string;
  warningMessage?: string;
}

interface StudentExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  existingStudents: StudentItem[];
  onImportStudents: (
    studentsToImport: (Omit<StudentItem, 'createdAt' | 'id'> & { id?: string })[]
  ) => { success: boolean; addedCount: number; updatedCount: number };
}

export const StudentExcelModal: React.FC<StudentExcelModalProps> = ({
  isOpen,
  onClose,
  classes,
  existingStudents,
  onImportStudents,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'update' | 'error'>('all');
  const [defaultClassId, setDefaultClassId] = useState<string>(classes[0]?.id || '');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState<boolean>(true);
  const [autoGenerateMissingCodes, setAutoGenerateMissingCodes] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<'upload' | 'preview'>('upload');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper: Format date from Excel serial or string to YYYY-MM-DD
  const formatExcelDate = (val: any): string => {
    if (!val) return '2013-01-01';
    
    // If it's a number (Excel date serial)
    if (typeof val === 'number') {
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        if (dateObj) {
          const y = dateObj.y;
          const m = String(dateObj.m).padStart(2, '0');
          const d = String(dateObj.d).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch {
        // ignore
      }
    }

    const str = String(val).trim();
    
    // Check if DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    // Check if YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // If JS Date parseable
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return '2013-01-01';
  };

  // Helper: Download official sample Excel template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Danh sách học sinh mẫu
    const sampleStudents = [
      {
        'Mã học sinh (*)': 'HS101',
        'Họ và tên học sinh (*)': 'Trần Hoàng Long',
        'Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) (*)': '2013-04-18',
        'Giới tính (Nam/Nữ) (*)': 'Nam',
        'Tên lớp / Mã lớp (*)': classes[0]?.name || '6A1',
        'SĐT Phụ huynh (*)': '0988123456',
        'Email Phụ huynh': 'phuhuynh.long@gmail.com',
        'Địa chỉ': 'Số 12 Quang Trung, Hoàn Kiếm, Hà Nội',
        'Ghi chú': 'Đạt giải Ba thi học sinh giỏi cấp trường',
      },
      {
        'Mã học sinh (*)': 'HS102',
        'Họ và tên học sinh (*)': 'Nguyễn Phương Thảo',
        'Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) (*)': '2013-09-22',
        'Giới tính (Nam/Nữ) (*)': 'Nữ',
        'Tên lớp / Mã lớp (*)': classes[0]?.name || '6A1',
        'SĐT Phụ huynh (*)': '0912345678',
        'Email Phụ huynh': 'thaonguyen.mom@gmail.com',
        'Địa chỉ': '45 Phố Huế, Hai Bà Trưng, Hà Nội',
        'Ghi chú': 'Ban cán sự lớp phụ trách học tập',
      },
      {
        'Mã học sinh (*)': 'HS103',
        'Họ và tên học sinh (*)': 'Lê Minh Trí',
        'Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) (*)': '2012-11-05',
        'Giới tính (Nam/Nữ) (*)': 'Nam',
        'Tên lớp / Mã lớp (*)': classes[1]?.name || '7A1',
        'SĐT Phụ huynh (*)': '0977889900',
        'Email Phụ huynh': '',
        'Địa chỉ': 'Thôn Đông, Xã Liên Ninh, Thanh Trì, Hà Nội',
        'Ghi chú': 'Thành viên đội tuyển Toán',
      },
      {
        'Mã học sinh (*)': 'HS104',
        'Họ và tên học sinh (*)': 'Phạm Hải Yến',
        'Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) (*)': '2011-02-14',
        'Giới tính (Nam/Nữ) (*)': 'Nữ',
        'Tên lớp / Mã lớp (*)': classes[2]?.name || '8A1',
        'SĐT Phụ huynh (*)': '0903456789',
        'Email Phụ huynh': 'haiyen.pham@yahoo.com',
        'Địa chỉ': '88 Cầu Giấy, Cầu Giấy, Hà Nội',
        'Ghi chú': '',
      },
      {
        'Mã học sinh (*)': 'HS105',
        'Họ và tên học sinh (*)': 'Đỗ Quốc Bảo',
        'Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) (*)': '2010-08-30',
        'Giới tính (Nam/Nữ) (*)': 'Nam',
        'Tên lớp / Mã lớp (*)': classes[3]?.name || '9A1',
        'SĐT Phụ huynh (*)': '0944556677',
        'Email Phụ huynh': 'baodo.parent@gmail.com',
        'Địa chỉ': 'Khu đô thị Linh Đàm, Hoàng Mai, Hà Nội',
        'Ghi chú': 'Học sinh giỏi toàn diện 4 năm liền',
      },
    ];

    const wsData = XLSX.utils.json_to_sheet(sampleStudents);
    
    // Set column widths
    wsData['!cols'] = [
      { wch: 16 }, // Mã học sinh
      { wch: 26 }, // Họ và tên
      { wch: 24 }, // Ngày sinh
      { wch: 14 }, // Giới tính
      { wch: 20 }, // Lớp
      { wch: 18 }, // SĐT
      { wch: 26 }, // Email
      { wch: 38 }, // Địa chỉ
      { wch: 35 }, // Ghi chú
    ];

    XLSX.utils.book_append_sheet(wb, wsData, 'Danh_Sach_Hoc_Sinh');

    // Sheet 2: Danh sách lớp hiện có để tham khảo
    const classReference = classes.map((c) => ({
      'Mã Lớp': c.code,
      'Tên Lớp Học': c.name,
      'Khối Lớp': `Khối ${c.grade}`,
      'Giáo Viên Chủ Nhiệm': c.teacher,
      'Năm Học': c.schoolYear,
    }));
    const wsClasses = XLSX.utils.json_to_sheet(classReference);
    wsClasses['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 26 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Danh_Sach_Lop_Hien_Co');

    // Sheet 3: Hướng dẫn
    const instructions = [
      { 'Quy tắc nhập': '1. Cột có dấu (*) là thông tin bắt buộc: Họ và tên, Ngày sinh, Giới tính, Lớp, SĐT Phụ huynh.' },
      { 'Quy tắc nhập': '2. Mã học sinh: Nếu để trống, hệ thống sẽ tự động cấp mã mới theo thứ tự (HS001, HS002...).' },
      { 'Quy tắc nhập': '3. Giới tính: Nhập "Nam" hoặc "Nữ".' },
      { 'Quy tắc nhập': '4. Tên lớp / Mã lớp: Nhập đúng Tên lớp (ví dụ: 6A1, 7A2) hoặc Mã lớp (L001, L002) theo danh sách ở Sheet "Danh_Sach_Lop_Hien_Co".' },
      { 'Quy tắc nhập': '5. Ngày sinh: Định dạng chuẩn YYYY-MM-DD (VD: 2013-05-15) hoặc DD/MM/YYYY (VD: 15/05/2013).' },
      { 'Quy tắc nhập': '6. SĐT phụ huynh: Nhập từ 9 đến 15 chữ số.' },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 120 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Huong_Dan_Nhap');

    // Export file
    XLSX.writeFile(wb, 'Mau_Nhap_Hoc_Sinh_THCS.xlsx');
  };

  // Helper: Remove Vietnamese tones / accents
  const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const normalizeHeader = (key: string): string => {
    return removeVietnameseTones(key)
      .toLowerCase()
      .replace(/[\(\*\)\:\_\-\.\/\,\#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper: Extract all student fields accurately from an Excel row
  const extractRowFields = (row: Record<string, any>) => {
    let rawCode: any = undefined;
    let rawFullName: any = undefined;
    let rawBirthDate: any = undefined;
    let rawGender: any = undefined;
    let rawClass: any = undefined;
    let rawPhone: any = undefined;
    let rawEmail: any = undefined;
    let rawAddress: any = undefined;
    let rawNote: any = undefined;

    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
      const val = row[key];
      if (val === undefined || val === null || String(val).trim() === '') continue;

      const norm = normalizeHeader(key);

      // 1. Email (Check FIRST to prevent "email" being matched as "code/ma")
      if (norm.includes('email') || norm.includes('mail') || norm.includes('thu dien tu')) {
        rawEmail = val;
      }
      // 2. Phone / SĐT
      else if (
        norm.includes('sdt') ||
        norm.includes('so dien thoai') ||
        norm.includes('dien thoai') ||
        norm.includes('phone') ||
        norm.includes('tel') ||
        norm.includes('mobile') ||
        norm.includes('so dt') ||
        norm.includes('lien he')
      ) {
        rawPhone = val;
      }
      // 3. Full name / Họ và tên
      else if (
        norm.includes('ho va ten') ||
        norm.includes('ho ten') ||
        norm.includes('ten hoc sinh') ||
        norm.includes('fullname') ||
        norm.includes('full name') ||
        norm.includes('ten hs') ||
        norm === 'ten' ||
        norm === 'name' ||
        norm.includes('student name')
      ) {
        rawFullName = val;
      }
      // 4. Code / Mã học sinh (Strict check to avoid false positives)
      else if (
        norm.includes('ma hoc sinh') ||
        norm.includes('ma hs') ||
        norm.includes('ma sv') ||
        norm.includes('student id') ||
        norm.includes('student code') ||
        norm === 'ma' ||
        norm === 'code' ||
        norm === 'id' ||
        norm === 'mahs'
      ) {
        rawCode = val;
      }
      // 5. Birthdate / Ngày sinh
      else if (
        norm.includes('ngay sinh') ||
        norm.includes('ngay thang nam sinh') ||
        norm.includes('ngaysinh') ||
        norm.includes('birthdate') ||
        norm.includes('birth date') ||
        norm.includes('dob') ||
        norm.includes('date of birth')
      ) {
        rawBirthDate = val;
      }
      // 6. Gender / Giới tính
      else if (
        norm.includes('gioi tinh') ||
        norm.includes('gioitinh') ||
        norm.includes('gender') ||
        norm.includes('sex') ||
        norm === 'phai'
      ) {
        rawGender = val;
      }
      // 7. Class / Lớp học (Avoid matching student name)
      else if (
        (norm.includes('lop') || norm.includes('class')) &&
        !norm.includes('hoc sinh') &&
        !norm.includes('ten hoc sinh')
      ) {
        rawClass = val;
      }
      // 8. Address / Địa chỉ
      else if (
        norm.includes('dia chi') ||
        norm.includes('diachi') ||
        norm.includes('address') ||
        norm.includes('noi o') ||
        norm.includes('que quan') ||
        norm.includes('thuong tru')
      ) {
        rawAddress = val;
      }
      // 9. Note / Ghi chú
      else if (
        norm.includes('ghi chu') ||
        norm.includes('ghichu') ||
        norm.includes('note') ||
        norm.includes('notes') ||
        norm.includes('nhan xet') ||
        norm.includes('thanh tich')
      ) {
        rawNote = val;
      }
    }

    return {
      rawCode,
      rawFullName,
      rawBirthDate,
      rawGender,
      rawClass,
      rawPhone,
      rawEmail,
      rawAddress,
      rawNote,
    };
  };

  // Process and parse workbook
  const processWorkbook = (wb: XLSX.WorkBook) => {
    setIsLoading(true);
    setGeneralError('');

    try {
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        setGeneralError('File Excel không có trang tính (Sheet) nào.');
        setIsLoading(false);
        return;
      }

      const worksheet = wb.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        setGeneralError('File Excel không có dữ liệu hàng nào hoặc định dạng không đúng.');
        setIsLoading(false);
        return;
      }

      // Calculate starting code sequence for auto generation
      const existingCodes = existingStudents.map((s) => {
        const num = parseInt(s.code.replace(/\D/g, '') || '0', 10);
        return isNaN(num) ? 0 : num;
      });
      let nextCodeNum = Math.max(0, ...existingCodes) + 1;

      // Find fallback default class
      const fallbackClass = classes.find((c) => c.id === defaultClassId) || classes[0];

      const processed: ParsedStudentRow[] = [];

      rawJson.forEach((row, i) => {
        const index = i + 1;

        const {
          rawCode,
          rawFullName,
          rawBirthDate,
          rawGender,
          rawClass,
          rawPhone,
          rawEmail,
          rawAddress,
          rawNote,
        } = extractRowFields(row);

        // Extract fullName
        const fullName = String(rawFullName || '').trim();

        // Skip completely empty rows
        if (!fullName && Object.values(row).every((v) => !v || String(v).trim() === '')) {
          return;
        }

        // Extract code
        let code = String(rawCode || '').trim().toUpperCase();

        if (!code && autoGenerateMissingCodes) {
          code = `HS${nextCodeNum.toString().padStart(3, '0')}`;
          nextCodeNum++;
        }

        // Extract birthDate
        const birthDate = formatExcelDate(rawBirthDate);

        // Extract gender
        let gender: 'Nam' | 'Nữ' = 'Nam';
        const gStr = removeVietnameseTones(String(rawGender || 'Nam')).trim().toLowerCase();
        if (gStr.includes('nu') || gStr === 'f' || gStr === 'female' || gStr.includes('gai')) {
          gender = 'Nữ';
        }

        // Extract class
        const rawClassStr = String(rawClass || '').trim();

        let matchedClass: ClassItem | undefined;
        if (rawClassStr) {
          const normClassInput = removeVietnameseTones(rawClassStr).toLowerCase().replace(/\s+/g, '');
          matchedClass = classes.find((c) => {
            const normName = removeVietnameseTones(c.name).toLowerCase().replace(/\s+/g, '');
            const normCode = removeVietnameseTones(c.code).toLowerCase().replace(/\s+/g, '');
            return normName === normClassInput || normCode === normClassInput;
          });
        }

        // Fallback to default class if not matched
        const assignedClass = matchedClass || fallbackClass;

        // Extract phone
        let parentPhone = String(rawPhone || '').trim();
        // Remove trailing decimal if parsed as number (e.g. 988123456.0)
        if (parentPhone.endsWith('.0')) {
          parentPhone = parentPhone.slice(0, -2);
        }
        // If 9 digits starting with 3, 5, 7, 8, 9 (Excel removed leading 0), add leading 0
        if (/^[35789]\d{8}$/.test(parentPhone)) {
          parentPhone = '0' + parentPhone;
        }

        // Extract email
        const parentEmail = String(rawEmail || '').trim() || undefined;

        // Extract address
        const address = String(rawAddress || '').trim() || undefined;

        // Extract note
        const note = String(rawNote || '').trim() || undefined;

        // Validation & Error checking
        let status: 'valid' | 'update' | 'error' = 'valid';
        let errorMessage: string | undefined;
        let warningMessage: string | undefined;

        if (!fullName) {
          status = 'error';
          errorMessage = 'Thiếu họ và tên học sinh';
        } else if (!parentPhone) {
          status = 'error';
          errorMessage = 'Thiếu số điện thoại phụ huynh';
        } else if (!/^[0-9+() -]{8,16}$/.test(parentPhone)) {
          status = 'error';
          errorMessage = 'Số điện thoại phụ huynh không đúng định dạng';
        } else if (!assignedClass) {
          status = 'error';
          errorMessage = 'Không tìm thấy lớp học phù hợp trong hệ thống';
        } else {
          // Check for existing student code in current system
          const existing = existingStudents.find((s) => s.code.toUpperCase() === code.toUpperCase());
          if (existing) {
            if (overwriteDuplicates) {
              status = 'update';
              warningMessage = `Mã ${code} đã tồn tại: Sẽ cập nhật hồ sơ "${existing.fullName}"`;
            } else {
              status = 'error';
              errorMessage = `Mã ${code} đã tồn tại trong hệ thống (Đã chọn không ghi đè)`;
            }
          }

          if (rawClassStr && !matchedClass && fallbackClass) {
            warningMessage = `Lớp "${rawClassStr}" không tìm thấy; Tự động gán vào lớp "${fallbackClass.name}"`;
          }
        }

        processed.push({
          index,
          code: code || 'CHƯA CÓ MÃ',
          fullName: fullName || '(Trống)',
          birthDate,
          gender,
          rawClassName: rawClassStr,
          classId: assignedClass?.id || '',
          className: assignedClass?.name || '',
          grade: assignedClass?.grade || 6,
          parentPhone: parentPhone || '(Trống)',
          parentEmail,
          address,
          note,
          status,
          errorMessage,
          warningMessage,
        });
      });

      if (processed.length === 0) {
        setGeneralError('Không trích xuất được học sinh nào từ file. Vui lòng kiểm tra lại file của bạn.');
        setIsLoading(false);
        return;
      }

      setParsedRows(processed);
      setActiveStep('preview');
    } catch (err: any) {
      console.error(err);
      setGeneralError('Đã xảy ra lỗi khi đọc file Excel: ' + (err?.message || 'Định dạng file không hỗ trợ'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFileName(selected.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        processWorkbook(workbook);
      } catch (error: any) {
        setGeneralError('Không thể đọc file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(selected);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setFileName(droppedFile.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          processWorkbook(workbook);
        } catch (error: any) {
          setGeneralError('Không thể đọc file: ' + error.message);
        }
      };
      reader.readAsArrayBuffer(droppedFile);
    }
  };

  // Re-parse when default class or options change
  const handleReprocessWithNewClass = (newDefaultClassId: string) => {
    setDefaultClassId(newDefaultClassId);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        processWorkbook(workbook);
      } catch (err: any) {
        setGeneralError('Lỗi khi xử lý lại: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Statistics
  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const updateCount = parsedRows.filter((r) => r.status === 'update').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;
  const totalImportable = validCount + updateCount;

  // Filtered rows for preview table
  const displayedRows = parsedRows.filter((r) => {
    if (previewFilter === 'all') return true;
    return r.status === previewFilter;
  });

  // Execute Import
  const handleExecuteImport = () => {
    const importableRows = parsedRows.filter((r) => r.status === 'valid' || r.status === 'update');
    if (importableRows.length === 0) {
      alert('Không có học sinh hợp lệ nào để nhập!');
      return;
    }

    const studentsToImport = importableRows.map((r) => {
      // Find if student with same code exists to keep their id
      const existing = existingStudents.find((s) => s.code.toUpperCase() === r.code.toUpperCase());
      return {
        id: existing?.id,
        code: r.code,
        fullName: r.fullName,
        birthDate: r.birthDate,
        gender: r.gender,
        classId: r.classId,
        className: r.className,
        grade: r.grade,
        parentPhone: r.parentPhone,
        parentEmail: r.parentEmail,
        address: r.address,
        note: r.note,
      };
    });

    onImportStudents(studentsToImport);
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setFile(null);
    setFileName('');
    setParsedRows([]);
    setActiveStep('upload');
    setGeneralError('');
    setPreviewFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Nhập Dữ Liệu Học Sinh Bằng File Excel
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ file định dạng Excel (.xlsx, .xls) hoặc CSV với tính năng tự động khớp dữ liệu & kiểm tra lỗi
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Wizard Steps / Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-teal-50/60 border border-teal-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Chưa có file mẫu chuẩn?</span>
                <span className="text-slate-600">Tải file mẫu Excel đã được định dạng sẵn đầy đủ các cột và danh mục lớp.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 shadow-xs hover:border-teal-300 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600" />
              Tải File Excel Mẫu (.xlsx)
            </button>
          </div>

          {/* STEP 1: UPLOAD AREA */}
          {activeStep === 'upload' && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50/80 bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>

                <h4 className="text-base font-bold text-slate-800 mb-1">
                  Kéo thả file Excel vào đây hoặc <span className="text-teal-600 underline">chọn từ máy tính</span>
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Hỗ trợ các định dạng bảng tính tiêu chuẩn <strong>.xlsx, .xls, .csv</strong>. Dung lượng tối đa 15MB.
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Hệ thống tự nhận diện các tên cột tiếng Việt như: Mã HS, Họ tên, Ngày sinh, Giới tính, Lớp, SĐT...
                </div>
              </div>

              {/* General Error Alert */}
              {generalError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Không thể xử lý file Excel:</strong>
                    <span>{generalError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW AND VALIDATION */}
          {activeStep === 'preview' && (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-sm sm:max-w-md">
                      {fileName || 'File dữ liệu Excel'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Đã đọc được tổng cộng <strong>{parsedRows.length}</strong> hàng dữ liệu
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleResetModal();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Chọn file khác
                  </button>
                </div>
              </div>

              {/* Options & Fallback Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {/* Fallback default class */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp mặc định (nếu file thiếu lớp):</label>
                  <select
                    value={defaultClassId}
                    onChange={(e) => handleReprocessWithNewClass(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Khối {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Overwrite duplicates */}
                <div className="flex items-center gap-2 pt-2 sm:pt-4">
                  <input
                    type="checkbox"
                    id="chk-overwrite"
                    checked={overwriteDuplicates}
                    onChange={(e) => {
                      setOverwriteDuplicates(e.target.checked);
                      if (file) handleReprocessWithNewClass(defaultClassId);
                    }}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="chk-overwrite" className="text-slate-700 cursor-pointer select-none">
                    Cập nhật nếu trùng Mã HS
                  </label>
                </div>

                {/* Auto generate code */}
                <div className="flex items-center gap-2 pt-2 sm:pt-4">
                  <input
                    type="checkbox"
                    id="chk-autocode"
                    checked={autoGenerateMissingCodes}
                    onChange={(e) => {
                      setAutoGenerateMissingCodes(e.target.checked);
                      if (file) handleReprocessWithNewClass(defaultClassId);
                    }}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="chk-autocode" className="text-slate-700 cursor-pointer select-none">
                    Tự động tạo mã HS nếu trống
                  </label>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-200 pb-3">
                <button
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({parsedRows.length})
                </button>

                <button
                  onClick={() => setPreviewFilter('valid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewFilter === 'valid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hợp lệ mới ({validCount})
                </button>

                <button
                  onClick={() => setPreviewFilter('update')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewFilter === 'update'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cập nhật hồ sơ ({updateCount})
                </button>

                <button
                  onClick={() => setPreviewFilter('error')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewFilter === 'error'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Dòng lỗi ({errorCount})
                </button>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-3 py-2.5 w-12 text-center">#</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">Mã HS</th>
                      <th className="px-3 py-2.5">Họ và tên</th>
                      <th className="px-3 py-2.5">Ngày sinh</th>
                      <th className="px-3 py-2.5">Giới tính</th>
                      <th className="px-3 py-2.5">Lớp gán</th>
                      <th className="px-3 py-2.5">SĐT Phụ huynh</th>
                      <th className="px-3 py-2.5">Chi tiết / Cảnh báo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.index}
                        className={`hover:bg-slate-50 transition-colors ${
                          row.status === 'error'
                            ? 'bg-rose-50/40'
                            : row.status === 'update'
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{row.index}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hợp lệ
                            </span>
                          )}
                          {row.status === 'update' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Cập nhật
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Lỗi
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-teal-700">{row.code}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{row.fullName}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono">{row.birthDate}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.gender === 'Nữ' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {row.gender}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <School className="w-3 h-3 text-teal-600" />
                            {row.className} (K{row.grade})
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-700">{row.parentPhone}</td>
                        <td className="px-3 py-2 text-[11px]">
                          {row.errorMessage && <span className="text-rose-600 font-semibold">{row.errorMessage}</span>}
                          {row.warningMessage && !row.errorMessage && (
                            <span className="text-amber-700">{row.warningMessage}</span>
                          )}
                          {!row.errorMessage && !row.warningMessage && (
                            <span className="text-slate-400">Sẵn sàng nhập</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Summary Callout */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-600">Tổng kết nhập: </span>
                  <strong className="text-emerald-700 font-bold">{validCount} học sinh mới</strong> +{' '}
                  <strong className="text-amber-700 font-bold">{updateCount} cập nhật</strong>
                  {errorCount > 0 && (
                    <span className="text-rose-600 ml-1.5 font-medium">({errorCount} dòng lỗi sẽ được bỏ qua)</span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Tổng cộng sẽ ghi vào hệ thống: <strong className="text-slate-800 font-bold">{totalImportable}</strong> học sinh
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          {activeStep === 'upload' ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Chưa chuẩn bị file? Nhấn "Tải File Excel Mẫu" ở góc trên để lấy mẫu.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveStep('upload')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Quay lại chọn file
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => {
                handleResetModal();
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-transparent hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {activeStep === 'preview' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={totalImportable === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận nhập ({totalImportable} học sinh)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
