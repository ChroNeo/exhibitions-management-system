import './App.css'

function App() {
  const x = 29;
  console.log(x);
  return (
    <>
      <h3>
        App.tsx เป็น ที่เริ่มต้นของทุกๆอย่าง
      </h3>
      <section>
        โดย index.css คือ css ของทั้งโปรเจคจะ set พวก default ต่างๆให้มาที่ index.css
      </section>
      <br/>
      <section>
        ส่วน css ของแต่ละหน้าจะใช้ ชื่อเดียวกันกับชื่อไฟล์เป็นหลักเช่น App.css เป็นต้น
      </section>
    </>
  )
}

export default App
