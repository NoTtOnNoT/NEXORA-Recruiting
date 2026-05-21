// ดึงข้อมูลเชื่อมต่อกับ API เดียวกับหน้าสมัคร
const sheetAPI_URL = 'https://sheetdb.io/api/v1/vjht2bq2sau8i'; 

let localApplicantsData = []; // ตัวแปรสำหรับเก็บข้อมูลไว้ค้นหาแบบออฟไลน์ไม่ต้องยิง API ซ้ำ

// ฟังก์ชันหลักในการดึงข้อมูลจาก Google Sheets ผ่าน SheetDB
function fetchApplicants() {
    const loadingState = document.getElementById('loading-state');
    const applicantsGrid = document.getElementById('applicants-grid');
    const totalCount = document.getElementById('total-applicants');

    fetch(sheetAPI_URL)
        .then(response => response.json())
        .then(data => {
            // บันทึกข้อมูลลงตัวแปรหลัก
            localApplicantsData = data;
            
            // แสดงจำนวนคนทั้งหมด
            totalCount.innerText = data.length;

            // ซ่อนตัวโหลดข้อมูล
            loadingState.style.display = 'none';

            // ส่งข้อมูลไปสร้างเป็นการ์ดรายคน
            displayApplicants(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            loadingState.innerHTML = `<p style="color: #f87171;">เกิดข้อผิดพลาดในการโหลดข้อมูลภายนอก</p>`;
        });
}

// ฟังก์ชันสำหรับสร้างกล่องข้อมูล (Card) รายคน
function displayApplicants(applicants) {
    const applicantsGrid = document.getElementById('applicants-grid');
    applicantsGrid.innerHTML = ''; // เคลียร์หน้ากระดานก่อนสร้างใหม่

    if (applicants.length === 0) {
        applicantsGrid.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1;">ไม่พบข้อมูลผู้สมัครที่ตรงเงื่อนไข</p>`;
        return;
    }

    // ลูปสร้างการ์ดรายคนตามชื่อคอลัมน์ใน Google Sheets ของคุณ (name, grade, facebook, instagram)
    applicants.forEach(person => {
        const card = document.createElement('div');
        card.className = 'applicant-card';

        card.innerHTML = `
            <div class="card-badge">MEMBER</div>
            <div class="card-info">
                <h3 class="name">${person.name || 'ไม่ระบุชื่อ'}</h3>
                
                <div class="info-item">
                    <span class="label">ระดับชั้น / ห้องเรียน</span>
                    <span class="value">${person.grade || '-'}</span>
                </div>
                
                <div class="info-item">
                    <span class="label">Facebook</span>
                    <span class="value social">${person.facebook || '-'}</span>
                </div>
                
                <div class="info-item">
                    <span class="label">Instagram</span>
                    <span class="value social">${person.instagram || '-'}</span>
                </div>
            </div>
        `;
        applicantsGrid.appendChild(card);
    });
}

// ระบบค้นหาข้อมูล (Real-time Search Filter)
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    
    // กรองข้อมูลจากตัวแปร local ให้เฉพาะคำที่ตรงกับชื่อหรือห้องเรียน
    const filteredData = localApplicantsData.filter(person => {
        const nameMatch = person.name ? person.name.toLowerCase().includes(searchText) : false;
        const gradeMatch = person.grade ? person.grade.toLowerCase().includes(searchText) : false;
        return nameMatch || gradeMatch;
    });

    displayApplicants(filteredData);
});

// สั่งให้ระบบทำงานทันทีเมื่อเปิดหน้าจอ
document.addEventListener('DOMContentLoaded', fetchApplicants);