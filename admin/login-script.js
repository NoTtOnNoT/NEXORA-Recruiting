document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const inputUser = document.getElementById('username').value.trim();
    const inputPass = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-msg');
    const loginBtn = document.querySelector('.btn-login');

    // 🌐 เปลี่ยนมาใช้ URL API ของ SteinHQ ชี้ตรงไปที่แท็บ "ชีต1" (ภาษาไทย) ตามหน้าตารางจริง
    const passwordAPI_URL = 'https://api.steinhq.com/v1/storages/6a114ab392b1163e97f9c787/ชีต1'; 

    // เปลี่ยนข้อความบนปุ่มระหว่างรอตรวจสอบข้อมูล
    loginBtn.innerText = "กำลังตรวจสอบสิทธิ์...";
    loginBtn.disabled = true;
    if (errorMsg) errorMsg.style.display = 'none'; // ซ่อน Error เก่าก่อนเริ่มตรวจสอบใหม่

    // ยิง API ไปดึงข้อมูลสิทธิ์ล็อกอินจาก SteinHQ
    fetch(passwordAPI_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            let rawData = Array.isArray(data) ? data : [];

            /* 🔍 ค้นหาในตารางว่ามีแถวไหนที่มี username และ password 
               ตรงกับที่ผู้ใช้กรอกเข้ามาหน้าเว็บหรือไม่ (จับคู่ตามหัวคอลัมน์พิมพ์เล็กในชีตของคุณ)
            */
            const accountFound = rawData.find(account => {
                const sheetUser = (account.username || '').toString().trim();
                const sheetPass = (account.password || '').toString().trim();
                return sheetUser === inputUser && sheetPass === inputPass;
            });

            if (accountFound) {
                // 💡 [PERSISTENT MULTI-ADMIN] บันทึกสถานะล็อกอินค้างไว้ถาวร
                localStorage.setItem('admin_logged_in', 'true');
                
                /* 🔄 ปรับเปลี่ยนการดึงชื่อแอดมินให้ตรงคอลัมน์ "realname" ใน Google Sheets ของคุณ
                   (หากไม่มีฟีลด์ realname ระบบจะถอยกลับไปใช้ username ที่กรอกเข้ามาแทนเพื่อความปลอดภัย)
                */
                const adminName = accountFound.realname || accountFound.username;
                localStorage.setItem('admin_name', adminName);
                
                // ดีดเข้าสู่หน้าควบคุม Dashboard ของแอดมินทันที
                window.location.href = 'admin.html';
            } else {
                // หากรหัสผิดพลาดหรือไม่พบบัญชีในระบบ
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
                }
                document.getElementById('password').value = ''; 
                resetButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerText = '❌ เกิดข้อผิดพลาดทางเทคนิค ไม่สามารถเชื่อมต่อฐานข้อมูลระบบ Stein ได้';
            }
            resetButton();
        });

    function resetButton() {
        loginBtn.innerText = "เข้าสู่ระบบควบคุม";
        loginBtn.disabled = false;
    }
});