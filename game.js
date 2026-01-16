// Основные переменные игры
class Game {
    constructor() {
        this.resources = {
            rna: 100,
            atp: 50,
            particles: 10
        };
        
        this.stats = {
            infectivity: 1.0,
            replicationRate: 1,
            stealth: 1.0,
            infectedCells: 0
        };
        
        this.cells = [];
        this.viruses = [];
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.upgrades = {
            infectivity: { level: 1, cost: 50 },
            replication: { level: 1, cost: 100 },
            stealth: { level: 1, cost: 75 },
            divide: { cost: 30 }
        };
        
        // Иммунная система
        this.immunity = {
            level: 0,
            max: 100,
            responseActive: false
        };
        
        // Инфекция текущей клетки
        this.infection = {
            progress: 0,
            max: 100
        };
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Создаем клетки
        this.createCells();
        
        // Создаем начальные вирусы
        this.createInitialViruses();
        
        // Назначаем обработчики событий
        this.setupEventListeners();
        
        // Запускаем игровой цикл
        requestAnimationFrame((time) => this.gameLoop(time));
        
        // Запускаем пассивный доход
        setInterval(() => this.passiveIncome(), 1000);
    }
    
    createCells() {
        const cellCount = 15;
        const padding = 50;
        
        for (let i = 0; i < cellCount; i++) {
            this.cells.push({
                x: padding + Math.random() * (this.canvas.width - 2 * padding),
                y: padding + Math.random() * (this.canvas.height - 2 * padding),
                radius: 20 + Math.random() * 15,
                infected: false,
                infectionProgress: 0,
                color: '#4a4aff'
            });
        }
    }
    
    createInitialViruses() {
        for (let i = 0; i < 5; i++) {
            this.viruses.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 3,
                targetCell: null,
                speed: 0.5 + Math.random() * 0.5,
                color: '#ff4757'
            });
        }
    }
    
    setupEventListeners() {
        // Кнопка атаки
        document.getElementById('attackBtn').addEventListener('click', () => this.attackCell());
        
        // Кнопки улучшений
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.buyUpgrade(e.target));
        });
        
        // Клик по canvas для атаки конкретной клетки
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.attackSpecificCell(x, y);
        });
    }
    
    attackCell() {
        if (this.resources.particles > 0) {
            // Тратим вирусные частицы
            this.resources.particles--;
            
            // Увеличиваем прогресс инфекции
            this.infection.progress += 5 * this.stats.infectivity;
            
            // Увеличиваем иммунный ответ
            this.immunity.level += 3 / this.stats.stealth;
            
            // Добавляем РНК за атаку
            this.resources.rna += Math.floor(5 * this.stats.infectivity);
            
            // Создаем новую вирусную частицу
            this.viruses.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 3,
                targetCell: null,
                speed: 0.5 + Math.random() * 0.5,
                color: '#ff4757'
            });
            
            // Обновляем интерфейс
            this.updateUI();
            
            // Проверяем, заполнена ли клетка
            if (this.infection.progress >= this.infection.max) {
                this.infectNewCell();
            }
            
            // Проверяем иммунный ответ
            if (this.immunity.level >= this.immunity.max && !this.immunity.responseActive) {
                this.activateImmuneResponse();
            }
        }
    }
    
    attackSpecificCell(x, y) {
        // Находим ближайшую клетку
        let nearestCell = null;
        let minDist = Infinity;
        
        for (const cell of this.cells) {
            const dx = cell.x - x;
            const dy = cell.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < cell.radius && dist < minDist) {
                minDist = dist;
                nearestCell = cell;
            }
        }
        
        if (nearestCell && this.resources.particles > 0) {
            this.resources.particles--;
            
            if (!nearestCell.infected) {
                nearestCell.infectionProgress += 10 * this.stats.infectivity;
                
                if (nearestCell.infectionProgress >= 100) {
                    nearestCell.infected = true;
                    nearestCell.color = '#ff4757';
                    this.stats.infectedCells++;
                    this.resources.rna += 50; // Награда за заражение клетки
                }
            }
            
            // Направляем вирус к клетке
            for (const virus of this.viruses) {
                if (!virus.targetCell) {
                    virus.targetCell = nearestCell;
                    break;
                }
            }
            
            this.updateUI();
        }
    }
    
    infectNewCell() {
        // Сбрасываем прогресс
        this.infection.progress = 0;
        
        // Увеличиваем счетчик зараженных клеток
        this.stats.infectedCells++;
        
        // Награда за заражение
        this.resources.rna += 100;
        this.resources.atp += 50;
        this.resources.particles += 10;
        
        // Обновляем интерфейс
        this.updateUI();
        
        // Визуальный эффект
        document.getElementById('infectionBar').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('infectionBar').classList.remove('pulse');
        }, 500);
    }
    
    activateImmuneResponse() {
        this.immunity.responseActive = true;
        
        // Иммунный ответ снижает эффективность
        const originalInfectivity = this.stats.infectivity;
        this.stats.infectivity *= 0.5;
        
        // Обновляем интерфейс
        this.updateUI();
        
        // Иммунный ответ длится 10 секунд
        setTimeout(() => {
            this.immunity.responseActive = false;
            this.stats.infectivity = originalInfectivity;
            this.immunity.level = 0;
            this.updateUI();
        }, 10000);
    }
    
    buyUpgrade(button) {
        const upgradeId = button.closest('.upgrade').id;
        const cost = parseInt(button.getAttribute('data-cost'));
        const type = button.getAttribute('data-type');
        
        if (this.resources[type] >= cost) {
            // Тратим ресурсы
            this.resources[type] -= cost;
            
            // Применяем улучшение
            switch (upgradeId) {
                case 'upgrade-infectivity':
                    this.stats.infectivity += 0.2;
                    this.upgrades.infectivity.level++;
                    this.upgrades.infectivity.cost = Math.floor(this.upgrades.infectivity.cost * 1.5);
                    button.innerHTML = `<i class="fas fa-dna"></i> ${this.upgrades.infectivity.cost} РНК`;
                    break;
                    
                case 'upgrade-replication':
                    this.stats.replicationRate += 1;
                    this.upgrades.replication.level++;
                    this.upgrades.replication.cost = Math.floor(this.upgrades.replication.cost * 1.5);
                    button.innerHTML = `<i class="fas fa-dna"></i> ${this.upgrades.replication.cost} РНК`;
                    break;
                    
                case 'upgrade-stealth':
                    this.stats.stealth += 0.1;
                    this.upgrades.stealth.level++;
                    this.upgrades.stealth.cost = Math.floor(this.upgrades.stealth.cost * 1.5);
                    button.innerHTML = `<i class="fas fa-bolt"></i> ${this.upgrades.stealth.cost} АТФ`;
                    break;
                    
                case 'upgrade-divide':
                    this.resources.particles += 5;
                    break;
            }
            
            // Обновляем интерфейс
            this.updateUI();
            
            // Визуальный эффект
            button.classList.add('pulse');
            setTimeout(() => {
                button.classList.remove('pulse');
            }, 300);
        }
    }
    
    passiveIncome() {
        // Пассивный доход АТФ
        this.resources.atp += this.stats.replicationRate;
        
        // Обновляем интерфейс
        this.updateUI();
    }
    
    updateUI() {
        // Обновляем ресурсы
        document.getElementById('rna').textContent = Math.floor(this.resources.rna);
        document.getElementById('atp').textContent = Math.floor(this.resources.atp);
        document.getElementById('particles').textContent = Math.floor(this.resources.particles);
        
        // Обновляем прогресс-бары
        document.getElementById('infectionBar').style.width = 
            (this.infection.progress / this.infection.max * 100) + '%';
        
        document.getElementById('immunityBar').style.width = 
            (this.immunity.level / this.immunity.max * 100) + '%';
        
        // Обновляем статистику
        document.getElementById('stat-infectivity').textContent = 
            this.stats.infectivity.toFixed(1);
        document.getElementById('stat-replication').textContent = 
            this.stats.replicationRate;
        document.getElementById('stat-stealth').textContent = 
            Math.floor(this.stats.stealth * 100) + '%';
        document.getElementById('stat-infected').textContent = 
            this.stats.infectedCells;
        
        // Обновляем доступность кнопок
        this.updateButtons();
    }
    
    updateButtons() {
        document.querySelectorAll('.buy-btn').forEach(btn => {
            const type = btn.getAttribute('data-type');
            const cost = parseInt(btn.getAttribute('data-cost'));
            
            if (this.resources[type] >= cost) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        });
        
        const attackBtn = document.getElementById('attackBtn');
        if (this.resources.particles > 0) {
            attackBtn.disabled = false;
        } else {
            attackBtn.disabled = true;
        }
    }
    
    update(deltaTime) {
        // Обновляем вирусы
        for (let i = this.viruses.length - 1; i >= 0; i--) {
            const virus = this.viruses[i];
            
            if (virus.targetCell) {
                // Двигаемся к целевой клетке
                const dx = virus.targetCell.x - virus.x;
                const dy = virus.targetCell.y - virus.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 1) {
                    virus.x += (dx / dist) * virus.speed;
                    virus.y += (dy / dist) * virus.speed;
                } else {
                    // Достигли клетки
                    if (!virus.targetCell.infected) {
                        virus.targetCell.infectionProgress += 2 * this.stats.infectivity;
                        
                        if (virus.targetCell.infectionProgress >= 100) {
                            virus.targetCell.infected = true;
                            virus.targetCell.color = '#ff4757';
                            this.stats.infectedCells++;
                            this.resources.rna += 50;
                        }
                    }
                    
                    // Удаляем вирус после достижения цели
                    this.viruses.splice(i, 1);
                }
            } else {
                // Случайное движение
                virus.x += (Math.random() - 0.5) * virus.speed;
                virus.y += (Math.random() - 0.5) * virus.speed;
                
                // Ограничение в пределах canvas
                virus.x = Math.max(virus.radius, Math.min(this.canvas.width - virus.radius, virus.x));
                virus.y = Math.max(virus.radius, Math.min(this.canvas.height - virus.radius, virus.y));
            }
        }
    }
    
    render() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем клетки
        for (const cell of this.cells) {
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
            
            if (cell.infected) {
                // Зараженная клетка
                this.ctx.fillStyle = cell.color;
                this.ctx.fill();
                
                // Эффект пульсации для зараженных клеток
                this.ctx.strokeStyle = '#ff3838';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                // Незараженная клетка
                this.ctx.fillStyle = cell.color;
                this.ctx.fill();
                
                // Прогресс заражения
                if (cell.infectionProgress > 0) {
                    this.ctx.strokeStyle = '#ff4757';
                    this.ctx.lineWidth = 3;
                    this.ctx.stroke();
                    
                    // Процент заражения
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        `${Math.min(100, Math.floor(cell.infectionProgress))}%`,
                        cell.x,
                        cell.y + 4
                    );
                }
            }
            
            // Ядро клетки
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = cell.infected ? '#ff6b6b' : '#6c5ce7';
            this.ctx.fill();
        }
        
        // Рисуем вирусы
        for (const virus of this.viruses) {
            this.ctx.beginPath();
            this.ctx.arc(virus.x, virus.y, virus.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = virus.color;
            this.ctx.fill();
            
            // Шипы вируса
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const spikeLength = virus.radius * 2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(
                    virus.x + Math.cos(angle) * virus.radius,
                    virus.y + Math.sin(angle) * virus.radius
                );
                this.ctx.lineTo(
                    virus.x + Math.cos(angle) * (virus.radius + spikeLength),
                    virus.y + Math.sin(angle) * (virus.radius + spikeLength)
                );
                this.ctx.strokeStyle = virus.color;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
        
        // Отображаем иммунный ответ, если активен
        if (this.immunity.responseActive) {
            this.ctx.fillStyle = 'rgba(74, 74, 255, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                'ИММУННЫЙ ОТВЕТ!',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
    }
    
    gameLoop(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Обновляем игровую логику
        this.update(this.deltaTime);
        
        // Рендерим графику
        this.render();
        
        // Продолжаем цикл
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Запускаем игру при загрузке страницы
window.addEventListener('load', () => {
    new Game();
});
