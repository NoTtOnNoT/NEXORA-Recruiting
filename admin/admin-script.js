// 🚨 [SECURITY] ระบบตรวจสอบสิทธิ์ความปลอดภัย (ตรวจสอบการล็อกอินรายบุคคลผ่าน localStorage)
const currentAdminName = localStorage.getItem('admin_name');

if (localStorage.getItem('admin_logged_in') !== 'true' || !currentAdminName) {
    document.body.innerHTML = `
        <div style="background: #030712; color: #f87171; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: 'Kanit', sans-serif;">
            <h2 style="margin-bottom: 10px;">🔒 ตรวจพบการเข้าถึงโดยไม่ได้รับอนุญาต</h2>
            <p style="color: #64748b;">กำลังนำคุณกลับไปหน้าเข้าสู่ระบบ...</p>
        </div>
    `;
    window.location.href = 'login.html';
}

// -------------------------------------------------------------------------
// 🌐 ส่วนควบคุม Dashboard แบบ Real-time Auto-Sync (SteinHQ Version - แก้บัก 400)
// -------------------------------------------------------------------------

// 🟢 ปรับเปลี่ยนคำต่อท้ายให้เป็น /ชีต1 (ภาษาไทย ตามที่ปรากฏในรูปภาพตารางของคุณ)
const sheetAPI_URL = 'https://api.steinhq.com/v1/storages/6a114ab392b1163e97f9c787/ชีต1'; 

let currentIntervalTime = 20000; 
let localApplicantsData = []; 
let isFetchLocked = false;    
let syncTimer = null;

// 1. ฟังก์ชันหลักในการดึงข้อมูลจากฐานข้อมูลส่วนกลาง (Background Sync)
function fetchApplicants(isSilentUpdate = false) {
    if (isFetchLocked) return;
    isFetchLocked = true;

    const loadingState = document.getElementById('loading-state');
    const totalCount = document.getElementById('total-applicants');

    fetch(sheetAPI_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            let rawData = Array.isArray(data) ? data : [];
            
            // ✂️ [FILTER] กรองแถวว่าง หรือแถวที่ไม่มีข้อมูล "ชื่อ-นามสกุล" ออกไป เพื่อไม่ให้แสดงเป็นกล่องเปล่าบนจอ
            let validApplicants = rawData.filter(person => {
                const name = person.name || person['name'] || '';
                return name.trim() !== '' && name !== 'name'; 
            });

            // 🔄 [ALGORITHM] คัดแยกและจัดเรียงข้อมูลตามระดับชั้น/ห้องเรียนจากน้อยไปมาก
            let sortedData = validApplicants.sort((a, b) => {
                const gradeA = (a.grade || '').toString();
                const gradeB = (b.grade || '').toString();
                return gradeA.localeCompare(gradeB, 'th', { numeric: true, sensitivity: 'base' });
            });
            
            // ⚡ [REAL-TIME ENGINE] ตรวจสอบความเปลี่ยนแปลงข้อมูล
            const isDataChanged = JSON.stringify(localApplicantsData) !== JSON.stringify(sortedData);

            if (isDataChanged) {
                localApplicantsData = sortedData; 
                
                if (totalCount) totalCount.innerText = localApplicantsData.length;

                const searchInput = document.getElementById('search-input');
                if (searchInput && searchInput.value.trim() !== '') {
                    triggerLiveSearch(searchInput.value);
                } else {
                    displayApplicants(localApplicantsData);
                }
            }

            if (!isSilentUpdate && loadingState) {
                loadingState.style.display = 'none';
            }
            isFetchLocked = false;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            isFetchLocked = false;
            if (!isSilentUpdate && loadingState) {
                loadingState.innerHTML = `
                    <div style="color: #f87171; font-weight: 500; text-align: center; padding: 20px;">
                        <p>⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูลจาก NEXORA DATABASE</p>
                        <p style="font-size: 0.85rem; color: #64748b; margin-top: 5px;">โปรดตรวจสอบว่าได้เปิดสิทธิ์แชร์ Google Sheets เป็น "ทุกคนที่มีลิงก์" หรือยัง</p>
                    </div>
                `;
            }
        });
}

// 2. ฟังก์ชันสร้างกล่องข้อมูลแบบย่อ (ชื่อ-นามสกุล และห้องเรียน)
function displayApplicants(applicants) {
    const applicantsGrid = document.getElementById('applicants-grid');
    if (!applicantsGrid) return;

    applicantsGrid.innerHTML = ''; 

    if (applicants.length === 0) {
        applicantsGrid.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 40px;">ไม่พบข้อมูลผู้สมัครที่ตรงเงื่อนไข</p>`;
        return;
    }

    applicants.forEach(person => {
        const card = document.createElement('div');
        card.className = 'applicant-card simplified-card';

        // แมปปิ้งตามชื่อคอลัมน์แถวแรกในตารางของคุญเป๊ะๆ (พิมพ์เล็กทั้งหมด)
        const name = person.name || 'ไม่ระบุชื่อ';
        const grade = person.grade || '-';

        card.innerHTML = `
            <div class="card-header-mini">
                <span class="room-tag">ห้อง ${grade}</span>
            </div>
            <h3 class="name-display">${name}</h3>
            <div class="action-hint">
                <span>คลิกเพื่อดูข้อมูลเพิ่มเติม</span> 
                <i class="fa-solid fa-arrow-right-to-bracket"></i>
            </div>
        `;
        
        card.addEventListener('click', () => {
            openDetailModal(person);
        });

        applicantsGrid.appendChild(card);
    });
}

// 3. ฟังก์ชันจัดโครงสร้างและดึงข้อมูลฉบับเต็มมาใส่ในกล่องป๊อปอัพ (Modal Popup)
function openDetailModal(person) {
    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body-content');
    
    if (!modal || !modalBody) return;

    // ตรวจจับคีย์หัวตารางตามรูปภาพที่ส่งมา
    const name = person.name || 'ไม่ระบุชื่อ';
    const grade = person.grade || '-';
    const gpa = person.gpa || 'ไม่ได้ระบุ';
    const facebook = person.facebook || '-';
    const instagram = person.instagram || '-';
    const reason = person.reason || 'ไม่มีคำตอบ';

    modalBody.innerHTML = `
        <div class="modal-badge-status">MEMBER DATA PROFILE</div>
        <h2 class="modal-profile-title">${name}</h2>
        
        <div class="modal-info-grid">
            <div class="modal-info-item">
                <span class="m-label">ระดับชั้น / ห้องเรียน</span>
                <span class="m-value">ห้อง ${grade}</span>
            </div>
            <div class="modal-info-item">
                <span class="m-label">เกรดเฉลี่ยสะสม</span>
                <span class="m-value highlights-gpa">${gpa}</span>
            </div>
            <div class="modal-info-item">
                <span class="m-label"><i class="fa-brands fa-facebook"></i> Facebook</span>
                <span class="m-value">${facebook}</span>
            </div>
            <div class="modal-info-item">
                <span class="m-label"><i class="fa-brands fa-instagram"></i> Instagram</span>
                <span class="m-value">${instagram}</span>
            </div>
        </div>

        <div class="modal-reason-section">
            <span class="m-label reason-title"><i class="fa-solid fa-quote-left"></i> เหตุผลที่อยากเข้ามาร่วมทางกับพรรค:</span>
            <p class="m-reason-text">"${reason}"</p>
        </div>
    `;

    modal.classList.add('modal-active');
}

// 4. ฟังก์ชันปิดป๊อปอัพ
function closeModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.remove('modal-active');
    }
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('detail-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// 5. ระบบแกนกลางการเสิร์ชค้นหา
function triggerLiveSearch(value) {
    const searchText = value.toLowerCase().trim();
    const filteredData = localApplicantsData.filter(person => {
        const name = (person.name || '').toLowerCase();
        const grade = (person.grade || '').toLowerCase();
        return name.includes(searchText) || grade.includes(searchText);
    });
    displayApplicants(filteredData);
}

const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        triggerLiveSearch(e.target.value);
    });
}

// 🚪 6. ฟังก์ชันสำหรับออกจากระบบ (Logout) ล้างค่าแอดมินทั้งหมด
function adminLogout() {
    if (confirm('คุณต้องการออกจากระบบควบคุมแผงบริหาร NEXORA ใช่หรือไม่?')) {
        localStorage.removeItem('admin_logged_in'); 
        localStorage.removeItem('admin_name');      
        window.location.href = 'login.html';       
    }
}

// -------------------------------------------------------------------------
// ⏰ [⚡ REAL-TIME ACTIVATOR] เริ่มทำงานและตั้งเวลาอัปเดตอัตโนมัติ
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const adminTarget = document.getElementById('admin-display-name');
    if (adminTarget) {
        adminTarget.innerText = currentAdminName;
    }

    fetchApplicants(false);

    syncTimer = setInterval(() => {
        fetchApplicants(true);
    }, currentIntervalTime);
});