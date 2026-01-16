class ViralMastermind {
    constructor() {
        this.gameState = {
            screen: 'loading',
            difficulty: 'normal',
            day: 1,
            paused: false,
            gameSpeed: 1,
            resources: {
                rna: 1000000,
                atp: 50000,
                particles: 10000,
                mutationPoints: 500,
                socialCapital: 1000
            },
            virus: {
                name: 'Alpha Strain',
                genes: [],
                stats: {
                    infectivity: 1.0,
                    replication: 1.0,
                    stealth: 1.0,
                    lethality: 0.02,
                    resistance: 1.0,
                    mutationRate: 0.8
                },
                activeMutations: []
            },
            world: {
                infectedCells: 12456,
                totalCells: 1000000,
                infectedCountries: ['china'],
                whoAwareness: 0.3
            },
            research: {
                unlocked: ['airborne'],
                inProgress: []
            },
            social: {
                misinformation: 0,
                antivax: 0,
                cult: 0
            }
        };

        this.modules = {
            genomeEditor: null,
            immuneSystem: null,
            worldMap: null,
            socialEngineering: null,
            multiplayer: null,
            tutorial: null
        };

        this.init();
    }

    async init() {
        // Инициализация загрузки
        this.showLoadingScreen();
        
        // Загрузка модулей
        await this.loadModules();
        
        // Настройка событий
        this.setupEventListeners();
        
        // Загрузка сохраненной игры
        await this.loadGame();
        
        // Запуск игрового цикла
        this.startGameLoop();
        
        // Скрытие загрузочного экрана
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showMainMenu();
        }, 2000);
    }

    async loadModules() {
        // Загрузка всех модулей игры
        this.modules.genomeEditor = new GenomeEditor(this);
        this.modules.immuneSystem = new ImmuneSystem(this);
        this.modules.worldMap = new WorldMap(this);
        this.modules.socialEngineering = new SocialEngineering(this);
        this.modules.multiplayer = new Multiplayer(this);
        this.modules.tutorial = new Tutorial(this);
        
        console.log('Все модули загружены');
    }

    showLoadingScreen() {
        const progressBar = document.querySelector('.progress-fill');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 100);
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 500);
    }

    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
        this.updateMenuStats();
    }

    showGameScreen() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Инициализация игрового интерфейса
        this.updateGameUI();
        this.modules.tutorial.startTutorial();
    }

    setupEventListeners() {
        // Кнопки главного меню
        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('btn-multiplayer').addEventListener('click', () => {
            this.showMultiplayerScreen();
        });

        document.getElementById('btn-load-game').addEventListener('click', () => {
            this.loadGameDialog();
        });

        document.getElementById('btn-tutorial').addEventListener('click', () => {
            this.modules.tutorial.showTutorial();
        });

        // Управление игрой
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-speed-1').addEventListener('click', () => {
            this.setGameSpeed(1);
        });

        document.getElementById('btn-speed-2').addEventListener('click', () => {
            this.setGameSpeed(2);
        });

        document.getElementById('btn-speed-5').addEventListener('click', () => {
            this.setGameSpeed(5);
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveGame();
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            this.returnToMenu();
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
            if (e.key === ' ') this.useAbility('attack');
            if (e.key === 'm') this.showMutationMenu();
            if (e.key === '1') this.setGameSpeed(1);
            if (e.key === '2') this.setGameSpeed(2);
            if (e.key === '3') this.setGameSpeed(5);
        });

        // Перетаскивание генов
        this.setupDragAndDrop();
    }

    startNewGame() {
        // Сброс игры к начальному состоянию
        this.gameState = {
            ...this.gameState,
            day: 1,
            resources: {
                rna: 1000,
                atp: 500,
                particles: 100,
                mutationPoints: 0,
                socialCapital: 0
            },
            virus: {
                name: 'Patient Zero',
                genes: ['basic_spike', 'basic_replication'],
                stats: {
                    infectivity: 1.0,
                    replication: 1.0,
                    stealth: 1.0,
                    lethality: 0.01,
                    resistance: 1.0,
                    mutationRate: 0.5
                },
                activeMutations: []
            },
            world: {
                infectedCells: 1,
                totalCells: 1000000,
                infectedCountries: [],
                whoAwareness: 0
            }
        };

        this.showGameScreen();
        
        // Начать с первой клетки
        this.startCaptureMinigame();
    }

    startGameLoop() {
        const gameLoop = (timestamp) => {
            if (!this.gameState.paused) {
                const deltaTime = this.calculateDeltaTime(timestamp);
                
                // Обновление всех систем
                this.updateResources(deltaTime);
                this.modules.immuneSystem.update(deltaTime);
                this.modules.worldMap.update(deltaTime);
                this.checkEvents();
                this.updateUI();
                
                // Проверка условий победы/поражения
                this.checkWinConditions();
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }

    updateResources(deltaTime) {
        // Пассивный доход
        const rnaPerSecond = this.calculateRNAPerSecond();
        const atpPerSecond = this.calculateATPPerSecond();
        const particlesPerSecond = this.calculateParticlesPerSecond();
        
        this.gameState.resources.rna += rnaPerSecond * deltaTime * this.gameState.gameSpeed;
        this.gameState.resources.atp += atpPerSecond * deltaTime * this.gameState.gameSpeed;
        this.gameState.resources.particles += particlesPerSecond * deltaTime * this.gameState.gameSpeed;
        
        // Мутации происходят со временем
        if (Math.random() < this.gameState.virus.stats.mutationRate * deltaTime) {
            this.generateRandomMutation();
        }
        
        // День увеличивается каждые 60 секунд реального времени
        this.gameState.dayTimer += deltaTime;
        if (this.gameState.dayTimer >= 60) {
            this.gameState.day++;
            this.gameState.dayTimer = 0;
            this.onNewDay();
        }
    }

    calculateRNAPerSecond() {
        let base = 10;
        // Модификаторы от генов и мутаций
        base *= this.gameState.virus.stats.replication;
        base *= 1 + (this.gameState.world.infectedCells / 10000);
        return base;
    }

    updateUI() {
        // Обновление ресурсов
        document.getElementById('rna').textContent = 
            this.formatNumber(this.gameState.resources.rna);
        document.getElementById('atp').textContent = 
            this.formatNumber(this.gameState.resources.atp);
        document.getElementById('particles').textContent = 
            this.formatNumber(this.gameState.resources.particles);
        document.getElementById('mutation-points').textContent = 
            this.formatNumber(this.gameState.resources.mutationPoints);
        document.getElementById('social-capital').textContent = 
            this.formatNumber(this.gameState.resources.socialCapital);
        
        // Обновление информации
        document.getElementById('current-day').textContent = this.gameState.day;
        document.getElementById('infected-count').textContent = 
            this.formatNumber(this.gameState.world.infectedCells);
        document.getElementById('lethality-rate').textContent = 
            `${(this.gameState.virus.stats.lethality * 100).toFixed(1)}%`;
        
        // Обновление угрозы ВОЗ
        const threatLevel = this.gameState.world.whoAwareness;
        document.querySelector('.threat-fill').style.width = `${threatLevel * 100}%`;
        document.querySelector('.threat-text').textContent = 
            this.getThreatLevelText(threatLevel);
        
        // Обновление скоростей
        document.getElementById('rna-per-sec').textContent = 
            this.formatNumber(this.calculateRNAPerSecond());
        document.getElementById('atp-per-sec').textContent = 
            this.formatNumber(this.calculateATPPerSecond());
        document.getElementById('particles-per-sec').textContent = 
            this.formatNumber(this.calculateParticlesPerSecond());
    }

    formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num);
    }

    getThreatLevelText(level) {
        if (level < 0.3) return 'Низкое';
        if (level < 0.6) return 'Среднее';
        if (level < 0.8) return 'Высокое';
        return 'Критическое';
    }

    startCaptureMinigame() {
        // Показать мини-игру захвата
        const minigame = document.getElementById('capture-minigame');
        minigame.classList.remove('hidden');
        
        // Инициализация мини-игры
        this.initCaptureGame();
    }

    initCaptureGame() {
        const timerElement = document.getElementById('minigame-timer');
        const progressElement = document.getElementById('capture-progress');
        const rnaInjectionElement = document.getElementById('rna-injection');
        
        let timeLeft = 15;
        let progress = 0;
        let gameActive = true;
        
        const gameInterval = setInterval(() => {
            if (!gameActive) return;
            
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.endCaptureMinigame(false);
                clearInterval(gameInterval);
            }
        }, 1000);
        
        // Управление в мини-игре
        const playerVirus = document.createElement('div');
        playerVirus.className = 'player-virus';
        document.querySelector('.minigame-field').appendChild(playerVirus);
        
        // Логика движения и захвата
        this.setupMinigameControls(playerVirus, (injectionProgress) => {
            progress = injectionProgress;
            progressElement.style.width = `${progress}%`;
            rnaInjectionElement.textContent = `${Math.floor(progress)}%`;
            
            if (progress >= 100) {
                this.endCaptureMinigame(true);
                clearInterval(gameInterval);
            }
        });
    }

    setupMinigameControls(playerElement, onProgress) {
        const keys = {};
        const field = document.querySelector('.minigame-field');
        const nucleus = document.getElementById('cell-nucleus');
        
        let x = field.clientWidth / 2;
        let y = field.clientHeight / 2;
        let speed = 5;
        let injectionProgress = 0;
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        const updatePosition = () => {
            if (keys['w'] || keys['arrowup']) y -= speed;
            if (keys['s'] || keys['arrowdown']) y += speed;
            if (keys['a'] || keys['arrowleft']) x -= speed;
            if (keys['d'] || keys['arrowright']) x += speed;
            
            // Границы поля
            x = Math.max(20, Math.min(field.clientWidth - 20, x));
            y = Math.max(20, Math.min(field.clientHeight - 20, y));
            
            playerElement.style.left = `${x}px`;
            playerElement.style.top = `${y}px`;
            
            // Проверка столкновения с ядром
            const nucleusRect = nucleus.getBoundingClientRect();
            const playerRect = playerElement.getBoundingClientRect();
            
            if (this.checkCollision(playerRect, nucleusRect)) {
                injectionProgress = Math.min(100, injectionProgress + 0.5);
                onProgress(injectionProgress);
            }
            
            requestAnimationFrame(updatePosition);
        };
        
        updatePosition();
    }

    checkCollision(rect1, rect2) {
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    endCaptureMinigame(success) {
        const minigame = document.getElementById('capture-minigame');
        minigame.classList.add('hidden');
        
        if (success) {
            // Награда за успешный захват
            this.gameState.world.infectedCells += 100;
            this.gameState.resources.rna += 500;
            this.gameState.resources.mutationPoints += 1;
            
            this.showMessage('Клетка успешно захвачена!', 'success');
            
            // Шанс на мутацию
            if (Math.random() < 0.3) {
                this.generateRandomMutation();
            }
        } else {
            this.showMessage('Захват не удался. Попробуйте снова!', 'error');
        }
    }

    generateRandomMutation() {
        const mutations = this.modules.genomeEditor.getAvailableMutations();
        const randomMutation = mutations[Math.floor(Math.random() * mutations.length)];
        
        if (randomMutation && !this.gameState.virus.activeMutations.includes(randomMutation.id)) {
            this.gameState.virus.activeMutations.push(randomMutation.id);
            this.applyMutationEffects(randomMutation);
            
            this.showMessage(
                `Обнаружена новая мутация: ${randomMutation.name}!`,
                'mutation'
            );
        }
    }

    applyMutationEffects(mutation) {
        Object.entries(mutation.effects).forEach(([stat, value]) => {
            if (this.gameState.virus.stats[stat] !== undefined) {
                this.gameState.virus.stats[stat] += value;
            }
        });
    }

    showMessage(text, type = 'info') {
        const log = document.getElementById('game-log');
        const message = document.createElement('div');
        message.className = `log-entry ${type}`;
        message.innerHTML = `
            <span class="log-time">[День ${this.gameState.day}]</span>
            ${text}
        `;
        
        log.appendChild(message);
        log.scrollTop = log.scrollHeight;
        
        // Анимация появления
        message.style.animation = 'fadeIn 0.5s ease';
        
        // Ограничение количества сообщений
        if (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
        
        // Звуковой эффект
        this.playSound(type);
    }

    playSound(soundType) {
        const audioMap = {
            mutation: 'sfx-mutation',
            success: 'sfx-infection',
            error: 'sfx-click'
        };
        
        const audioId = audioMap[soundType] || 'sfx-click';
        const audio = document.getElementById(audioId);
        
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        const btn = document.getElementById('btn-pause');
        
        if (this.gameState.paused) {
            btn.innerHTML = '<i class="fas fa-play"></i> Продолжить';
            this.showMessage('Игра приостановлена', 'info');
        } else {
            btn.innerHTML = '<i class="fas fa-pause"></i> Пауза';
        }
    }

    setGameSpeed(speed) {
        this.gameState.gameSpeed = speed;
        
        // Обновление активной кнопки скорости
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`btn-speed-${speed}`).classList.add('active');
    }

    async saveGame() {
        const saveData = {
            gameState: this.gameState,
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        try {
            localStorage.setItem('viral-mastermind-save', JSON.stringify(saveData));
            this.showMessage('Игра сохранена успешно!', 'success');
        } catch (e) {
            this.showMessage('Ошибка сохранения игры', 'error');
            console.error('Save error:', e);
        }
    }

    async loadGame() {
        try {
            const saveData = JSON.parse(localStorage.getItem('viral-mastermind-save'));
            
            if (saveData && saveData.version === '1.0.0') {
                this.gameState = saveData.gameState;
                this.showMessage('Игра загружена успешно!', 'success');
                return true;
            }
        } catch (e) {
            console.error('Load error:', e);
        }
        
        return false;
    }

    loadGameDialog() {
        if (this.loadGame()) {
            this.showGameScreen();
        } else {
            this.showMessage('Сохраненная игра не найдена', 'error');
        }
    }

    returnToMenu() {
        if (confirm('Вернуться в главное меню? Весь несохраненный прогресс будет утерян.')) {
            document.getElementById('game-screen').classList.add('hidden');
            this.showMainMenu();
        }
    }

    showMultiplayerScreen() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('multiplayer-screen').classList.remove('hidden');
    }

    checkWinConditions() {
        const infectedPercent = this.gameState.world.infectedCells / this.gameState.world.totalCells;
        
        // Проверка различных условий победы
        if (infectedPercent >= 0.99 && this.gameState.virus.stats.lethality > 0.1) {
            this.showVictory('pandomination');
        } else if (infectedPercent >= 0.8 && this.gameState.virus.stats.lethality < 0.01) {
            this.showVictory('symbiosis');
        } else if (this.gameState.world.whoAwareness >= 1.0) {
            this.showDefeat('who_detected');
        }
    }

    showVictory(type) {
        const modal = document.getElementById('victory-modal');
        const victoryType = document.getElementById('victory-type');
        
        const victoryTexts = {
            pandomination: {
                title: 'ПанДоминация',
                description: 'Вы заразили 99% населения при высокой летальности. Человечество пало.'
            },
            symbiosis: {
                title: 'Симбиоз',
                description: 'Вирус превратился в сезонное заболевание, с которым человечество научилось жить.'
            },
            vaccine_betrayal: {
                title: 'Вакцинное Предательство',
                description: 'Вирус использует механизм вакцины для усиленного заражения.'
            }
        };
        
        victoryType.innerHTML = `
            <h3>Тип победы: ${victoryTexts[type].title}</h3>
            <p>${victoryTexts[type].description}</p>
        `;
        
        modal.classList.remove('hidden');
    }

    calculateDeltaTime(timestamp) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            return 0;
        }
        
        const delta = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        return delta;
    }

    onNewDay() {
        // События, происходящие каждый день
        this.generateDailyEvents();
        this.modules.worldMap.spreadVirus();
        this.modules.immuneSystem.adapt();
        
        // ВОЗ становится умнее
        this.gameState.world.whoAwareness += 0.01;
        
        // Социальные эффекты
        if (this.gameState.social.misinformation > 0) {
            this.gameState.world.whoAwareness -= 0.005 * this.gameState.social.misinformation;
        }
    }

    generateDailyEvents() {
        const events = [
            {
                probability: 0.1,
                text: 'Ученые обнаружили новый штамм вируса',
                effect: () => { this.gameState.world.whoAwareness += 0.1; }
            },
            {
                probability: 0.05,
                text: 'Разработана новая вакцина',
                effect: () => { this.gameState.virus.stats.infectivity *= 0.9; }
            },
            {
                probability: 0.08,
                text: 'Вспышка в новом регионе',
                effect: () => { 
                    const newCountry = this.modules.worldMap.getRandomCountry();
                    this.gameState.world.infectedCountries.push(newCountry);
                }
            }
        ];
        
        events.forEach(event => {
            if (Math.random() < event.probability) {
                this.showMessage(event.text, 'info');
                event.effect();
            }
        });
    }

    setupDragAndDrop() {
        const geneSlots = document.querySelectorAll('.gene-slot');
        const geneCards = document.querySelectorAll('.gene-card');
        
        geneCards.forEach(card => {
            card.setAttribute('draggable', 'true');
            
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.geneId);
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });
        
        geneSlots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                const geneId = e.dataTransfer.getData('text/plain');
                this.modules.genomeEditor.insertGene(slot.dataset.slot, geneId);
            });
        });
    }

    updateMenuStats() {
        // Загрузка статистики из localStorage
        const totalStrains = localStorage.getItem('total-strains') || 0;
        const totalPandemics = localStorage.getItem('total-pandemics') || 0;
        
        document.getElementById('total-strains').textContent = totalStrains;
        document.getElementById('total-pandemics').textContent = totalPandemics;
    }
}

// Классы модулей (упрощенные версии)
class GenomeEditor {
    constructor(game) {
        this.game = game;
        this.geneLibrary = this.initializeGeneLibrary();
    }

    initializeGeneLibrary() {
        return {
            basic_spike: {
                id: 'basic_spike',
                name: 'Базовый шип',
                type: 'spike',
                rarity: 'common',
                effects: { infectivity: 0.2 },
                cost: { rna: 100 },
                description: 'Базовая структура для прикрепления к клеткам'
            },
            bat_spike: {
                id: 'bat_spike',
                name: 'Шип летучей мыши',
                type: 'spike',
                rarity: 'rare',
                effects: { infectivity: 0.5, stealth: -0.1 },
                cost: { rna: 500, mutationPoints: 5 },
                description: 'Адаптирован для передачи от животных'
            },
            // ... другие гены
        };
    }

    insertGene(slot, geneId) {
        const gene = this.geneLibrary[geneId];
        if (!gene) return false;

        // Проверка стоимости
        const canAfford = Object.entries(gene.cost).every(([resource, amount]) => {
            return this.game.gameState.resources[resource] >= amount;
        });

        if (!canAfford) {
            this.game.showMessage('Недостаточно ресурсов для этого гена', 'error');
            return false;
        }

        // Списание ресурсов
        Object.entries(gene.cost).forEach(([resource, amount]) => {
            this.game.gameState.resources[resource] -= amount;
        });

        // Добавление гена
        this.game.gameState.virus.genes[slot] = geneId;
        
        // Применение эффектов
        Object.entries(gene.effects).forEach(([stat, value]) => {
            if (this.game.gameState.virus.stats[stat] !== undefined) {
                this.game.gameState.virus.stats[stat] += value;
            }
        });

        this.game.showMessage(`Ген "${gene.name}" установлен`, 'success');
        return true;
    }

    getAvailableMutations() {
        return Object.values(this.geneLibrary).filter(gene => 
            !this.game.gameState.virus.activeMutations.includes(gene.id)
        );
    }
}

class ImmuneSystem {
    constructor(game) {
        this.game = game;
        this.cells = {
            macrophages: 10,
            tKillers: 5,
            bCells: 3,
            memory: 0
        };
        this.adaptation = {
            airborne: 0,
            contact: 0,
            waterborne: 0
        };
    }

    update(deltaTime) {
        // Рост иммунного ответа в зависимости от угрозы
        const threat = this.calculateThreat();
        
        if (threat > 0.5) {
            this.cells.macrophages += 0.1 * deltaTime;
            this.cells.tKillers += 0.05 * deltaTime;
            
            // Адаптация к текущей тактике вируса
            this.adaptToVirus();
        }
        
        // Атака на зараженные клетки
        this.attackInfectedCells(deltaTime);
    }

    calculateThreat() {
        const virus = this.game.gameState.virus;
        const world = this.game.gameState.world;
        
        let threat = 0;
        threat += virus.stats.lethality * 2;
        threat += (world.infectedCells / 10000) * 0.1;
        threat -= virus.stats.stealth * 0.5;
        
        return Math.max(0, Math.min(1, threat));
    }

    adaptToVirus() {
        // Иммунная система учится и адаптируется
        const virus = this.game.gameState.virus;
        
        if (virus.stats.infectivity > 2) {
            this.adaptation.airborne += 0.01;
        }
        
        // Если вирус использует одну и ту же тактику, иммунитет усиливается против нее
        this.cells.memory = Math.min(1, this.cells.memory + 0.001);
    }

    attackInfectedCells(deltaTime) {
        const attackPower = 
            this.cells.macrophages * 0.1 +
            this.cells.tKillers * 0.2 +
            this.cells.bCells * 0.15;
        
        const cellsKilled = attackPower * deltaTime * (1 - this.game.gameState.virus.stats.stealth);
        this.game.gameState.world.infectedCells = Math.max(0, 
            this.game.gameState.world.infectedCells - cellsKilled
        );
        
        if (cellsKilled > 0) {
            this.game.showMessage(`Иммунная система уничтожила ${Math.floor(cellsKilled)} клеток`, 'info');
        }
    }
}

class WorldMap {
    constructor(game) {
        this.game = game;
        this.countries = this.initializeCountries();
    }

    initializeCountries() {
        return {
            china: { name: 'Китай', population: 1400, climate: 'temperate', healthcare: 0.7, infected: 0 },
            usa: { name: 'США', population: 330, climate: 'varied', healthcare: 0.9, infected: 0 },
            india: { name: 'Индия', population: 1380, climate: 'tropical', healthcare: 0.5, infected: 0 },
            // ... другие страны
        };
    }

    update(deltaTime) {
        // Распространение вируса между странами
        Object.entries(this.countries).forEach(([id, country]) => {
            if (country.infected > 0) {
                this.spreadFromCountry(id, deltaTime);
            }
        });
    }

    spreadFromCountry(countryId, deltaTime) {
        const country = this.countries[countryId];
        const virus = this.game.gameState.virus;
        
        // Базовое распространение
        const spreadRate = virus.stats.infectivity * 0.01 * deltaTime;
        country.infected = Math.min(country.population, 
            country.infected * (1 + spreadRate)
        );
        
        // Распространение в соседние страны
        if (Math.random() < spreadRate * 0.1) {
            const neighbor = this.getRandomNeighbor(countryId);
            if (neighbor && this.countries[neighbor].infected === 0) {
                this.countries[neighbor].infected = 1;
                this.game.gameState.world.infectedCountries.push(neighbor);
                this.game.showMessage(`Вспышка в ${this.countries[neighbor].name}!`, 'danger');
            }
        }
        
        // Обновление общего количества зараженных
        this.updateTotalInfected();
    }

    updateTotalInfected() {
        let total = 0;
        Object.values(this.countries).forEach(country => {
            total += country.infected;
        });
        this.game.gameState.world.infectedCells = Math.floor(total * 1000); // Конвертация в клетки
    }

    getRandomCountry() {
        const countryIds = Object.keys(this.countries);
        return countryIds[Math.floor(Math.random() * countryIds.length)];
    }

    getRandomNeighbor(countryId) {
        // Упрощенная логика соседства
        const neighbors = {
            china: ['india', 'russia'],
            usa: ['canada', 'mexico'],
            india: ['china', 'pakistan']
        };
        
        return neighbors[countryId] ? 
            neighbors[countryId][Math.floor(Math.random() * neighbors[countryId].length)] : 
            null;
    }

    spreadVirus() {
        // Ежедневное распространение
        Object.keys(this.countries).forEach(countryId => {
            if (this.countries[countryId].infected > 0) {
                this.spreadFromCountry(countryId, 1);
            }
        });
    }
}

class SocialEngineering {
    constructor(game) {
        this.game = game;
        this.actions = this.initializeActions();
    }

    initializeActions() {
        return {
            misinformation: {
                name: 'Инфодемия',
                cost: 200,
                effect: () => {
                    this.game.gameState.social.misinformation++;
                    this.game.gameState.world.whoAwareness -= 0.1;
                    return 'Дезинформация распространяется в соцсетях';
                }
            },
            antivax: {
                name: 'Антивакцинный тренд',
                cost: 300,
                effect: () => {
                    this.game.gameState.social.antivax++;
                    this.game.gameState.virus.stats.infectivity += 0.1;
                    return 'Доверие к вакцинам падает';
                }
            },
            cult: {
                name: 'Культ кашля',
                cost: 500,
                effect: () => {
                    this.game.gameState.social.cult++;
                    this.game.gameState.virus.stats.infectivity += 0.3;
                    return 'Чихание становится модным';
                }
            }
        };
    }

    executeAction(actionId) {
        const action = this.actions[actionId];
        if (!action) return false;

        if (this.game.gameState.resources.socialCapital >= action.cost) {
            this.game.gameState.resources.socialCapital -= action.cost;
            const message = action.effect();
            this.game.showMessage(message, 'success');
            return true;
        } else {
            this.game.showMessage('Недостаточно социального капитала', 'error');
            return false;
        }
    }
}

class Multiplayer {
    constructor(game) {
        this.game = game;
        this.players = {};
        this.role = null; // 'virus' или 'who'
    }

    startLocalMultiplayer() {
        this.role = 'virus';
        this.game.showGameScreen();
        
        // В локальном мультиплеере второй игрок управляет ВОЗ
        this.showWHOInterface();
    }

    showWHOInterface() {
        const interfaceEl = document.getElementById('who-interface');
        interfaceEl.classList.remove('hidden');
        
        // Настройка действий ВОЗ
        document.querySelectorAll('.who-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeWHOAction(e.currentTarget.dataset.action);
            });
        });
    }

    executeWHOAction(action) {
        const actions = {
            research: () => {
                this.game.gameState.world.whoAwareness += 0.2;
                return 'ВОЗ исследует вирус';
            },
            quarantine: () => {
                this.game.gameState.virus.stats.infectivity *= 0.8;
                return 'Введен карантин';
            },
            travel_ban: () => {
                this.game.modules.worldMap.spreadRate *= 0.5;
                return 'Закрыты границы';
            },
            vaccine: () => {
                this.game.gameState.virus.stats.infectivity *= 0.7;
                return 'Разработана вакцина';
            }
        };

        if (actions[action]) {
            const message = actions[action]();
            this.game.showMessage(message, 'info');
        }
    }
}

class Tutorial {
    constructor(game) {
        this.game = game;
        this.steps = this.initializeSteps();
        this.currentStep = 0;
    }

    initializeSteps() {
        return [
            {
                title: 'Добро пожаловать в Viral Mastermind!',
                content: 'Вы управляете вирусом, который должен эволюционировать и распространяться.',
                target: '.logo',
                position: 'center'
            },
            {
                title: 'Редактор генома',
                content: 'Здесь вы можете изменять ДНК вашего вируса. Перетащите гены из библиотеки в слоты.',
                target: '.left-panel',
                position: 'right'
            },
            {
                title: 'Игровое поле',
                content: 'Здесь происходит захват клеток и распространение вируса.',
                target: '.center-panel',
                position: 'center'
            },
            {
                title: 'Исследования и способности',
                content: 'Разблокируйте новые возможности через дерево исследований.',
                target: '.right-panel',
                position: 'left'
            }
        ];
    }

    startTutorial() {
        if (localStorage.getItem('tutorial-completed')) {
            return; // Обучение уже пройдено
        }

        this.showStep(0);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.completeTutorial();
            return;
        }

        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;

        // Создание окна обучения
        const tutorialOverlay = document.createElement('div');
        tutorialOverlay.className = 'tutorial-overlay';
        tutorialOverlay.innerHTML = `
            <div class="tutorial-box" style="${this.getPositionStyle(step)}">
                <h3>${step.title}</h3>
                <p>${step.content}</p>
                <div class="tutorial-buttons">
                    ${stepIndex > 0 ? '<button class="tutorial-btn" id="tutorial-prev">Назад</button>' : ''}
                    <button class="tutorial-btn primary" id="tutorial-next">
                        ${stepIndex === this.steps.length - 1 ? 'Завершить' : 'Далее'}
                    </button>
                </div>
                <div class="tutorial-progress">Шаг ${stepIndex + 1} из ${this.steps.length}</div>
            </div>
        `;

        document.body.appendChild(tutorialOverlay);

        // Обработчики кнопок
        document.getElementById('tutorial-next').addEventListener('click', () => {
            tutorialOverlay.remove();
            this.showStep(stepIndex + 1);
        });

        if (stepIndex > 0) {
            document.getElementById('tutorial-prev').addEventListener('click', () => {
                tutorialOverlay.remove();
                this.showStep(stepIndex - 1);
            });
        }
    }

    getPositionStyle(step) {
        const positions = {
            center: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
            right: 'top: 50%; right: 20px; transform: translateY(-50%);',
            left: 'top: 50%; left: 20px; transform: translateY(-50%);'
        };

        return positions[step.position] || positions.center;
    }

    completeTutorial() {
        localStorage.setItem('tutorial-completed', 'true');
        this.game.showMessage('Обучение завершено! Удачи в создании пандемии!', 'success');
    }

    showTutorial() {
        localStorage.removeItem('tutorial-completed');
        this.startTutorial();
    }
}

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    window.game = new ViralMastermind();
});

// Глобальные вспомогательные функции
window.formatNumber = function(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' млрд';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + ' млн';
    if (num >= 1000) return (num / 1000).toFixed(1) + ' тыс';
    return Math.floor(num);
};

// Добавление CSS для обучения
const tutorialCSS = `
.tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tutorial-box {
    background: linear-gradient(135deg, var(--bg-panel), rgba(25, 25, 50, 0.95));
    border: 3px solid var(--primary);
    border-radius: 15px;
    padding: 30px;
    max-width: 500px;
    color: var(--text-primary);
    box-shadow: 0 0 50px rgba(157, 78, 221, 0.5);
    animation: tutorialAppear 0.5s ease;
}

@keyframes tutorialAppear {
    from {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.tutorial-box h3 {
    color: var(--primary);
    margin-bottom: 15px;
    font-size: 1.5em;
}

.tutorial-box p {
    color: var(--text-secondary);
    margin-bottom: 25px;
    line-height: 1.6;
}

.tutorial-buttons {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
}

.tutorial-btn {
    padding: 10px 25px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tutorial-btn:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
}

.tutorial-btn.primary {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
}

.tutorial-progress {
    text-align: center;
    margin-top: 20px;
    font-size: 0.9em;
    color: var(--text-muted);
}
`;

// Добавление CSS в документ
const style = document.createElement('style');
style.textContent = tutorialCSS;
document.head.appendChild(style);
