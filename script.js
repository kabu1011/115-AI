// ==========================================
// 福瑞斯特中小學－AI校隊
// Version 2.0
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbxPP-qxjl58Y8G4ozxpphw73z_8d2iM5oj4CgQ1WVPmWddg6O2yeiorxE_2ptZlDww/exec";

let activities = [];
let students = [];
let currentActivity = null;

//==============================
// 初始化
//==============================

document.addEventListener("DOMContentLoaded", () => {

    loadActivities();

});

//==============================
// 載入活動
//==============================

async function loadActivities() {

    try {

        const res = await fetch(
            API_URL + "?action=getActivities"
        );

        activities = await res.json();

        renderActivities();

    } catch (err) {

        console.error(err);

        Swal.fire(
            "錯誤",
            "無法取得活動資料",
            "error"
        );

    }

}

//==============================
// 顯示活動
//==============================

function renderActivities() {

    const list =
        document.getElementById("activityList");

    list.innerHTML = "";

    activities.forEach(activity => {

        const template =
            document
            .getElementById("activityTemplate")
            .content
            .cloneNode(true);

        template.querySelector(".activity-date").textContent =
            activity.Date;

        template.querySelector(".activity-name").textContent =
            activity.Title;

        template.querySelector(".progress-text").textContent =
            `${activity.Completed} / ${activity.Total}`;

        template.querySelector(".btn-start").onclick = () => {

            openActivity(activity);

        };

        list.appendChild(template);

    });

}

//==============================
// 開啟活動
//==============================

async function openActivity(activity) {

    currentActivity = activity;

    document.getElementById("activityPage").style.display = "none";

    document.getElementById("studentPage").style.display = "block";

    document.getElementById("activityTitle").innerHTML =
        `${activity.Title}<br><small>${activity.Date}</small>`;

    await loadStudents();

}

//==============================
// 返回首頁
//==============================

function backActivity() {

    document.getElementById("studentPage").style.display = "none";

    document.getElementById("activityPage").style.display = "block";

}

//==============================
// 載入學生
//==============================

async function loadStudents() {

    try {

        const res = await fetch(
            API_URL +
            "?action=getStudents&activityId=" +
            currentActivity.ActivityID
        );

        students = await res.json();

        renderStudents(students);

    } catch (err) {

        console.error(err);

        Swal.fire(
            "錯誤",
            "無法取得學生資料",
            "error"
        );

    }

}
//==============================
// 顯示學生
//==============================

function renderStudents(data){

    const list = document.getElementById("studentList");

    list.innerHTML = "";

    data.forEach(student=>{

        const template =
            document.getElementById("studentTemplate")
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

        if(student.Status){

            updateCard(card,student);

        }

        card.onclick=()=>{

            openStudent(student);

        };

        list.appendChild(template);

    });

}

//==============================
// 搜尋學生
//==============================

document.getElementById("searchInput")
.addEventListener("input",searchStudent);

function searchStudent(){

    const keyword =
    document.getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

    if(keyword===""){

        renderStudents(students);

        return;

    }

    const result = students.filter(student=>{

        return(

            student.StudentID
            .toLowerCase()
            .includes(keyword)

            ||

            student.Name
            .toLowerCase()
            .includes(keyword)

        );

    });

    renderStudents(result);

}

//==============================
// 點學生
//==============================

async function openStudent(student){

    const status = student.Status || "參加";

    const lunch = student.Lunch || "需要";

    const meal = student.Meal || "葷";

    const { value } = await Swal.fire({

        title:
        `<div style="font-size:34px">
            ${student.Name}
        </div>
        <div style="font-size:20px;color:#94A3B8">
            ${student.StudentID}
        </div>`,

        width:650,

        confirmButtonText:"確認送出",

        cancelButtonText:"取消",

        showCancelButton:true,

        html:`

<div style="text-align:left;font-size:22px;line-height:2.2">

<b>📌 是否參加</b>

<label>
<input type="radio"
name="status"
value="參加"
${status=="參加"?"checked":""}>
參加
</label>

<label>
<input type="radio"
name="status"
value="上午請假"
${status=="上午請假"?"checked":""}>
上午請假
</label>

<label>
<input type="radio"
name="status"
value="下午請假"
${status=="下午請假"?"checked":""}>
下午請假
</label>

<label>
<input type="radio"
name="status"
value="全天請假"
${status=="全天請假"?"checked":""}>
全天請假
</label>

<hr>

<b>🍱 午餐</b>

<label>
<input type="radio"
name="lunch"
value="需要"
${lunch=="需要"?"checked":""}>
需要
</label>

<label>
<input type="radio"
name="lunch"
value="不需要"
${lunch=="不需要"?"checked":""}>
不需要
</label>

<hr>

<b>🥩 餐點</b>

<label>
<input type="radio"
name="meal"
value="葷"
${meal=="葷"?"checked":""}>
葷食
</label>

<label>
<input type="radio"
name="meal"
value="素"
${meal=="素"?"checked":""}>
素食
</label>

</div>

`,

        preConfirm(){

            return{

                status:
                document.querySelector(
                "input[name='status']:checked"
                ).value,

                lunch:
                document.querySelector(
                "input[name='lunch']:checked"
                ).value,

                meal:
                document.querySelector(
                "input[name='meal']:checked"
                ).value

            };

        }

    });

    if(!value) return;

    saveStudent(student,value);

}
//==============================
// 儲存資料
//==============================

async function saveStudent(student,data){

    Swal.fire({

        title:"儲存中...",

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

    try{

        const body={

            action:"save",

            activityId:currentActivity.ActivityID,

            studentId:student.StudentID,

            name:student.Name,

            status:data.status,

            lunch:data.lunch,

            meal:data.meal

        };

        const res=await fetch(API_URL,{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify(body)

        });

        const result=await res.json();

        Swal.close();

        if(result.success){

            student.Status=data.status;
            student.Lunch=data.lunch;
            student.Meal=data.meal;

            renderStudents(students);

            toast("success","已儲存");

            loadActivities();

        }else{

            Swal.fire(

                "錯誤",

                result.message,

                "error"

            );

        }

    }catch(err){

        console.error(err);

        Swal.fire(

            "錯誤",

            "無法連線 Apps Script",

            "error"

        );

    }

}

//==============================
// 更新學生卡片
//==============================

function updateCard(card,student){

    const status=
        card.querySelector(".student-status");

    const dot=
        card.querySelector(".status-dot");

    card.classList.remove(
        "green",
        "yellow",
        "orange",
        "red"
    );

    switch(student.Status){

        case "參加":

            card.classList.add("green");

            dot.style.background="#22C55E";

            status.innerHTML="● 已完成";

            break;

        case "上午請假":

            card.classList.add("yellow");

            dot.style.background="#FACC15";

            status.innerHTML="● 上午請假";

            break;

        case "下午請假":

            card.classList.add("orange");

            dot.style.background="#FB923C";

            status.innerHTML="● 下午請假";

            break;

        case "全天請假":

            card.classList.add("red");

            dot.style.background="#EF4444";

            status.innerHTML="● 全天請假";

            break;

        default:

            dot.style.background="#64748B";

            status.innerHTML="● 尚未確認";

    }

}

//==============================
// Toast
//==============================

function toast(icon,title){

    Swal.fire({

        toast:true,

        position:"top-end",

        icon:icon,

        title:title,

        showConfirmButton:false,

        timer:1500,

        timerProgressBar:true

    });

}

//==============================
// 重新整理活動
//==============================

async function refreshActivities(){

    await loadActivities();

}

//==============================
// 清除搜尋
//==============================

function clearSearch(){

    document.getElementById("searchInput").value="";

    renderStudents(students);

}

//==============================
// Console
//==============================

console.log("================================");
console.log("福瑞斯特中小學－AI校隊 V2");
console.log("Frontend Ready");
console.log("================================");
