// 🚨 [SECURITY] ระบบตรวจสอบสิทธิ์ความปลอดภัยขั้นแรก (ตรวจสอบก่อนเริ่มทำอะไรทั้งสิ้น)
if (sessionStorage.getItem('admin_logged_in') !== 'true') {
    // 1. ล้างข้อมูลหน้าจอออกทันทีเพื่อไม่ให้เหลือข้อมูลเก่าตกค้าง
    document.body.innerHTML = `
        <div style="background: #030712; color: #f87171; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: 'Kanit', sans-serif;">
            <h2 style="margin-bottom: 10px;">🔒 ตรวจพบการเข้าถึงโดยไม่ได้รับอนุญาต</h2>
            <p style="color: #64748b;">กำลังนำคุณกลับไปหน้าเข้าสู่ระบบ...</p>
        </div>
    `;
    // 2. ดีดผู้ใช้งานกลับไปที่หน้า login.html ทันที
    window.location.href = 'login.html';
}

// -------------------------------------------------------------------------
// 🌐 ส่วนควบคุม Dashboard (จะทำงานเมื่อยืนยันรหัสผ่านจากหน้า login.html ผ่านแล้วเท่านั้น)
// -------------------------------------------------------------------------

// ดึงข้อมูลเชื่อมต่อกับ API เดียวกับหน้าสมัคร
const sheetAPI_URL = 'https://sheetdb.io/api/v1/vjht2bq2sau8i'; 

let localApplicantsData = []; // ตัวแปรสำหรับเก็บข้อมูลไว้ค้นหาแบบออฟไลน์ไม่ต้องยิง API ซ้ำ

// ฟังก์ชันหลักในการดึงข้อมูลจาก Google Sheets ผ่าน SheetDB
function fetchApplicants() {
    const loadingState = document.getElementById('loading-state');
    const applicantsGrid = document.getElementById('applicants-grid');
    const totalCount = document.getElementById('total-applicants');

    fetch(sheetAPI_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // บันทึกข้อมูลลงตัวแปรหลัก (ตรวจเช็กโครงสร้าง Array ซัพพอร์ต SheetDB)
            localApplicantsData = Array.isArray(data) ? data : (data.data || []);
            
            // แสดงจำนวนคนทั้งหมด
            if (totalCount) totalCount.innerText = localApplicantsData.length;

            // ซ่อนตัวโหลดข้อมูล
            if (loadingState) loadingState.style.display = 'none';

            // ส่งข้อมูลไปสร้างเป็นการ์ดรายคน
            displayApplicants(localApplicantsData);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            if (loadingState) {
                loadingState.innerHTML = `<p style="color: #f87171; font-weight: 500;">เกิดข้อผิดพลาดในการโหลดข้อมูลจาก NEXORA DATABASE</p>`;
            }
        });
}

// ฟังก์ชันสำหรับสร้างกล่องข้อมูล (Card) รายคนเวอร์ชันดึงค่าแม่นยำสูง
function displayApplicants(applicants) {
    const applicantsGrid = document.getElementById('applicants-grid');
    if (!applicantsGrid) return;

    applicantsGrid.innerHTML = ''; 

    if (applicants.length === 0) {
        applicantsGrid.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 40px;">ไม่พบข้อมูลผู้สมัครที่ตรงเงื่อนไข</p>`;
        return;
    }

    // ลูปสร้างการ์ดรายคนเพื่อดึงข้อมูลทั้งหมดมาโชว์ที่หน้า Admin
    applicants.forEach(person => {
        const card = document.createElement('div');
        card.className = 'applicant-card';

        /* 🔒 จุดแก้ไขสำคัญ: แกะรหัสคีย์คู่ขนาน 
           เนื่องจาก FormData ส่งค่าไปเป็นเนมสเปซ 'data[ชื่อคีย์]' 
           เราจึงต้องดักจับทั้งแบบธรรมดาและแบบเนมสเปซ เพื่อไม่ให้ค่าหลุดเป็นว่างเปล่า
        */
        const name = person['data[name]'] || person.name || 'ไม่ระบุชื่อ';
        const grade = person['data[grade]'] || person.grade || '-';
        const gpa = person['data[gpa]'] || person.gpa || 'ไม่ได้ระบุ';
        const facebook = person['data[facebook]'] || person.facebook || '-';
        const instagram = person['data[instagram]'] || person.instagram || '-';
        const reason = person['data[reason]'] || person.reason || 'ไม่มีคำตอบ';

        // วาดสไตล์การ์ดแสดงผลข้อมูลแบบครบทุกช่องกรอก
        card.innerHTML = `
            <div class="card-badge">MEMBER</div>
            <div class="card-info">
                <h3 class="name" style="color: #ffffff; font-size: 1.5rem; margin-bottom: 15px; font-weight: 600;">${name}</h3>
                
                <div class="info-item" style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span class="label" style="color: #64748b;">ระดับชั้น / ห้องเรียน:</span>
                    <span class="value" style="color: #ffffff; font-weight: 500;">${grade}</span>
                </div>

                <div class="info-item" style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span class="label" style="color: #64748b;">เกรดเฉลี่ย (2/2568):</span>
                    <span class="value" style="color: #3b82f6; font-weight: 600;">${gpa}</span>
                </div>
                
                <div class="info-item" style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span class="label" style="color: #64748b;"><i class="fa-brands fa-facebook"></i> Facebook:</span>
                    <span class="value social" style="color: #94a3b8;">${facebook}</span>
                </div>
                
                <div class="info-item" style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span class="label" style="color: #64748b;"><i class="fa-brands fa-instagram"></i> Instagram:</span>
                    <span class="value social" style="color: #94a3b8;">${instagram}</span>
                </div>

                <div class="info-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <span class="label" style="color: #d4a359; display: block; margin-bottom: 5px; font-weight: 500;">เหตุผลที่อยากเข้าพรรค:</span>
                    <p class="value" style="font-size: 0.9rem; line-height: 1.5; color: #94a3b8; white-space: pre-line; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 6px; border-left: 2px solid #d4a359;">
                        "${reason}"
                    </p>
                </div>
            </div>
        `;
        applicantsGrid.appendChild(card);
    });
}

// ระบบค้นหาข้อมูลอัจฉริยะ (Real-time Multi-Search Filter)
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchText = e.target.value.toLowerCase().trim();
        
        const filteredData = localApplicantsData.filter(person => {
            // รวมรวมจุดดึงค่ามาทำตัวพิมพ์เล็กเพื่อเทียบคำค้นหา
            const name = (person['data[name]'] || person.name || '').toLowerCase();
            const grade = (person['data[grade]'] || person.grade || '').toLowerCase();
            const gpa = (person['data[gpa]'] || person.gpa || '').toLowerCase();
            
            // คืนค่าจริงหากคำค้นหาไปตรงกับ ชื่อ, ห้องเรียน หรือเกรดเฉลี่ย
            return name.includes(searchText) || 
                   grade.includes(searchText) || 
                   gpa.includes(searchText);
        });

        displayApplicants(filteredData);
    });
}

// สั่งให้ระบบทำงานทันทีเมื่อเปิดหน้าจอ
document.addEventListener('DOMContentLoaded', fetchApplicants);