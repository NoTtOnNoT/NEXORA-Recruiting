document.getElementById('sheetdb-form').addEventListener('submit', function(e) {
    e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช

    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    const statusMsg = document.getElementById('status-message');

    // 1. เปลี่ยนข้อความปุ่มระหว่างส่งข้อมูล
    submitBtn.innerText = 'กำลังส่งใบสมัคร...';
    submitBtn.disabled = true;

    // 2. ดึงข้อมูลจากฟอร์ม
    const formData = new FormData(form);

    /* [สำคัญ] นำ URL ของ API Google Sheet ของคุณมาวางแทนที่ตรงนี้ 
       เช่น เปลี่ยนจาก 'YOUR_API_URL_HERE' เป็นลิงก์ที่ได้จาก SheetDB หรือ Google Apps Script
    */
    const sheetAPI_URL = 'https://sheetdb.io/api/v1/vjht2bq2sau8i'; 

    // 3. ยิงข้อมูลไปที่ Google Sheet
    fetch(sheetAPI_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(response.ok) {
            // แสดงข้อความสำเร็จ
            statusMsg.innerText = '🎉 ส่งใบสมัครสำเร็จ! ยินดีต้อนรับสู่พรรค NEXORA';
            statusMsg.className = 'status-msg success';
            form.reset(); // เคลียร์ข้อมูลในฟอร์ม
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .catch(error => {
        // แสดงข้อความเมื่อเกิดข้อผิดพลาด
        statusMsg.innerText = '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการตั้งค่า API';
        statusMsg.className = 'status-msg error';
        console.error('Error:', error);
    })
    .finally(() => {
        // เปลี่ยนปุ่มกลับมาเป็นเหมือนเดิม
        submitBtn.innerText = 'ส่งใบสมัคร';
        submitBtn.disabled = false;
    });
});