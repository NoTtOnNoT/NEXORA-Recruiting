/**
 * NEXORA PARTY - CORE JAVASCRIPT ENGINE (STEINHQ ALL-IN-ONE VERSION)
 * ใช้ร่วมกันได้ทั้งหน้าสมัครสมาชิก (Index) และหน้าแอดมิน (Admin)
 */

// ==========================================
// 1. ระบบควบคุมแอนิเมชันโลโก้ (สำหรับหน้าแรก)
// ==========================================
const snapContainer = document.querySelector('.snap-container');

if (snapContainer) {
    snapContainer.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        const logo = document.getElementById('party-logo');
        const slogan = document.getElementById('party-slogan');
        const indicator = document.querySelector('.scroll-indicator');
        
        // ดึงค่าการสโครลจากกล่อง snapContainer แทน window
        if (snapContainer.scrollTop > 80) {
            if (navbar) navbar.classList.add('scrolled');
            if (logo) logo.classList.add('fade-and-shrink'); 
            if (slogan) slogan.classList.add('fade-out');
            if (indicator) indicator.classList.add('fade-out');
        } else {
            if (navbar) navbar.classList.remove('scrolled');
            if (logo) logo.classList.remove('fade-and-shrink'); 
            if (slogan) slogan.classList.remove('fade-out');
            if (indicator) indicator.classList.remove('fade-out');
        }
    });
}

// ==========================================
// 2. ระบบส่งข้อมูลไปยังฐานข้อมูล Stein (สำหรับฟอร์มสมัคร)
// ==========================================
const sheetForm = document.getElementById('sheetdb-form');

if (sheetForm) {
    sheetForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const form = e.target;
        const submitBtn = document.getElementById('submit-btn');
        const statusMsg = document.getElementById('status-message');

        if (submitBtn) {
            submitBtn.innerText = 'PROCESSING...';
            submitBtn.disabled = true;
        }

        // 🔄 แปลงข้อมูลจาก Form ให้กลายเป็น JSON Object เพื่อให้รองรับกับระบบของ SteinHQ
        const formData = new FormData(form);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value.trim();
        });

        // 🌐 URL สำหรับยิง POST บันทึกข้อมูล ชี้เป้าตรงเข้าสู่แท็บ "/ชีต1"
        const postAPI_URL = 'https://api.steinhq.com/v1/storages/6a114ab392b1163e97f9c787/ชีต1'; 

        fetch(postAPI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([formObject]) // Stein บังคับส่งข้อมูลหุ้มด้วย Array [ ] เสมอครับ
        })
        .then(response => {
            if (response.ok) {
                if (statusMsg) {
                    statusMsg.innerText = 'SUCCESS: บันทึกข้อมูลใบสมัครของคุณเรียบร้อยแล้ว';
                    statusMsg.className = 'status-box success';
                }
                form.reset(); 
                if (typeof charCount !== 'undefined' && charCount) {
                    charCount.innerText = '0 / 300';
                }
            } else {
                throw new Error('Submission failed');
            }
        })
        .catch(error => {
            if (statusMsg) {
                statusMsg.innerText = 'ERROR: ไม่สามารถส่งข้อมูลได้ กรุณาตรวจสอบระบบเครือข่าย';
                statusMsg.className = 'status-box error';
            }
            console.error('Error:', error);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.innerText = 'ส่งข้อมูลใบสมัคร';
                submitBtn.disabled = false;
            }
            if (statusMsg) statusMsg.classList.remove('hidden'); 
        });
    });
}

// ==========================================
// 3. ระบบดึงและแสดงผลข้อมูลแอดมิน (สำหรับหน้าแอดมิน)
// ==========================================
// 🟢 เปลี่ยนจาก SheetDB ลิงก์เก่า มาดึงตารางจาก Stein ผ่านแท็บ "/ชีต1" ภาษาไทยตัวเดียวกัน
const adminAPI_URL = 'https://api.steinhq.com/v1/storages/6a114ab392b1163e97f9c787/ชีต1'; 
let localApplicantsData = []; // เก็บข้อมูลไว้สำหรับการค้นหาเรียลไทม์

// ฟังก์ชันหลักในการดึงข้อมูล (จะทำงานเฉพาะเมื่อเป็นหน้า Admin)
function fetchApplicants() {
    const loadingState = document.getElementById('loading-state');
    const totalCount = document.getElementById('total-applicants');
    const applicantsGrid = document.getElementById('applicants-grid');

    // ตรวจสอบว่าหน้านี้มีบอร์ดแอดมินหรือไม่ ถ้าไม่มีให้หยุดฟังก์ชันทันที
    if (!applicantsGrid) return; 

    fetch(adminAPI_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            let rawData = Array.isArray(data) ? data : [];
            
            // ✂️ กรองข้อมูลแถวเปล่าที่ไม่มีรายชื่อออก เพื่อป้องกันกล่องข้อมูลขยะแสดงผลบนบอร์ด
            let validApplicants = rawData.filter(person => {
                const name = person.name || '';
                return name.trim() !== '' && name.toLowerCase() !== 'name';
            });

            // 🔄 จัดเรียงข้อมูลผู้สมัครตามระดับห้องเรียน (grade) จากน้อยไปมาก
            localApplicantsData = validApplicants.sort((a, b) => {
                const gradeA = (a.grade || '').toString();
                const gradeB = (b.grade || '').toString();
                return gradeA.localeCompare(gradeB, 'th', { numeric: true, sensitivity: 'base' });
            });
            
            if (totalCount) totalCount.innerText = localApplicantsData.length;
            if (loadingState) loadingState.style.display = 'none';

            displayApplicants(localApplicantsData);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            if (loadingState) {
                loadingState.innerHTML = `<p style="color: #f87171; font-weight: 500;">ERROR: ไม่สามารถเชื่อมต่อฐานข้อมูลส่วนกลางผ่าน STEIN API ได้</p>`;
            }
        });
}

// ฟังก์ชันสำหรับสร้างการ์ดข้อมูลรายคนตามหัวตารางจริงในคอลัมน์ภาษาอังกฤษพิมพ์เล็ก
function displayApplicants(applicants) {
    const applicantsGrid = document.getElementById('applicants-grid');
    if (!applicantsGrid) return;

    applicantsGrid.innerHTML = ''; 

    if (applicants.length === 0) {
        applicantsGrid.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 40px;">ไม่พบข้อมูลผู้สมัครที่ตรงเงื่อนไข</p>`;
        return;
    }

    // ลูปสร้างการ์ดรายคน ดึงค่าตามหัวตารางพิมพ์เล็กแถวแรกเป๊ะๆ
    applicants.forEach(person => {
        const card = document.createElement('div');
        card.className = 'applicant-card';

        const name = person.name || 'ไม่ระบุชื่อ';
        const grade = person.grade || '-';
        const gpa = person.gpa || 'ไม่ได้ระบุ';
        const facebook = person.facebook || '-';
        const instagram = person.instagram || '-';
        const reason = person.reason || 'ไม่มีคำตอบ';

        card.innerHTML = `
            <div class="card-badge">MEMBER</div>
            <div class="card-info">
                <h3 class="name">${name}</h3>
                
                <div class="info-item">
                    <span class="label">ระดับชั้น / ห้องเรียน</span>
                    <span class="value">ห้อง ${grade}</span>
                </div>

                <div class="info-item">
                    <span class="label">เกรดเฉลี่ยสะสม</span>
                    <span class="value" style="color: #3b82f6; font-weight: 600;">${gpa}</span>
                </div>
                
                <div class="info-item">
                    <span class="label">Facebook</span>
                    <span class="value social">${facebook}</span>
                </div>
                
                <div class="info-item">
                    <span class="label">Instagram</span>
                    <span class="value social">${instagram}</span>
                </div>

                <div class="info-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <span class="label" style="color: #d4a359;">เหตุผลที่อยากเข้าพรรค:</span>
                    <p class="value" style="font-size: 0.85rem; line-height: 1.5; color: #94a3b8; white-space: pre-line;">
                        "${reason}"
                    </p>
                </div>
            </div>
        `;
        applicantsGrid.appendChild(card);
    });
}

// ระบบค้นหาข้อมูลเรียลไทม์ (Real-time Search Filter สำหรับหน้า Admin)
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchText = e.target.value.toLowerCase().trim();
        
        const filteredData = localApplicantsData.filter(person => {
            const name = (person.name || '').toLowerCase();
            const grade = (person.grade || '').toLowerCase();
            return name.includes(searchText) || grade.includes(searchText);
        });

        displayApplicants(filteredData);
    });
}

// รันระบบดึงข้อมูลทันทีเมื่อโหลดหน้าเว็บสำเร็จ (ฟังก์ชันจะดักเองหากไม่ใช่หน้า Admin)
document.addEventListener('DOMContentLoaded', fetchApplicants);

// ==========================================
// 4. ระบบจำกัดและนับจำนวนตัวอักษรกล่องเหตุผล
// ==========================================
const reasonTextarea = document.getElementById('reason');
const charCount = document.getElementById('char-count');

if (reasonTextarea && charCount) {
    reasonTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.innerText = `${currentLength} / 300`;
        
        // ถ้าพิมพ์ใกล้เต็ม (เกิน 250 ตัว) ให้เปลี่ยนตัวนับเป็นสีทองไฮไลต์ตามดีไซน์พรรค
        if (currentLength >= 250) {
            charCount.style.color = '#d4a359';
        } else {
            charCount.style.color = '#475569';
        }
    });
}
