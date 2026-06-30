/**
 * نظام متابعة وتقييم المتدربين - صيدليات آل مغاوري
 * برمجة وتنسيق تفاعلي كامل
 */

// بيانات وهمية ابتدائية لجعل النظام يبدو حيوياً عند التشغيل الأول
const MOCK_DATA = [
    {
        id: "eval_1",
        date: "2026-06-29",
        day: "الإثنين",
        traineeName: "أحمد فؤاد الشافعي",
        branchName: "فرع أبو الخير",
        shiftTime: "صباحي (8:00 ص - 4:00 م)",
        supervisorName: "د. محمد حسام",
        tasks: [
            { desc: "جرد وتدقيق أصناف ثلاجة الأنسولين والامبولات", status: true },
            { desc: "ترتيب ومراجعة صلاحيات قسم حليب الأطفال", status: true },
            { desc: "مراجعة وتسجيل الطلبيات النواقص على النظام", status: false }
        ],
        ratings: [5, 4, 5, 4, 4], // التقييمات للمعايير الخمسة
        notes: "متدرب ملتزم جداً، يظهر سرعة استيعاب ممتازة لنظام البيع والصرف، يحتاج للتركيز أكثر أثناء تسجيل النواقص.",
        approved: true,
        managerFeedback: "عمل ممتاز، استمر في المتابعة معه والتركيز على تدريبه على نظام الطلبيات.",
        managerSig: "م. أحمد مغاوري"
    },
    {
        id: "eval_2",
        date: "2026-06-30",
        day: "الثلاثاء",
        traineeName: "عمر عبد العزيز خالد",
        branchName: "فرع أبو الخير",
        shiftTime: "مسائي (4:00 م - 12:00 ص)",
        supervisorName: "د. رانيا علي",
        tasks: [
            { desc: "استلام وتدقيق فاتورة مخزن الأدوية الرئيسي", status: true },
            { desc: "تحديث شلفات التجميل والعناية بالبشرة وتوزيع العينات", status: true },
            { desc: "مراجعة الكاش وتسليم عهدة الشفت للمشرف التالي", status: true }
        ],
        ratings: [4, 3, 4, 5, 3],
        notes: "تواصله مع العملاء ممتاز ولبق جداً. يحتاج لزيادة سرعة قراءة الروشتات الطبية وحفظ تصنيفات أدوية الضغط.",
        approved: false,
        managerFeedback: "",
        managerSig: ""
    }
];

// المتغيرات العامة للنظام
let evaluations = [];
let currentEvalId = null; // لتتبع التقييم المعروض حالياً في المودال

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    setDefaultDate();
    initAppEvents();
    renderDashboard();
    updatePendingBadge();
});

// تهيئة قاعدة البيانات المحلية
function initDatabase() {
    const localData = localStorage.getItem("almaghawry_evaluations_v2");
    if (!localData) {
        localStorage.setItem("almaghawry_evaluations_v2", JSON.stringify(MOCK_DATA));
        evaluations = [...MOCK_DATA];
    } else {
        evaluations = JSON.parse(localData);
    }
}

// وضع تاريخ اليوم كقيمة افتراضية
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("evaluation-date").value = today;
}

// تهيئة الأحداث والتفاعلات في الصفحة
function initAppEvents() {
    // تبديل الشاشات (المشرف ضد المدير)
    const btnSupervisor = document.getElementById("btn-supervisor-view");
    const btnManager = document.getElementById("btn-manager-view");
    const viewSupervisor = document.getElementById("supervisor-view");
    const viewManager = document.getElementById("manager-view");

    btnSupervisor.addEventListener("click", () => {
        btnSupervisor.classList.add("active");
        btnManager.classList.remove("active");
        viewSupervisor.classList.add("active");
        viewManager.classList.remove("active");
    });

    btnManager.addEventListener("click", () => {
        btnManager.classList.add("active");
        btnSupervisor.classList.remove("active");
        viewManager.classList.add("active");
        viewSupervisor.classList.remove("active");
        renderDashboard(); // تحديث البيانات فورياً
    });

    // زر إضافة مهمة جديدة في جدول المهام
    let taskCounter = 2; // بدأنا بـ 2 لأن هناك صفين مبدئياً
    document.getElementById("btn-add-task").addEventListener("click", () => {
        taskCounter++;
        const tbody = document.getElementById("tasks-tbody");
        const newRow = document.createElement("tr");
        newRow.className = "task-row";
        newRow.innerHTML = `
            <td class="task-number">${taskCounter}</td>
            <td>
                <input type="text" class="task-desc" required placeholder="اكتب المهمة المطلوبة...">
            </td>
            <td>
                <div class="status-toggle">
                    <input type="checkbox" id="task-status-${taskCounter}" class="task-status-chk">
                    <label for="task-status-${taskCounter}" class="status-label">
                        <span class="status-done">تم الإنجاز <i class="fa-solid fa-check"></i></span>
                        <span class="status-not-done">معلق <i class="fa-solid fa-hourglass-start"></i></span>
                    </label>
                </div>
            </td>
            <td>
                <button type="button" class="btn-delete-row" onclick="deleteTaskRow(this)"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(newRow);
        recalculateTaskNumbers();
    });

    // إرسال استمارة التقييم
    document.getElementById("evaluation-form").addEventListener("submit", (e) => {
        e.preventDefault();
        saveEvaluation();
    });

    // التصفية والبحث في لوحة المدير
    document.getElementById("search-trainee").addEventListener("input", filterEvaluations);
    document.getElementById("filter-branch").addEventListener("change", filterEvaluations);
    document.getElementById("filter-date").addEventListener("input", filterEvaluations);
    
    // زر مسح الفلاتر
    document.getElementById("btn-clear-filters").addEventListener("click", () => {
        document.getElementById("search-trainee").value = "";
        document.getElementById("filter-branch").value = "all";
        document.getElementById("filter-date").value = "";
        filterEvaluations();
    });

    // إغلاق المودال
    const closeModal = () => {
        document.getElementById("details-modal").classList.remove("active");
    };
    document.getElementById("btn-close-modal").addEventListener("click", closeModal);
    document.getElementById("btn-close-modal-bottom").addEventListener("click", closeModal);

    // اعتماد التقييم من المودال
    document.getElementById("btn-approve-sheet").addEventListener("click", () => {
        approveEvaluation();
    });

    // طباعة الاستمارة كـ PDF
    document.getElementById("btn-print-sheet").addEventListener("click", () => {
        window.print();
    });

    // مسح كافة البيانات وإعادة التصفير
    document.getElementById("btn-reset-data").addEventListener("click", () => {
        if(confirm("هل أنت متأكد من رغبتك في مسح كافة التقييمات المسجلة وإعادة تهيئة النظام؟")) {
            localStorage.removeItem("almaghawry_evaluations_v2");
            initDatabase();
            renderDashboard();
            updatePendingBadge();
            showToast("تم إعادة تهيئة قاعدة البيانات بنجاح", "info");
        }
    });
}

// حذف صف مهمة وإعادة ترقيم الجدول
function deleteTaskRow(button) {
    const row = button.closest("tr");
    row.remove();
    recalculateTaskNumbers();
}

function recalculateTaskNumbers() {
    const rows = document.querySelectorAll("#tasks-tbody .task-row");
    rows.forEach((row, index) => {
        row.querySelector(".task-number").textContent = index + 1;
    });
}

// الحصول على اسم اليوم بالعربية من التاريخ
function getArabicDayName(dateString) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const d = new Date(dateString);
    return days[d.getDay()];
}

// حفظ تقييم جديد في قاعدة البيانات
function saveEvaluation() {
    const traineeName = document.getElementById("trainee-name").value.trim();
    const branchName = document.getElementById("branch-name").value;
    const shiftTime = document.getElementById("shift-time").value;
    const evalDate = document.getElementById("evaluation-date").value;
    const supervisorName = document.getElementById("supervisor-name").value.trim();
    const notes = document.getElementById("evaluation-notes").value.trim();

    // تجميع المهام
    const taskRows = document.querySelectorAll("#tasks-tbody .task-row");
    const tasks = [];
    taskRows.forEach(row => {
        const desc = row.querySelector(".task-desc").value.trim();
        const status = row.querySelector(".task-status-chk").checked;
        if(desc) {
            tasks.push({ desc, status });
        }
    });

    // تجميع تقييمات المعايير الخمسة
    const ratings = [];
    for(let i=1; i<=5; i++) {
        const selected = document.querySelector(`input[name="rating-${i}"]:checked`);
        ratings.push(selected ? parseInt(selected.value) : 3); // افتراضي جيد في حال لم يحدد
    }

    // إنشاء كائن التقييم
    const newEval = {
        id: "eval_" + Date.now(),
        date: evalDate,
        day: getArabicDayName(evalDate),
        traineeName,
        branchName,
        shiftTime,
        supervisorName,
        tasks,
        ratings,
        notes,
        approved: false,
        managerFeedback: "",
        managerSig: ""
    };

    // حفظ في المصفوفة والتخزين المحلي
    evaluations.unshift(newEval); // إضافته في البداية
    localStorage.setItem("almaghawry_evaluations_v2", JSON.stringify(evaluations));

    // إرسال إشعار للمستخدم
    showToast(`تم إرسال تقييم المتدرب "${traineeName}" بنجاح إلى مدير الفرع!`, "success");

    // تصفير الاستمارة
    document.getElementById("evaluation-form").reset();
    setDefaultDate();
    
    // إعادة تعيين جدول المهام لصفين افتراضيين
    const tbody = document.getElementById("tasks-tbody");
    tbody.innerHTML = `
        <tr class="task-row">
            <td class="task-number">1</td>
            <td><input type="text" class="task-desc" required placeholder="مثال: جرد وتدقيق أصناف الثلاجة"></td>
            <td>
                <div class="status-toggle">
                    <input type="checkbox" id="task-status-1" class="task-status-chk">
                    <label for="task-status-1" class="status-label">
                        <span class="status-done">تم الإنجاز <i class="fa-solid fa-check"></i></span>
                        <span class="status-not-done">معلق <i class="fa-solid fa-hourglass-start"></i></span>
                    </label>
                </div>
            </td>
            <td><button type="button" class="btn-delete-row" disabled><i class="fa-solid fa-trash"></i></button></td>
        </tr>
        <tr class="task-row">
            <td class="task-number">2</td>
            <td><input type="text" class="task-desc" required placeholder="مثال: مراجعة تاريخ الصلاحية للرفوف الأمامية"></td>
            <td>
                <div class="status-toggle">
                    <input type="checkbox" id="task-status-2" class="task-status-chk">
                    <label for="task-status-2" class="status-label">
                        <span class="status-done">تم الإنجاز <i class="fa-solid fa-check"></i></span>
                        <span class="status-not-done">معلق <i class="fa-solid fa-hourglass-start"></i></span>
                    </label>
                </div>
            </td>
            <td><button type="button" class="btn-delete-row" onclick="deleteTaskRow(this)"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `;
    
    updatePendingBadge();
}

// عرض لوحة المدير وحساب الإحصائيات
function renderDashboard(filteredData = null) {
    const dataToRender = filteredData || evaluations;
    
    // 1. حساب الإحصائيات المبدئية
    const totalEvals = dataToRender.length;
    document.getElementById("stat-total-evals").textContent = totalEvals;

    if (totalEvals > 0) {
        // متوسط التقييم الكلي
        let totalSum = 0;
        let totalCount = 0;
        let completedTasks = 0;
        let totalTasksCount = 0;

        dataToRender.forEach(ev => {
            const sum = ev.ratings.reduce((a, b) => a + b, 0);
            totalSum += (sum / ev.ratings.length);
            totalCount++;

            // المهام
            ev.tasks.forEach(t => {
                totalTasksCount++;
                if (t.status) completedTasks++;
            });
        });

        const avg = (totalSum / totalCount).toFixed(1);
        document.getElementById("stat-avg-rating").textContent = `${avg} / 5`;

        const taskRate = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;
        document.getElementById("stat-tasks-rate").textContent = `${taskRate}%`;
    } else {
        document.getElementById("stat-avg-rating").textContent = "0 / 5";
        document.getElementById("stat-tasks-rate").textContent = "0%";
    }

    // 2. تعبئة الجدول بالتقييمات
    const tbody = document.getElementById("evaluations-list-tbody");
    tbody.innerHTML = "";

    if (totalEvals === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fa-regular fa-folder-open"></i>
                    <p>لا توجد تقييمات تطابق خيارات البحث والتصفية المحددة.</p>
                </td>
            </tr>
        `;
        return;
    }

    dataToRender.forEach(ev => {
        // متوسط تقييم هذا المتدرب
        const scoreSum = ev.ratings.reduce((a, b) => a + b, 0);
        const scoreAvg = (scoreSum / ev.ratings.length).toFixed(1);
        
        let scoreClass = "score-med";
        if(scoreAvg >= 4.0) scoreClass = "score-high";
        else if(scoreAvg <= 2.5) scoreClass = "score-low";

        const badgeState = ev.approved 
            ? `<span class="badge-state badge-approved"><i class="fa-solid fa-check-double"></i> معتمد</span>`
            : `<span class="badge-state badge-pending"><i class="fa-solid fa-hourglass-start"></i> بانتظار الاعتماد</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${ev.date}</strong></td>
            <td><strong>${ev.traineeName}</strong></td>
            <td>${ev.branchName}</td>
            <td><span style="font-size: 0.8rem; color: var(--text-muted);">${ev.shiftTime.split(' ')[0]}</span></td>
            <td>${ev.supervisorName}</td>
            <td><span class="score-badge ${scoreClass}">${scoreAvg} / 5</span></td>
            <td>${badgeState}</td>
            <td>
                <button class="btn-view-details" onclick="openDetailsModal('${ev.id}')">
                    <i class="fa-solid fa-eye"></i> عرض وتعديل
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// تصفية التقييمات بناء على مدخلات المدير
function filterEvaluations() {
    const searchVal = document.getElementById("search-trainee").value.toLowerCase().trim();
    const branchVal = document.getElementById("filter-branch").value;
    const dateVal = document.getElementById("filter-date").value;

    const filtered = evaluations.filter(ev => {
        const matchesSearch = ev.traineeName.toLowerCase().includes(searchVal);
        const matchesBranch = (branchVal === "all") || (ev.branchName === branchVal);
        const matchesDate = !dateVal || (ev.date === dateVal);

        return matchesSearch && matchesBranch && matchesDate;
    });

    renderDashboard(filtered);
}

// تحديث شارة عدد التقييمات بانتظار الاعتماد
function updatePendingBadge() {
    const pendingCount = evaluations.filter(ev => !ev.approved).length;
    const badge = document.getElementById("badge-count");
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? "inline-block" : "none";
}

// فتح نافذة تفاصيل التقييم (المودال)
window.openDetailsModal = function(id) {
    const ev = evaluations.find(item => item.id === id);
    if (!ev) return;

    currentEvalId = id;

    // ملء البيانات في الاستمارة القابلة للطباعة
    document.getElementById("m-eval-date").textContent = ev.date;
    document.getElementById("m-eval-day").textContent = ev.day;
    document.getElementById("m-trainee-name").textContent = ev.traineeName;
    document.getElementById("m-branch-name").textContent = ev.branchName;
    document.getElementById("m-shift-time").textContent = ev.shiftTime;
    document.getElementById("m-supervisor-name").textContent = ev.supervisorName;
    
    document.getElementById("m-notes").textContent = ev.notes || "لا توجد ملاحظات إضافية مسجلة من المشرف.";
    document.getElementById("m-sig-supervisor").textContent = ev.supervisorName;

    // 1. معالجة حالة التقييم المعتمد أو المعلق
    const modalApprovedBadge = document.getElementById("modal-badge-approved");
    const managerActionSection = document.querySelector(".manager-action-section");
    const approveBtn = document.getElementById("btn-approve-sheet");
    const feedbackTextarea = document.getElementById("manager-feedback");

    if (ev.approved) {
        modalApprovedBadge.style.display = "inline-block";
        managerActionSection.style.display = "none";
        approveBtn.style.display = "none";
        document.getElementById("m-sig-manager").textContent = ev.managerSig || "تم الاعتماد إلكترونياً";
        
        // إظهار تعليق المدير إن وجد في بوكس الملاحظات أو خانة منفصلة
        if(ev.managerFeedback) {
            document.getElementById("m-notes").innerHTML = `
                <strong>ملاحظات المشرف:</strong><br>${ev.notes || "لا توجد"}<br><br>
                <strong style="color: var(--success)"><i class="fa-solid fa-comment-medical"></i> توجيهات واعتماد مدير الفرع:</strong><br>${ev.managerFeedback}
            `;
        }
    } else {
        modalApprovedBadge.style.display = "none";
        managerActionSection.style.display = "block";
        approveBtn.style.display = "inline-flex";
        feedbackTextarea.value = "";
        document.getElementById("m-sig-manager").textContent = "بانتظار المراجعة والاعتماد...";
    }

    // 2. ملء جدول المهام
    const tasksTbody = document.getElementById("m-tasks-tbody");
    tasksTbody.innerHTML = "";
    ev.tasks.forEach((t, index) => {
        const statusHtml = t.status 
            ? `<span style="color: var(--success); font-weight: bold;"><i class="fa-solid fa-circle-check"></i> تم التنفيذ</span>`
            : `<span style="color: var(--danger); font-weight: bold;"><i class="fa-solid fa-circle-xmark"></i> لم ينفذ</span>`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align: center; font-weight: bold;">${index + 1}</td>
            <td>${t.desc}</td>
            <td style="text-align: center;">${statusHtml}</td>
        `;
        tasksTbody.appendChild(tr);
    });

    // 3. ملء جدول التقييمات
    const ratingsTbody = document.getElementById("m-ratings-tbody");
    ratingsTbody.innerHTML = "";
    
    const criteriaNames = [
        "1. الالتزام بمواعيد الشيفت والزي الموحد",
        "2. سرعة التعلم والاستجابة للتوجيهات",
        "3. دقة وجودة تنفيذ المهام المطلوبة",
        "4. مهارات التواصل الإيجابي مع العملاء والزملاء",
        "5. روح المبادرة والتعاون والعمل الجماعي"
    ];

    criteriaNames.forEach((name, index) => {
        const rating = ev.ratings[index];
        
        // رسم علامة الصح في الخانة المناسبة
        const check = `<span style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;"><i class="fa-solid fa-check-double"></i></span>`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight: 600;">${name}</td>
            <td>${rating === 5 ? check : ""}</td>
            <td>${rating === 4 ? check : ""}</td>
            <td>${rating === 3 ? check : ""}</td>
            <td>${rating === 2 ? check : ""}</td>
            <td>${rating === 1 ? check : ""}</td>
        `;
        ratingsTbody.appendChild(tr);
    });

    // فتح المودال
    document.getElementById("details-modal").classList.add("active");
};

// اعتماد وتقييم المتدرب من قبل المدير
function approveEvaluation() {
    if (!currentEvalId) return;

    const evIndex = evaluations.findIndex(item => item.id === currentEvalId);
    if (evIndex === -1) return;

    const feedback = document.getElementById("manager-feedback").value.trim();

    // تحديث حالة الاستمارة
    evaluations[evIndex].approved = true;
    evaluations[evIndex].managerFeedback = feedback;
    evaluations[evIndex].managerSig = "م. أحمد مغاوري (مدير الفرع)"; // توقيع المدير الافتراضي للموقع

    // حفظ في التخزين المحلي
    localStorage.setItem("almaghawry_evaluations_v2", JSON.stringify(evaluations));

    // إشعار بالنجاح وإغلاق المودال وتحديث لوحة التحكم
    showToast(`تم اعتماد استمارة تقييم المتدرب "${evaluations[evIndex].traineeName}" بنجاح!`, "success");
    document.getElementById("details-modal").classList.remove("active");
    renderDashboard();
    updatePendingBadge();
}

// عرض رسائل التنبيه العائمة (Toasts)
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = '<i class="fa-solid fa-info-circle"></i>';
    if(type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    else if(type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // إزالة التنبيه بعد 4 ثوانٍ تلقائياً
    setTimeout(() => {
        toast.style.animation = "slideOutLeft 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
