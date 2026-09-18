import { ClassItem, StudentItem, SubjectItem, LessonItem, ActivityLog } from '../types';

export function generateStandaloneHtml(
  classes: ClassItem[],
  students: StudentItem[],
  subjects: SubjectItem[],
  lessons: LessonItem[],
  logs: ActivityLog[]
): string {
  const serializedClasses = JSON.stringify(classes, null, 2);
  const serializedStudents = JSON.stringify(students, null, 2);
  const serializedSubjects = JSON.stringify(subjects, null, 2);
  const serializedLessons = JSON.stringify(lessons, null, 2);
  const serializedLogs = JSON.stringify(logs, null, 2);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TRƯỜNG THCS LÊ LỢI - QUẢN LÝ HỌC SINH</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --secondary: #0d9488;
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --danger: #e11d48;
      --success: #10b981;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }
    
    /* Layout */
    #sidebar { width: 260px; background: #ffffff; border-right: 1px solid var(--border); display: flex; flex-direction: column; shrink-0; }
    #main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
    header { background: #ffffff; border-bottom: 1px solid var(--border); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
    .page-content { padding: 24px; max-width: 1400px; margin: 0 auto; width: 100%; }

    /* Nav */
    .brand { padding: 20px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 16px; color: var(--primary); }
    .nav-list { list-style: none; padding: 12px 8px; flex: 1; }
    .nav-item { padding: 12px 14px; margin-bottom: 4px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: #475569; transition: all 0.2s; }
    .nav-item:hover { background: #f1f5f9; color: var(--text); }
    .nav-item.active { background: var(--primary); color: #ffffff; }

    /* Cards & Stats */
    .grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--surface); padding: 20px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .stat-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 800; color: var(--text); }

    /* Controls & Tables */
    .card { background: var(--surface); border-radius: 16px; border: 1px solid var(--border); padding: 20px; margin-bottom: 24px; }
    .controls { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-input { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border); font-size: 14px; width: 300px; }
    .filter-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border); font-size: 14px; }
    .btn { padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-secondary { background: #f1f5f9; color: #334155; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-danger { background: var(--danger); color: #fff; }

    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid var(--border); font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: #f8fafc; }

    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
    .action-btn { padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid var(--border); background: #fff; cursor: pointer; margin-right: 4px; }
    .action-btn:hover { background: #f8fafc; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal-box { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
    .form-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); font-size: 14px; }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside id="sidebar">
    <div class="brand">
      🏫 THCS LÊ LỢI
    </div>
    <ul class="nav-list">
      <li class="nav-item active" onclick="switchTab('dashboard')">
        <span>📊 Trang tổng quan</span>
      </li>
      <li class="nav-item" onclick="switchTab('classes')">
        <span>👥 Quản lý lớp học</span>
      </li>
      <li class="nav-item" onclick="switchTab('students')">
        <span>🎓 Quản lý học sinh</span>
      </li>
      <li class="nav-item" onclick="switchTab('subjects_lessons')">
        <span>📚 Môn học & Bài học</span>
      </li>
    </ul>
    <div style="padding: 16px; font-size: 11px; color: var(--text-muted); text-align: center; border-top: 1px solid var(--border);">
      Năm học 2026 - 2027
    </div>
  </aside>

  <!-- Main Content -->
  <main id="main-content">
    <header>
      <div>
        <h2 id="header-title" style="font-size: 20px; font-weight: 800;">Trang tổng quan</h2>
        <p id="header-subtitle" style="font-size: 13px; color: var(--text-muted);">Hệ thống quản lý giáo dục THCS</p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="padding: 6px 12px; background: #e0f2fe; color: #0369a1; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
          <span>👤 Thầy Trần Văn Bình (BGH)</span>
        </div>
        <button class="btn btn-secondary" onclick="resetToInitialData()">Đặt lại mẫu</button>
      </div>
    </header>

    <div class="page-content" id="app-view">
      <!-- Dynamic Views Rendered Here -->
    </div>
  </main>

  <div id="modal-container"></div>

  <script>
    // ==========================================
    // 1. DỮ LIỆU BAN ĐẦU & LOCAL STORAGE
    // ==========================================
    const DEFAULT_CLASSES = ${serializedClasses};
    const DEFAULT_STUDENTS = ${serializedStudents};
    const DEFAULT_SUBJECTS = ${serializedSubjects};
    const DEFAULT_LESSONS = ${serializedLessons};
    const DEFAULT_LOGS = ${serializedLogs};

    let appState = {
      activeTab: 'dashboard',
      classes: JSON.parse(localStorage.getItem('thcs_classes_v1') || 'null') || DEFAULT_CLASSES,
      students: JSON.parse(localStorage.getItem('thcs_students_v1') || 'null') || DEFAULT_STUDENTS,
      subjects: JSON.parse(localStorage.getItem('thcs_subjects_v1') || 'null') || DEFAULT_SUBJECTS,
      lessons: JSON.parse(localStorage.getItem('thcs_lessons_v1') || 'null') || DEFAULT_LESSONS,
      logs: JSON.parse(localStorage.getItem('thcs_logs_v1') || 'null') || DEFAULT_LOGS,
      subjectSubTab: 'subjects',
      studentSearch: '',
      studentGrade: 'all',
      classSearch: '',
      classGrade: 'all',
      lessonSearch: '',
    };

    function saveState() {
      localStorage.setItem('thcs_classes_v1', JSON.stringify(appState.classes));
      localStorage.setItem('thcs_students_v1', JSON.stringify(appState.students));
      localStorage.setItem('thcs_subjects_v1', JSON.stringify(appState.subjects));
      localStorage.setItem('thcs_lessons_v1', JSON.stringify(appState.lessons));
      localStorage.setItem('thcs_logs_v1', JSON.stringify(appState.logs));
      renderView();
    }

    function resetToInitialData() {
      if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu mẫu ban đầu?')) {
        appState.classes = DEFAULT_CLASSES;
        appState.students = DEFAULT_STUDENTS;
        appState.subjects = DEFAULT_SUBJECTS;
        appState.lessons = DEFAULT_LESSONS;
        appState.logs = DEFAULT_LOGS;
        saveState();
      }
    }

    function switchTab(tab) {
      appState.activeTab = tab;
      document.querySelectorAll('.nav-item').forEach((el, idx) => {
        el.classList.remove('active');
        if ((tab === 'dashboard' && idx === 0) ||
            (tab === 'classes' && idx === 1) ||
            (tab === 'students' && idx === 2) ||
            (tab === 'subjects_lessons' && idx === 3)) {
          el.classList.add('active');
        }
      });
      renderView();
    }

    function renderView() {
      const container = document.getElementById('app-view');
      const title = document.getElementById('header-title');
      const subtitle = document.getElementById('header-subtitle');

      // Update student count per class dynamically
      appState.classes.forEach(c => {
        c.studentCount = appState.students.filter(s => s.classId === c.id || s.className === c.name).length;
      });

      // Update lesson count per subject dynamically
      appState.subjects.forEach(sub => {
        sub.lessonCount = appState.lessons.filter(l => l.subjectId === sub.id || l.subjectName === sub.name).length;
      });

      if (appState.activeTab === 'dashboard') {
        title.innerText = 'Trang tổng quan hệ thống';
        subtitle.innerText = 'Tổng hợp số liệu lớp học, học sinh, môn học và bài học THCS';
        renderDashboard(container);
      } else if (appState.activeTab === 'classes') {
        title.innerText = 'Quản lý lớp học';
        subtitle.innerText = 'Danh sách lớp, khối, năm học và giáo viên chủ nhiệm';
        renderClasses(container);
      } else if (appState.activeTab === 'students') {
        title.innerText = 'Quản lý học sinh';
        subtitle.innerText = 'Danh sách học sinh, thông tin phụ huynh và phân lớp';
        renderStudents(container);
      } else if (appState.activeTab === 'subjects_lessons') {
        title.innerText = 'Quản lý môn học và bài học';
        subtitle.innerText = 'Chương trình khung và giáo án bài học';
        renderSubjectsLessons(container);
      }
    }

    // ==========================================
    // 2. DASHBOARD RENDER
    // ==========================================
    function renderDashboard(el) {
      el.innerHTML = \`
        <div class="grid-stats">
          <div class="stat-card">
            <div class="stat-title">Tổng số lớp học</div>
            <div class="stat-value" style="color: #0284c7;">\${appState.classes.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Tổng số học sinh</div>
            <div class="stat-value" style="color: #0d9488;">\${appState.students.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Tổng số môn học</div>
            <div class="stat-value" style="color: #6366f1;">\${appState.subjects.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Tổng số bài học</div>
            <div class="stat-value" style="color: #d97706;">\${appState.lessons.length}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div class="card">
            <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;">Lớp học gần đây</h3>
            <table>
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Khối</th>
                  <th>GVCN</th>
                  <th>Sĩ số</th>
                </tr>
              </thead>
              <tbody>
                \${appState.classes.map(c => \`
                  <tr>
                    <td><strong>\${c.name}</strong></td>
                    <td><span class="badge">Khối \${c.grade}</span></td>
                    <td>\${c.teacher}</td>
                    <td><strong>\${c.studentCount} HS</strong></td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>

          <div class="card">
            <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;">Hoạt động gần đây</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              \${appState.logs.map(log => \`
                <div style="padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--border);">
                  <div style="font-weight: 700; font-size: 13px; color: var(--primary);">\${log.action}</div>
                  <div style="font-size: 12px; color: #334155;">\${log.targetName}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // ==========================================
    // 3. CLASSES RENDER
    // ==========================================
    function renderClasses(el) {
      el.innerHTML = \`
        <div class="card">
          <div class="controls">
            <input type="text" class="search-input" id="class-search-input" placeholder="Tìm theo tên lớp, GVCN..." value="\${appState.classSearch}" oninput="appState.classSearch = this.value; renderView();">
            <button class="btn btn-primary" onclick="openAddClassModal()">+ Thêm lớp mới</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Tên lớp</th>
                <th>Khối</th>
                <th>Năm học</th>
                <th>GVCN</th>
                <th>Sĩ số</th>
                <th>Ghi chú</th>
                <th style="text-align: right;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              \${appState.classes
                .filter(c => c.name.toLowerCase().includes(appState.classSearch.toLowerCase()) || c.teacher.toLowerCase().includes(appState.classSearch.toLowerCase()))
                .map(c => \`
                  <tr>
                    <td><strong>\${c.code}</strong></td>
                    <td style="font-size: 16px; font-weight: 800;">\${c.name}</td>
                    <td><span class="badge">Khối \${c.grade}</span></td>
                    <td>\${c.schoolYear}</td>
                    <td>\${c.teacher}</td>
                    <td><strong>\${c.studentCount} HS</strong></td>
                    <td>\${c.note || '-'}</td>
                    <td style="text-align: right;">
                      <button class="action-btn" onclick="openEditClassModal('\${c.id}')">Sửa</button>
                      <button class="action-btn" style="color: var(--danger);" onclick="deleteClass('\${c.id}')">Xóa</button>
                    </td>
                  </tr>
                \`).join('')}
            </tbody>
          </table>
        </div>
      \`;
    }

    // ==========================================
    // 4. STUDENTS RENDER
    // ==========================================
    function renderStudents(el) {
      const filtered = appState.students.filter(s => {
        const matchSearch = s.fullName.toLowerCase().includes(appState.studentSearch.toLowerCase()) || s.code.toLowerCase().includes(appState.studentSearch.toLowerCase());
        const matchGrade = appState.studentGrade === 'all' || s.grade.toString() === appState.studentGrade;
        return matchSearch && matchGrade;
      });

      el.innerHTML = \`
        <div class="card">
          <div class="controls">
            <div style="display: flex; gap: 10px;">
              <input type="text" class="search-input" placeholder="Tìm tên, mã HS..." value="\${appState.studentSearch}" oninput="appState.studentSearch = this.value; renderView();">
              <select class="filter-select" onchange="appState.studentGrade = this.value; renderView();">
                <option value="all" \${appState.studentGrade === 'all' ? 'selected' : ''}>Tất cả khối</option>
                <option value="6" \${appState.studentGrade === '6' ? 'selected' : ''}>Khối 6</option>
                <option value="7" \${appState.studentGrade === '7' ? 'selected' : ''}>Khối 7</option>
                <option value="8" \${appState.studentGrade === '8' ? 'selected' : ''}>Khối 8</option>
                <option value="9" \${appState.studentGrade === '9' ? 'selected' : ''}>Khối 9</option>
              </select>
            </div>
            <button class="btn btn-primary" onclick="openAddStudentModal()">+ Tiếp nhận học sinh</button>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Đang hiển thị <strong>\${filtered.length}</strong> học sinh</p>
          <table>
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Họ và tên</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Lớp</th>
                <th>SĐT Phụ huynh</th>
                <th style="text-align: right;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              \${filtered.map(s => \`
                <tr>
                  <td><strong>\${s.code}</strong></td>
                  <td style="font-weight: 700;">\${s.fullName}</td>
                  <td>\${s.birthDate}</td>
                  <td><span class="badge" style="background: \${s.gender === 'Nữ' ? '#ffe4e6' : '#e0f2fe'}; color: \${s.gender === 'Nữ' ? '#be123c' : '#0369a1'};">\${s.gender}</span></td>
                  <td>\${s.className}</td>
                  <td>\${s.parentPhone}</td>
                  <td style="text-align: right;">
                    <button class="action-btn" onclick="openEditStudentModal('\${s.id}')">Sửa</button>
                    <button class="action-btn" style="color: var(--danger);" onclick="deleteStudent('\${s.id}')">Xóa</button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`;
    }

    // ==========================================
    // 5. SUBJECTS & LESSONS RENDER
    // ==========================================
    function renderSubjectsLessons(el) {
      el.innerHTML = \`
        <div class="card">
          <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <button class="btn \${appState.subjectSubTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}" onclick="appState.subjectSubTab = 'subjects'; renderView();">TAB 1: MÔN HỌC</button>
            <button class="btn \${appState.subjectSubTab === 'lessons' ? 'btn-primary' : 'btn-secondary'}" onclick="appState.subjectSubTab = 'lessons'; renderView();">TAB 2: BÀI HỌC</button>
          </div>

          \${appState.subjectSubTab === 'subjects' ? \`
            <div class="controls">
              <button class="btn btn-primary" onclick="openAddSubjectModal()">+ Thêm môn học</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên môn</th>
                  <th>Khối áp dụng</th>
                  <th>Mô tả</th>
                  <th>Số bài học</th>
                  <th style="text-align: right;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                \${appState.subjects.map(sub => \`
                  <tr>
                    <td><strong>\${sub.code}</strong></td>
                    <td style="font-size: 15px; font-weight: 700;">\${sub.name}</td>
                    <td>Khối \${sub.grades.join(', ')}</td>
                    <td>\${sub.description || '-'}</td>
                    <td><strong>\${sub.lessonCount} bài</strong></td>
                    <td style="text-align: right;">
                      <button class="action-btn" onclick="openEditSubjectModal('\${sub.id}')">Sửa</button>
                      <button class="action-btn" style="color: var(--danger);" onclick="deleteSubject('\${sub.id}')">Xóa</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          \` : \`
            <div class="controls">
              <input type="text" class="search-input" placeholder="Tìm bài học..." value="\${appState.lessonSearch}" oninput="appState.lessonSearch = this.value; renderView();">
              <button class="btn btn-primary" onclick="openAddLessonModal()">+ Soạn bài học mới</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Mã bài</th>
                  <th>Tên bài học</th>
                  <th>Môn</th>
                  <th>Khối</th>
                  <th>Chương</th>
                  <th>Thứ tự</th>
                  <th style="text-align: right;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                \${appState.lessons.filter(l => l.title.toLowerCase().includes(appState.lessonSearch.toLowerCase())).map(l => \`
                  <tr>
                    <td><strong>\${l.code}</strong></td>
                    <td style="font-weight: 700;">\${l.title}</td>
                    <td>\${l.subjectName}</td>
                    <td>Khối \${l.grade}</td>
                    <td>\${l.chapter}</td>
                    <td>#\${l.order}</td>
                    <td style="text-align: right;">
                      <button class="action-btn" onclick="openEditLessonModal('\${l.id}')">Sửa</button>
                      <button class="action-btn" style="color: var(--danger);" onclick="deleteLesson('\${l.id}')">Xóa</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          \`}
        </div>
      \`;
    }

    // Modal Helpers
    function openAddClassModal() {
      const code = 'L' + (appState.classes.length + 1).toString().padStart(3, '0');
      const name = prompt('Nhập tên lớp (VD: 6A3):');
      if (!name) return;
      const grade = parseInt(prompt('Nhập khối (6, 7, 8, 9):', '6')) || 6;
      const teacher = prompt('Nhập họ tên Giáo viên chủ nhiệm:');
      if (!teacher) return;

      appState.classes.push({
        id: 'c_' + Date.now(),
        code,
        name,
        grade,
        schoolYear: '2026-2027',
        teacher,
        note: '',
        createdAt: new Date().toISOString()
      });
      saveState();
    }

    function deleteClass(id) {
      if (confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
        appState.classes = appState.classes.filter(c => c.id !== id);
        saveState();
      }
    }

    function openAddStudentModal() {
      const fullName = prompt('Nhập họ và tên học sinh:');
      if (!fullName) return;
      const className = prompt('Nhập tên lớp học (VD: 6A1):', appState.classes[0]?.name || '6A1');
      const matched = appState.classes.find(c => c.name === className) || appState.classes[0];
      const parentPhone = prompt('Nhập SĐT phụ huynh:', '0912345678');

      appState.students.push({
        id: 's_' + Date.now(),
        code: 'HS' + (appState.students.length + 1).toString().padStart(3, '0'),
        fullName,
        birthDate: '2013-05-15',
        gender: 'Nam',
        classId: matched.id,
        className: matched.name,
        grade: matched.grade,
        parentPhone: parentPhone || '0900000000',
        createdAt: new Date().toISOString()
      });
      saveState();
    }

    function deleteStudent(id) {
      if (confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
        appState.students = appState.students.filter(s => s.id !== id);
        saveState();
      }
    }

    function openAddSubjectModal() {
      const name = prompt('Nhập tên môn học (VD: Sinh học):');
      if (!name) return;
      appState.subjects.push({
        id: 'sub_' + Date.now(),
        code: 'MH' + (appState.subjects.length + 1).toString().padStart(3, '0'),
        name,
        grades: [6, 7, 8, 9],
        description: 'Môn học THCS',
        createdAt: new Date().toISOString()
      });
      saveState();
    }

    function deleteSubject(id) {
      if (confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
        appState.subjects = appState.subjects.filter(s => s.id !== id);
        saveState();
      }
    }

    function openAddLessonModal() {
      const title = prompt('Nhập tên bài học:');
      if (!title) return;
      const sub = appState.subjects[0];
      appState.lessons.push({
        id: 'l_' + Date.now(),
        code: 'BH' + (appState.lessons.length + 1).toString().padStart(3, '0'),
        title,
        subjectId: sub.id,
        subjectName: sub.name,
        grade: 6,
        chapter: 'Chương 1',
        order: 1,
        createdAt: new Date().toISOString()
      });
      saveState();
    }

    function deleteLesson(id) {
      if (confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
        appState.lessons = appState.lessons.filter(l => l.id !== id);
        saveState();
      }
    }

    // Initialize View
    renderView();
  </script>
</body>
</html>`;
}
