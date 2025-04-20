// ==UserScript==
// @name         TikTok Live Auto Liker Pro
// @namespace    http://tampermonkey.net/
// @version      2.7.1
// @description  Advanced auto-liker for TikTok live streams with ultra-fast combo mode
// @author       Amped
// @match        https://www.tiktok.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Credits and Info
    console.log(`
    ████████╗██╗██╗  ██╗████████╗ ██████╗ ██╗  ██╗    ██╗     ██╗██╗  ██╗███████╗██████╗ 
    ╚══██╔══╝██║██║ ██╔╝╚══██╔══╝██╔═══██╗██║ ██╔╝    ██║     ██║██║ ██╔╝██╔════╝██╔══██╗
       ██║   ██║█████╔╝    ██║   ██║   ██║█████╔╝     ██║     ██║█████╔╝ █████╗  ██████╔╝
       ██║   ██║██╔═██╗    ██║   ██║   ██║██╔═██╗     ██║     ██║██╔═██╗ ██╔══╝  ██╔══██╗
       ██║   ██║██║  ██╗   ██║   ╚██████╔╝██║  ██╗    ███████╗██║██║  ██╗███████╗██║  ██║
       ╚═╝   ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝    ╚══════╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                                                                                           
    TikTok Live Auto Liker Pro v2.7.1
    Created by Amped
    Enhanced Features:
    - Ultra-fast combo mode
    - Multi-mode liking system
    - Statistics tracking
    - Advanced detection methods
    - Performance optimization
    `);

    // Configuration
    const CONFIG = {
        enabled: false,
        buttonKey: 'l',
        showNotifications: true,
        stats: {
            totalClicks: 0,
            startTime: null,
            successfulClicks: 0,
            failedClicks: 0,
            combos: 0,
            maxCombo: 0,
            currentCombo: 0
        },
        mode: 'normal',
        comboTimeoutId: null,
        lastClickTime: 0,
        debugMode: true,
        isCollapsed: false,
        position: {
            x: localStorage.getItem('autoLikerPosX') || 'auto',
            y: localStorage.getItem('autoLikerPosY') || '50%'
        }
    };

    // Mode configurations
    const MODES = {
        normal: {
            min: 50,
            max: 150,
            name: "Normal Mode",
            burstCount: 2
        },
        turbo: {
            min: 20,
            max: 50,
            name: "🚀 Turbo Mode",
            burstCount: 4
        },
        stealth: {
            min: 200,
            max: 500,
            name: "🕵️ Stealth Mode",
            burstCount: 1
        },
        combo: {
            min: 5,
            max: 15,
            name: "⚡ Combo Mode",
            burstCount: 10,
            burstDelay: 5,
            comboTimeout: 800
        }
    };

    // Button structure
    const BUTTON_STRUCTURE = {
        container: 'tiktok-1f32i2v e1tv929b0',
        outer: 'tiktok-yl9fg8 e1tv929b1',
        middle: 'tiktok-pn4agh e1tv929b2',
        inner: 'tiktok-1cu4ad e1tv929b3'
    };

    // Notification system with safety checks
    function showNotification(message, type = 'info') {
        if (!CONFIG.showNotifications) return;
        if (!document.body) return;  // Safety check
        
        const notification = document.createElement('div');
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FFC107',
            error: '#F44336'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            border-left: 4px solid ${colors[type]};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s forwards;
        `;
        notification.textContent = message;
        
        // Safe append
        try {
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // Find the like button with complete structure
    function findLikeButton() {
        try {
            // Try each part of the button structure
            for (const [key, className] of Object.entries(BUTTON_STRUCTURE)) {
                const elements = document.getElementsByClassName(className);
                for (const element of elements) {
                    if (isValidLikeButton(element)) {
                        if (CONFIG.debugMode) {
                            console.log(`Found like button (${key}):`, element);
                        }
                        return element;
                    }
                }
            }

            if (CONFIG.debugMode) {
                console.log('Like button not found');
            }
            return null;
        } catch (error) {
            console.error('Error finding like button:', error);
            return null;
        }
    }

    // Validate if element is actually a like button
    function isValidLikeButton(element) {
        try {
            // Check if element or its children contain like button characteristics
            const hasLikeClass = element.className.includes('e1tv929b');
            const hasLikeStructure = element.closest(`.${BUTTON_STRUCTURE.container}`);
            const isClickable = window.getComputedStyle(element).cursor === 'pointer';

            return hasLikeClass && (hasLikeStructure || isClickable);
        } catch (error) {
            return false;
        }
    }

    // Improved click simulation
    function simulateClick(element) {
        try {
            // Create and dispatch multiple types of events
            const events = [
                new MouseEvent('mouseover', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }),
                new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }),
                new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }),
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1
                })
            ];

            // Try clicking the element and its parent structure
            const elementsToClick = [
                element,
                element.parentElement,
                element.closest(`.${BUTTON_STRUCTURE.container}`),
                element.querySelector(`.${BUTTON_STRUCTURE.inner}`),
                element.querySelector(`.${BUTTON_STRUCTURE.middle}`)
            ].filter(Boolean);

            // Try clicking each element with each event
            elementsToClick.forEach(el => {
                events.forEach(event => {
                    el.dispatchEvent(event);
                });
                try { el.click(); } catch (e) {}
            });

            return true;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('Click simulation error:', error);
            }
            return false;
        }
    }

    // Combo tracking
    function updateCombo(success) {
        if (success) {
            CONFIG.stats.currentCombo++;
            if (CONFIG.stats.currentCombo > CONFIG.stats.maxCombo) {
                CONFIG.stats.maxCombo = CONFIG.stats.currentCombo;
                showNotification(`🔥 New Max Combo: ${CONFIG.stats.maxCombo}!`, 'success');
            }
            // Reset combo timeout
            if (CONFIG.comboTimeoutId) clearTimeout(CONFIG.comboTimeoutId);
            CONFIG.comboTimeoutId = setTimeout(() => {
                if (CONFIG.stats.currentCombo > 0) {
                    CONFIG.stats.combos++;
                    showNotification(`Combo End: ${CONFIG.stats.currentCombo}x`, 'info');
                    CONFIG.stats.currentCombo = 0;
                }
            }, MODES.combo.comboTimeout);
        } else {
            if (CONFIG.stats.currentCombo > 0) {
                CONFIG.stats.combos++;
            }
            CONFIG.stats.currentCombo = 0;
        }
    }

    // Optimized burst clicking for combo mode
    async function burstClick(button, count) {
        const clicks = new Array(count).fill(null);
        
        try {
            await Promise.all(clicks.map(async (_, index) => {
                try {
                    // Create and dispatch a custom mouse event
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    button.dispatchEvent(clickEvent);
                    
                    CONFIG.stats.successfulClicks++;
                    updateCombo(true);
                    
                    // Add minimal delay between clicks in burst
                    await new Promise(r => setTimeout(r, MODES.combo.burstDelay));
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error(`Burst click error at index ${index}:`, error);
                    }
                    CONFIG.stats.failedClicks++;
                    updateCombo(false);
                }
            }));
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('Burst sequence error:', error);
            }
        }
    }

    // Enhanced click function with optimized combo support
    async function clickLikeButton() {
        const likeButton = findLikeButton();
        if (!likeButton) {
            updateStats(false);
            return;
        }

        try {
            const modeConfig = MODES[CONFIG.mode];
            
            if (CONFIG.mode === 'combo') {
                await burstClick(likeButton, modeConfig.burstCount);
            } else {
                // Use custom event dispatch for single clicks too
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                likeButton.dispatchEvent(clickEvent);
                updateStats(true);
            }
            
            const now = Date.now();
            CONFIG.lastClickTime = now;

            const delay = Math.floor(Math.random() * 
                (modeConfig.max - modeConfig.min) + modeConfig.min);
            
            if (CONFIG.enabled) {
                setTimeout(clickLikeButton, delay);
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('Click error:', error);
            }
            updateStats(false);
        }
    }

    // Enhanced statistics tracking with combo stats
    function updateStats(success = true) {
        CONFIG.stats.totalClicks++;
        if (success) {
            CONFIG.stats.successfulClicks++;
            updateCombo(true);
        } else {
            CONFIG.stats.failedClicks++;
            updateCombo(false);
        }
        
        const runtime = CONFIG.stats.startTime ? 
            Math.round((Date.now() - CONFIG.stats.startTime) / 1000) : 0;
        
        const clicksPerSecond = runtime > 0 ? 
            (CONFIG.stats.successfulClicks / runtime).toFixed(2) : 0;

        console.log(`
        📊 Auto Liker Stats:
        ▶ Runtime: ${runtime}s
        ❤ Total Clicks: ${CONFIG.stats.totalClicks}
        ✅ Successful: ${CONFIG.stats.successfulClicks}
        ❌ Failed: ${CONFIG.stats.failedClicks}
        🔥 Current Combo: ${CONFIG.stats.currentCombo}x
        🏆 Max Combo: ${CONFIG.stats.maxCombo}x
        🎯 Total Combos: ${CONFIG.stats.combos}
        ⚡ Clicks/sec: ${clicksPerSecond}
        🔄 Mode: ${MODES[CONFIG.mode].name}
        `);
    }

    // Update the stats display in the control panel
    function updateStatsDisplay(statsDiv) {
        if (CONFIG.enabled) {
            const runtime = Math.round((Date.now() - CONFIG.stats.startTime) / 1000);
            const clicksPerSecond = runtime > 0 ? 
                (CONFIG.stats.successfulClicks / runtime).toFixed(2) : 0;
            
            statsDiv.innerHTML = `
                <span style="color: #ff3b5c">Mode: ${MODES[CONFIG.mode].name}</span><br>
                Runtime: ${runtime}s<br>
                Total Clicks: ${CONFIG.stats.totalClicks}<br>
                Success Rate: ${Math.round((CONFIG.stats.successfulClicks / CONFIG.stats.totalClicks) * 100 || 0)}%<br>
                Current Combo: <span style="color: #ff3b5c">${CONFIG.stats.currentCombo}x</span><br>
                Max Combo: <span style="color: #ff3b5c">${CONFIG.stats.maxCombo}x</span><br>
                Total Combos: ${CONFIG.stats.combos}<br>
                Clicks/sec: ${clicksPerSecond}
            `;
        }
    }

    // Enhanced toggle function
    function toggleAutoLiker() {
        CONFIG.enabled = !CONFIG.enabled;
        
        if (CONFIG.enabled) {
            CONFIG.stats.startTime = Date.now();
            CONFIG.stats.totalClicks = 0;
            CONFIG.stats.successfulClicks = 0;
            CONFIG.stats.failedClicks = 0;
            CONFIG.stats.combos = 0;
            CONFIG.stats.maxCombo = 0;
            CONFIG.stats.currentCombo = 0;
            showNotification(`Auto Liker: ON (${MODES[CONFIG.mode].name})`, 'success');
            clickLikeButton();
        } else {
            showNotification('Auto Liker: OFF', 'warning');
        }
    }

    // Mode switcher
    function switchMode() {
        const modes = Object.keys(MODES);
        const currentIndex = modes.indexOf(CONFIG.mode);
        CONFIG.mode = modes[(currentIndex + 1) % modes.length];
        showNotification(`Switched to ${MODES[CONFIG.mode].name}`, 'info');
    }

    // Enhanced keyboard controls
    document.addEventListener('keydown', function(event) {
        if (event.target.tagName.toLowerCase() !== 'input' && 
            event.target.tagName.toLowerCase() !== 'textarea') {
            
            if (event.key.toLowerCase() === CONFIG.buttonKey) {
                toggleAutoLiker();
            } else if (event.key.toLowerCase() === 'm') {
                switchMode();
            }
        }
    });

    // Setup drag functionality
    function setupDrag(panel, handle) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (e.target === handle || handle.contains(e.target)) {
                isDragging = true;
                handle.style.cursor = 'grabbing';
                
                if (e.type === "touchstart") {
                    initialX = e.touches[0].clientX - xOffset;
                    initialY = e.touches[0].clientY - yOffset;
                } else {
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                }
            }
        };

        const dragEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            handle.style.cursor = 'grab';
            
            // Save position
            localStorage.setItem('autoLikerPosX', panel.style.left);
            localStorage.setItem('autoLikerPosY', panel.style.top);
        };

        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;
            
            // Constrain to window bounds
            const bounds = panel.getBoundingClientRect();
            const maxX = window.innerWidth - bounds.width;
            const maxY = window.innerHeight - bounds.height;
            
            currentX = Math.min(Math.max(0, currentX), maxX);
            currentY = Math.min(Math.max(0, currentY), maxY);
            
            panel.style.left = currentX + 'px';
            panel.style.top = currentY + 'px';
        };

        // Touch events
        handle.addEventListener("touchstart", dragStart, false);
        document.addEventListener("touchend", dragEnd, false);
        document.addEventListener("touchmove", drag, false);

        // Mouse events
        handle.addEventListener("mousedown", dragStart, false);
        document.addEventListener("mouseup", dragEnd, false);
        document.addEventListener("mousemove", drag, false);

        // Load saved position
        const savedX = localStorage.getItem('autoLikerPosX');
        const savedY = localStorage.getItem('autoLikerPosY');
        if (savedX && savedY) {
            panel.style.left = savedX;
            panel.style.top = savedY;
            xOffset = parseInt(savedX);
            yOffset = parseInt(savedY);
        }
    }

    // Setup collapse functionality
    function setupCollapse(panel, header, content) {
        const collapseButton = document.createElement('div');
        collapseButton.innerHTML = '▼';
        collapseButton.style.cssText = `
            margin-left: 10px;
            font-size: 18px;
            color: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            transition: transform 0.3s ease;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            user-select: none;
        `;

        let isCollapsed = false;

        const toggleCollapse = () => {
            isCollapsed = !isCollapsed;
            content.style.maxHeight = isCollapsed ? '0' : '1000px';
            content.style.opacity = isCollapsed ? '0' : '1';
            content.style.overflow = isCollapsed ? 'hidden' : 'visible';
            collapseButton.style.transform = isCollapsed ? 'rotate(-180deg)' : '';
            collapseButton.innerHTML = isCollapsed ? '▲' : '▼';
            
            // Save state
            localStorage.setItem('autoLikerCollapsed', isCollapsed);
        };

        collapseButton.addEventListener('click', toggleCollapse);
        header.appendChild(collapseButton);

        // Load saved state
        const savedState = localStorage.getItem('autoLikerCollapsed');
        if (savedState === 'true') {
            toggleCollapse();
        }

        // Add transition styles
        content.style.transition = 'all 0.3s ease';
        content.style.maxHeight = '1000px';
        content.style.opacity = '1';
        content.style.overflow = 'hidden';
    }

    function addControlPanel() {
        if (!document.body) {
            if (CONFIG.debugMode) {
                console.log('Document body not ready, retrying...');
            }
            setTimeout(addControlPanel, 500);
            return;
        }

        // Check if panel already exists
        const existingPanel = document.querySelector('#tiktok-auto-liker-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        try {
            const panel = document.createElement('div');
            const header = document.createElement('div');
            const logo = document.createElement('div');
            const titleContainer = document.createElement('div');
            const title = document.createElement('div');
            const subtitle = document.createElement('div');
            const content = document.createElement('div');
            const toggleButton = document.createElement('button');
            const modeButton = document.createElement('button');
            const statsDiv = document.createElement('div');
            const footer = document.createElement('div');

            // Set IDs
            panel.id = 'tiktok-auto-liker-panel';
            content.id = 'panel-content';

            // Basic styling with centered position
            panel.style.cssText = `
                position: fixed;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                background: rgba(22, 24, 35, 0.95);
                color: white;
                padding: 20px;
                border-radius: 20px;
                z-index: 999999;
                min-width: 240px;
                max-width: 300px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: fadeIn 0.3s ease-out;
            `;

            header.style.cssText = `
                display: flex;
                align-items: center;
                margin: -10px -10px 15px -10px;
                padding: 10px;
                cursor: grab;
                user-select: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: linear-gradient(to right, rgba(255, 59, 92, 0.1), transparent);
                border-radius: 20px 20px 0 0;
            `;

            logo.innerHTML = '❤️';
            logo.style.cssText = `
                font-size: 24px;
                margin-right: 10px;
                animation: pulse 2s infinite;
            `;

            titleContainer.style.cssText = 'flex: 1;';
            
            title.textContent = 'TikTok Auto Liker Pro';
            title.style.cssText = 'font-size: 16px; font-weight: 600; color: #ff3b5c;';

            subtitle.textContent = 'Created by Amped';
            subtitle.style.cssText = 'font-size: 12px; color: rgba(255,255,255,0.6);';

            content.style.cssText = `
                transition: all 0.3s ease;
                overflow: hidden;
            `;

            toggleButton.textContent = 'Start Auto-Liker';
            toggleButton.style.cssText = `
                width: 100%;
                padding: 12px;
                margin-bottom: 10px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(45deg, #ff3b5c, #ff2f40);
                color: white;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            `;

            modeButton.textContent = `Current: ${MODES[CONFIG.mode].name}`;
            modeButton.style.cssText = `
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(45deg, #2196F3, #1976D2);
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            statsDiv.style.cssText = `
                font-size: 13px;
                margin-top: 10px;
                padding: 10px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
            `;

            footer.innerHTML = `Version 2.8.2 | Made with ❤️<br>© 2024 Amped`;
            footer.style.cssText = `
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.1);
                font-size: 11px;
                color: rgba(255,255,255,0.5);
                text-align: center;
            `;

            // Event listeners
            toggleButton.onclick = () => {
                toggleAutoLiker();
                toggleButton.textContent = CONFIG.enabled ? 'Stop Auto-Liker' : 'Start Auto-Liker';
                toggleButton.style.background = CONFIG.enabled ? 
                    'linear-gradient(45deg, #ff2f40, #ff1f1f)' : 
                    'linear-gradient(45deg, #ff3b5c, #ff2f40)';
            };

            modeButton.onclick = () => {
                switchMode();
                modeButton.textContent = `Current: ${MODES[CONFIG.mode].name}`;
            };

            // Add fade-in animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -45%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                #tiktok-auto-liker-panel button:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
                #tiktok-auto-liker-panel button:active {
                    transform: translateY(0);
                    filter: brightness(0.95);
                }
            `;
            document.head.appendChild(style);

            // Modify setupDrag to handle centered positioning
            const setupDragForPanel = () => {
                // Load saved position or use center position
                const savedX = localStorage.getItem('autoLikerPosX');
                const savedY = localStorage.getItem('autoLikerPosY');
                
                if (savedX && savedY) {
                    // Remove centering transform and set saved position
                    panel.style.transform = 'none';
                    panel.style.left = savedX;
                    panel.style.top = savedY;
                }
                
                // Setup drag functionality
                setupDrag(panel, header);
            };

            // Assemble the panel
            titleContainer.appendChild(title);
            titleContainer.appendChild(subtitle);
            
            header.appendChild(logo);
            header.appendChild(titleContainer);
            
            content.appendChild(toggleButton);
            content.appendChild(modeButton);
            content.appendChild(statsDiv);
            content.appendChild(footer);
            
            panel.appendChild(header);
            panel.appendChild(content);
            
            document.body.appendChild(panel);

            // Wait for animation to complete before enabling drag
            setTimeout(setupDragForPanel, 300);

            // Setup collapse functionality
            setupCollapse(panel, header, content);

            // Start stats update
            setInterval(() => {
                if (CONFIG.enabled) {
                    updateStatsDisplay(statsDiv);
                }
            }, 1000);

        } catch (error) {
            console.error('Error assembling panel:', error);
        }
    }

    // Initialize with retry mechanism
    function initialize() {
        if (!document.body) {
            if (CONFIG.debugMode) {
                console.log('Waiting for document body...');
            }
            setTimeout(initialize, 500);
            return;
        }

        if (window.location.pathname.includes('/live')) {
            // Add CSS animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            
            try {
                document.head.appendChild(style);
                addControlPanel();
                showNotification('TikTok Auto Liker Pro Ready!\nPress L to toggle, M to switch modes', 'info');
            } catch (error) {
                console.error('Error during initialization:', error);
                // Retry initialization if it fails
                setTimeout(initialize, 1000);
            }
        }
    }

    // URL change detection with safety check
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (!document.body) return;
        
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            initialize();
        }
    });

    // Start observing with error handling
    try {
        observer.observe(document, { subtree: true, childList: true });
    } catch (error) {
        console.error('Error starting observer:', error);
    }

    // Wait for document to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})(); 