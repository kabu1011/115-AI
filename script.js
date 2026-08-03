// =====================================
// AI 校隊每日確認
// script.js Part 1
// =====================================

const API_URL = "https://script.google.com/macros/s/AKfycbxPP-qxjl58Y8G4ozxpphw73z_8d2iM5oj4CgQ1WVPmWddg6O2yeiorxE_2ptZlDww/exec";

let students = [];

//======================================
// 載入
//======================================

window.onload = () => {

    showToday();

    loadStudents();

    document
        .getElementById("searchInput")
        .addEventListener("keyup", searchStudent);

};

//======================================
// 日期
//======================================

function showToday() {

    const d = new Date();

    document.getElementById("today").innerHTML =
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

}

//======================================
// 讀學生
//======================================

async function loadStudents(){

    try{

        const res = await fetch(
            API_URL + "?action=getStudents"
        );

        students = await res.json();

        renderStudents(students);

        loadTodayStatus();

    }catch(err){

        console.log(err);

        Swal.fire(
            "錯誤",
            "無法取得學生名單",
            "error"
        );

    }

}

//======================================
// 建立卡片
//======================================

function renderStudents(list){

    const studentList =
        document.getElementById("studentList");

    studentList.innerHTML="";

    list.forEach(student=>{

        const template =
            document
            .getElementById("studentTemplate")
            .content
            .cloneNode(true);

        const card =
            template.querySelector(".student-card");

        card.dataset.id = student.StudentID;
        card.dataset.name = student.Name;

        template.querySelector(".student-id").innerHTML =
            student.StudentID;

        template.querySelector(".student-name").innerHTML =
            student.Name;

        card.onclick = ()=>{

            openDialog(card);

        };

        studentList.appendChild(template);

    });

}

//======================================
// 搜尋
//======================================

function searchStudent(){

    const keyword =
        document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    if(keyword==""){

        renderStudents(students);

        loadTodayStatus();

        return;

    }

    const result = students.filter(s=>{

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

    renderStudents(result);

    loadTodayStatus();

}
//======================================
// 開啟確認視窗
//======================================

async function openDialog(card){

    const studentId = card.dataset.id;
    const name = card.dataset.name;

    const { value: formValues } = await Swal.fire({

        title: `${studentId}<br>${name}`,

        width: 420,

        html: `

        <div style="text-align:left">

            <h5 style="margin-bottom:10px;">📌 今日狀態</h5>

            <label>
                <input type="radio" name="status" value="參加" checked>
                🟢 參加
            </label><br>

            <label>
                <input type="radio" name="status" value="上午請假">
                🟡 上午請假
            </label><br>

            <label>
                <input type="radio" name="status" value="下午請假">
                🟠 下午請假
            </label><br>

            <label>
                <input type="radio" name="status" value="全天請假">
                🔴 全天請假
            </label>

            <hr>

            <h5 style="margin-bottom:10px;">🍱 午餐</h5>

            <label>
                <input type="radio" name="lunch" value="需要" checked>
                🍱 需要
            </label><br>

            <label>
                <input type="radio" name="lunch" value="不需要">
                🚫 不需要
            </label>

        </div>

        `,

        confirmButtonText:"確認送出",

        showCancelButton:true,

        cancelButtonText:"取消",

        preConfirm:()=>{

            const status =
                document.querySelector("input[name='status']:checked");

            const lunch =
                document.querySelector("input[name='lunch']:checked");

            return{

                status:status.value,

                lunch:lunch.value

            }

        }

    });

    if(!formValues) return;

    saveStudent(

        card,

        studentId,

        name,

        formValues.status,

        formValues.lunch

    );

}

//======================================
// 儲存
//======================================

async function saveStudent(

    card,

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

            updateCard(

                card,

                status,

                lunch

            );

            Swal.fire({

                icon:"success",

                title:"完成",

                text:"已成功送出",

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

            "送出失敗",

            "error"

        );

    }

}
//======================================
// 更新卡片
//======================================

function updateCard(card,status,lunch){

    const statusText = card.querySelector(".student-status");
    const dot = card.querySelector(".status-dot");

    card.classList.remove(
        "green",
        "yellow",
        "orange",
        "red"
    );

    switch(status){

        case "參加":

            card.classList.add("green");

            dot.style.background="#4CAF50";

            statusText.innerHTML="🟢 已完成";

            break;

        case "上午請假":

            card.classList.add("yellow");

            dot.style.background="#FFC107";

            statusText.innerHTML="🟡 上午請假";

            break;

        case "下午請假":

            card.classList.add("orange");

            dot.style.background="#FF9800";

            statusText.innerHTML="🟠 下午請假";

            break;

        case "全天請假":

            card.classList.add("red");

            dot.style.background="#F44336";

            statusText.innerHTML="🔴 全天請假";

            break;

    }

    card.dataset.status=status;
    card.dataset.lunch=lunch;

}

//======================================
// 今天已回報
//======================================

async function loadTodayStatus(){

    try{

        const res = await fetch(
            API_URL+"?action=today"
        );

        const list = await res.json();

        list.forEach(item=>{

            const card=document.querySelector(
                ".student-card[data-id='"+item.StudentID+"']"
            );

            if(card){

                updateCard(

                    card,

                    item.Status,

                    item.Lunch

                );

            }

        });

    }catch(err){

        console.log(err);

    }

}

//======================================
// 重新整理
//======================================

function refresh(){

    loadStudents();

}

//======================================
// Console
//======================================

console.log("AI 校隊每日確認 V2 啟動成功");
