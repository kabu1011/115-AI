// ==========================================
// AI 校隊每日確認系統
// Version 1.0
// ==========================================

const API_URL =
"https://script.google.com/macros/s/AKfycbxPP-qxjl58Y8G4ozxpphw73z_8d2iM5oj4CgQ1WVPmWddg6O2yeiorxE_2ptZlDww/exec";

let students = [];

// ============================
// 初始化
// ============================

window.onload = function(){

    showToday();

    loadStudents();

    document
        .getElementById("searchInput")
        .addEventListener("keyup",searchStudent);

};

// ============================
// 日期
// ============================

function showToday(){

    const today=new Date();

    const text=
        today.getFullYear()+"-"+

        String(today.getMonth()+1).padStart(2,"0")+"-"+

        String(today.getDate()).padStart(2,"0");

    document.getElementById("today").innerHTML=text;

}

// ============================
// 取得學生
// ============================

async function loadStudents(){

    Swal.fire({

        title:"載入學生...",

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

    try{

        const res=await fetch(

            API_URL+"?action=getStudents"

        );

        students=await res.json();

        renderStudents(students);

        Swal.close();

        checkToday();

    }

    catch(err){

        console.log(err);

        Swal.fire(

            "錯誤",

            "無法讀取學生",

            "error"

        );

    }

}

// ============================
// 建立畫面
// ============================

function renderStudents(list){

    const container=

    document.getElementById("studentList");

    container.innerHTML="";

    list.forEach(student=>{

        const template=

        document

        .getElementById("studentTemplate")

        .content

        .cloneNode(true);

        const card=

        template.querySelector(".student-card");

        card.dataset.id=student.StudentID;

        card.dataset.name=student.Name;

        template.querySelector(".student-id").innerHTML=

        student.StudentID;

        template.querySelector(".student-name").innerHTML=

        student.Name;

        // radio name

        template

        .querySelectorAll(".status-radio")

        .forEach(r=>{

            r.name="status_"+student.StudentID;

        });

        template

        .querySelectorAll(".lunch-radio")

        .forEach(r=>{

            r.name="lunch_"+student.StudentID;

        });

        // 展開

        template

        .querySelector(".student-header")

        .onclick=()=>{

            card.classList.toggle("open");

        };

        // 全天請假

        template

        .querySelectorAll(".status-radio")

        .forEach(r=>{

            r.onchange=()=>{

                autoLunch(card);

            }

        });

        // 送出

        template

        .querySelector(".submit-btn")

        .onclick=()=>{

            submitStudent(card);

        };

        container.appendChild(template);

    });

}

// ============================
// 搜尋
// ============================

function searchStudent(){

    const keyword=

    document

    .getElementById("searchInput")

    .value

    .trim()

    .toLowerCase();

    if(keyword==""){

        renderStudents(students);

        checkToday();

        return;

    }

    const result=

    students.filter(s=>{

        return(

            s.StudentID

            .toLowerCase()

            .includes(keyword)

            ||

            s.Name

            .toLowerCase()

            .includes(keyword)

        );

    });

    renderStudents(result);

    checkToday();

}

// ============================
// 全天請假
// ============================

function autoLunch(card){

    const status=

    card.querySelector(

        "input[name^='status_']:checked"

    );

    if(!status) return;

    if(status.value=="全天請假"){

        card

        .querySelectorAll(

            "input[name^='lunch_']"

        )

        .forEach(r=>{

            if(r.value=="不需要"){

                r.checked=true;

            }

        });

    }

}
// ==========================================
// 送出資料
// ==========================================

async function submitStudent(card){

    const studentId = card.dataset.id;
    const name = card.dataset.name;

    // 狀態
    const status = card.querySelector(
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

    // 午餐
    const lunch = card.querySelector(
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

    Swal.fire({

        title:"送出中...",

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

    try{

        const url =
            API_URL+
            "?action=save"+
            "&date="+encodeURIComponent(date)+
            "&studentId="+encodeURIComponent(studentId)+
            "&name="+encodeURIComponent(name)+
            "&status="+encodeURIComponent(status.value)+
            "&lunch="+encodeURIComponent(lunch.value);

        const response = await fetch(url);

        const result = await response.json();

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

// ==========================================
// 完成
// ==========================================

function finishCard(card,status,lunch){

    card.classList.add("completed");

    card.classList.remove("open");

    const body =
        card.querySelector(".student-body");

    body.style.display="none";

    const old =
        card.querySelector(".done-info");

    if(old){

        old.remove();

    }

    const div=document.createElement("div");

    div.className="done-info";

    div.innerHTML=`
        <div style="font-size:18px;">
            ✅ 已完成今日確認
        </div>

        <hr>

        <b>${status}</b>

        <br>

        🍱 ${lunch}
    `;

    card.appendChild(div);

    card.querySelectorAll("input").forEach(i=>{

        i.disabled=true;

    });

    card.querySelector(".submit-btn").disabled=true;

    Swal.fire({

        icon:"success",

        title:"完成",

        text:"已送出"

    });

}

// ==========================================
// 今日已回報
// ==========================================

async function checkToday(){

    try{

        const response =
            await fetch(
                API_URL+"?action=today"
            );

        const list =
            await response.json();

        list.forEach(item=>{

            const card =
                document.querySelector(
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
// ==========================================
// Part 3
// 工具函式
// ==========================================

// 一次只展開一張卡片
document.addEventListener("click", function (e) {

    const header = e.target.closest(".student-header");

    if (!header) return;

    const currentCard = header.closest(".student-card");

    document.querySelectorAll(".student-card").forEach(card => {

        if (card !== currentCard) {
            card.classList.remove("open");
        }

    });

});

// Enter 搜尋
document
.getElementById("searchInput")
.addEventListener("keypress", function (e) {

    if (e.key === "Enter") {

        searchStudent();

    }

});

// 狀態切換
document.addEventListener("change", function(e){

    if(!e.target.classList.contains("status-radio")) return;

    const card = e.target.closest(".student-card");

    if(!card) return;

    const value = e.target.value;

    const lunchNeed =
        card.querySelector("input[value='需要']");

    const lunchNo =
        card.querySelector("input[value='不需要']");

    if(value=="全天請假"){

        lunchNo.checked=true;

    }else{

        if(!lunchNeed.checked && !lunchNo.checked){

            lunchNeed.checked=true;

        }

    }

});

// 完成後右上角打勾
function markComplete(card){

    const btn = card.querySelector(".toggle-btn");

    btn.innerHTML = `
        <i class="fa-solid fa-circle-check text-success"></i>
    `;

}

// 修改 finishCard
const oldFinish = finishCard;

finishCard = function(card,status,lunch){

    oldFinish(card,status,lunch);

    markComplete(card);

}

// Loading
function loading(text="載入中..."){

    Swal.fire({

        title:text,

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

}

// 關閉 Loading
function closeLoading(){

    Swal.close();

}

// Toast
function toast(icon,title){

    Swal.fire({

        toast:true,

        position:"top",

        timer:1800,

        showConfirmButton:false,

        icon:icon,

        title:title

    });

}

// 今天日期 yyyy-MM-dd
function getToday(){

    const d=new Date();

    return d.getFullYear()+"-"+
        String(d.getMonth()+1).padStart(2,"0")+"-"+
        String(d.getDate()).padStart(2,"0");

}

// 清空搜尋
function clearSearch(){

    document.getElementById("searchInput").value="";

    renderStudents(students);

    checkToday();

}

// 重新整理
function reloadStudents(){

    loadStudents();

}

// Console
console.log("AI 校隊每日確認系統 V1.0 啟動");
