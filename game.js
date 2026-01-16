// Основные переменные игры - ОБНОВЛЕНО
class Game {
    constructor() {
        // Ресурсы
        this.resources = {
            rna: 100,
            atp: 50,
            particles: 10,
            mutationPoints: 0
        };
        
        // Характеристики вируса - ТЕПЕРЬ МЕНЯЮТСЯ
        this.stats = {
            infectivity: 1.0,    // Урон при захвате
            speed: 2.0,          // Скорость движения (пикселей/кадр)
            replication: 1,      // Пассивный доход АТФ
            stealth: 1.0,        // Замедление иммунитета
            maxHealth: 100,      // Макс. здоровье вируса
            currentHealth: 100   // Текущее здоровье
        };
        
        // Система мутаций
        this.mutations = {
            available: [
                { id: 'spike', name: 'Острые шипы', cost: 3, effect: { infectivity: 0.3 }, description: '+30% к урону', unlocked: false },
                { id: 'flagella', name: 'Жгутики', cost: 2, effect: { speed: 0.5 }, description: '+50% к скорости', unlocked: false },
                { id: 'membrane', name: 'Прочная мембрана', cost: 4, effect: { maxHealth: 50 }, description: '+50 к здоровью', unlocked: false },
                { id: 'stealth', name: 'Скрытная оболочка', cost: 5, effect: { stealth: 0.2 }, description: '+20% к скрытности', unlocked: false },
                { id: 'splitter', name: 'Способность к делению', cost: 8, effect: {}, description: 'Автоматическое создание частиц', unlocked: false }
            ],
            active: []
        };
        
        // Игровые объекты
        this.cells = [];
        this.viruses = [];
        this.playerVirus = null; // Главный управляемый вирус
        this.keys = {}; // Состояние клавиш
        
        // Прогресс и сложность
        this.infectedCells = 0;
        this.totalCells = 0;
        this.difficultyLevel = 1;
        this.gamePhase = 'exploration'; // 'exploration' или 'capture'
        
        // Мини-игра захвата
        this.captureGame = {
            active: false,
            targetCell: null,
            progress: 0,
            maxProgress: 100,
            requiredClicks: 10,
            clicksDone: 0,
            timer: null,
            timeLimit: 5000 // 5 секунд на захват
        };
        
        // Иммунная система (становится сложнее)
        this.immunity = {
            level: 1,
            active: false,
            responseTimer: 0,
            antibodies: []
        };
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        // Создаем клетки
        this.createCells();
        
        // Создаем игрока
        this.createPlayerVirus();
        
        // Создаем обычные вирусы
        this.createVirusParticles();
        
        // Назначаем обработчики
        this.setupEventListeners();
        
        // Начинаем игровой цикл
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
        
        // Пассивный доход
        setInterval(() => this.passiveIncome(), 1000);
        
        // Сложность растет со временем
        setInterval(() => this.increaseDifficulty(), 30000); // Каждые 30 секунд
    }
    
    createCells() {
        const cellCount = 20;
        this.totalCells = cellCount;
        
        for (let i = 0; i < cellCount; i++) {
            this.cells.push({
                id: i,
                x: 50 + Math.random() * (this.canvas.width - 100),
                y: 50 + Math.random() * (this.canvas.height - 100),
                radius: 15 + Math.random() * 20,
                type: Math.random() > 0.8 ? 'immune' : 'normal', // 20% иммунных клеток
                infected: false,
                infectionProgress: 0,
                color: '#4a4aff',
                health: 100
            });
        }
    }
    
    createPlayerVirus() {
        this.playerVirus = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            color: '#ff4757',
            rotation: 0,
            isInvulnerable: false,
            invulnerabilityTimer: 0
        };
    }
    
    createVirusParticles() {
        for (let i = 0; i < 3; i++) {
            this.viruses.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 4,
                speed: 0.3 + Math.random() * 0.5,
                color: '#ff6b81',
                targetCell: null
            });
        }
    }
    
    setupEventListeners() {
        // Управление клавиатурой
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') this.spaceAction(); // Пробел для действий
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Клик для мини-игры захвата
        this.canvas.addEventListener('click', (e) => {
            if (this.captureGame.active) {
                this.captureCellClick();
            }
        });
        
        // Кнопки улучшений
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.buyUpgrade(e.target));
        });
        
        // Кнопки мутаций
        document.getElementById('mutateBtn')?.addEventListener('click', () => this.openMutationMenu());
    }
    
    // ===== ОСНОВНОЙ ИГРОВОЙ ЦИКЛ =====
    gameLoop(currentTime) {
        const deltaTime = Math.min(currentTime - this.lastTime, 100) / 16;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Управление игроком
        this.handlePlayerInput(deltaTime);
        
        // Обновление обычных вирусов
        this.updateVirusParticles(deltaTime);
        
        // Проверка столкновений
        this.checkCollisions();
        
        // Обновление мини-игры захвата
        if (this.captureGame.active) {
            this.updateCaptureGame(deltaTime);
        }
        
        // Обновление иммунной системы
        this.updateImmuneSystem(deltaTime);
        
        // Обновление инвизов (если есть)
        if (this.playerVirus.isInvulnerable) {
            this.playerVirus.invulnerabilityTimer -= deltaTime;
            if (this.playerVirus.invulnerabilityTimer <= 0) {
                this.playerVirus.isInvulnerable = false;
            }
        }
    }
    
    // ===== УПРАВЛЕНИЕ С WASD =====
    handlePlayerInput(deltaTime) {
        if (!this.playerVirus || this.captureGame.active) return;
        
        const speed = this.stats.speed * deltaTime;
        
        if (this.keys['w'] || this.keys['arrowup']) this.playerVirus.y -= speed;
        if (this.keys['s'] || this.keys['arrowdown']) this.playerVirus.y += speed;
        if (this.keys['a'] || this.keys['arrowleft']) this.playerVirus.x -= speed;
        if (this.keys['d'] || this.keys['arrowright']) this.playerVirus.x += speed;
        
        // Границы поля
        this.playerVirus.x = Math.max(this.playerVirus.radius, 
            Math.min(this.canvas.width - this.playerVirus.radius, this.playerVirus.x));
        this.playerVirus.y = Math.max(this.playerVirus.radius, 
            Math.min(this.canvas.height - this.playerVirus.radius, this.playerVirus.y));
        
        // Вращение для эффекта движения
        this.playerVirus.rotation += 0.1 * deltaTime;
    }
    
    spaceAction() {
        // Специальная атака пробелом
        if (this.resources.particles >= 5) {
            this.resources.particles -= 5;
            this.createExplosion(this.playerVirus.x, this.playerVirus.y);
            this.updateUI();
        }
    }
    
    // ===== МИНИ-ИГРА ЗАХВАТА КЛЕТКИ =====
    checkCollisions() {
        if (!this.playerVirus || this.captureGame.active) return;
        
        for (const cell of this.cells) {
            if (cell.infected) continue;
            
            const dx = cell.x - this.playerVirus.x;
            const dy = cell.y - this.playerVirus.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = cell.radius + this.playerVirus.radius;
            
            if (distance < minDistance && !this.playerVirus.isInvulnerable) {
                this.startCaptureGame(cell);
                break;
            }
        }
    }
    
    startCaptureGame(cell) {
        this.gamePhase = 'capture';
        this.captureGame.active = true;
        this.captureGame.targetCell = cell;
        this.captureGame.progress = 0;
        this.captureGame.clicksDone = 0;
        
        // Таймер на захват
        this.captureGame.timer = setTimeout(() => {
            if (this.captureGame.active) {
                this.endCaptureGame(false); // Не успели
            }
        }, this.captureGame.timeLimit);
        
        // Показываем интерфейс мини-игры
        this.showCaptureUI();
        
        // Урон игроку от иммунных клеток
        if (cell.type === 'immune') {
            this.playerVirus.currentHealth -= 20;
            if (this.playerVirus.currentHealth <= 0) {
                this.gameOver();
            }
        }
    }
    
    captureCellClick() {
        if (!this.captureGame.active) return;
        
        this.captureGame.clicksDone++;
        this.captureGame.progress = (this.captureGame.clicksDone / this.captureGame.requiredClicks) * 100;
        
        // Визуальный эффект клика
        this.createClickEffect(this.captureGame.targetCell.x, this.captureGame.targetCell.y);
        
        // Проверка победы
        if (this.captureGame.clicksDone >= this.captureGame.requiredClicks) {
            this.endCaptureGame(true);
        }
        
        this.updateCaptureUI();
    }
    
    endCaptureGame(success) {
        this.captureGame.active = false;
        this.gamePhase = 'exploration';
        clearTimeout(this.captureGame.timer);
        this.hideCaptureUI();
        
        if (success) {
            this.infectCell(this.captureGame.targetCell);
            
            // Откат игрока от клетки
            this.playerVirus.x += (this.playerVirus.x - this.captureGame.targetCell.x) * 0.5;
            this.playerVirus.y += (this.playerVirus.y - this.captureGame.targetCell.y) * 0.5;
            this.playerVirus.isInvulnerable = true;
            this.playerVirus.invulnerabilityTimer = 30;
        }
    }
    
    infectCell(cell) {
        cell.infected = true;
        cell.color = '#ff4757';
        this.infectedCells++;
        
        // Награда за захват
        this.resources.rna += 50 * this.stats.infectivity;
        this.resources.atp += 25;
        this.resources.particles += 5;
        this.resources.mutationPoints += 1;
        
        // Проверка на повышение сложности
        if (this.infectedCells % 5 === 0) {
            this.difficultyLevel++;
            this.onDifficultyIncrease();
        }
        
        this.updateUI();
    }
    
    // ===== СИСТЕМА МУТАЦИЙ И ЭВОЛЮЦИИ =====
    openMutationMenu() {
        const menu = document.getElementById('mutationMenu');
        if (!menu) return;
        
        // Заполняем меню доступными мутациями
        const list = menu.querySelector('.mutation-list');
        list.innerHTML = '';
        
        this.mutations.available.forEach(mutation => {
            if (mutation.unlocked) return;
            
            const item = document.createElement('div');
            item.className = 'mutation-item';
            item.innerHTML = `
                <h4>${mutation.name}</h4>
                <p>${mutation.description}</p>
                <button class="mutate-btn" data-id="${mutation.id}" 
                        ${this.resources.mutationPoints >= mutation.cost ? '' : 'disabled'}>
                    Купить (${mutation.cost} очков мутации)
                </button>
            `;
            list.appendChild(item);
        });
        
        menu.style.display = 'block';
        
        // Обработчики кнопок покупки
        list.querySelectorAll('.mutate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mutationId = e.target.dataset.id;
                this.buyMutation(mutationId);
                menu.style.display = 'none';
            });
        });
    }
    
    buyMutation(mutationId) {
        const mutation = this.mutations.available.find(m => m.id === mutationId);
        if (!mutation || mutation.unlocked || this.resources.mutationPoints < mutation.cost) return;
        
        this.resources.mutationPoints -= mutation.cost;
        mutation.unlocked = true;
        this.mutations.active.push(mutationId);
        
        // Применяем эффект мутации
        Object.entries(mutation.effect).forEach(([stat, value]) => {
            if (stat === 'maxHealth') {
                this.stats[stat] += value;
                this.stats.currentHealth += value;
            } else {
                this.stats[stat] += value;
            }
        });
        
        // Особые способности
        switch(mutationId) {
            case 'splitter':
                // Автоматическое создание частиц каждые 10 сек
                setInterval(() => {
                    if (this.gamePhase === 'exploration') {
                        this.resources.particles += 2;
                        this.updateUI();
                    }
                }, 10000);
                break;
        }
        
        this.updateUI();
        this.showMutationEffect(mutation.name);
    }
    
    // ===== ПРОГРЕССИВНАЯ СЛОЖНОСТЬ =====
    increaseDifficulty() {
        if (this.difficultyLevel < 10) {
            this.difficultyLevel++;
            this.onDifficultyIncrease();
        }
    }
    
    onDifficultyIncrease() {
        // Усиление иммунной системы
        this.immunity.level += 0.5;
        
        // Создание новых иммунных клеток
        if (Math.random() > 0.7) {
            this.createImmuneCell();
        }
        
        // Усиление существующих иммунных клеток
        this.cells.forEach(cell => {
            if (cell.type === 'immune') {
                cell.health += 20;
                cell.radius += 3;
            }
        });
        
        // Сообщение о повышении сложности
        this.showMessage(`Сложность увеличена! Уровень ${this.difficultyLevel}`);
    }
    
    createImmuneCell() {
        this.cells.push({
            id: this.cells.length,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: 25,
            type: 'immune',
            infected: false,
            color: '#2d2dff',
            health: 150
        });
        this.totalCells++;
    }
    
    // ===== ИММУННАЯ СИСТЕМА =====
    updateImmuneSystem(deltaTime) {
        if (!this.immunity.active && this.infectedCells > 3) {
            // Активация иммунного ответа при достаточном заражении
            this.immunity.active = true;
            this.showMessage('Иммунная система активирована!');
        }
        
        if (this.immunity.active) {
            this.immunity.responseTimer += deltaTime;
            
            // Каждые 5 секунд создаем антитела
            if (this.immunity.responseTimer > 300) {
                this.createAntibody();
                this.immunity.responseTimer = 0;
            }
            
            // Антитела преследуют игрока
            this.updateAntibodies(deltaTime);
        }
    }
    
    createAntibody() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: x = 0; y = Math.random() * this.canvas.height; break;
            case 1: x = this.canvas.width; y = Math.random() * this.canvas.height; break;
            case 2: x = Math.random() * this.canvas.width; y = 0; break;
            case 3: x = Math.random() * this.canvas.width; y = this.canvas.height; break;
        }
        
        this.immunity.antibodies.push({
            x, y,
            radius: 6,
            speed: 1 + this.immunity.level * 0.3,
            color: '#4a4aff',
            target: this.playerVirus
        });
    }
    
    updateAntibodies(deltaTime) {
        for (let i = this.immunity.antibodies.length - 1; i >= 0; i--) {
            const ab = this.immunity.antibodies[i];
            
            // Движение к игроку
            const dx = ab.target.x - ab.x;
            const dy = ab.target.y - ab.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                ab.x += (dx / dist) * ab.speed * deltaTime;
                ab.y += (dy / dist) * ab.speed * deltaTime;
            }
            
            // Проверка столкновения с игроком
            if (dist < ab.radius + this.playerVirus.radius) {
                this.playerVirus.currentHealth -= 15;
                this.immunity.antibodies.splice(i, 1);
                
                if (this.playerVirus.currentHealth <= 0) {
                    this.gameOver();
                }
                this.updateUI();
            }
            
            // Удаление вышедших за пределы
            if (ab.x < -100 || ab.x > this.canvas.width + 100 ||
                ab.y < -100 || ab.y > this.canvas.height + 100) {
                this.immunity.antibodies.splice(i, 1);
            }
        }
    }
    
    // ===== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ И РЕНДЕР =====
    render() {
        // Очистка
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Фон
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Сетка фона
        this.ctx.strokeStyle = 'rgba(74, 74, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Клетки
        this.cells.forEach(cell => {
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
            
            if (cell.infected) {
                this.ctx.fillStyle = cell.color;
                this.ctx.fill();
                
                // Эффект пульсации
                if (Math.sin(Date.now() * 0.005) > 0) {
                    this.ctx.strokeStyle = '#ff3838';
                    this.ctx.lineWidth = 3;
                    this.ctx.stroke();
                }
            } else {
                // Незараженные клетки
                if (cell.type === 'immune') {
                    // Иммунные клетки с защитным кольцом
                    const gradient = this.ctx.createRadialGradient(
                        cell.x, cell.y, 0,
                        cell.x, cell.y, cell.radius
                    );
                    gradient.addColorStop(0, '#2d2dff');
                    gradient.addColorStop(1, '#1a1a7f');
                    this.ctx.fillStyle = gradient;
                } else {
                    this.ctx.fillStyle = cell.color;
                }
                this.ctx.fill();
                
                // Оболочка клетки
                this.ctx.strokeStyle = cell.type === 'immune' ? '#6c6cff' : '#3a3aff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            // Ядро клетки
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = cell.infected ? '#ff6b6b' : 
                                cell.type === 'immune' ? '#4a4aff' : '#6c5ce7';
            this.ctx.fill();
        });
        
        // Антитела
        this.immunity.antibodies.forEach(ab => {
            this.ctx.beginPath();
            this.ctx.arc(ab.x, ab.y, ab.radius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(
                ab.x, ab.y, 0,
                ab.x, ab.y, ab.radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#4a4aff');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Крестообразная форма антитела
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(ab.x - ab.radius, ab.y);
            this.ctx.lineTo(ab.x + ab.radius, ab.y);
            this.ctx.moveTo(ab.x, ab.y - ab.radius);
            this.ctx.lineTo(ab.x, ab.y + ab.radius);
            this.ctx.stroke();
        });
        
        // Обычные вирусы
        this.viruses.forEach(virus => {
            this.drawVirus(virus.x, virus.y, virus.radius, virus.color);
        });
        
        // Игрок (главный вирус)
        if (this.playerVirus) {
            const virus = this.playerVirus;
            const alpha = virus.isInvulnerable ? 0.5 : 1.0;
            
            // Тело вируса
            this.ctx.save();
            this.ctx.translate(virus.x, virus.y);
            this.ctx.rotate(virus.rotation);
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, virus.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 71, 87, ${alpha})`;
            this.ctx.fill();
            
            // Шипы вируса
            this.ctx.strokeStyle = `rgba(255, 56, 56, ${alpha})`;
            this.ctx.lineWidth = 2;
            const spikeLength = virus.radius * (1 + this.stats.infectivity * 0.5);
            
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                this.ctx.beginPath();
                this.ctx.moveTo(
                    Math.cos(angle) * virus.radius,
                    Math.sin(angle) * virus.radius
                );
                this.ctx.lineTo(
                    Math.cos(angle) * (virus.radius + spikeLength),
                    Math.sin(angle) * (virus.radius + spikeLength)
                );
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            
            // Полоска здоровья игрока
            if (this.stats.currentHealth < this.stats.maxHealth) {
                const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
                const barWidth = 40;
                const barHeight = 4;
                
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(virus.x - barWidth/2, virus.y - virus.radius - 10, barWidth, barHeight);
                
                this.ctx.fillStyle = healthPercent > 0.5 ? '#6cff6c' : 
                                    healthPercent > 0.25 ? '#ffa726' : '#ff4757';
                this.ctx.fillRect(virus.x - barWidth/2, virus.y - virus.radius - 10, barWidth * healthPercent, barHeight);
            }
        }
        
        // Интерфейс мини-игры захвата
        if (this.captureGame.active && this.captureGame.targetCell) {
            const cell = this.captureGame.targetCell;
            
            // Подсветка целевой клетки
            this.ctx.strokeStyle = '#ffcc00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Прогресс захвата
            const progressRadius = cell.radius + 15;
            this.ctx.strokeStyle = '#ff4757';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, progressRadius, -Math.PI/2, 
                        (-Math.PI/2) + (Math.PI * 2 * this.captureGame.progress / 100));
            this.ctx.stroke();
            
            // Текст
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ЗАХВАТ!', cell.x, cell.y - cell.radius - 25);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Кликов: ${this.captureGame.clicksDone}/${this.captureGame.requiredClicks}`, 
                            cell.x, cell.y - cell.radius - 10);
        }
    }
    
    drawVirus(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Простые шипы
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            this.ctx.beginPath();
            this.ctx.moveTo(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius
            );
            this.ctx.lineTo(
                x + Math.cos(angle) * (radius * 1.8),
                y + Math.sin(angle) * (radius * 1.8)
            );
            this.ctx.stroke();
        }
    }
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.viruses.push({
                x, y,
                radius: 3,
                speed: 1 + Math.random() * 2,
                angle: Math.random() * Math.PI * 2,
                color: '#ff4757',
                lifetime: 30
            });
        }
    }
    
    createClickEffect(x, y) {
        // Эффект клика для мини-игры
        const particles = 5;
        for (let i = 0; i < particles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            setTimeout(() => {
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.beginPath();
                this.ctx.arc(
                    x + Math.cos(angle) * 20,
                    y + Math.sin(angle) * 20,
                    3, 0, Math.PI * 2
                );
                this.ctx.fill();
            }, i * 50);
        }
    }
    
    updateVirusParticles(deltaTime) {
        for (let i = this.viruses.length - 1; i >= 0; i--) {
            const virus = this.viruses[i];
            
            if (virus.lifetime) {
                virus.lifetime -= deltaTime;
                if (virus.lifetime <= 0) {
                    this.viruses.splice(i, 1);
                    continue;
                }
                
                virus.x += Math.cos(virus.angle) * virus.speed * deltaTime;
                virus.y += Math.sin(virus.angle) * virus.speed * deltaTime;
            } else {
                // Обычное поведение
                if (!virus.targetCell) {
                    // Поиск незараженной клетки
                    for (const cell of this.cells) {
                        if (!cell.infected) {
                            virus.targetCell = cell;
                            break;
                        }
                    }
                }
                
                if (virus.targetCell) {
                    const dx = virus.targetCell.x - virus.x;
                    const dy = virus.targetCell.y - virus.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 1) {
                        virus.x += (dx / dist) * virus.speed * deltaTime;
                        virus.y += (dy / dist) * virus.speed * deltaTime;
                    } else {
                        // Заражение клетки
                        if (!virus.targetCell.infected) {
                            virus.targetCell.infectionProgress += 5;
                            if (virus.targetCell.infectionProgress >= 100) {
                                this.infectCell(virus.targetCell);
                            }
                        }
                        this.viruses.splice(i, 1);
                    }
                }
            }
        }
    }
    
    passiveIncome() {
        this.resources.atp += this.stats.replication;
        this.updateUI();
    }
    
    updateUI() {
        // Ресурсы
        document.getElementById('rna').textContent = Math.floor(this.resources.rna);
        document.getElementById('atp').textContent = Math.floor(this.resources.atp);
        document.getElementById('particles').textContent = Math.floor(this.resources.particles);
        
        // Мутации
        const mutationPointsEl = document.getElementById('mutationPoints');
        if (mutationPointsEl) {
            mutationPointsEl.textContent = Math.floor(this.resources.mutationPoints);
        }
        
        // Статистика
        document.getElementById('stat-infectivity').textContent = this.stats.infectivity.toFixed(1);
        document.getElementById('stat-replication').textContent = this.stats.replication;
        document.getElementById('stat-stealth').textContent = Math.floor(this.stats.stealth * 100) + '%';
        document.getElementById('stat-infected').textContent = `${this.infectedCells}/${this.totalCells}`;
        
        // Здоровье игрока
        const healthBar = document.getElementById('healthBar');
        if (healthBar) {
            const percent = (this.stats.currentHealth / this.stats.maxHealth) * 100;
            healthBar.style.width = percent + '%';
            healthBar.style.backgroundColor = percent > 50 ? '#6cff6c' : 
                                            percent > 25 ? '#ffa726' : '#ff4757';
        }
        
        // Сложность
        const difficultyEl = document.getElementById('difficulty');
        if (difficultyEl) {
            difficultyEl.textContent = this.difficultyLevel;
        }
        
        // Кнопки улучшений
        this.updateButtons();
    }
    
    updateButtons() {
        document.querySelectorAll('.buy-btn').forEach(btn => {
            const type = btn.getAttribute('data-type');
            const cost = parseInt(btn.getAttribute('data-cost'));
            
            btn.disabled = !(this.resources[type] >= cost);
        });
    }
    
    showCaptureUI() {
        let ui = document.getElementById('captureUI');
        if (!ui) {
            ui = document.createElement('div');
            ui.id = 'captureUI';
            ui.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                border: 3px solid #ff4757;
                text-align: center;
                z-index: 1000;
            `;
            ui.innerHTML = `
                <h3 style="color: #ffcc00; margin-bottom: 10px;">ЗАХВАТ КЛЕТКИ!</h3>
                <p>Кликайте быстро чтобы захватить клетку!</p>
                <div style="margin: 15px 0;">
                    <div style="background: #333; height: 20px; border-radius: 10px; overflow: hidden;">
                        <div id="captureProgress" style="height: 100%; background: #ff4757; width: 0%;"></div>
                    </div>
                </div>
                <p id="captureTimer" style="color: #6cff6c;">Осталось: 5.0с</p>
            `;
            document.body.appendChild(ui);
        }
        ui.style.display = 'block';
    }
    
    updateCaptureUI() {
        const progressBar = document.getElementById('captureProgress');
        const timerEl = document.getElementById('captureTimer');
        
        if (progressBar) {
            progressBar.style.width = this.captureGame.progress + '%';
        }
        
        if (timerEl && this.captureGame.timer) {
            const timeLeft = this.captureGame.timeLimit - 
                           (this.captureGame.timeLimit * (this.captureGame.clicksDone / this.captureGame.requiredClicks));
            timerEl.textContent = `Осталось: ${(timeLeft / 1000).toFixed(1)}с`;
        }
    }
    
    hideCaptureUI() {
        const ui = document.getElementById('captureUI');
        if (ui) ui.style.display = 'none';
    }
    
    showMutationEffect(name) {
        const message = document.createElement('div');
        message.textContent = `Мутация получена: ${name}!`;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(108, 255, 108, 0.9);
            color: #000;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1001;
            animation: fadeOut 2s forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; top: 50%; }
                70% { opacity: 1; top: 45%; }
                100% { opacity: 0; top: 40%; display: none; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
            document.head.removeChild(style);
        }, 2000);
    }
    
    showMessage(text) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(25, 25, 50, 0.95);
            color: #e0e0ff;
            padding: 10px 20px;
            border-radius: 5px;
            border: 2px solid #4a4aff;
            font-weight: bold;
            z-index: 1001;
            animation: slideDown 3s forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                0% { top: -50px; opacity: 0; }
                10% { top: 20px; opacity: 1; }
                90% { top: 20px; opacity: 1; }
                100% { top: -50px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
            document.head.removeChild(style);
        }, 3000);
    }
    
    gameOver() {
        this.showMessage(`Игра окончена! Захвачено клеток: ${this.infectedCells}`);
        
        // Сброс к начальным значениям с сохранением некоторых улучшений
        setTimeout(() => {
            this.stats.currentHealth = this.stats.maxHealth;
            this.playerVirus.x = this.canvas.width / 2;
            this.playerVirus.y = this.canvas.height / 2;
            this.immunity.antibodies = [];
            this.immunity.active = false;
            this.updateUI();
        }, 3000);
    }
    
    buyUpgrade(button) {
        // Ваша существующая логика улучшений (можно оставить как есть)
        const upgradeId = button.closest('.upgrade').id;
        // ... остальной код ...
    }
}

// Запуск игры
window.addEventListener('load', () => {
    new Game();
});
