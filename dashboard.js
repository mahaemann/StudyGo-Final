// This is the DASHBOARD JAVASCRIPT 
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log("User logged in:", user.uid);
            
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                document.getElementById('userName').innerText = userData.name;
                updateGreeting(userData.name);
                
                if (userData.streak) {
                    document.getElementById('streakCount').innerText = userData.streak;
                } else {
                    document.getElementById('streakCount').innerText = "0";
                }
            }
            
            await loadAllData();
            await updateStreak();
            
            // This is the Start real-time deadline checker (updates every minute)
            startDeadlineChecker();
            
        } else {
            window.location.href = 'index.html';
        }
    });
    
    // Clock
    function updateClock() {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('currentDay').innerText = days[now.getDay()];
        document.getElementById('currentDate').innerText = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        document.getElementById('currentTime').innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);
    
    // REAL-TIME DEADLINE CHECKER
    let deadlineCheckerInterval = null;
    function startDeadlineChecker() {
        if (deadlineCheckerInterval) clearInterval(deadlineCheckerInterval);
        // Check every 30 seconds for deadline updates
        deadlineCheckerInterval = setInterval(async () => {
            if (currentUser) {
                await checkAndUpdateDeadlines();
            }
        }, 30000); // this Checks every 30 seconds so yh
    }
    
    async function checkAndUpdateDeadlines() {
        // Reload data and update stats means this will recalculate deadlinePassed
        await loadAllData();
    }
    
    function updateGreeting(name) {
        const hour = new Date().getHours();
        let greeting = hour >= 5 && hour < 12 ? 'Good Morning,' : hour >= 12 && hour < 17 ? 'Good Afternoon,' : hour >= 17 && hour < 21 ? 'Good Evening,' : 'Good Night,';
        document.getElementById('greeting').innerText = greeting;
        document.getElementById('userName').innerText = name.split(' ')[0];
    }
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active-section'));
            document.getElementById(`${this.dataset.page}Section`).classList.add('active-section');
        };
    });
    
    // Logout
    document.getElementById('logoutBtn').onclick = () => auth.signOut().then(() => window.location.href = 'index.html');
    
    // Timer
    let timerSeconds = 1500, timerRunning = false, timerInterval = null;
    function updateTimerDisplay() {
        document.getElementById('timerMinutes').innerText = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
        document.getElementById('timerSeconds').innerText = (timerSeconds % 60).toString().padStart(2, '0');
    }
    document.getElementById('setTimerBtn').onclick = () => { if (!timerRunning) { timerSeconds = parseInt(document.getElementById('customTimerMinutes').value) * 60; updateTimerDisplay(); } };
    document.getElementById('startTimerBtn').onclick = function() {
        if (timerRunning) { clearInterval(timerInterval); timerRunning = false; this.innerText = '▶ Start'; this.style.background = '#48bb78'; }
        else { timerInterval = setInterval(() => { if (timerSeconds > 0) { timerSeconds--; updateTimerDisplay(); if (timerSeconds === 0) { clearInterval(timerInterval); timerRunning = false; this.innerText = '▶ Start'; this.style.background = '#48bb78'; alert('Time is up!'); } } }, 1000); timerRunning = true; this.innerText = '⏸ Pause'; this.style.background = '#e53e3e'; }
    };
    document.getElementById('resetTimerBtn').onclick = () => { clearInterval(timerInterval); timerRunning = false; timerSeconds = parseInt(document.getElementById('customTimerMinutes').value) * 60; updateTimerDisplay(); document.getElementById('startTimerBtn').innerText = '▶ Start'; document.getElementById('startTimerBtn').style.background = '#48bb78'; };
    
    // == STREAK FUNCTION  ==
    async function updateStreak() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        let currentStreak = userData.streak || 0;
        let lastActive = userData.lastActive ? userData.lastActive.toDate() : null;
        
        if (lastActive) {
            lastActive.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Came back the next day it will the increase streak
                currentStreak++;
                console.log("Streak increased to:", currentStreak);
            } else if (diffDays > 1) {
                // Missed one day the streak will reset to 0 
                currentStreak = 0;
                console.log("Streak reset to 0 because you missed a day");
            }
            // If diffDays === 0 (same day), do nothing (already updated today)
        } else {
            // First time user
            currentStreak = 1;
            console.log("First streak:", currentStreak);
        }
        
        await db.collection('users').doc(currentUser.uid).update({
            streak: currentStreak,
            lastActive: today
        });
        
        document.getElementById('streakCount').innerText = currentStreak;
    }
    
    // == HELPER: FORMAT DATE ==
    function formatDate(dateValue) {
        if (!dateValue) return 'No date set';
        try {
            let date;
            if (dateValue.toDate) {
                date = dateValue.toDate();
            } else {
                date = new Date(dateValue);
            }
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleString();
        } catch (e) {
            return 'Invalid date';
        }
    }
    
    // === this ones CHECKs IF DATE IS PAST DUE ===
    function isDatePassed(dateValue) {
        if (!dateValue) return false;
        try {
            let date;
            if (dateValue.toDate) {
                date = dateValue.toDate();
            } else {
                date = new Date(dateValue);
            }
            const now = new Date();
            return date < now;
        } catch (e) {
            return false;
        }
    }
    
    // === LOAD ALL DATA FUNCTION ==
    async function loadAllData() {
        console.log("Loading all data...");
        
        const assignSnapshot = await db.collection('assignments').where('userId', '==', currentUser.uid).get();
        const assignments = [];
        assignSnapshot.forEach(doc => assignments.push({ id: doc.id, ...doc.data() }));
        
        const examSnapshot = await db.collection('exams').where('userId', '==', currentUser.uid).get();
        const exams = [];
        examSnapshot.forEach(doc => exams.push({ id: doc.id, ...doc.data() }));
        
        const taskSnapshot = await db.collection('tasks').where('userId', '==', currentUser.uid).get();
        const tasks = [];
        taskSnapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
        
        const vacSnapshot = await db.collection('vacations').where('userId', '==', currentUser.uid).get();
        const vacations = [];
        vacSnapshot.forEach(doc => vacations.push({ id: doc.id, ...doc.data() }));
        
        displayAssignments(assignments);
        displayExams(exams);
        displayTasks(tasks);
        displayVacations(vacations);
        updateStats(assignments, exams, tasks);
        displayDashboardList(assignments, exams, tasks);
        
        if (typeof setupAddButtons === 'function') {
            setupAddButtons();
        }
    }
    
    // == DISPLAY ASSIGNMENTS ==
    function displayAssignments(assignments) {
        const container = document.getElementById('assignmentsList');
        if (!container) return;
        
        if (assignments.length === 0) {
            container.innerHTML = '<div class="empty-state">📭 No assignments yet. Click "Add Assignment" to get started!</div>';
            return;
        }
        
        container.innerHTML = assignments.map(a => `
            <div class="item-card ${a.completed ? 'completed' : ''}">
                <div class="item-info">
                    <div class="item-title">📝 ${escapeHtml(a.title)}</div>
                    <div class="item-details">
                        📚 ${escapeHtml(a.subject)} | ⏰ Due: ${formatDate(a.dueDate)} | 
                        <span class="priority-badge ${a.priority}">${a.priority}</span>
                    </div>
                    ${a.instructions ? `<div class="item-details">📝 Instructions: ${escapeHtml(a.instructions)}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${!a.completed ? `<button class="complete-item" onclick="completeItem('assignments', '${a.id}')">✓ Complete</button>` : ''}
                    <button class="delete-item" onclick="deleteItem('assignments', '${a.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // == DISPLAY EXAMS ==
    function displayExams(exams) {
        const container = document.getElementById('examsList');
        if (!container) return;
        
        if (exams.length === 0) {
            container.innerHTML = '<div class="empty-state">📚 No exams yet. Click "Add Exam" to get started!</div>';
            return;
        }
        
        container.innerHTML = exams.map(e => `
            <div class="item-card ${e.completed ? 'completed' : ''}">
                <div class="item-info">
                    <div class="item-title">📚 ${escapeHtml(e.title)}</div>
                    <div class="item-details">
                        📖 ${escapeHtml(e.subject)} | ⏰ Date: ${formatDate(e.examDate)} | 
                        <span class="priority-badge ${e.priority}">${e.priority}</span>
                    </div>
                </div>
                <div class="item-actions">
                    ${!e.completed ? `<button class="complete-item" onclick="completeItem('exams', '${e.id}')">✓ Complete</button>` : ''}
                    <button class="delete-item" onclick="deleteItem('exams', '${e.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // = DISPLAY TASKS ===
    function displayTasks(tasks) {
        const container = document.getElementById('tasksList');
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">✅ No tasks yet. Click "Add Task" to get started!</div>';
            return;
        }
        
        container.innerHTML = tasks.map(t => `
            <div class="item-card ${t.completed ? 'completed' : ''}">
                <div class="item-info">
                    <div class="item-title">✅ ${escapeHtml(t.title)}</div>
                    <div class="item-details">
                        ⏰ Due: ${formatDate(t.dueDate)} | 
                        <span class="priority-badge ${t.priority}">${t.priority}</span>
                    </div>
                    ${t.description ? `<div class="item-details">📝 ${escapeHtml(t.description)}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${!t.completed ? `<button class="complete-item" onclick="completeItem('tasks', '${t.id}')">✓ Complete</button>` : ''}
                    <button class="delete-item" onclick="deleteItem('tasks', '${t.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // == DISPLAY VACATIONS ==
    function displayVacations(vacations) {
        const container = document.getElementById('vacationsList');
        if (!container) return;
        
        if (vacations.length === 0) {
            container.innerHTML = '<div class="empty-state">🌴 No vacations planned. Click "Plan Vacation" to get started!</div>';
            return;
        }
        
        container.innerHTML = vacations.map(v => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">🌴 ${escapeHtml(v.title)}</div>
                    <div class="item-details">
                        📅 ${formatDate(v.startDate)} - ${formatDate(v.endDate)}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="delete-item" onclick="deleteVacation('${v.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // === UPDATE STATS (FIXED - TOTAL & PENDING ONLY COUNT ACTIVE TASKS) ===
    function updateStats(assignments, exams, tasks) {
        const now = new Date();
        
        // FIXED: Total tasks only counts items that are NOT completed AND deadline NOT passed
        const totalTasks = assignments.filter(a => !a.completed && !isDatePassed(a.dueDate)).length +
                           exams.filter(e => !e.completed && !isDatePassed(e.examDate)).length +
                           tasks.filter(t => !t.completed && !isDatePassed(t.dueDate)).length;
        
        // Pending only counts items that are NOT completed AND deadline NOT passed
        const pending = assignments.filter(a => !a.completed && !isDatePassed(a.dueDate)).length +
                        exams.filter(e => !e.completed && !isDatePassed(e.examDate)).length +
                        tasks.filter(t => !t.completed && !isDatePassed(t.dueDate)).length;
        
        // REAL-TIME DEADLINE CHECK - compares current time with due date
        let deadlinePassed = 0;
        
        assignments.forEach(a => {
            if (!a.completed && a.dueDate && isDatePassed(a.dueDate)) {
                deadlinePassed++;
            }
        });
        
        tasks.forEach(t => {
            if (!t.completed && t.dueDate && isDatePassed(t.dueDate)) {
                deadlinePassed++;
            }
        });
        
        // For exams, also check if exam date passed
        exams.forEach(e => {
            if (!e.completed && e.examDate && isDatePassed(e.examDate)) {
                deadlinePassed++;
            }
        });
        
        const examsDone = exams.filter(e => e.completed).length;
        const assignmentsDone = assignments.filter(a => a.completed).length;
        
        document.getElementById('totalTasks').innerText = totalTasks;
        document.getElementById('pendingTasks').innerText = pending;
        document.getElementById('deadlinePassed').innerText = deadlinePassed;
        document.getElementById('examsDone').innerText = examsDone;
        document.getElementById('assignmentsDone').innerText = assignmentsDone;
    }
    
    // === DASHBOARD LIST
    function displayDashboardList(assignments, exams, tasks) {
        let allItems = [];
        
        assignments.forEach(a => allItems.push({
            id: a.id,
            title: a.title,
            type: 'assignment',
            dueDate: a.dueDate,
            completed: a.completed,
            priority: a.priority
        }));
        
        exams.forEach(e => allItems.push({
            id: e.id,
            title: e.title,
            type: 'exam',
            dueDate: e.examDate,
            completed: e.completed,
            priority: e.priority
        }));
        
        tasks.forEach(t => allItems.push({
            id: t.id,
            title: t.title,
            type: 'task',
            dueDate: t.dueDate,
            completed: t.completed,
            priority: t.priority
        }));
        
        allItems.sort((a,b) => {
            const dateA = a.dueDate && (a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate));
            const dateB = b.dueDate && (b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate));
            return dateA - dateB;
        });
        
        const container = document.getElementById('dashboardItemsList');
        if (!container) return;
        
        if (allItems.length === 0) {
            container.innerHTML = '<div class="empty-state">✨ No items yet. Add assignments, exams, or tasks!</div>';
            return;
        }
        
        container.innerHTML = allItems.map(item => `
            <div class="item-card ${item.completed ? 'completed' : ''}">
                <div class="item-info">
                    <div class="item-title">
                        ${item.type === 'assignment' ? '📝' : item.type === 'exam' ? '📚' : '✅'} ${escapeHtml(item.title)}
                    </div>
                    <div class="item-details">
                        ⏰ Due: ${formatDate(item.dueDate)} | 
                        <span class="priority-badge ${item.priority}">${item.priority}</span> | 
                        Type: ${item.type}
                    </div>
                </div>
                <div class="item-actions">
                    ${!item.completed ? `<button class="complete-item" onclick="completeItem('${item.type}s', '${item.id}')">✓ Complete</button>` : ''}
                    <button class="delete-item" onclick="deleteItem('${item.type}s', '${item.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // == SETUP ADD BUTTONS
    let buttonsSetup = false;
    function setupAddButtons() {
        if (buttonsSetup) return;
        buttonsSetup = true;
        
        // Assignment
        document.getElementById('showAddAssignmentBtn').onclick = () => document.getElementById('addAssignmentForm').style.display = 'block';
        document.getElementById('cancelAssignmentBtn').onclick = () => {
            document.getElementById('addAssignmentForm').style.display = 'none';
            clearAssignmentForm();
        };
        document.getElementById('saveAssignmentBtn').onclick = async () => {
            const title = document.getElementById('assignmentTitle').value;
            const subject = document.getElementById('assignmentSubject').value;
            const dueDate = document.getElementById('assignmentDueDate').value;
            const priority = document.getElementById('assignmentPriority').value;
            const instructions = document.getElementById('assignmentInstructions').value;
            if (!title || !subject || !dueDate) return;
            
            await db.collection('assignments').add({
                userId: currentUser.uid,
                title, subject,
                dueDate: new Date(dueDate),
                priority, instructions,
                completed: false,
                createdAt: new Date()
            });
            
            document.getElementById('addAssignmentForm').style.display = 'none';
            clearAssignmentForm();
            await loadAllData();
            await updateStreak();
        };
        
        // Exam
        document.getElementById('showAddExamBtn').onclick = () => document.getElementById('addExamForm').style.display = 'block';
        document.getElementById('cancelExamBtn').onclick = () => {
            document.getElementById('addExamForm').style.display = 'none';
            clearExamForm();
        };
        document.getElementById('saveExamBtn').onclick = async () => {
            const title = document.getElementById('examTitle').value;
            const subject = document.getElementById('examSubject').value;
            const examDate = document.getElementById('examDate').value;
            const priority = document.getElementById('examPriority').value;
            if (!title || !subject || !examDate) return;
            
            await db.collection('exams').add({
                userId: currentUser.uid,
                title, subject,
                examDate: new Date(examDate),
                priority,
                completed: false,
                createdAt: new Date()
            });
            
            document.getElementById('addExamForm').style.display = 'none';
            clearExamForm();
            await loadAllData();
            await updateStreak();
        };
        
        // Task
        document.getElementById('showAddTaskBtn').onclick = () => document.getElementById('addTaskForm').style.display = 'block';
        document.getElementById('cancelTaskBtn').onclick = () => {
            document.getElementById('addTaskForm').style.display = 'none';
            clearTaskForm();
        };
        document.getElementById('saveTaskBtn').onclick = async () => {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const priority = document.getElementById('taskPriority').value;
            if (!title || !dueDate) return;
            
            await db.collection('tasks').add({
                userId: currentUser.uid,
                title, description,
                dueDate: new Date(dueDate),
                priority,
                completed: false,
                createdAt: new Date()
            });
            
            document.getElementById('addTaskForm').style.display = 'none';
            clearTaskForm();
            await loadAllData();
            await updateStreak();
        };
        
        // Vacation
        document.getElementById('showAddVacationBtn').onclick = () => document.getElementById('addVacationForm').style.display = 'block';
        document.getElementById('cancelVacationBtn').onclick = () => {
            document.getElementById('addVacationForm').style.display = 'none';
            clearVacationForm();
        };
        document.getElementById('saveVacationBtn').onclick = async () => {
            const title = document.getElementById('vacationTitle').value;
            const startDate = document.getElementById('vacationStartDate').value;
            const endDate = document.getElementById('vacationEndDate').value;
            if (!title || !startDate || !endDate) return;
            
            await db.collection('vacations').add({
                userId: currentUser.uid,
                title,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                createdAt: new Date()
            });
            
            document.getElementById('addVacationForm').style.display = 'none';
            clearVacationForm();
            await loadAllData();
        };
    }
    
    function clearAssignmentForm() {
        document.getElementById('assignmentTitle').value = '';
        document.getElementById('assignmentSubject').value = '';
        document.getElementById('assignmentDueDate').value = '';
        document.getElementById('assignmentInstructions').value = '';
    }
    
    function clearExamForm() {
        document.getElementById('examTitle').value = '';
        document.getElementById('examSubject').value = '';
        document.getElementById('examDate').value = '';
    }
    
    function clearTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDueDate').value = '';
    }
    
    function clearVacationForm() {
        document.getElementById('vacationTitle').value = '';
        document.getElementById('vacationStartDate').value = '';
        document.getElementById('vacationEndDate').value = '';
    }
    
    //  GLOBAL FUNCTIONS 
    window.completeItem = async (collection, id) => {
        await db.collection(collection).doc(id).update({ completed: true });
        await loadAllData();
        await updateStreak();
    };
    
    window.deleteItem = async (collection, id) => {
        if (confirm('Delete this item?')) {
            await db.collection(collection).doc(id).delete();
            await loadAllData();
        }
    };
    
    window.deleteVacation = async (id) => {
        if (confirm('Delete this vacation?')) {
            await db.collection('vacations').doc(id).delete();
            await loadAllData();
        }
    };
    
    // This is the Dark mode
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.onchange = function() {
            document.body.classList.toggle('dark-mode', this.checked);
            localStorage.setItem('darkMode', this.checked ? 'enabled' : 'disabled');
        };
        if (localStorage.getItem('darkMode') === 'enabled') {
            darkToggle.checked = true;
            document.body.classList.add('dark-mode');
        }
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
});