document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const inputUser = document.getElementById('username').value.trim();
    const inputPass = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-msg');
    const loginBtn = document.querySelector('.btn-login');

    // 🌐 นำ API URL ของ SheetDB ชุดที่ใช้เก็บรหัสผ่าน มาวางที่นี่
    const passwordAPI_URL = 'https://sheetdb.io/api/v1/vjht2bq2sau8i'; 

    // เปลี่ยนข้อความบนปุ่มระหว่างรอตรวจสอบข้อมูล
    loginBtn.innerText = "กำลังตรวจสอบสิทธิ์...";
    loginBtn.disabled = true;

    // ยิง API ไปดึงข้อมูลล็อกอินจาก Google Sheets
    fetch(passwordAPI_URL)
        .then(response => response.json())
        .then(data => {
            /* ค้นหาในตารางว่ามีแถวไหนที่มี username และ password 
               ตรงกับที่ผู้ใช้กรอกเข้ามาหน้าเว็บหรือไม่
            */
            const accountFound = data.find(account => {
                return account.username === inputUser && account.password === inputPass;
            });

            if (accountFound) {
                // หากข้อมูลถูกต้อง บันทึกสถานะชั่วคราวแล้วเข้าสู่หน้าแอดมิน
                sessionStorage.setItem('admin_logged_in', 'true');
                window.location.href = 'admin.html';
            } else {
                // หากรหัสผิดพลาด
                errorMsg.style.display = 'block';
                errorMsg.innerText = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
                document.getElementById('password').value = ''; 
                resetButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMsg.style.display = 'block';
            errorMsg.innerText = '❌ เกิดข้อผิดพลาดทางเทคนิค ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
            resetButton();
        });

    function resetButton() {
        loginBtn.innerText = "เข้าสู่ระบบควบคุม";
        loginBtn.disabled = false;
    }
});