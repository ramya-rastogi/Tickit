// ===== DATA MANAGEMENT =====
        class TaskManager {
            constructor() {
                this.tasks = {};
                this.editingTaskId = null;
                this.charts = {};
            }

            addTask(title, description) {
                const task = {
                    id: Date.now().toString(),
                    title,
                    description,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                this.tasks[task.id] = task;
                return task;
            }

            updateTask(id, updates) {
                if (this.tasks[id]) {
                    this.tasks[id] = { ...this.tasks[id], ...updates };
                    return this.tasks[id];
                }
                return null;
            }

            deleteTask(id) {
                delete this.tasks[id];
            }

            toggleComplete(id) {
                if (this.tasks[id]) {
                    this.tasks[id].completed = !this.tasks[id].completed;
                    return this.tasks[id];
                }
                return null;
            }

            getActiveTasks() {
                return Object.values(this.tasks).filter(t => !t.completed);
            }

            getCompletedTasks() {
                return Object.values(this.tasks).filter(t => t.completed);
            }

            getAllTasks() {
                return Object.values(this.tasks);
            }

            getStats() {
                const all = this.getAllTasks();
                const completed = this.getCompletedTasks();
                const active = this.getActiveTasks();
                const total = all.length;
                const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

                return {
                    total,
                    active: active.length,
                    completed: completed.length,
                    completionRate
                };
            }
        }

        const taskManager = new TaskManager();

        // ===== NAVIGATION =====
        function initNavigation() {
            const navLinks = document.querySelectorAll('.nav-links a');
            const sections = document.querySelectorAll('.section');

            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetSection = link.dataset.section;
                    navigateToSection(targetSection);
                });
            });

            // Stat card navigation
            document.querySelectorAll('[data-navigate]').forEach(card => {
                card.addEventListener('click', () => {
                    navigateToSection(card.dataset.navigate);
                });
            });
        }

        function navigateToSection(sectionId) {
            const sections = document.querySelectorAll('.section');
            const navLinks = document.querySelectorAll('.nav-links a');
            const targetSection = document.getElementById(sectionId);

            // Update active nav link
            navLinks.forEach(link => {
                if (link.dataset.section === sectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Animate section transition
            sections.forEach(section => {
                if (section.id === sectionId) {
                    section.style.display = 'block';
                    gsap.fromTo(section, 
                        { opacity: 0, y: 30 },
                        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
                    );
                    section.classList.add('active');
                    
                    // Update analytics charts when navigating to analytics
                    if (sectionId === 'analytics') {
                        updateCharts();
                    }
                } else {
                    gsap.to(section, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            section.style.display = 'none';
                            section.classList.remove('active');
                        }
                    });
                }
            });
        }

        // ===== TASK UI =====
        function renderTasks() {
            const activeTasks = taskManager.getActiveTasks();
            const completedTasks = taskManager.getCompletedTasks();

            renderTaskList('active-tasks-list', activeTasks, false);
            renderTaskList('completed-tasks-list', completedTasks, true);
            updateTaskCounts();
            updateProgress();
            updateHomeStats();
        }

        function renderTaskList(containerId, tasks, isCompleted) {
            const container = document.getElementById(containerId);
            
            if (tasks.length === 0) {
                const emptyIcon = isCompleted ? '🎉' : '📝';
                const emptyText = isCompleted ? 'No completed tasks yet. Keep going!' : 'No active tasks. Add one to get started!';
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">${emptyIcon}</div>
                        <p>${emptyText}</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = tasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-content">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="task-btn complete" onclick="completeTask('${task.id}')" title="Complete">✓</button>
                            <button class="task-btn edit" onclick="editTask('${task.id}')" title="Edit">✎</button>
                        ` : ''}
                        <button class="task-btn delete" onclick="deleteTask('${task.id}')" title="Delete">✕</button>
                    </div>
                </div>
            `).join('');

            // Animate new tasks
            gsap.from(`#${containerId} .task-item`, {
                opacity: 0,
                x: -20,
                duration: 0.4,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }

        function updateTaskCounts() {
            const stats = taskManager.getStats();
            document.getElementById('active-count').textContent = stats.active;
            document.getElementById('completed-count').textContent = stats.completed;
        }

        function updateProgress() {
            const stats = taskManager.getStats();
            const progressBar = document.getElementById('progress-bar');
            
            gsap.to(progressBar, {
                width: `${stats.completionRate}%`,
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: function() {
                    const currentWidth = Math.round(parseFloat(progressBar.style.width) || 0);
                    progressBar.textContent = `${currentWidth}%`;
                }
            });
        }

        function updateHomeStats() {
            const stats = taskManager.getStats();
            
            animateNumber('home-total-tasks', stats.total);
            animateNumber('home-active-tasks', stats.active);
            animateNumber('home-completed-tasks', stats.completed);
            
            const rateElement = document.getElementById('home-completion-rate');
            rateElement.textContent = `${stats.completionRate}%`;

            // Update recent activity
            updateRecentActivity();
        }

        function updateRecentActivity() {
            const container = document.getElementById('recent-tasks');
            const allTasks = taskManager.getAllTasks();
            
            if (allTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎯</div>
                        <p>No recent activity. Start by creating your first task!</p>
                    </div>
                `;
                return;
            }

            // Sort by creation date and take last 3 tasks
            const recentTasks = allTasks
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3);

            container.innerHTML = recentTasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}" style="cursor: pointer;" onclick="navigateToSection('tasks')">
                    <div class="task-content">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${task.completed ? '✓ Completed' : '⏳ Active'}
                    </div>
                </div>
            `).join('');
        }

        function animateNumber(elementId, targetValue) {
            const element = document.getElementById(elementId);
            const currentValue = parseInt(element.textContent) || 0;
            
            gsap.to({ value: currentValue }, {
                value: targetValue,
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: function() {
                    element.textContent = Math.round(this.targets()[0].value);
                }
            });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ===== TASK ACTIONS =====
        function completeTask(id) {
            const taskElement = document.querySelector(`[data-task-id="${id}"]`);
            
            // Animate completion
            gsap.to(taskElement, {
                scale: 0.95,
                opacity: 0.5,
                duration: 0.3,
                onComplete: () => {
                    taskManager.toggleComplete(id);
                    renderTasks();
                    updateCharts();
                }
            });
        }

        function editTask(id) {
            const task = taskManager.tasks[id];
            if (!task) return;

            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('submit-btn').textContent = 'Update Task';
            document.getElementById('cancel-edit-btn').style.display = 'block';
            
            taskManager.editingTaskId = id;

            // Scroll to form
            document.querySelector('.task-input-section').scrollIntoView({ behavior: 'smooth' });
        }

        function deleteTask(id) {
            const taskElement = document.querySelector(`[data-task-id="${id}"]`);
            
            // Animate deletion
            gsap.to(taskElement, {
                x: 50,
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                    taskManager.deleteTask(id);
                    renderTasks();
                    updateCharts();
                }
            });
        }

        function cancelEdit() {
            taskManager.editingTaskId = null;
            document.getElementById('task-form').reset();
            document.getElementById('submit-btn').textContent = 'Add Task';
            document.getElementById('cancel-edit-btn').style.display = 'none';
        }

        // ===== FORM HANDLING =====
        function initTaskForm() {
            const form = document.getElementById('task-form');
            const cancelBtn = document.getElementById('cancel-edit-btn');

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const title = document.getElementById('task-title').value.trim();
                const description = document.getElementById('task-description').value.trim();

                if (!title) return;

                if (taskManager.editingTaskId) {
                    // Update existing task
                    taskManager.updateTask(taskManager.editingTaskId, { title, description });
                    cancelEdit();
                } else {
                    // Add new task
                    taskManager.addTask(title, description);
                    form.reset();
                }

                renderTasks();
                updateCharts();

                // Animate form submission
                gsap.from('.task-input-section', {
                    scale: 1.05,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1
                });
            });

            cancelBtn.addEventListener('click', cancelEdit);
        }

        // ===== CHARTS =====
        function initCharts() {
            // Donut Chart
            const donutCtx = document.getElementById('donut-chart').getContext('2d');
            taskManager.charts.donut = new Chart(donutCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Active'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: [
                            'rgba(0, 255, 136, 0.8)',
                            'rgba(0, 212, 255, 0.8)'
                        ],
                        borderColor: [
                            'rgba(0, 255, 136, 1)',
                            'rgba(0, 212, 255, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#a0aec0',
                                font: {
                                    size: 14
                                },
                                padding: 20
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });

            // Bar Chart - Tasks completed over last 7 days
            const barCtx = document.getElementById('bar-chart').getContext('2d');
            taskManager.charts.bar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: getLast7Days(),
                    datasets: [{
                        label: 'Tasks Completed',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(184, 41, 255, 0.8)',
                        borderColor: 'rgba(184, 41, 255, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#a0aec0',
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#a0aec0'
                            },
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#a0aec0',
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }

        function updateCharts() {
            const stats = taskManager.getStats();

            // Update donut chart
            if (taskManager.charts.donut) {
                taskManager.charts.donut.data.datasets[0].data = [stats.completed, stats.active];
                taskManager.charts.donut.update();
            }

            // Update bar chart with completion trend
            if (taskManager.charts.bar) {
                const completionTrend = getCompletionTrend();
                taskManager.charts.bar.data.datasets[0].data = completionTrend;
                taskManager.charts.bar.update();
            }
        }

        function getLast7Days() {
            const days = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                days.push(dayNames[date.getDay()]);
            }
            
            return days;
        }

        function getCompletionTrend() {
            // Simulate completion trend based on current tasks
            // In a real app, this would track actual completion dates
            const stats = taskManager.getStats();
            const trend = [0, 0, 0, 0, 0, 0, 0];
            
            // Distribute completed tasks across the week for demo
            if (stats.completed > 0) {
                const tasksPerDay = Math.floor(stats.completed / 7);
                const remainder = stats.completed % 7;
                
                for (let i = 0; i < 7; i++) {
                    trend[i] = tasksPerDay;
                    if (i < remainder) trend[i]++;
                }
            }
            
            return trend;
        }

        // ===== INITIALIZATION =====
        function init() {
            initNavigation();
            initTaskForm();
            initCharts();
            renderTasks();
            updateCharts();

            // Animate hero on load
            gsap.from('.hero', {
                opacity: 0,
                y: 50,
                duration: 1,
                ease: 'power2.out'
            });

            gsap.from('.stat-card', {
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.15,
                delay: 0.3,
                ease: 'power2.out'
            });

            // Add some demo tasks if no tasks exist
            if (taskManager.getAllTasks().length === 0) {
                taskManager.addTask('Welcome to TaskFlow!', 'This is your first task. Click the complete button to mark it as done.');
                taskManager.addTask('Explore the Analytics', 'Check out the analytics section to see visual insights about your tasks.');
                taskManager.addTask('Try editing a task', 'Click the edit button on any task to modify it.');
                renderTasks();
                updateCharts();
            }
        }

        // Start the app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }