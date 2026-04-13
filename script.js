// 
    //  INTRO ANIMATION PARTICLES
    // 
    (function () {
      const c = document.getElementById('introParticles');
      const colors = ['#7c6aff', '#ff6a9b', '#6affb8', '#ffb86a'];
      for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.className = 'intro-particle';
        const size = 3 + Math.random() * 8;
        el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%; top:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * 4)]};
      animation-delay:${Math.random() * 2}s;
      animation-duration:${2 + Math.random() * 2}s;
    `;
        c.appendChild(el);
      }
    })();

    // 
    //  FLOATING BG PARTICLES
    // 
    (function () {
      const colors = ['rgba(124,106,255,0.4)', 'rgba(255,106,155,0.4)', 'rgba(106,255,184,0.3)', 'rgba(255,184,106,0.3)'];
      for (let i = 0; i < 12; i++) {
        const el = document.createElement('div');
        el.className = 'float-particle';
        const size = 3 + Math.random() * 6;
        el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * 4)]};
      animation-duration:${8 + Math.random() * 12}s;
      animation-delay:${Math.random() * 10}s;
    `;
        document.body.appendChild(el);
      }
    })();

    // 
    //  STORAGE
    // 
    const STORAGE_KEY = 'tamizh_todo_v1';
    function loadData() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultData(); }
      catch { return getDefaultData(); }
    }
    function saveData(data) { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
      if (typeof syncDataToCloud === 'function') syncDataToCloud(data);
    }
    function getDefaultData() {
      return {
        days: {},
        monthly: {},   // { "2026-04": { tasks:[] } }
        yearly: {},    // { "2026": { tasks:[] } }
        samples: null, // null = use defaults
        lifetime: { totalCreated: 0, totalCompleted: 0, bestStreak: 0 },
        lastVisit: null,
        reminderEnabled: false
      };
    }

    let appData = loadData();
    let currentFilter = { daily: 'all', monthly: 'all', yearly: 'all' };
    let charts = {};

    // 
    //  DATE HELPERS
    // 
    function todayKey() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
    function monthKey() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
    function yearKey() { return String(new Date().getFullYear()); }
    function pad(n) { return String(n).padStart(2, '0'); }

    function getTodayRecord() {
      const k = todayKey();
      if (!appData.days[k]) appData.days[k] = { tasks: [], completed: 0 };
      return appData.days[k];
    }
    function getMonthRecord() {
      const k = monthKey();
      if (!appData.monthly[k]) appData.monthly[k] = { tasks: [] };
      return appData.monthly[k];
    }
    function getYearRecord() {
      const k = yearKey();
      if (!appData.yearly[k]) appData.yearly[k] = { tasks: [] };
      return appData.yearly[k];
    }

    function formatDate(key) {
      const [y, m, d] = key.split('-');
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    function monthName(m) {
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][parseInt(m) - 1];
    }

    function daysLeftInMonth() {
      const now = new Date();
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return last.getDate() - now.getDate();
    }
    function daysLeftInYear() {
      const now = new Date();
      const last = new Date(now.getFullYear(), 11, 31);
      const diff = last - now;
      return Math.ceil(diff / 86400000);
    }

    // 
    //  CLOCK & COUNTDOWN
    // 
    function updateClock() {
      const now = new Date();
      document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      document.getElementById('timeDisplay').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const el = document.getElementById('countdownTime');
      el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
      el.className = 'countdown-time' + (h < 1 ? ' countdown-warn' : '');
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 
    //  AUTO-DELETE CHECKS
    // 
    function checkAutoDelete() {
      const now = new Date();
      // Daily  midnight cleanup
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        const yesterday = new Date(now - 86400000);
        const k = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
        if (appData.days[k]) {
          const rec = appData.days[k];
          rec.completed = rec.tasks.filter(t => t.done).length;
          // Retain all tasks for history visibility instead of filtering out uncompleted ones
          saveData(appData);
        }
      }
      // Monthly  end of month
      const daysLeft = daysLeftInMonth();
      if (daysLeft === 0 && now.getHours() === 23 && now.getMinutes() === 59) {
        const k = monthKey();
        if (appData.monthly[k]) { appData.monthly[k].tasks = []; saveData(appData); }
      }
      // Yearly  end of year
      const dLeft = daysLeftInYear();
      if (dLeft === 0 && now.getHours() === 23 && now.getMinutes() === 59) {
        const k = yearKey();
        if (appData.yearly[k]) { appData.yearly[k].tasks = []; saveData(appData); }
      }
      renderAll();
    }
    setInterval(checkAutoDelete, 60000);

    // 
    //  PERIOD META LABELS
    // 
    function updatePeriodMeta() {
      const now = new Date();
      document.getElementById('monthlyMeta').textContent = `${monthName(pad(now.getMonth() + 1))} ${now.getFullYear()}  ${daysLeftInMonth()} days left`;
      document.getElementById('yearlyMeta').textContent = `Year ${now.getFullYear()}  ${daysLeftInYear()} days left`;
    }

    // 
    //  MOTIVATIONS
    // 
    const quotes = [
      { text: "Every completed task is a <em>victory worth celebrating</em>. Keep the momentum!", icon: "" },
      { text: "The secret to getting ahead is <em>getting started</em>. Your future self will thank you.", icon: "" },
      { text: "Focus on <em>progress, not perfection</em>. Done is better than perfect.", icon: "" },
      { text: "Small steps taken consistently lead to <em>extraordinary results</em>.", icon: "" },
      { text: "You are <em>stronger than your excuses</em>. Let's crush today's tasks!", icon: "" },
      { text: "The best time was yesterday. The <em>second best time is now</em>.", icon: "" },
      { text: "Each task you complete brings you one step closer to <em>your best self</em>.", icon: "" },
      { text: "Discipline is choosing between what you <em>want now</em> and what you <em>want most</em>.", icon: "" },
    ];

    const motivationMessages = [
      "You're doing amazing! Keep up the great work. Every task done is a win! ",
      "Halfway there? You've already beaten most people. Push through! ",
      "Your consistency is your superpower. Keep showing up! ",
      "Done a task? Reward yourself. You've earned it! ",
      "The only way out is through. Finish strong today! ",
      "Progress over perfection! Each tick is a step forward. ",
      "You started the day with goals  end it with accomplishments! ",
    ];

    function setDailyQuote() {
      const q = quotes[new Date().getDate() % quotes.length];
      document.getElementById('motivationBanner').innerHTML = `${q.icon} ${q.text}`;
    }

    function showMotivation() {
      const rec = getTodayRecord();
      const done = rec.tasks.filter(t => t.done).length;
      const total = rec.tasks.length;
      let msg = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
      if (total > 0) {
        const pct = Math.round(done / total * 100);
        msg = `You've completed ${done}/${total} tasks today (${pct}%)! ${pct >= 80 ? ' Amazing work!' : pct >= 50 ? ' Great progress!' : ' Keep going!'}`;
      }
      document.getElementById('notifMsg').textContent = msg;
      document.getElementById('notifPopup').classList.add('show');
      setTimeout(closeNotif, 6000);
      // Also fire desktop notification if enabled
      fireDesktopNotification('Tamizh Todo  Progress Update', msg);
    }
    function closeNotif() { document.getElementById('notifPopup').classList.remove('show'); }
    setInterval(() => { const r = getTodayRecord(); if (r.tasks.length > 0) showMotivation(); }, 20 * 60 * 1000);

    // 
    //  DESKTOP NOTIFICATIONS
    // 
    function requestReminder() {
      if (!('Notification' in window)) {
        document.getElementById('reminderStatus').textContent = ' Notifications not supported on this browser.';
        return;
      }
      if (Notification.permission === 'granted') {
        appData.reminderEnabled = true; saveData(appData);
        document.getElementById('reminderBtn').classList.add('active');
        document.getElementById('reminderBtn').textContent = ' Reminders Active';
        document.getElementById('reminderStatus').textContent = 'You will get reminders every hour!';
        fireDesktopNotification('Tamizh Todo', 'Reminders are now enabled! ');
        return;
      }
      if (Notification.permission === 'denied') {
        document.getElementById('reminderStatus').textContent = ' Permission denied. Enable in browser settings.';
        return;
      }
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          appData.reminderEnabled = true; saveData(appData);
          document.getElementById('reminderBtn').classList.add('active');
          document.getElementById('reminderBtn').textContent = ' Reminders Active';
          document.getElementById('reminderStatus').textContent = 'Reminders enabled! Every hour.';
          fireDesktopNotification('Tamizh Todo', 'Reminders enabled! Stay on track ');
        } else {
          document.getElementById('reminderStatus').textContent = ' Permission denied.';
        }
      });
    }

    function fireDesktopNotification(title, body) {
      if (!appData.reminderEnabled) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try { new Notification(title, { body, icon: '', badge: '' }); } catch (e) { }
    }

    function startHourlyReminder() {
      if (appData.reminderEnabled) {
        document.getElementById('reminderBtn').classList.add('active');
        document.getElementById('reminderBtn').textContent = ' Reminders Active';
        document.getElementById('reminderStatus').textContent = 'Reminders are active!';
      }
      setInterval(() => {
        const rec = getTodayRecord();
        const done = rec.tasks.filter(t => t.done).length;
        const total = rec.tasks.length;
        if (total > 0) {
          fireDesktopNotification('Tamizh Todo ', `${done}/${total} tasks done today. Keep going! `);
        } else {
          fireDesktopNotification('Tamizh Todo ', "You haven't added any tasks yet. Start planning! ");
        }
      }, 3600000);
    }

    // 
    //  SAMPLE TASKS
    // 
    const DEFAULT_SAMPLES = [
      { id: 's1', text: ' Morning meditation (10 minutes)', priority: 'medium', category: 'wellness' },
      { id: 's2', text: ' Drink 8 glasses of water', priority: 'high', category: 'health' },
      { id: 's3', text: ' Read for 30 minutes', priority: 'medium', category: 'learning' },
      { id: 's4', text: ' Exercise / walk for 20 minutes', priority: 'high', category: 'fitness' },
      { id: 's5', text: ' Clear email inbox', priority: 'medium', category: 'work' },
      { id: 's6', text: ' Clean & organise workspace', priority: 'low', category: 'home' },
      { id: 's7', text: ' Call a friend or family member', priority: 'low', category: 'social' },
      { id: 's8', text: ' Review and update weekly goals', priority: 'high', category: 'planning' },
      { id: 's9', text: ' Sleep by 10:30 PM', priority: 'medium', category: 'wellness' },
      { id: 's10', text: ' Eat at least 3 healthy meals', priority: 'medium', category: 'health' },
      { id: 's11', text: ' Journal / write about your day', priority: 'low', category: 'mindfulness' },
      { id: 's12', text: ' 1-hour phone-free focus time', priority: 'high', category: 'productivity' },
    ];

    function getSamples() {
      return appData.samples || DEFAULT_SAMPLES.map(s => ({ ...s }));
    }

    function renderSamples() {
      const samples = getSamples();
      const list = document.getElementById('sampleList');
      if (!samples.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><p>No samples left. Click Reset Samples to restore them.</p></div>`;
        return;
      }
      list.innerHTML = samples.map((s, i) => `
    <div class="todo-item p-${s.priority}" data-sid="${s.id}" style="animation-delay:${i * 0.04}s;cursor:pointer" onclick="addSampleToDaily('${s.id}')">
      <div style="font-size:1.2rem"></div>
      <div class="todo-content">
        <div class="todo-text">${escapeHtml(s.text)}</div>
        <div class="todo-meta">
          <span class="priority-badge badge-${s.priority}">${s.priority}</span>
          <span class="sample-badge">SAMPLE</span>
          <span class="todo-time">Click to add to Daily</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteSample(event,'${s.id}')"></button>
    </div>
  `).join('');
    }

    function addSampleToDaily(sid) {
      const samples = getSamples();
      const s = samples.find(x => x.id === sid);
      if (!s) return;
      const rec = getTodayRecord();
      rec.tasks.push({ id: Date.now(), text: s.text, priority: s.priority, done: false, createdAt: new Date().toISOString() });
      appData.lifetime.totalCreated++;
      saveData(appData);
      showToast(' Added to Daily tasks!');
      renderTasks('daily');
      updateStats();
    }

    function deleteSample(e, sid) {
      e.stopPropagation();
      const samples = getSamples();
      appData.samples = samples.filter(s => s.id !== sid);
      saveData(appData);
      renderSamples();
    }

    function resetSamples() {
      appData.samples = DEFAULT_SAMPLES.map(s => ({ ...s }));
      saveData(appData);
      renderSamples();
      showToast(' Samples restored!');
    }

    // 
    //  TOAST NOTIFICATION
    // 
    function showToast(msg) {
      document.getElementById('notifMsg').textContent = msg;
      document.getElementById('notifPopup').classList.add('show');
      setTimeout(closeNotif, 3000);
    }

    // 
    //  ADD TASK (universal)
    // 
    function addTask(type) {
      const inputId = { daily: 'taskInput', monthly: 'monthlyInput', yearly: 'yearlyInput' }[type];
      const selectId = { daily: 'prioritySelect', monthly: 'monthlyPriority', yearly: 'yearlyPriority' }[type];
      const input = document.getElementById(inputId);
      const text = input.value.trim();
      if (!text) { input.focus(); input.style.borderColor = 'var(--accent2)'; setTimeout(() => input.style.borderColor = '', 1000); return; }
      const priority = document.getElementById(selectId).value;
      const task = { id: Date.now(), text, priority, done: false, createdAt: new Date().toISOString() };

      if (type === 'daily') { getTodayRecord().tasks.push(task); }
      else if (type === 'monthly') { getMonthRecord().tasks.push(task); }
      else if (type === 'yearly') { getYearRecord().tasks.push(task); }

      appData.lifetime.totalCreated++;
      saveData(appData);
      input.value = '';
      input.style.borderColor = 'var(--accent3)';
      setTimeout(() => input.style.borderColor = '', 600);
      renderTasks(type);
      updateStats();
      addRipple(document.getElementById(inputId));
    }

    function addRipple(el) {
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.cssText = 'width:20px;height:20px;top:50%;left:50%;margin:-10px;';
      el.parentElement.style.position = 'relative';
      el.parentElement.appendChild(r);
      setTimeout(() => r.remove(), 700);
    }

    // 
    //  COMPLETE / DELETE TASK
    // 
    function completeTask(id, type) {
      let tasks = getTasksByType(type);
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      task.done = !task.done;
      if (task.done) { appData.lifetime.totalCompleted++; spawnConfetti(); showMotivation(); }
      else { appData.lifetime.totalCompleted = Math.max(0, appData.lifetime.totalCompleted - 1); }
      if (type === 'daily') { const r = getTodayRecord(); r.completed = r.tasks.filter(t => t.done).length; }
      saveData(appData);
      renderTasks(type);
      updateStats();
    }

    function deleteTask(id, type) {
      const item = document.querySelector(`[data-id="${id}"]`);
      if (item) {
        item.classList.add('removing');
        setTimeout(() => {
          if (type === 'daily') { const r = getTodayRecord(); r.tasks = r.tasks.filter(t => t.id !== id); r.completed = r.tasks.filter(t => t.done).length; }
          else if (type === 'monthly') { const r = getMonthRecord(); r.tasks = r.tasks.filter(t => t.id !== id); }
          else if (type === 'yearly') { const r = getYearRecord(); r.tasks = r.tasks.filter(t => t.id !== id); }
          saveData(appData);
          renderTasks(type);
          updateStats();
        }, 500);
      }
    }

    function getTasksByType(type) {
      if (type === 'daily') return getTodayRecord().tasks;
      if (type === 'monthly') return getMonthRecord().tasks;
      if (type === 'yearly') return getYearRecord().tasks;
      return [];
    }

    // 
    //  RENDER TASKS (universal)
    // 
    function renderTasks(type) {
      const listIds = { daily: 'todoList', monthly: 'monthlyList', yearly: 'yearlyList' };
      const list = document.getElementById(listIds[type]);
      const filter = currentFilter[type] || 'all';
      let tasks = [...getTasksByType(type)];
      if (filter === 'active') tasks = tasks.filter(t => !t.done);
      if (filter === 'done') tasks = tasks.filter(t => t.done);

      if (!tasks.length) {
        const empties = {
          daily: { icon: filter === 'done' ? '' : '', msg: filter === 'done' ? 'No completed tasks yet. Get going!' : 'No tasks yet. Add your first task above!' },
          monthly: { icon: '', msg: 'No monthly goals yet. Set your goals for the month!' },
          yearly: { icon: '', msg: 'No yearly aspirations yet. Dream big and add your goals!' },
        };
        const e = empties[type];
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">${e.icon}</div><p>${e.msg}</p></div>`;
        // update progress
        updateProgress(type, 0, 0);
        return;
      }

      list.innerHTML = tasks.map((task, i) => `
    <div class="todo-item ${task.done ? 'done' : ''} p-${task.priority}" data-id="${task.id}" style="animation-delay:${i * 0.05}s">
      <button class="check-btn" onclick="completeTask(${task.id},'${type}')">${task.done ? '' : ''}</button>
      <div class="todo-content">
        <div class="todo-text">${escapeHtml(task.text)}</div>
        <div class="todo-meta">
          <span class="priority-badge badge-${task.priority}">${task.priority}</span>
          <span class="todo-time">${new Date(task.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask(${task.id},'${type}')"></button>
    </div>
  `).join('');

      const allTasks = getTasksByType(type);
      const done = allTasks.filter(t => t.done).length;
      updateProgress(type, done, allTasks.length);
    }

    function updateProgress(type, done, total) {
      const rate = total > 0 ? Math.round(done / total * 100) : 0;
      if (type === 'daily') {
        document.getElementById('progressFill').style.width = rate + '%';
        document.getElementById('progressLabel').textContent = `${done} / ${total} tasks`;
      } else if (type === 'monthly') {
        document.getElementById('monthlyProgressFill').style.width = rate + '%';
        document.getElementById('monthlyProgressLabel').textContent = `${done} / ${total} goals`;
      } else if (type === 'yearly') {
        document.getElementById('yearlyProgressFill').style.width = rate + '%';
        document.getElementById('yearlyProgressLabel').textContent = `${done} / ${total} aspirations`;
      }
    }

    function filterTasks(filter, btn, type) {
      currentFilter[type] = filter;
      // update filter tab styles within same section
      const sectionId = { daily: 'section-tasks', monthly: 'section-monthly', yearly: 'section-yearly' }[type];
      document.querySelectorAll(`#${sectionId} .tabs .tab`).forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderTasks(type);
    }

    function escapeHtml(text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // 
    //  STATS
    // 
    function updateStats() {
      const rec = getTodayRecord();
      const total = rec.tasks.length;
      const done = rec.tasks.filter(t => t.done).length;
      const rate = total > 0 ? Math.round(done / total * 100) : 0;
      document.getElementById('statTotal').textContent = total;
      document.getElementById('statDone').textContent = done;
      document.getElementById('statRate').textContent = rate + '%';
      document.getElementById('statStreak').textContent = calcStreak();
      document.getElementById('progressFill').style.width = rate + '%';
      document.getElementById('progressLabel').textContent = `${done} / ${total} tasks`;
    }

    function calcStreak() {
      const days = Object.keys(appData.days).sort().reverse();
      let streak = 0; let current = new Date();
      for (let key of days) {
        const d = new Date(key);
        const diff = Math.round((current - d) / 86400000);
        if (diff > 1) break;
        if (appData.days[key].tasks.length > 0) { streak++; current = d; }
      }
      return streak;
    }

    // 
    //  CONFETTI
    // 
    function spawnConfetti() {
      const container = document.getElementById('confettiContainer');
      const colors = ['#7c6aff', '#ff6a9b', '#6affb8', '#ffb86a', '#ffffff'];
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'confetti-piece';
          el.style.cssText = `
        left:${30 + Math.random() * 40}%; top:${20 + Math.random() * 30}%;
        background:${colors[Math.floor(Math.random() * 5)]};
        width:${6 + Math.random() * 6}px; height:${6 + Math.random() * 6}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation-delay:${Math.random() * 0.4}s;
        animation-duration:${0.8 + Math.random() * 0.6}s;
      `;
          container.appendChild(el);
          setTimeout(() => el.remove(), 2000);
        }, i * 25);
      }
    }

    // 
    //  CHARTS
    // 
    Chart.defaults.color = '#7d7999';
    Chart.defaults.borderColor = '#272736';
    Chart.defaults.font.family = 'DM Sans';

    function buildWeeklyChart() {
      const labels = [], added = [], completed = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        const rec = appData.days[k];
        added.push(rec ? rec.tasks.length : 0);
        completed.push(rec ? rec.tasks.filter(t => t.done).length : 0);
      }
      const ctx = document.getElementById('weeklyChart').getContext('2d');
      if (charts.weekly) charts.weekly.destroy();
      charts.weekly = new Chart(ctx, {
        type: 'bar', data: {
          labels, datasets: [
            { label: 'Added', data: added, backgroundColor: 'rgba(94,67,243,0.35)', borderColor: '#5e43f3', borderWidth: 2, borderRadius: 8 },
            { label: 'Completed', data: completed, backgroundColor: 'rgba(0,229,255,0.35)', borderColor: '#00e5ff', borderWidth: 2, borderRadius: 8 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#7d7999', font: { size: 12 } } } }, scales: { x: { grid: { color: '#272736' } }, y: { grid: { color: '#272736' }, beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    }

    function buildPriorityChart() {
      const rec = getTodayRecord();
      const h = rec.tasks.filter(t => t.priority === 'high').length;
      const m = rec.tasks.filter(t => t.priority === 'medium').length;
      const l = rec.tasks.filter(t => t.priority === 'low').length;
      const ctx = document.getElementById('priorityChart').getContext('2d');
      if (charts.priority) charts.priority.destroy();
      charts.priority = new Chart(ctx, {
        type: 'doughnut', data: { labels: ['High', 'Medium', 'Low'], datasets: [{ data: [h || 1, m || 1, l || 1], backgroundColor: ['rgba(243,67,131,0.8)', 'rgba(255,157,0,0.8)', 'rgba(0,229,255,0.8)'], borderColor: ['#f34383', '#ff9d00', '#00e5ff'], borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#7d7999', padding: 16 } } }, cutout: '65%' }
      });
    }

    function buildYearChart() {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const year = new Date().getFullYear();
      const rates = months.map((_, mi) => {
        const keys = Object.keys(appData.days).filter(k => { const [y, m] = k.split('-'); return parseInt(y) === year && parseInt(m) === mi + 1; });
        if (!keys.length) return 0;
        const total = keys.reduce((s, k) => s + appData.days[k].tasks.length, 0);
        const done = keys.reduce((s, k) => s + appData.days[k].tasks.filter(t => t.done).length, 0);
        return total > 0 ? Math.round(done / total * 100) : 0;
      });
      const ctx = document.getElementById('yearChart').getContext('2d');
      if (charts.year) charts.year.destroy();
      charts.year = new Chart(ctx, {
        type: 'line', data: { labels: months, datasets: [{ label: 'Completion Rate %', data: rates, borderColor: '#5e43f3', backgroundColor: 'rgba(94,67,243,0.15)', fill: true, tension: 0.4, pointBackgroundColor: '#5e43f3', pointRadius: 5, pointHoverRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#272736' } }, y: { grid: { color: '#272736' }, min: 0, max: 100, ticks: { callback: v => v + '%' } } } }
      });
    }

    // 
    //  FREQUENT TASKS ANALYSIS
    // 

    // Build a full lookup: normalised text  [{date, done}]
    function buildFreqMap() {
      const freq = {};
      Object.keys(appData.days).sort().forEach(dateKey => {
        const rec = appData.days[dateKey];
        (rec.tasks || []).forEach(t => {
          const key = t.text.trim().toLowerCase().replace(/\s+/g, ' ');
          if (!freq[key]) freq[key] = { text: t.text, count: 0, doneCount: 0, priority: t.priority, history: [] };
          freq[key].count++;
          if (t.done) freq[key].doneCount++;
          freq[key].history.push({ dateKey, done: t.done });
        });
      });
      return freq;
    }

    function toggleFreqHistory(idx) {
      const el = document.getElementById('freq-history-' + idx);
      const btn = document.getElementById('freq-btn-' + idx);
      if (!el) return;
      const isOpen = el.style.display !== 'none';
      el.style.display = isOpen ? 'none' : 'block';
      btn.textContent = isOpen ? ' See History' : ' Hide History';
      btn.style.background = isOpen ? 'rgba(124,106,255,0.12)' : 'rgba(106,255,184,0.12)';
      btn.style.color = isOpen ? 'var(--accent)' : 'var(--accent3)';
      btn.style.borderColor = isOpen ? 'rgba(124,106,255,0.25)' : 'rgba(106,255,184,0.25)';
    }

    let freqPanelOpen = false;
    function toggleFreqPanel() {
      const panel = document.getElementById('frequentTasksList');
      const arrow = document.getElementById('freqToggleArrow');
      const btn   = document.getElementById('freqToggleBtn');
      freqPanelOpen = !freqPanelOpen;

      if (freqPanelOpen) {
        // Load data fresh each open
        renderFrequentTasks();
        panel.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
        arrow.style.color = 'var(--accent)';
        btn.style.background = 'linear-gradient(135deg, rgba(124,106,255,0.25), rgba(255,106,155,0.18))';
        btn.style.borderColor = 'var(--accent)';
        btn.style.boxShadow = '0 0 20px rgba(124,106,255,0.25)';
      } else {
        panel.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
        arrow.style.color = 'var(--muted)';
        btn.style.background = 'linear-gradient(135deg, rgba(124,106,255,0.15), rgba(255,106,155,0.1))';
        btn.style.borderColor = 'rgba(124,106,255,0.35)';
        btn.style.boxShadow = 'none';
      }
    }

    function renderFrequentTasks() {
      const container = document.getElementById('frequentTasksList');
      const freq = buildFreqMap();
      const sorted = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 10);

      if (!sorted.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><p>No history data yet. Start adding tasks daily!</p></div>`;
        return;
      }

      const maxCount = sorted[0].count;
      const medals = ['', '', ''];
      const rankColors = ['var(--accent4)', 'var(--muted)', '#cd7f32'];

      container.innerHTML = sorted.map((item, i) => {
        const pct = Math.round((item.count / maxCount) * 100);
        const donePct = item.count > 0 ? Math.round((item.doneCount / item.count) * 100) : 0;
        const barColor = donePct >= 80
          ? 'linear-gradient(90deg, var(--accent3), var(--accent))'
          : donePct >= 50
            ? 'linear-gradient(90deg, var(--accent4), var(--accent3))'
            : 'linear-gradient(90deg, var(--accent2), var(--accent4))';
        const rankLabel = i < 3 ? medals[i] : `#${i + 1}`;
        const rankColor = i < 3 ? rankColors[i] : 'var(--muted)';

        // Build per-day history rows (most recent first)
        const histRows = [...item.history].reverse().map(h => {
          const icon = h.done ? '' : '';
          const statusColor = h.done ? 'var(--accent3)' : 'var(--muted)';
          const statusLabel = h.done ? 'Completed' : 'Not done';
          return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.8rem;">
            <span style="font-size:1rem">${icon}</span>
            <span style="flex:1;color:var(--text)">${formatDate(h.dateKey)}</span>
            <span style="color:${statusColor};font-weight:600">${statusLabel}</span>
          </div>`;
        }).join('');

        return `
        <div class="freq-item" style="animation-delay:${i * 0.06}s">
          <div class="freq-item-top">
            <div class="freq-rank" style="color:${rankColor}">${rankLabel}</div>
            <div class="freq-text">${escapeHtml(item.text)}</div>
            <div class="freq-meta">
              <span class="freq-count-badge">${item.count} times</span>
              <span class="freq-done-badge"> ${donePct}%</span>
              <button id="freq-btn-${i}"
                onclick="toggleFreqHistory(${i})"
                style="
                  background:rgba(124,106,255,0.12);
                  border:1px solid rgba(124,106,255,0.25);
                  color:var(--accent);
                  border-radius:8px;
                  padding:4px 10px;
                  font-size:0.72rem;
                  font-family:'DM Sans',sans-serif;
                  font-weight:600;
                  cursor:pointer;
                  white-space:nowrap;
                  transition:all 0.2s;
                "> See History</button>
            </div>
          </div>
          <div class="freq-bar-track" style="margin-bottom:0">
            <div class="freq-bar-fill" style="width:${pct}%; background:${barColor}"></div>
          </div>
          <div id="freq-history-${i}" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:8px;">
            <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Day-by-day record</div>
            ${histRows || '<div style="font-size:0.8rem;color:var(--muted);padding:6px 0">No records found.</div>'}
          </div>
        </div>`;
      }).join('');
    }

    // 
    //  DATA SECTION
    // 
    function renderDataSection() {
      const days = Object.keys(appData.days).sort().reverse();
      const activeDays = days.filter(k => appData.days[k].tasks.length > 0);
      document.getElementById('dataTotal').textContent = appData.lifetime.totalCreated;
      document.getElementById('dataCompleted').textContent = appData.lifetime.totalCompleted;
      document.getElementById('dataBestStreak').textContent = calcStreak() + ' days';
      document.getElementById('dataActiveDays').textContent = activeDays.length;
      // Reset freq panel to collapsed state each time data section opens
      freqPanelOpen = false;
      const panel = document.getElementById('frequentTasksList');
      const arrow = document.getElementById('freqToggleArrow');
      const freqBtn = document.getElementById('freqToggleBtn');
      if (panel) panel.style.display = 'none';
      if (arrow) { arrow.style.transform = 'rotate(0deg)'; arrow.style.color = 'var(--muted)'; }
      if (freqBtn) { freqBtn.style.background = 'linear-gradient(135deg, rgba(124,106,255,0.15), rgba(255,106,155,0.1))'; freqBtn.style.borderColor = 'rgba(124,106,255,0.35)'; freqBtn.style.boxShadow = 'none'; }
      const list = document.getElementById('historyList');
      if (!activeDays.length) { list.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><p>No history yet. Start adding tasks!</p></div>`; return; }
      list.innerHTML = activeDays.slice(0, 30).map(key => {
        const rec = appData.days[key];
        const total = rec.tasks.length;
        const done = rec.tasks.filter(t => t.done).length;
        const rate = total > 0 ? Math.round(done / total * 100) : 0;
        const isToday = key === todayKey();
        const taskListHtml = rec.tasks.map(t => `<div style="font-size: 0.85rem; color: ${t.done ? 'var(--muted)' : 'var(--text)'}; text-decoration: ${t.done ? 'line-through' : 'none'}; padding: 4px 0; display: flex; align-items: center; justify-content: space-between;">
          <div> ${escapeHtml(t.text)}</div>
          <span class="priority-badge badge-${t.priority}" style="font-size:0.55rem; margin-left: 6px; flex-shrink: 0;">${t.priority}</span>
        </div>`).join('');
        
        return `<div class="history-entry" style="cursor:pointer; flex-direction: column; align-items: stretch; ${isToday ? 'border-color:var(--accent);' : ''}" onclick="toggleHistoryTasks('${key}')">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="history-date"><strong>${formatDate(key)}${isToday ? ' (Today)' : ''}</strong><span>${total} tasks added</span></div>
        <div class="history-stats">
          <div class="h-stat"><div class="h-stat-num" style="color:var(--accent3)">${done}</div><div class="h-stat-label">Done</div></div>
          <div class="h-stat"><div class="h-stat-num" style="color:var(--accent4)">${rate}%</div><div class="h-stat-label">Rate</div></div>
        </div>
      </div>
      <div class="history-tasks-detail" id="history-tasks-${key}" style="display:none; width:100%; margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
        ${taskListHtml || '<div style="font-size:0.85rem; color:var(--muted)">No tasks recorded for this day.</div>'}
      </div>
    </div>`;
      }).join('');
    }

    function toggleHistoryTasks(key) {
      const el = document.getElementById('history-tasks-' + key);
      if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
      }
    }

    // 
    //  YEAR GRID
    // 
    function renderYearGrid() {
      const year = new Date().getFullYear();
      document.getElementById('yearBadge').textContent = year;
      const grid = document.getElementById('yearGrid');
      const today = todayKey();
      const startOfYear = new Date(year, 0, 1);
      const days = [];
      for (let i = 0; i < 366; i++) { const d = new Date(startOfYear); d.setDate(d.getDate() + i); if (d.getFullYear() !== year) break; days.push(d); }
      grid.innerHTML = days.map(d => {
        const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const rec = appData.days[k];
        const isFuture = d > new Date();
        const isToday = k === today;
        const total = rec ? rec.tasks.length : 0;
        const done = rec ? rec.tasks.filter(t => t.done).length : 0;
        const rate = total > 0 ? done / total : 0;
        const opacity = total > 0 ? 0.2 + rate * 0.8 : 0;
        return `<div class="year-cell ${rec && total > 0 ? 'has-data' : ''} ${isToday ? 'today' : ''}" style="${isFuture ? 'opacity:0.3;' : ''}" title="${k}: ${total} tasks, ${done} done">
      <div class="year-cell-fill" style="background:var(--accent3);opacity:${opacity};"></div>
    </div>`;
      }).join('');
    }

    // 
    //  TAB SWITCHING
    // 
    function switchTab(tab, btn) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tabs > .tab').forEach(t => t.classList.remove('active'));
      document.getElementById('section-' + tab).classList.add('active');
      btn.classList.add('active');
      if (tab === 'graph') { buildWeeklyChart(); buildPriorityChart(); }
      if (tab === 'data') renderDataSection();
      if (tab === 'year') { buildYearChart(); renderYearGrid(); }
      if (tab === 'samples') renderSamples();
      if (tab === 'monthly') renderTasks('monthly');
      if (tab === 'yearly') renderTasks('yearly');
      updatePeriodMeta();
    }

    // 
    //  KEY HANDLERS
    // 
    document.getElementById('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask('daily'); });
    document.getElementById('monthlyInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask('monthly'); });
    document.getElementById('yearlyInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask('yearly'); });

    // 
    //  RENDER ALL
    // 
    function renderAll() {
      setDailyQuote();
      renderTasks('daily');
      renderTasks('monthly');
      renderTasks('yearly');
      renderSamples();
      updateStats();
      updatePeriodMeta();
    }

    // 
    //  INIT
    // 
    renderAll();
    startHourlyReminder();

    // Demo tasks on first visit
    if (Object.keys(appData.days).length === 0) {
      const rec = getTodayRecord();
      [
        { text: "Welcome to Tamizh Todo! Complete your first task ", priority: "high" },
        { text: "Try adding your own tasks above", priority: "medium" },
        { text: "Check the Monthly & Yearly tabs for long-term goals", priority: "low" },
        { text: "Click Graph tab to see your progress charts", priority: "medium" },
      ].forEach((d, i) => {
        rec.tasks.push({ id: Date.now() + i, text: d.text, priority: d.priority, done: false, createdAt: new Date().toISOString() });
        appData.lifetime.totalCreated++;
      });
      saveData(appData);
      renderAll();
    }

    // Show motivation after 3s
    setTimeout(() => { const r = getTodayRecord(); if (r.tasks.length > 0) showMotivation(); }, 3000);

    // 
    //  AI CHATBOT ENGINE
    // 
    let chatOpen = false;

    function toggleChatbot() {
      chatOpen = !chatOpen;
      const panel = document.getElementById('chatbotPanel');
      const fab   = document.getElementById('chatbotFab');
      panel.classList.toggle('open', chatOpen);
      fab.classList.toggle('open', chatOpen);
      if (chatOpen) {
        document.getElementById('chatInput').focus();
        scrollChatBottom();
      }
    }

    function scrollChatBottom() {
      const msgs = document.getElementById('chatMessages');
      setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);
    }

    function addChatMsg(role, html) {
      const msgs = document.getElementById('chatMessages');
      const now = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
      const isUser = role === 'user';
      const div = document.createElement('div');
      div.className = `chat-msg ${role}`;
      div.innerHTML = `
        <div class="chat-msg-avatar">${isUser ? '' : '<img src="optimus.png" style="width:22px;height:22px;border-radius:50%;object-fit:cover;">'}</div>
        <div>
          <div class="chat-bubble">${html}</div>
          <div class="chat-time">${now}</div>
        </div>`;
      msgs.appendChild(div);
      scrollChatBottom();
    }

    function showTyping() {
      const msgs = document.getElementById('chatMessages');
      const el = document.createElement('div');
      el.className = 'chat-msg bot'; el.id = 'typingIndicator';
      el.innerHTML = `<div class="chat-msg-avatar"><img src="optimus.png" style="width:22px;height:22px;border-radius:50%;object-fit:cover;"></div>
        <div class="typing-indicator">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>`;
      msgs.appendChild(el);
      scrollChatBottom();
    }
    function hideTyping() { const el = document.getElementById('typingIndicator'); if (el) el.remove(); }

    function sendChatChip(text) {
      document.getElementById('chatInput').value = text;
      sendChat();
    }

    function sendChat() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addChatMsg('user', escapeHtml(text));
      showTyping();
      setTimeout(() => {
        hideTyping();
        const reply = chatbotRespond(text);
        addChatMsg('bot', reply);
      }, 700 + Math.random() * 400);
    }

    //  Core AI Response Engine 
    function chatbotRespond(msg) {
      const m = msg.toLowerCase();
      const rec   = getTodayRecord();
      const today = rec.tasks;
      const done  = today.filter(t => t.done);
      const pending = today.filter(t => !t.done);
      const rate  = today.length > 0 ? Math.round(done.length / today.length * 100) : 0;
      const streak = calcStreak();
      const allDays = Object.keys(appData.days).sort();
      const activeDays = allDays.filter(k => (appData.days[k].tasks || []).length > 0);

      //  GREETING 
      if (/^(hi|hello|hey|yo|good\s*(morning|evening|afternoon|night)|namaste)/.test(m)) {
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        return `<strong>${greet}! </strong>I'm your personal Todo AI. I know everything about your tasks and habits!<br><br>You can ask me things like:<br><ul><li>What did I do today?</li><li>What are my most frequent tasks?</li><li>Show my streak</li><li>What should I improve?</li><li>How am I doing this month?</li></ul>`;
      }

      //  HELP 
      if (/help|what can you|what do you|commands/.test(m)) {
        return `<strong>Here's what I can tell you </strong><ul><li> Today's tasks & progress</li><li> Monthly / Yearly goals</li><li> Streak & active days</li><li> Most frequent tasks</li><li> Stats & success rate</li><li> Improvement suggestions</li><li> Pending / incomplete tasks</li><li> Best completions</li><li> Weekly performance</li></ul>Just ask naturally!`;
      }

      //  TODAY 
      if (/today|daily|current|right now|this day/.test(m)) {
        if (!today.length) return `You haven't added any tasks for today yet! <br>Head over to the <strong>Daily</strong> tab and start planning your day.`;
        const doneList = done.map(t => `<li> ${escapeHtml(t.text)}</li>`).join('');
        const pendList = pending.map(t => `<li> ${escapeHtml(t.text)}</li>`).join('');
        const emoji = rate >= 80 ? '' : rate >= 50 ? '' : '';
        return `<strong>Today's Tasks ${emoji} (${rate}% done)</strong>
          ${doneList ? `Done:<ul>${doneList}</ul>` : ''}
          ${pendList ? `Still pending:<ul>${pendList}</ul>` : ''}
          ${!pendList ? ' All done for today!' : `${pending.length} task${pending.length > 1 ? 's' : ''} left!`}`;
      }

      //  PENDING 
      if (/pending|not done|incomplete|remaining|left|unfinished/.test(m)) {
        if (!pending.length) return today.length ? ' <strong>Amazing!</strong> You have no pending tasks today. Everything is done!' : 'No tasks added today yet. Start planning! ';
        return `<strong> ${pending.length} Pending Task${pending.length > 1 ? 's' : ''} Today</strong><ul>${pending.map(t => `<li>${escapeHtml(t.text)} <span style="font-size:0.72rem;color:var(--accent4)">[${t.priority}]</span></li>`).join('')}</ul>Get going  you can do it! `;
      }

      //  COMPLETED 
      if (/complet|done|finish|achiev|accomplish/.test(m)) {
        if (!done.length) return `You haven't completed any tasks today yet. <br>Your first completion unlocks confetti! `;
        return `<strong> ${done.length} Completed Today!</strong><ul>${done.map(t => `<li>${escapeHtml(t.text)}</li>`).join('')}</ul>Total lifetime completions: <strong style="color:var(--accent3)">${appData.lifetime.totalCompleted}</strong> `;
      }

      //  STREAK 
      if (/streak|consecutive|row|days in a row/.test(m)) {
        const best = appData.lifetime.bestStreak || streak;
        return streak > 0
          ? `<strong> Current Streak: ${streak} day${streak > 1 ? 's' : ''}!</strong>You've been active for <strong>${streak}</strong> consecutive day${streak > 1 ? 's' : ''}.<br>Best streak ever: <strong style="color:var(--accent4)">${best} days</strong><br>${streak >= 7 ? ' Incredible consistency!' : streak >= 3 ? ' Keep it up!' : ' Build the habit  keep going tomorrow!'}`
          : `Your streak is at 0 right now. <br>Add and complete at least one task today to start building a streak! `;
      }

      //  STATS / SUMMARY 
      if (/stats|statistic|summary|overview|performance|how am i|how i am|report/.test(m)) {
        const monthRec = getMonthRecord();
        const mDone = monthRec.tasks.filter(t => t.done).length;
        const yearRec = getYearRecord();
        const yDone = yearRec.tasks.filter(t => t.done).length;
        return `<strong> Your Performance Summary</strong>
          <ul>
            <li>Today: <strong>${done.length}/${today.length}</strong> tasks (${rate}%)</li>
            <li>Monthly goals: <strong>${mDone}/${monthRec.tasks.length}</strong> done</li>
            <li>Yearly goals: <strong>${yDone}/${yearRec.tasks.length}</strong> done</li>
            <li>Lifetime tasks: <strong>${appData.lifetime.totalCreated}</strong></li>
            <li>Lifetime completed: <strong>${appData.lifetime.totalCompleted}</strong></li>
            <li>Active days: <strong>${activeDays.length}</strong></li>
            <li>Streak: <strong>${streak} days </strong></li>
          </ul>`;
      }

      //  SUCCESS RATE 
      if (/success rate|completion rate|percentage|percent/.test(m)) {
        const totCreated = appData.lifetime.totalCreated;
        const totDone = appData.lifetime.totalCompleted;
        const lifeRate = totCreated > 0 ? Math.round(totDone / totCreated * 100) : 0;
        return `<strong> Success Rate</strong>
          <ul>
            <li>Today: <strong style="color:var(--accent3)">${rate}%</strong></li>
            <li>Lifetime: <strong style="color:var(--accent4)">${lifeRate}%</strong> (${totDone}/${totCreated})</li>
          </ul>
          ${lifeRate >= 80 ? ' Outstanding performance!' : lifeRate >= 60 ? ' Great work overall!' : ' Room to grow  keep pushing!'}`;
      }

      //  MONTHLY 
      if (/month|monthly/.test(m)) {
        const mr = getMonthRecord();
        const mDone = mr.tasks.filter(t => t.done).length;
        const mRate = mr.tasks.length > 0 ? Math.round(mDone / mr.tasks.length * 100) : 0;
        if (!mr.tasks.length) return 'You have no monthly goals set yet! <br>Go to the <strong>Monthly</strong> tab and set your goals for this month.';
        return `<strong> This Month's Goals</strong><ul>${mr.tasks.map(t => `<li>${t.done ? '' : ''} ${escapeHtml(t.text)}</li>`).join('')}</ul>Progress: <strong style="color:var(--accent2)">${mDone}/${mr.tasks.length} (${mRate}%)</strong>`;
      }

      //  YEARLY 
      if (/year|yearly|annual/.test(m)) {
        const yr = getYearRecord();
        const yDone = yr.tasks.filter(t => t.done).length;
        const yRate = yr.tasks.length > 0 ? Math.round(yDone / yr.tasks.length * 100) : 0;
        if (!yr.tasks.length) return 'No yearly aspirations set yet! <br>Go to the <strong>Yearly</strong> tab and dream big!';
        return `<strong> This Year's Goals</strong><ul>${yr.tasks.map(t => `<li>${t.done ? '' : ''} ${escapeHtml(t.text)}</li>`).join('')}</ul>Progress: <strong style="color:var(--accent3)">${yDone}/${yr.tasks.length} (${yRate}%)</strong>`;
      }

      //  FREQUENT / HABIT 
      if (/frequent|habit|often|common|repeat|most.*task|task.*most/.test(m)) {
        const freq = buildFreqMap();
        const sorted = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5);
        if (!sorted.length) return 'No history to analyse yet! Add tasks daily and I\'ll track your habits. ';
        const medals = ['','','','4','5'];
        return `<strong> Your Top Habits</strong><ul>${sorted.map((t, i) => `<li>${medals[i]} ${escapeHtml(t.text)} <span style="font-size:0.72rem;color:var(--accent)">${t.count}</span> <span style="font-size:0.72rem;color:var(--accent3)">${Math.round(t.doneCount/t.count*100)}% done</span></li>`).join('')}</ul>`;
      }

      //  IMPROVE / SUGGESTIONS 
      if (/improve|suggest|tip|advice|better|weak|struggle|pattern|insight/.test(m)) {
        const freq = buildFreqMap();
        const sorted = Object.values(freq).sort((a, b) => b.count - a.count);
        const tips = [];
        // Low-completion recurring tasks
        const lowComp = sorted.filter(t => t.count >= 2 && (t.doneCount / t.count) < 0.5);
        if (lowComp.length) tips.push(` <strong>Struggling with recurring tasks:</strong> "${escapeHtml(lowComp[0].text)}" repeated ${lowComp[0].count} but only ${Math.round(lowComp[0].doneCount/lowComp[0].count*100)}% completion. Consider breaking it into smaller steps.`);
        // Streak building
        if (streak < 3) tips.push(' <strong>Build your streak:</strong> You haven\'t built a consistent streak yet. Set a reminder and add at least 1 task every day.');
        // High-priority incomplete
        const highPending = today.filter(t => !t.done && t.priority === 'high');
        if (highPending.length) tips.push(` <strong>High priority pending:</strong> You still have ${highPending.length} high-priority task${highPending.length > 1 ? 's' : ''} today. These should be your next focus!`);
        // Completion rate
        const lifeRate = appData.lifetime.totalCreated > 0 ? Math.round(appData.lifetime.totalCompleted / appData.lifetime.totalCreated * 100) : 0;
        if (lifeRate < 60 && appData.lifetime.totalCreated > 5) tips.push(' <strong>Improve completion rate:</strong> Your lifetime rate is ' + lifeRate + '%. Try adding fewer, more focused tasks each day.');
        // Monthly goal reminder
        const mr = getMonthRecord();
        if (!mr.tasks.length) tips.push(' <strong>Add monthly goals:</strong> You have no monthly goals set. Planning ahead greatly improves productivity!');
        if (!mr.tasks.length) tips.push(' <strong>Add monthly goals:</strong> You have no monthly goals set. Planning ahead greatly improves productivity!');
        if (!tips.length) tips.push(' <strong>You\' doing great!</strong> Keep up your current pace, maintain the streak, and keep completing high-priority tasks first.');
        return `<strong> Personalised Improvement Tips</strong><br><br>${tips.join('<br><br>')}`;
      }

      //  PRIORITY 
      if (/priority|high|urgent|important/.test(m)) {
        const high   = today.filter(t => t.priority === 'high');
        const hDone  = high.filter(t => t.done);
        const hPend  = high.filter(t => !t.done);
        if (!high.length) return 'No high-priority tasks today. You can set priority when adding tasks. ';
        return `<strong> High Priority Today (${high.length})</strong><ul>${hDone.map(t => `<li> ${escapeHtml(t.text)}</li>`).join('')}${hPend.map(t => `<li> ${escapeHtml(t.text)}</li>`).join('')}</ul>${hPend.length ? ` ${hPend.length} high-priority still pending!` : ' All high-priority done!'}`;
      }

      //  ACTIVE DAYS 
      if (/active day|how many day|days used|day count/.test(m)) {
      }

      //  BEST DAY 
      if (/best day|most productive|top day/.test(m)) {
        let bestKey = '', bestRate = -1;
        activeDays.forEach(k => {
          const r = appData.days[k];
          const pct = r.tasks.length > 0 ? r.tasks.filter(t => t.done).length / r.tasks.length : 0;
          if (pct > bestRate) { bestRate = pct; bestKey = k; }
        });
        if (!bestKey) return 'No history yet to determine your best day. Start tracking! ';
        const br = appData.days[bestKey];
        return `<strong> Your Best Day</strong><br><strong>${formatDate(bestKey)}</strong>  ${Math.round(bestRate*100)}% completion rate (${br.tasks.filter(t=>t.done).length}/${br.tasks.length} tasks). Keep chasing that level every day!`;
      }

      //  MOTIVATION 
      if (/motivat|inspire|quote|boost|encourage/.test(m)) {
        const q = quotes[new Date().getDate() % quotes.length];
        return `${q.icon} ${q.text}<br><br>You've got this!  Keep adding tasks and building momentum.`;
      }

      //  LIFETIME 
      if (/lifetime|all time|ever|total|since start/.test(m)) {
        return `<strong> Lifetime Stats</strong><ul><li>Total Created: <strong style="color:var(--accent)">${appData.lifetime.totalCreated}</strong></li><li>Total Completed: <strong style="color:var(--accent3)">${appData.lifetime.totalCompleted}</strong></li><li>Active Days: <strong style="color:var(--accent2)">${activeDays.length}</strong></li><li>Current Streak: <strong style="color:var(--accent4)">${streak} </strong></li></ul>`;
      }

      //  DEFAULT 
      const suggestions = ['today\'s tasks', 'my streak', 'tips to improve', 'frequent tasks', 'my stats', 'monthly goals', 'yearly goals'];
      const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
      return `I'm not sure about that, but I can help! Try asking about:<br><ul><li>"Show ${pick}"</li><li>"What should I improve?"</li><li>"How am I doing?"</li><li>"Best day ever"</li></ul>Type <strong>help</strong> to see everything I can do! `;
    }

    // Init chatbot welcome message
    (function () {
      const msgs = document.getElementById('chatMessages');
      const rec = getTodayRecord();
      const done = rec.tasks.filter(t => t.done).length;
      const total = rec.tasks.length;
      const greeting = total > 0
        ? `Hey!  You have <strong>${total} task${total>1?'s':''}</strong> today  <strong style="color:var(--accent3)">${done} done</strong>. Ask me anything about your data!`
        : `Hey!  No tasks added today yet. Ask me anything or explore your history! Type <strong>help</strong> to see what I can do.`;
      setTimeout(() => {
        addChatMsg('bot', greeting);
      }, 200);
    })();


// ============================================================
//  AVATAR + AUTH + CLOUD SYNC
// ============================================================

var ANIME_AVATARS = [
  { emoji: '\uD83E\uDD77', name: 'Shadow Ninja' },
  { emoji: '\uD83E\uDDD9', name: 'Arcane Mage' },
  { emoji: '\uD83E\uDD8A', name: 'Nine-Tails' },
  { emoji: '\uD83D\uDC09', name: 'Dragon Lord' },
  { emoji: '\uD83D\uDC79', name: 'Oni Slayer' },
  { emoji: '\uD83E\uDDB8', name: 'Hero Class' },
  { emoji: '\uD83E\uDDB9', name: 'Dark Villain' },
  { emoji: '\uD83E\uDDDB', name: 'Night Walker' },
  { emoji: '\uD83E\uDD16', name: 'Mecha Proto' },
  { emoji: '\uD83C\uDF38', name: 'Sakura Spirit' }
];

var authToken    = localStorage.getItem('tamizh_todo_token');
var authUsername = localStorage.getItem('tamizh_todo_username');
var userAvatar   = localStorage.getItem('tamizh_todo_avatar') || '';
var selectedAvatarEmoji = '';

// ---- Header Button ----------------------------------------
function setUserBtn(username) {
  var btn = document.getElementById('userAccountBtn');
  if (!btn) return;
  if (username) {
    var av = localStorage.getItem('tamizh_todo_avatar') || '\uD83D\uDC64';
    btn.textContent = av;
    btn.title = 'Logged in as ' + username + ' (click to view profile)';
    btn.classList.add('logged-in');
  } else {
    btn.textContent = '\uD83D\uDC64';
    btn.title = 'Login / Sign up';
    btn.classList.remove('logged-in');
  }
}

// ---- Profile Dropdown ------------------------------------
function toggleProfileDropdown() {
  if (!authToken) { toggleAuthModal(true); return; }
  var dropdown = document.getElementById('profileDropdown');
  if (!dropdown) return;

  var isOpen = dropdown.classList.contains('open');
  if (isOpen) {
    dropdown.classList.remove('open');
    return;
  }

  // Fill stats
  var rec   = getTodayRecord();
  var done  = rec.tasks.filter(function(t){ return t.done; }).length;
  var total = rec.tasks.length;
  var streak = calcStreak();

  var av = localStorage.getItem('tamizh_todo_avatar') || '\uD83D\uDC64';
  document.getElementById('pdAvatar').textContent   = av;
  document.getElementById('pdUsername').textContent = authUsername || 'User';
  document.getElementById('pdTasksToday').textContent  = total;
  document.getElementById('pdDoneToday').textContent   = done;
  document.getElementById('pdStreakPd').textContent    = streak;
  document.getElementById('pdLifetime').textContent    = appData.lifetime ? appData.lifetime.totalCreated : 0;

  dropdown.classList.add('open');

  // Close when clicking outside
  setTimeout(function() {
    document.addEventListener('click', function closeDropdown(e) {
      var wrap = document.getElementById('profileDropdownWrap');
      if (wrap && !wrap.contains(e.target)) {
        dropdown.classList.remove('open');
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 50);
}

// ---- Avatar Picker ---------------------------------------
function showAvatarPicker(mandatory) {
  userAvatar = localStorage.getItem('tamizh_todo_avatar') || '';
  selectedAvatarEmoji = userAvatar;

  var overlay = document.getElementById('avatarPickerOverlay');
  if (!overlay) return;

  // Build grid
  var grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';
  ANIME_AVATARS.forEach(function(ch) {
    var div = document.createElement('div');
    div.className = 'avatar-opt' + (ch.emoji === selectedAvatarEmoji ? ' selected' : '');
    div.title = ch.name;
    div.innerHTML = '<div class="avatar-opt-emoji">' + ch.emoji + '</div><div class="avatar-opt-name">' + ch.name + '</div>';
    div.onclick = function() {
      document.querySelectorAll('.avatar-opt').forEach(function(el){ el.classList.remove('selected'); });
      div.classList.add('selected');
      selectedAvatarEmoji = ch.emoji;
    };
    grid.appendChild(div);
  });

  // Hide skip button if mandatory (first login)
  document.getElementById('avatarSkipBtn').style.display = mandatory ? 'none' : 'inline-block';

  overlay.classList.add('show');
}

function confirmAvatar() {
  if (!selectedAvatarEmoji) return showToast('Pick a character first!');
  localStorage.setItem('tamizh_todo_avatar', selectedAvatarEmoji);
  userAvatar = selectedAvatarEmoji;
  setUserBtn(authUsername);
  document.getElementById('avatarPickerOverlay').classList.remove('show');
  spawnConfetti();
  showToast('Avatar set! Looking great, ' + authUsername + '!');
}

function skipAvatar() {
  if (!localStorage.getItem('tamizh_todo_avatar')) {
    localStorage.setItem('tamizh_todo_avatar', '\uD83E\uDD77'); // default: ninja
    userAvatar = '\uD83E\uDD77';
    setUserBtn(authUsername);
  }
  document.getElementById('avatarPickerOverlay').classList.remove('show');
}

// ---- Toggle auth modal -----------------------------------
function toggleAuthModal(force) {
  if (force === undefined) force = false;
  var overlay  = document.getElementById('authModalOverlay');
  var closeBtn = document.getElementById('authCloseBtn');

  if (overlay.classList.contains('show') && !force) {
    if (!authToken) return;
    overlay.classList.remove('show');
  } else {
    overlay.classList.add('show');
    closeBtn.style.display = authToken ? 'block' : 'none';
    if (authToken) {
      document.getElementById('profileUsername').textContent = authUsername || 'User';
      switchAuthView('profile');
    } else {
      switchAuthView('login');
    }
  }
}

// ---- Switch form views ----------------------------------
function switchAuthView(view) {
  ['loginForm', 'registerForm', 'profileForm'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  var target = document.getElementById(view + 'Form');
  if (target) target.style.display = 'block';

  var titles = { login: 'Welcome Back', register: 'Create Account', profile: 'Your Account' };
  document.getElementById('authTitle').textContent = titles[view] || '';
}

// ---- Toggle password visibility -------------------------
function togglePw(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '&#x1F648;'; // monkey closed eye
  } else {
    inp.type = 'password';
    btn.innerHTML = '&#x1F441;&#xFE0F;'; // eye
  }
}

// ---- API helper ----------------------------------------
async function apiRequest(endpoint, body) {
  try {
    var headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

    var API_BASE = (window.location.origin.includes('localhost') ||
                    window.location.protocol === 'file:')
                   ? 'http://localhost:3000'
                   : window.location.origin;

    var res  = await fetch(API_BASE + endpoint, {
      method:  body ? 'POST' : 'GET',
      headers: headers,
      body:    body ? JSON.stringify(body) : undefined
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    showToast('Error: ' + err.message);
    throw err;
  }
}

// ---- Register ------------------------------------------
async function submitRegister(e) {
  if (e) e.preventDefault();
  var username = document.getElementById('regUsername').value.trim();
  var password = document.getElementById('regPassword').value;
  if (!username || !password) return showToast('Please enter username and password.');
  if (username.length < 3)   return showToast('Username must be at least 3 characters.');
  if (password.length < 6)   return showToast('Password must be at least 6 characters.');

  try {
    var res = await apiRequest('/api/auth/register', { username: username, password: password });
    authToken    = res.token;
    authUsername = res.username;
    localStorage.setItem('tamizh_todo_token',    authToken);
    localStorage.setItem('tamizh_todo_username', authUsername);
    applyLoginGate();
    toggleAuthModal();
    fetchDataFromCloud();
    showToast('Welcome, ' + authUsername + '! Now pick your character!');
    // Show avatar picker (mandatory on first register)
    setTimeout(function() { showAvatarPicker(true); }, 400);
  } catch (e) {
    if (e.message && e.message.includes('already taken')) {
      alert("âš ï¸ This username is already taken by another user! Please choose a different username.");
      document.getElementById('regUsername').focus(); // Select the box for them
    }
  }
}

// ---- Login ---------------------------------------------
async function submitLogin(e) {
  if (e) e.preventDefault();
  var username = document.getElementById('loginUsername').value.trim();
  var password = document.getElementById('loginPassword').value;
  if (!username || !password) return showToast('Please enter username and password.');

  try {
    var res = await apiRequest('/api/auth/login', { username: username, password: password });
    authToken    = res.token;
    authUsername = res.username;
    localStorage.setItem('tamizh_todo_token',    authToken);
    localStorage.setItem('tamizh_todo_username', authUsername);
    setUserBtn(authUsername);
    showToast('Welcome back, ' + authUsername + '!');
    applyLoginGate();
    toggleAuthModal();
    fetchDataFromCloud();
  } catch (e) {
    // Check if the specific "Username not found" error occurred
    if (e.message && e.message.includes('Username not found')) {
      alert("Account not found! ðŸš€ Please switch to 'Sign Up' to create your account.");
      switchAuthView('register');
      // Pre-fill the username they attempted to log in with
      var regUser = document.getElementById('regUsername');
      if (regUser) regUser.value = document.getElementById('loginUsername').value;
    }
  }
}

// ---- Logout --------------------------------------------
function submitLogout() {
  authToken    = null;
  authUsername = null;
  localStorage.removeItem('tamizh_todo_token');
  localStorage.removeItem('tamizh_todo_username');
  localStorage.removeItem('tamizh_todo_avatar');
  setUserBtn(null);
  document.getElementById('profileDropdown').classList.remove('open');
  showToast('Logged out successfully.');
  applyLoginGate();
  setTimeout(function() { toggleAuthModal(true); }, 400);
}

// ---- Cloud sync save ------------------------------------
var syncTimeout;
function syncDataToCloud(data) {
  if (!authToken) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async function() {
    try { await apiRequest('/api/data/sync', { data: data }); }
    catch (e) { console.error('Cloud sync failed', e); }
  }, 1500);
}

// ---- Cloud sync fetch -----------------------------------
async function fetchDataFromCloud() {
  if (!authToken) return;
  try {
    var res = await apiRequest('/api/data/sync');
    if (res.data) {
      appData = res.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      renderAll();
      showToast('Data synced from cloud!');
    } else {
      syncDataToCloud(appData);
    }
  } catch (e) {
    if (e.message && (e.message.includes('Access denied') || e.message.includes('expired'))) {
      submitLogout();
    }
  }
}

// ---- Login gate -----------------------------------------
function applyLoginGate() {
  var main      = document.querySelector('.container');
  var footer    = document.querySelector('.site-footer');
  var chatFab   = document.getElementById('chatbotFab');
  var chatPanel = document.getElementById('chatbotPanel');

  if (!authToken) {
    if (main)      { main.style.filter = 'blur(6px) brightness(0.4)'; main.style.pointerEvents = 'none'; main.style.userSelect = 'none'; }
    if (footer)    footer.style.display = 'none';
    if (chatFab)   chatFab.style.display = 'none';
    if (chatPanel) chatPanel.style.display = 'none';
  } else {
    if (main)      { main.style.filter = ''; main.style.pointerEvents = ''; main.style.userSelect = ''; }
    if (footer)    footer.style.display = '';
    if (chatFab)   chatFab.style.display = '';
    if (chatPanel) chatPanel.style.display = '';
  }
}

// ---- Init -----------------------------------------------
if (authToken) {
  setUserBtn(authUsername);
  fetchDataFromCloud();
  applyLoginGate();
}

setTimeout(function() {
  if (!authToken) {
    applyLoginGate();
    toggleAuthModal(true);
  }
}, 4000);



