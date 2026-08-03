// =======================================
// AI 校隊每日確認 V2
// Part 1
// =======================================

const API_URL = "https://script.google.com/macros/s/AKfycbxPP-qxjl58Y8G4ozxpphw73z_8d2iM5oj4CgQ1WVPmWddg6O2yeiorxE_2ptZlDww/exec";

let students = [];
let todayStatus = {};

//======================================
// 初始化
//======================================

document.addEventListener("DOMContentLoaded", () => {

    showToday();

    loadStudents();

    document
        .getElementById("searchInput")
        .addEventListener("input", searchStudent);

});

//======================================
// 顯示日期
//======================================

function showToday() {

    const d = new Date();

    document.getElementById("today").textContent =
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

}

//======================================
// 載入學生
//======================================

async function loadStudents() {

    try {

        const res = await fetch(API_URL + "?action=getStudents");

        students = await res.json();

        await loadTodayStatus();

        renderCards(students);

    } catch (err) {

        console.error(err);

        Swal.fire(
            "錯誤",
            "無法取得學生資料",
            "error"
        );

    }

}

//======================================
// 今日已確認
//======================================

async function loadTodayStatus() {

    try {

        const res = await fetch(API_URL + "?action=today");

        const list = await res.json();

        todayStatus = {};

        list.forEach(item => {

            todayStatus[item.StudentID] = item;

        });

    } catch (e) {

        console.log(e);

    }

}

//======================================
// 建立卡片
//======================================

function renderCards(data) {

    const container =
        document.getElementById("studentList");

    container.innerHTML = "";

    data.forEach(student => {

        const template =
            document
            .getElementById("studentTemplate")
            .content
            .cloneNode(true);

        const card =
            template.querySelector(".student-card");

        card.dataset.id = student.StudentID;
        card.dataset.name = student.Name;

        template.querySelector(".student-id").textContent =
            student.StudentID;

        template.querySelector(".student-name").textContent =
            student.Name;

        if (todayStatus[student.StudentID]) {

            updateCard(
                card,
                todayStatus[student.StudentID]
            );

        }

        card.onclick = () => {

            openDialog(card);

        };

        container.appendChild(template);

    });

}

//======================================
// 搜尋
//======================================

function searchStudent() {

    const keyword =
        document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    if (keyword === "") {

        renderCards(students);

        return;

    }

    const result = students.filter(s => {

        return (

            s.StudentID
            .toLowerCase()
            .includes(keyword)

            ||

            s.Name
            .toLowerCase()
            .includes(keyword)

        );

    });

    renderCards(result);

}
//======================================
// 開啟確認視窗
//======================================

async function openDialog(card){

    const studentId = card.dataset.id;
    const name = card.dataset.name;

    const old = todayStatus[studentId];

    const statusDefault = old ? old.Status : "參加";
    const lunchDefault = old ? old.Lunch : "需要";

    const { value } = await Swal.fire({

        title: `
            <div style="font-size:36px;font-weight:bold;">
                ${studentId}
            </div>
            <div style="font-size:30px;">
                ${name}
            </div>
        `,

        width: 600,

        html: `

<div style="text-align:left;font-size:24px;line-height:2;">

<h3>📌 今日狀態</h3>

<label>
<input type="radio" name="status" value="參加"
${statusDefault=="參加"?"checked":""}>
🟢 參加
</label><br>

<label>
<input type="radio" name="status" value="上午請假"
${statusDefault=="上午請假"?"checked":""}>
🟡 上午請假
</label><br>

<label>
<input type="radio" name="status" value="下午請假"
${statusDefault=="下午請假"?"checked":""}>
🟠 下午請假
</label><br>

<label>
<input type="radio" name="status" value="全天請假"
${statusDefault=="全天請假"?"checked":""}>
🔴 全天請假
</label>

<hr>

<h3>🍱 午餐</h3>

<label>
<input type="radio" name="lunch" value="需要"
${lunchDefault=="需要"?"checked":""}>
🍱 需要
</label><br>

<label>
<input type="radio" name="lunch" value="不需要"
${lunchDefault=="不需要"?"checked":""}>
🚫 不需要
</label>

</div>

        `,

        showCancelButton:true,

        confirmButtonText:"✅ 確認送出",

        cancelButtonText:"取消",

        preConfirm:()=>{

            const status =
                document.querySelector(
                    "input[name='status']:checked"
                );

            const lunch =
                document.querySelector(
                    "input[name='lunch']:checked"
                );

            return{

                status:status.value,

                lunch:lunch.value

            };

        }

    });

    if(!value) return;

    await saveStudent(

        studentId,

        name,

        value.status,

        value.lunch

    );

}

//======================================
// 儲存
//======================================

async function saveStudent(

    studentId,

    name,

    status,

    lunch

){

    Swal.fire({

        title:"送出中...",

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

    const today = new Date();

    const date =

        today.getFullYear()+"-"+

        String(today.getMonth()+1).padStart(2,"0")+"-"+

        String(today.getDate()).padStart(2,"0");

    try{

        const url =

            API_URL+

            "?action=save"+

            "&date="+encodeURIComponent(date)+

            "&studentId="+encodeURIComponent(studentId)+

            "&name="+encodeURIComponent(name)+

            "&status="+encodeURIComponent(status)+

            "&lunch="+encodeURIComponent(lunch);

        const res = await fetch(url);

        const result = await res.json();

        if(result.success){

            todayStatus[studentId]={

                StudentID:studentId,

                Name:name,

                Status:status,

                Lunch:lunch

            };

            renderCards(students);

            Swal.fire({

                icon:"success",

                title:"送出成功",

                timer:1200,

                showConfirmButton:false

            });

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

            "無法連線 Google Apps Script",

            "error"

        );

    }

}
//======================================
// 更新卡片畫面
//======================================

function updateCard(card, data){

    const statusText = card.querySelector(".student-status");
    const dot = card.querySelector(".status-dot");

    card.classList.remove(
        "green",
        "yellow",
        "orange",
        "red"
    );

    switch(data.Status){

        case "參加":

            card.classList.add("green");

            dot.style.background="#4CAF50";

            statusText.innerHTML="🟢 已確認";

            break;

        case "上午請假":

            card.classList.add("yellow");

            dot.style.background="#FBC02D";

            statusText.innerHTML="🟡 上午請假";

            break;

        case "下午請假":

            card.classList.add("orange");

            dot.style.background="#FB8C00";

            statusText.innerHTML="🟠 下午請假";

            break;

        case "全天請假":

            card.classList.add("red");

            dot.style.background="#E53935";

            statusText.innerHTML="🔴 全天請假";

            break;

        default:

            dot.style.background="#BDBDBD";

            statusText.innerHTML="⬜ 尚未確認";

    }

}

//======================================
// 重新整理首頁
//======================================

function refreshCards(){

    renderCards(students);

}

//======================================
// 清除搜尋
//======================================

function clearSearch(){

    document.getElementById("searchInput").value="";

    renderCards(students);

}

//======================================
// 今天日期
//======================================

function today(){

    const d=new Date();

    return d.getFullYear()+"-"+

        String(d.getMonth()+1).padStart(2,"0")+"-"+

        String(d.getDate()).padStart(2,"0");

}

//======================================
// Toast
//======================================

function toast(icon,title){

    Swal.fire({

        toast:true,

        position:"top",

        icon:icon,

        title:title,

        timer:1500,

        showConfirmButton:false

    });

}

//======================================
// Loading
//======================================

function loading(text="讀取中..."){

    Swal.fire({

        title:text,

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

}

//======================================
// 關閉 Loading
//======================================

function closeLoading(){

    Swal.close();

}

//======================================
// Console
//======================================

console.log("================================");
console.log(" AI 校隊每日確認 V2");
console.log(" GitHub + Google Apps Script");
console.log("================================");
