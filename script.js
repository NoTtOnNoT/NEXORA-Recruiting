/**
 * NEXORA PARTY - CORE JAVASCRIPT ENGINE (ALL-IN-ONE)
 * ใช้ร่วมกันได้ทั้งหน้าสมัครสมาชิก (Index) และหน้าแอดมิน (Admin)
 */

// เผื่อใช้เรียกซ้ำในหลายๆ ฟังก์ชัน
const snapContainer = document.querySelector('.snap-container');
let hasClosedPopupShown = false; // ตัวแปรล็อกสำหรับเปิดป๊อปอัพปิดรับสมัคร (ให้แสดงผลแค่ครั้งเดียว)

// ==========================================
// 1. ระบบควบคุมแอนิเมชันโลโก้ & ตรวจจับป๊อปอัพฟอร์มปิด (Scroll Snapping Setup)
// ==========================================
if (snapContainer) {
    snapContainer.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        const logo = document.getElementById('party-logo');
        const slogan = document.getElementById('party-slogan');
        const indicator = document.querySelector('.scroll-indicator');
        
        // 1.1 ควบคุมแอนิเมชันเปิด-ปิดเงาและเฟดส่วนหัวโลโก้หน้าแรก
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

        // 1.2 🚨 ตรวจจับการสโครลภายใน snap-container เพื่อเปิดป๊อปอัพแจ้งเตือนปิดรับสมัคร
        const registerSection = document.getElementById('register-section');
        const popupModal = document.getElementById('closed-popup-modal');

        if (registerSection && popupModal && !hasClosedPopupShown) {
            // คำนวณหาตำแหน่งพิกัดขอบบนของเซกชันเทียบกับมุมมองหน้าจอปัจจุบัน
            const sectionTopPosition = registerSection.getBoundingClientRect().top;
            const triggerWindowPoint = window.innerHeight / 1.3;

            // หากเลื่อนมาถึงจุดกระตุ้นที่ตั้งไว้ ให้สั่งเปิดหน้าต่างป๊อปอัพทันที
            if (sectionTopPosition < triggerWindowPoint) {
                popupModal.classList.add('active');
                hasClosedPopupShown = true; // ล็อกไว้ไม่ให้ระบบเด้งแจ้งเตือนซ้ำซากเวลาเลื่อนขึ้นลง
            }
        }
    });
}

/**
 * ❌ ฟังก์ชันสำหรับกดปุ่ม "รับทราบ" เพื่อปิดป๊อปอัพโมดอลลงไป
 * (ผูกเงื่อนไขทำงานร่วมกับอินไลน์ onclick="closePopup()" ในหน้า HTML)
 */
function closePopup() {
    const popupModal = document.getElementById('closed-popup-modal');
    if (popupModal) {
        popupModal.classList.remove('active');
    }
}

// ==========================================
// 2. ระบบส่งข้อมูลฟอร์ม (ปรับปรุงบล็อกการทำงานเนื่องจากปิดรับสมัครแล้ว)
// ==========================================
const sheetForm = document.getElementById('sheetdb-form');

if (sheetForm) {
    sheetForm.addEventListener('submit', function(e) {
        // บล็อกไม่ให้ฟอร์มรีเฟรชหน้าและหยุดการส่งข้อมูลเก่าไปฐานข้อมูลโดยเด็ดขาด
        e.preventDefault(); 
        return false;
    });
}

// ==========================================
// 3. ระบบดึงและแสดงผลข้อมูลแอดมิน (สำหรับหน้าแอดมิน)
// ==========================================
const adminAPI_URL = 'https://api.steinhq.com/v1/storages/6a114ab392b1163e97f9c787'; 
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
            // รองรับโครงสร้างข้อมูลที่อาจถูกหุ้มออบเจกต์มาจาก SheetDB
            localApplicantsData = Array.isArray(data) ? data : (data.data || []);
            
            if (totalCount) totalCount.innerText = localApplicantsData.length;
            if (loadingState) loadingState.style.display = 'none';

            displayApplicants(localApplicantsData);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            if (loadingState) {
                loadingState.innerHTML = `<p style="color: #f87171; font-weight: 500;">ERROR: ไม่สามารถเชื่อมต่อฐานข้อมูลส่วนกลางได้</p>`;
            }
        });
}

// ฟังก์ชันสำหรับสร้างการ์ดข้อมูลรายคนเวอร์ชันอัปเดตหัวข้อใหม่ (รวม Fallback ดักชื่อตัวแปร)
function displayApplicants(applicants) {
    const applicantsGrid = document.getElementById('applicants-grid');
    if (!applicantsGrid) return;

    applicantsGrid.innerHTML = ''; 

    if (applicants.length === 0) {
        applicantsGrid.innerHTML = `<p style="color: #64748b; text-align: center; grid-column: 1/-1; padding: 40px;">ไม่พบข้อมูลผู้สมัครที่ตรงเงื่อนไข</p>`;
        return;
    }

    // ลูปสร้างการ์ดรายคนตามโครงสร้างฟอร์มใหม่
    applicants.forEach(person => {
        const card = document.createElement('div');
        card.className = 'applicant-card';

        // รองรับทั้งคีย์ธรรมดา และคีย์ที่ถูกส่งผ่านเนมสเปซ data[คีย์] เพื่อความแม่นยำ 100%
        const name = person.name || person['data[name]'] || 'ไม่ระบุชื่อ';
        const grade = person.grade || person['data[grade]'] || '-';
        const gpa = person.gpa || person['data[gpa]'] || 'ไม่ได้ระบุ';
        const facebook = person.facebook || person['data[facebook]'] || '-';
        const instagram = person.instagram || person['data[instagram]'] || '-';
        const reason = person.reason || person['data[reason]'] || 'ไม่มีคำตอบ';

        card.innerHTML = `
            <div class="card-badge">MEMBER</div>
            <div class="card-info">
                <h3 class="name">${name}</h3>
                
                <div class="info-item">
                    <span class="label">ระดับชั้น / ห้องเรียน</span>
                    <span class="value">${grade}</span>
                </div>

                <div class="info-item">
                    <span class="label">เกรดเฉลี่ย (2/2568)</span>
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
        const searchText = e.target.value.toLowerCase();
        
        const filteredData = localApplicantsData.filter(person => {
            const name = (person.name || person['data[name]'] || '').toLowerCase();
            const grade = (person.grade || person['data[grade]'] || '').toLowerCase();
            return name.includes(searchText) || grade.includes(searchText);
        });

        displayApplicants(filteredData);
    });
}

// รันระบบดึงข้อมูลทันทีเมื่อโหลดหน้าเว็บสำเร็จ (ฟังก์ชันจะดักเองหากไม่ใช่หน้า Admin)
document.addEventListener('DOMContentLoaded', fetchApplicants);

// ระบบนับตัวอักษรกล่องเหตุผล (คงไว้เผื่อเปิดใช้งานอีกครั้งในอนาคต)
const reasonTextarea = document.getElementById('reason');
const charCount = document.getElementById('char-count');

if (reasonTextarea && charCount) {
    reasonTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.innerText = `${currentLength} / 300`;
        
        if (currentLength >= 250) {
            charCount.style.color = '#d4a359';
        } else {
            charCount.style.color = '#475569';
        }
    });
}