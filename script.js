// ===============================
// AI 校隊每日確認
// script.js
// ===============================

// 修改成你的 Apps Script Web App
const API_URL = "https://script.google.com/macros/s/AKfycbxPP-qxjl58Y8G4ozxpphw73z_8d2iM5oj4CgQ1WVPmWddg6O2yeiorxE_2ptZlDww/exec";

// 學生資料
let students = [];

// ===============================
// 今天日期
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    showToday();

    loadStudents();

    document
        .getElementById("searchInput")
        .addEventListener("input", searchStudent);

});

// ===============================
// 顯示日期
// ===============================

function showToday(){

    const today = new Date();

    const txt =
        today.getFullYear()+" / "+
        String(today.getMonth()+1).padStart(2,"0")+" / "+
        String(today.getDate()).padStart(2,"0");

    document.getElementById("today").innerHTML=txt;

}

// ===============================
// 載入學生
// ===============================

async function loadStudents(){

    try{

        const res = await fetch(API_URL+"?action=getStudents");

        students = await res.json();

        renderStudents(students);

    }catch(e){

        console.log(e);

        Swal.fire(
            "錯誤",
            "無法取得學生資料",
            "error"
        );

    }

}

// ===============================
// 建立卡片
// ===============================

function renderStudents(list){

    const container =
    document.getElementById("studentList");

    container.innerHTML="";

    list.forEach(student=>{

        const template =
        document
        .getElementById("studentTemplate")
        .content
        .cloneNode(true);

        const card =
        template.querySelector(".student-card");

        card.dataset.id=student.StudentID;

        card.dataset.name=student.Name;

        template.querySelector(".student-id").innerHTML=
        student.StudentID;

        template.querySelector(".student-name").innerHTML=
        student.Name;

        // 展開按鈕

        template
        .querySelector(".student-header")
        .addEventListener("click",()=>{

            card.classList.toggle("open");

        });

        // Radio 名稱

        const statusRadio =
        template.querySelectorAll(".status-radio");

        statusRadio.forEach(r=>{

            r.name="status_"+student.StudentID;

        });

        const lunchRadio =
        template.querySelectorAll(".lunch-radio");

        lunchRadio.forEach(r=>{

            r.name="lunch_"+student.StudentID;

        });

        // 全天請假

        statusRadio.forEach(r=>{

            r.addEventListener("change",()=>{

                autoLunch(card);

            });

        });

        // 送出

        template
        .querySelector(".submit-btn")
        .addEventListener("click",()=>{

            submitStudent(card);

        });

        container.appendChild(template);

    });

}

// ===============================
// 搜尋
// ===============================

function searchStudent(){

    const keyword =
    document
    .getElementById("searchInput")
    .value
    .trim();

    if(keyword==""){

        renderStudents(students);

        return;

    }

    const result =
    students.filter(s=>{

        return s.StudentID.includes(keyword)
        ||
        s.Name.includes(keyword);

    });

    renderStudents(result);

}

// ===============================
// 全天請假
// 自動午餐
// ===============================

function autoLunch(card){

    const status =
    card.querySelector(
        "input[name^='status_']:checked"
    );

    if(!status) return;

    if(status.value=="全天請假"){

        const radios =
        card.querySelectorAll(
            "input[name^='lunch_']"
        );

        radios.forEach(r=>{

            if(r.value=="不需要"){

                r.checked=true;

            }

        });

    }

}
// ===============================
// 送出資料
// ===============================

async function submitStudent(card){

    const studentId = card.dataset.id;
    const name = card.dataset.name;

    // 取得狀態
    const status =
        card.querySelector(
            "input[name^='status_']:checked"
        );

    if(!status){

        Swal.fire(
            "提醒",
            "請選擇今日狀態",
            "warning"
        );

        return;
    }

    // 取得午餐
    const lunch =
        card.querySelector(
            "input[name^='lunch_']:checked"
        );

    if(!lunch){

        Swal.fire(
            "提醒",
            "請選擇是否需要午餐",
            "warning"
        );

        return;
    }

    const today = new Date();

    const date =
        today.getFullYear()+"-"+
        String(today.getMonth()+1).padStart(2,"0")+"-"+
        String(today.getDate()).padStart(2,"0");

    const data={

        action:"save",

        studentId:studentId,

        name:name,

        date:date,

        status:status.value,

        lunch:lunch.value

    };

    try{

        Swal.fire({

            title:"送出中...",

            allowOutsideClick:false,

            didOpen:()=>{

                Swal.showLoading();

            }

        });

        const res = await fetch(API_URL,{

            method:"POST",

            body:JSON.stringify(data)

        });

        const result = await res.json();

        Swal.close();

        if(result.success){

            finishCard(card,status.value,lunch.value);

        }else{

            Swal.fire(
                "錯誤",
                result.message,
                "error"
            );

        }

    }catch(err){

        console.log(err);

        Swal.fire(
            "錯誤",
            "無法連線 Apps Script",
            "error"
        );

    }

}

// ===============================
// 完成
// ===============================

function finishCard(card,status,lunch){

    card.classList.add("completed");

    card.classList.remove("open");

    const body =
        card.querySelector(".student-body");

    body.style.display="none";

    if(card.querySelector(".done-info")){

        card.querySelector(".done-info").remove();

    }

    const div=document.createElement("div");

    div.className="done-info";

    div.innerHTML=`

        ✅ 已完成今日確認

        <br><br>

        ${status}

        <br>

        🍱 ${lunch}

    `;

    card.appendChild(div);

    Swal.fire({

        icon:"success",

        title:"完成",

        text:"已送出"

    });

}

// ===============================
// 今天是否已經送過
// ===============================

async function checkToday(){

    try{

        const res=await fetch(
            API_URL+"?action=today"
        );

        const result=await res.json();

        result.forEach(item=>{

            const card=document.querySelector(

                ".student-card[data-id='"+item.StudentID+"']"

            );

            if(card){

                finishCard(

                    card,

                    item.Status,

                    item.Lunch

                );

            }

        });

    }catch(e){

        console.log(e);

    }

}

// ===============================
// DOM 完成後
// ===============================

window.addEventListener("load",()=>{

    setTimeout(()=>{

        checkToday();

    },800);

});
