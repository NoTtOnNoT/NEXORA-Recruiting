// --- 1. ควบคุมแอนิเมชันโลโก้ ย่อ-ขยาย ผ่าน Container เลื่อนหน้าจอ ---
const snapContainer = document.querySelector('.snap-container');

snapContainer.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    const logo = document.getElementById('party-logo');
    const slogan = document.getElementById('party-slogan');
    const indicator = document.querySelector('.scroll-indicator');
    
    // ดึงค่าการสโครลจากกล่อง snapContainer แทน window
    if (snapContainer.scrollTop > 80) {
        navbar.classList.add('scrolled');
        if(logo) logo.classList.add('fade-and-shrink'); 
        if(slogan) slogan.classList.add('fade-out');
        if(indicator) indicator.classList.add('fade-out');
    } else {
        navbar.classList.remove('scrolled');
        if(logo) logo.classList.remove('fade-and-shrink'); 
        if(slogan) slogan.classList.remove('fade-out');
        if(indicator) indicator.classList.remove('fade-out');
    }
});


// --- 2. ระบบส่งข้อมูลไปยังฐานข้อมูล Google Sheet ---
document.getElementById('sheetdb-form').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    const statusMsg = document.getElementById('status-message');

    submitBtn.innerText = 'PROCESSING...';
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const sheetAPI_URL = 'https://sheetdb.io/api/v1/vjht2bq2sau8i'; 

    fetch(sheetAPI_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(response.ok) {
            statusMsg.innerText = 'SUCCESS: บันทึกข้อมูลใบสมัครของคุณเรียบร้อยแล้ว';
            statusMsg.className = 'status-box success';
            form.reset(); 
        } else {
            throw new Error('Submission failed');
        }
    })
    .catch(error => {
        statusMsg.innerText = 'ERROR: ไม่สามารถส่งข้อมูลได้ กรุณาตรวจสอบระบบเครือข่าย';
        statusMsg.className = 'status-box error';
        console.error('Error:', error);
    })
    .finally(() => {
        submitBtn.innerText = 'ส่งข้อมูลใบสมัคร';
        submitBtn.disabled = false;
        statusMsg.classList.remove('hidden'); 
    });
});