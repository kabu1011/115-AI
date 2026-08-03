// ==========================================
// 福瑞斯特中小學－AI校隊
// Script.js V3
// ==========================================

// Apps Script WebApp
const API_URL = "https://script.google.com/macros/s/AKfycbxPP-qxjl58Y8G4ozxpphw73z_8d2iM5oj4CgQ1WVPmWddg6O2yeiorxE_2ptZlDww/exec";

let activities = [];
let students = [];
let currentActivity = null;

//==========================================
// 初始化
//==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadActivities();

});

//==========================================
// 載入活動
//==========================================

async function loadActivities() {

    const list = document.getElementById("activityList");

    list.innerHTML = `

    <div class="col-12 text-center py-5">

        <div class="spinner-border text-primary"></div>

        <div class="mt-3">

            活動載入中...

        </div>

    </div>

    `;

    try{

        const response = await fetch(

            API_URL + "?action=getActivities"

        );

        activities = await response.json();

        renderActivities();

    }catch(error){

        console.error(error);

        Swal.fire(

            "錯誤",

            "無法取得活動資料",

            "error"

        );

    }

}

//==========================================
// 顯示活動
//==========================================

function renderActivities(){

    const list = document.getElementById("activityList");

    list.innerHTML = "";

    activities.forEach(activity=>{

        const template = document

            .getElementById("activityTemplate")

            .content

            .cloneNode(true);

        template.querySelector(".activity-date").textContent =
            activity.Date;

        template.querySelector(".activity-name").textContent =
            activity.Title;

        template.querySelector(".progress-text").textContent =
            activity.Completed + " / " + activity.Total;

        template.querySelector(".btn-start").onclick = ()=>{

            openActivity(activity);

        };

        list.appendChild(template);

    });

}

//==========================================
// 開啟活動
//==========================================

async function openActivity(activity){

    currentActivity = activity;

    document.getElementById("activityPage").style.display="none";

    document.getElementById("studentPage").style.display="block";

    document.getElementById("activityTitle").innerHTML=

        activity.Title+

        "<br><small>"+

        activity.Date+

        "</small>";

    await loadStudents();

}

//==========================================
// 返回首頁
//==========================================

function backActivity(){

    document.getElementById("studentPage").style.display="none";

    document.getElementById("activityPage").style.display="block";

}
//==========================================
// 載入學生
//==========================================

async function loadStudents(){

    const list=document.getElementById("studentList");

    list.innerHTML=`

    <div class="col-12 text-center py-5">

        <div class="spinner-border text-primary"></div>

        <div class="mt-3">

            學生資料載入中...

        </div>

    </div>

    `;

    try{

        const response=await fetch(

            API_URL+
            "?action=getStudents&activityId="+
            currentActivity.ActivityID

        );

        students=await response.json();

        renderStudents(students);

    }catch(error){

        console.error(error);

        Swal.fire(

            "錯誤",

            "無法取得學生資料",

            "error"

        );

    }

}

//==========================================
// 顯示學生
//==========================================

function renderStudents(data){

    const list=document.getElementById("studentList");

    list.innerHTML="";

    data.forEach(student=>{

        const template=document

            .getElementById("studentTemplate")

            .content

            .cloneNode(true);

        const card=template.querySelector(".student-card");

        template.querySelector(".student-id").textContent=
            student.StudentID;

        template.querySelector(".student-name").textContent=
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

//==========================================
// 開啟學生資料
//==========================================

async function openStudent(student){

    const status=student.Status || "參加";

    const lunch=student.Lunch || "需要";

    const meal=student.Meal || "葷";

    const { value } = await Swal.fire({

        width:650,

        title:

        `<div style="font-size:34px;font-weight:bold;">
            ${student.Name}
        </div>

        <div style="
            font-size:18px;
            color:#64748B;
            margin-top:8px;">
            ${student.StudentID}
        </div>`,

        html:`

<div style="text-align:left">

<h5 style="margin-bottom:15px;">📅 今日狀態</h5>

<label><input type="radio" name="status" value="參加" ${status==="參加"?"checked":""}> 🟢 參加</label>

<label><input type="radio" name="status" value="上午請假" ${status==="上午請假"?"checked":""}> 🟡 上午請假</label>

<label><input type="radio" name="status" value="下午請假" ${status==="下午請假"?"checked":""}> 🟠 下午請假</label>

<label><input type="radio" name="status" value="全天請假" ${status==="全天請假"?"checked":""}> 🔴 全天請假</label>

<hr>

<h5 style="margin-bottom:15px;">🍱 午餐</h5>

<label><input type="radio" name="lunch" value="需要" ${lunch==="需要"?"checked":""}> 需要午餐</label>

<label><input type="radio" name="lunch" value="不需要" ${lunch==="不需要"?"checked":""}> 不需要午餐</label>

<hr>

<h5 style="margin-bottom:15px;">🥢 餐點</h5>

<label><input type="radio" name="meal" value="葷" ${meal==="葷"?"checked":""}> 🍖 葷食</label>

<label><input type="radio" name="meal" value="素" ${meal==="素"?"checked":""}> 🥬 素食</label>

</div>

`,

        confirmButtonText:"確認送出",

        cancelButtonText:"取消",

        showCancelButton:true,

        preConfirm(){

            return{

                status:document.querySelector("input[name='status']:checked").value,

                lunch:document.querySelector("input[name='lunch']:checked").value,

                meal:document.querySelector("input[name='meal']:checked").value

            };

        }

    });

    if(!value) return;

    saveStudent(student,value);

}
//==========================================
// 儲存學生資料
//==========================================

async function saveStudent(student, data){

    Swal.fire({

        title:"儲存中...",

        allowOutsideClick:false,

        didOpen(){

            Swal.showLoading();

        }

    });

    try{

        const response = await fetch(API_URL,{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                action:"save",

                activityId:currentActivity.ActivityID,

                studentId:student.StudentID,

                name:student.Name,

                status:data.status,

                lunch:data.lunch,

                meal:data.meal

            })

        });

        const result = await response.json();

        Swal.close();

        if(result.success){

            student.Status=data.status;
            student.Lunch=data.lunch;
            student.Meal=data.meal;

            renderStudents(students);

            await loadActivities();

            toast("success","已完成儲存");

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

//==========================================
// 更新學生卡片
//==========================================

function updateCard(card,student){

    const status=card.querySelector(".student-status");

    const dot=card.querySelector(".status-dot");

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

            status.innerHTML="🟢 已參加";

            break;

        case "上午請假":

            card.classList.add("yellow");

            dot.style.background="#FACC15";

            status.innerHTML="🟡 上午請假";

            break;

        case "下午請假":

            card.classList.add("orange");

            dot.style.background="#FB923C";

            status.innerHTML="🟠 下午請假";

            break;

        case "全天請假":

            card.classList.add("red");

            dot.style.background="#EF4444";

            status.innerHTML="🔴 全天請假";

            break;

        default:

            dot.style.background="#94A3B8";

            status.innerHTML="⚪ 尚未確認";

    }

}

//==========================================
// Toast
//==========================================

function toast(icon,title){

    Swal.fire({

        toast:true,

        position:"top-end",

        icon:icon,

        title:title,

        timer:1800,

        showConfirmButton:false,

        timerProgressBar:true

    });

}

//==========================================
// 返回首頁
//==========================================

async function refreshHome(){

    document.getElementById("studentPage").style.display="none";

    document.getElementById("activityPage").style.display="block";

    await loadActivities();

}

//==========================================
// 清除搜尋
//==========================================

function clearSearch(){

    document.getElementById("searchInput").value="";

    renderStudents(students);

}

//==========================================
// 啟動完成
//==========================================

console.log("===================================");

console.log("福瑞斯特中小學－AI校隊");

console.log("Script V3 Ready");

console.log("===================================");
