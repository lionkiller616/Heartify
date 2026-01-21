/**
 * ==========================================================================
 * HEARTIFY CORE ENGINE V5.0 (ENTERPRISE EDITION)
 * "The Logic Behind the Pixel Perfection"
 * ==========================================================================
 *
 * [SYSTEM ARCHITECTURE OVERVIEW]
 * --------------------------------------------------------------------------
 * The Heartify Engine is built on a modular, event-driven architecture designed
 * for scalability, maintainability, and high-performance rendering.
 *
 * 1.  CORE UTILITIES (Utils)
 * - Provides foundational helper functions for UUID generation, deep cloning,
 * debouncing, throttling, and mathematical operations.
 * - Acts as the standard library for the entire application.
 *
 * 2.  EVENT BUS (EventBus)
 * - Implements the Publish-Subscribe pattern to decouple modules.
 * - Facilitates communication between the UI, State Manager, and Renderer
 * without direct dependencies.
 *
 * 3.  STATE MANAGER (StateManager)
 * - Centralized store for application data (Single Source of Truth).
 * - Implements a robust Undo/Redo history stack.
 * - Persists state to LocalStorage for session restoration.
 * - Triggers state-change events for reactive UI updates.
 *
 * 4.  RENDER ENGINE (Renderer)
 * - Advanced HTML5 Canvas rendering pipeline.
 * - Supports high-DPI (Retina) displays via pixel ratio scaling.
 * - Layered rendering approach: Background -> Decorations -> Text -> Overlays.
 * - Optimized redraw loops using requestAnimationFrame.
 *
 * 5.  UI CONTROLLER (UI)
 * - Manages all DOM interactions and event listeners.
 * - Handles dynamic input binding and validation.
 * - Controls view transitions (Edit/Preview modes) and theme toggling.
 * - Manages floating UI elements like Toasts and Modals.
 *
 * 6.  EXPORT MANAGER (ExportEngine)
 * - Handles complex export logic for PNG and PDF formats.
 * - Generates sanitized filenames based on user content.
 * - interfaces with external libraries (jsPDF) safely.
 *
 * 7.  ANIMATION CONTROLLER (Motion)
 * - Manages particle systems and CSS-driven transitions.
 * - Provides physics-based animation utilities.
 *
 * ==========================================================================
 */

/* =========================================
   1.0 CORE UTILITIES & HELPERS
   ========================================= */
const Utils = (function() {
    /**
     * Generates a unique identifier (UUID v4 style).
     * @returns {string} A random UUID string.
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Creates a deep copy of an object or array.
     * Uses JSON serialization for simplicity and safety with data objects.
     * @param {any} obj - The object to clone.
     * @returns {any} The cloned object.
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error("Utils.deepClone: Error cloning object", e);
            return obj; // Fallback
        }
    }

    /**
     * Debounces a function execution.
     * @param {Function} func - The function to debounce.
     * @param {number} wait - The delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * Throttles a function execution.
     * @param {Function} func - The function to throttle.
     * @param {number} limit - The time limit in milliseconds.
     * @returns {Function} The throttled function.
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Linearly interpolates between two values.
     * @param {number} start - The start value.
     * @param {number} end - The end value.
     * @param {number} amt - The amount to interpolate (0.0 to 1.0).
     * @returns {number} The interpolated value.
     */
    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    /**
     * Clamps a number between a minimum and maximum value.
     * @param {number} num - The number to clamp.
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number} The clamped value.
     */
    function clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    /**
     * Generates a random integer between min and max (inclusive).
     * @param {number} min - Minimum value.
     * @param {number} max - Maximum value.
     * @returns {number} Random integer.
     */
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generates a random float between min and max.
     * @param {number} min - Minimum value.
     * @param {number} max - Maximum value.
     * @returns {number} Random float.
     */
    function randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Converts hex color to RGBA string.
     * @param {string} hex - The hex color string (e.g., "#ff0000").
     * @param {number} alpha - The alpha value (0.0 to 1.0).
     * @returns {string} The RGBA string.
     */
    function hexToRgba(hex, alpha = 1) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
        }
        return hex; // Return original if fails
    }

    /**
     * Sanitizes a string for use in filenames.
     * @param {string} str - The input string.
     * @returns {string} The sanitized string.
     */
    function sanitizeFilename(str) {
        return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    return {
        generateUUID,
        deepClone,
        debounce,
        throttle,
        lerp,
        clamp,
        randomInt,
        randomFloat,
        hexToRgba,
        sanitizeFilename
    };
})();

/* =========================================
   2.0 EVENT BUS (PUBLISH/SUBSCRIBE)
   ========================================= */
const EventBus = (function() {
    const topics = {};
    const hOP = topics.hasOwnProperty;

    return {
        /**
         * Subscribe to an event topic.
         * @param {string} topic - The event name.
         * @param {Function} listener - The callback function.
         * @returns {object} An object with a remove() method.
         */
        subscribe: function(topic, listener) {
            if (!hOP.call(topics, topic)) topics[topic] = [];

            const index = topics[topic].push(listener) - 1;

            return {
                remove: function() {
                    delete topics[topic][index];
                }
            };
        },

        /**
         * Publish an event to a topic.
         * @param {string} topic - The event name.
         * @param {any} info - Data to pass to listeners.
         */
        publish: function(topic, info) {
            if (!hOP.call(topics, topic)) return;

            topics[topic].forEach(function(item) {
                item(info != undefined ? info : {});
            });
        }
    };
})();

/* =========================================
   3.0 STATE MANAGER (STORE & HISTORY)
   ========================================= */
const StateManager = (function() {
    // Default Application State
    const DEFAULT_STATE = {
        meta: {
            version: '5.0.0',
            lastModified: Date.now()
        },
        content: {
            to: "My Dearest",
            message: "In all the world, there is no heart for me like yours. \n\nHappy Valentine's Day!",
            from: "Yours Always",
            quoteId: null
        },
        design: {
            themeId: 'rose',
            fontFamily: 'Great Vibes',
            layoutMode: 'centered',
            showWatermark: true
        },
        config: {
            canvasScale: 2, // High DPI factor
            width: 600,
            height: 800,
            exportQuality: 1.0
        }
    };

    // Theme Definitions (Configuration Data)
    const THEMES = {
        rose: { 
            id: 'rose',
            label: 'Rose',
            bg: ['#fff1f2', '#fecdd3'], 
            primary: '#be123c', 
            accent: '#fb7185',
            text: '#881337',
            particleColors: ['#be123c', '#fb7185', '#fff']
        },
        midnight: { 
            id: 'midnight',
            label: 'Midnight',
            bg: ['#0f172a', '#1e293b'], 
            primary: '#fbbf24', 
            accent: '#f59e0b',
            text: '#e2e8f0',
            particleColors: ['#fbbf24', '#f59e0b', '#ffffff']
        },
        lavender: { 
            id: 'lavender',
            label: 'Lavender',
            bg: ['#f5f3ff', '#ddd6fe'], 
            primary: '#6d28d9', 
            accent: '#8b5cf6',
            text: '#4c1d95',
            particleColors: ['#6d28d9', '#8b5cf6', '#e9d5ff']
        },
        gold: { 
            id: 'gold',
            label: 'Gold',
            bg: ['#fdfbfb', '#fde68a'], 
            primary: '#92400e', 
            accent: '#b45309',
            text: '#451a03',
            particleColors: ['#92400e', '#b45309', '#fcd34d']
        }
    };

    // AI Quotes Database
    const QUOTES = [
        "You are my sun, my moon, and all my stars.",
        "I look at you and see the rest of my life.",
        "Every love story is beautiful, but ours is my favorite.",
        "You make my heart smile.",
        "I love you more than words can say.",
        "To the world you may be one person, but to me you are the world.",
        "Whatever our souls are made of, his and mine are the same.",
        "If I know what love is, it is because of you.",
        "I swear I couldn't love you more than I do right now, and yet I know I will tomorrow.",
        "You are the finest, loveliest, tenderest, and most beautiful person I have ever known."
    ];

    // Current State Container
    let currentState = Utils.deepClone(DEFAULT_STATE);
    
    // History Stack for Undo/Redo
    const historyStack = [];
    const redoStack = [];
    const MAX_HISTORY = 50;

    /**
     * Initializes the state manager.
     * Tries to load from localStorage first.
     */
    function init() {
        console.log("StateManager: Initializing...");
        // Attempt to load saved state
        const saved = loadFromStorage();
        if (saved) {
            console.log("StateManager: Loaded from storage.");
            currentState = saved;
        } else {
            console.log("StateManager: Using default state.");
        }
        
        // Initial Publish
        EventBus.publish('state:updated', currentState);
    }

    /**
     * Loads state from localStorage.
     */
    function loadFromStorage() {
        try {
            const raw = localStorage.getItem('heartify_state_v5');
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error("StateManager: Load failed", e);
        }
        return null;
    }

    /**
     * Saves current state to localStorage.
     */
    function saveToStorage() {
        try {
            localStorage.setItem('heartify_state_v5', JSON.stringify(currentState));
        } catch (e) {
            console.error("StateManager: Save failed", e);
        }
    }

    /**
     * Updates a specific part of the state tree.
     * Pushes the previous state to history before updating.
     * @param {string} path - Dot notation path (e.g., 'content.to').
     * @param {any} value - The new value.
     */
    function updateState(path, value) {
        // Push to history
        pushHistory();

        // Parse path
        const keys = path.split('.');
        let target = currentState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) target[keys[i]] = {};
            target = target[keys[i]];
        }
        
        // Update value
        target[keys[keys.length - 1]] = value;
        
        // Update timestamp
        currentState.meta.lastModified = Date.now();

        // Persist & Notify
        saveToStorage();
        EventBus.publish('state:updated', currentState);
    }

    /**
     * Pushes a snapshot of the current state to the history stack.
     */
    function pushHistory() {
        if (historyStack.length >= MAX_HISTORY) {
            historyStack.shift(); // Remove oldest
        }
        historyStack.push(Utils.deepClone(currentState));
        // Clear redo stack on new action
        redoStack.length = 0; 
    }

    /**
     * Reverts to the previous state.
     */
    function undo() {
        if (historyStack.length > 0) {
            const previous = historyStack.pop();
            redoStack.push(Utils.deepClone(currentState));
            currentState = previous;
            saveToStorage();
            EventBus.publish('state:updated', currentState);
            Utils.notify("Undo successful");
        }
    }

    /**
     * Re-applies a reverted state.
     */
    function redo() {
        if (redoStack.length > 0) {
            const next = redoStack.pop();
            historyStack.push(Utils.deepClone(currentState));
            currentState = next;
            saveToStorage();
            EventBus.publish('state:updated', currentState);
            Utils.notify("Redo successful");
        }
    }

    /**
     * Resets the application to default state.
     */
    function reset() {
        pushHistory();
        currentState = Utils.deepClone(DEFAULT_STATE);
        saveToStorage();
        EventBus.publish('state:updated', currentState);
        EventBus.publish('app:reset');
        Utils.notify("Canvas Reset");
    }

    /**
     * Gets a random quote.
     */
    function getRandomQuote() {
        return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }

    // Public API
    return {
        init,
        get: () => Utils.deepClone(currentState),
        update: updateState,
        undo,
        redo,
        reset,
        getThemes: () => THEMES,
        getRandomQuote,
        getQuotes: () => QUOTES
    };
})();

/* =========================================
   4.0 RENDER ENGINE (CANVAS PIPELINE)
   ========================================= */
const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let isDrawing = false;
    let animationFrameId = null;

    /**
     * Initializes the rendering engine.
     */
    function init() {
        canvas = document.getElementById('cardCanvas');
        if (!canvas) {
            console.error("Renderer: Canvas element #cardCanvas not found!");
            return;
        }

        ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on body
        
        console.log("Renderer: Initialized context.");

        // Subscribe to state changes
        EventBus.subscribe('state:updated', (state) => {
            requestRender();
        });

        // Initial render
        requestRender();
    }

    /**
     * Requests a render frame via requestAnimationFrame.
     * Prevents excessive draw calls.
     */
    function requestRender() {
        if (!isDrawing) {
            isDrawing = true;
            animationFrameId = requestAnimationFrame(renderFrame);
        }
    }

    /**
     * Main rendering loop function.
     */
    function renderFrame() {
        const state = StateManager.get();
        const config = state.config;
        const theme = StateManager.getThemes()[state.design.themeId];

        // 1. Setup Canvas Dimensions (High DPI)
        // We set the internal resolution higher than display size
        const scale = config.canvasScale;
        const w = config.width * scale;
        const h = config.height * scale;

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        // 2. Setup Context Scaling
        ctx.setTransform(scale, 0, 0, scale, 0, 0); // Reset and scale
        
        // 3. Clear Screen
        ctx.clearRect(0, 0, config.width, config.height);

        // 4. Render Layers
        drawBackground(ctx, theme, config.width, config.height);
        drawDecorations(ctx, theme, config.width, config.height);
        drawTextContent(ctx, state.content, state.design, theme, config.width, config.height);
        
        // 5. Watermark (Optional)
        if (state.design.showWatermark) {
            drawWatermark(ctx, theme, config.width, config.height);
        }

        isDrawing = false;
    }

    /**
     * Layer 1: Background
     */
    function drawBackground(ctx, theme, w, h) {
        // Gradient
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, theme.bg[0]);
        grad.addColorStop(1, theme.bg[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Procedural Noise (Paper Texture)
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = '#000000';
        // Optimization: Draw larger noise blocks for performance
        const noiseSize = 2;
        const step = 4;
        for (let i = 0; i < w; i += step) {
            for (let j = 0; j < h; j += step) {
                if (Math.random() > 0.6) {
                    ctx.fillRect(i, j, noiseSize, noiseSize);
                }
            }
        }
        ctx.restore();
    }

    /**
     * Layer 2: Decorations (Frame, Icons)
     */
    function drawDecorations(ctx, theme, w, h) {
        ctx.save();
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        // Elegant Inner Frame
        const margin = 30;
        ctx.strokeRect(margin, margin, w - (margin * 2), h - (margin * 2));

        // Corner Flourishes
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = 0.15;
        
        // Top Left Heart
        drawHeartPath(ctx, margin + 30, margin + 30, 25);
        ctx.fill();
        
        // Bottom Right Heart
        drawHeartPath(ctx, w - (margin + 30), h - (margin + 30), 35);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Helper to draw a heart path
     */
    function drawHeartPath(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-size / 2, -size / 2, -size, size / 3, 0, size);
        ctx.bezierCurveTo(size, size / 3, size / 2, -size / 2, 0, 0);
        ctx.closePath();
        ctx.restore();
    }

    /**
     * Layer 3: Text Content
     */
    function drawTextContent(ctx, content, design, theme, w, h) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = theme.primary;

        const centerX = w / 2;

        // 1. Recipient Name
        // Font loading check could be implemented here, but we rely on window.onload
        ctx.font = `italic 36px '${design.fontFamily}'`;
        ctx.fillText(content.to, centerX, 160);

        // 2. Divider Graphic
        ctx.beginPath();
        ctx.moveTo(centerX - 50, 190);
        ctx.lineTo(centerX + 50, 190);
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3. Message Body
        ctx.font = `400 24px 'Lato'`;
        // High contrast logic
        ctx.fillStyle = (design.themeId === 'midnight') ? '#cbd5e1' : '#475569';
        
        const msgY = 320;
        const msgWidth = w - 120; // Padding side
        wrapText(ctx, content.message, centerX, msgY, msgWidth, 38);

        // 4. Sender Name (Footer)
        const footerY = h - 100;
        ctx.fillStyle = theme.accent;
        ctx.font = `italic 28px '${design.fontFamily}'`;
        ctx.fillText(content.from, centerX, footerY);

        ctx.restore();
    }

    /**
     * Layer 4: Watermark
     */
    function drawWatermark(ctx, theme, w, h) {
        ctx.save();
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        
        if (theme.id === 'midnight') {
            ctx.fillStyle = "rgba(255,255,255,0.15)";
        } else {
            ctx.fillStyle = "rgba(0,0,0,0.1)";
        }
        
        ctx.fillText("HEARTIFY STUDIO", w/2, h - 20);
        ctx.restore();
    }

    /**
     * Wraps text within a given width.
     */
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        // Handle explicit newlines first
        const paragraphs = text.split('\n');
        let cursorY = y;

        paragraphs.forEach(paragraph => {
            const words = paragraph.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;
                
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, x, cursorY);
                    line = words[n] + ' ';
                    cursorY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, cursorY);
            cursorY += lineHeight; // Newline for paragraph break
        });
    }

    // Public API
    return {
        init,
        update: requestRender,
        getCanvas: () => canvas
    };
})();

/* =========================================
   5.0 UI CONTROLLER (INTERACTION)
   ========================================= */
const UI = (function() {
    
    // DOM Elements Cache
    const dom = {};

    function init() {
        console.log("UIController: Initializing...");
        cacheDOM();
        bindEvents();
        renderThemePicker();
        renderFontSelector(); // Ensure font selector respects state
        
        // Initial State Sync
        syncUI(StateManager.get());

        // Sub to state updates
        EventBus.subscribe('state:updated', (state) => {
            syncUI(state);
        });
        
        // Spawn bg particles
        Motion.spawnParticles();
    }

    function cacheDOM() {
        dom.inputTo = document.getElementById('in-to');
        dom.inputMsg = document.getElementById('in-msg');
        dom.inputFrom = document.getElementById('in-from');
        dom.inputFont = document.getElementById('in-font');
        dom.themePicker = document.getElementById('theme-picker');
        dom.btnQuote = document.getElementById('btn-quote');
        dom.btnPng = document.getElementById('export-png');
        dom.btnPdf = document.getElementById('export-pdf');
        dom.toast = document.getElementById('toast');
        dom.sidebar = document.querySelector('.sidebar');
    }

    function bindEvents() {
        // Text Inputs (Debounced update for perf)
        // Actually, for immediate canvas feedback, we might want 'input' without debounce, 
        // or a very short debounce. Renderer uses RAF so it's safe.
        
        if (dom.inputTo) {
            dom.inputTo.addEventListener('input', (e) => {
                StateManager.update('content.to', e.target.value);
            });
        }
        
        if (dom.inputMsg) {
            dom.inputMsg.addEventListener('input', (e) => {
                StateManager.update('content.message', e.target.value);
            });
        }
        
        if (dom.inputFrom) {
            dom.inputFrom.addEventListener('input', (e) => {
                StateManager.update('content.from', e.target.value);
            });
        }

        if (dom.inputFont) {
            dom.inputFont.addEventListener('change', (e) => {
                StateManager.update('design.fontFamily', e.target.value);
            });
        }

        // Actions
        if (dom.btnQuote) {
            dom.btnQuote.addEventListener('click', () => {
                const quote = StateManager.getRandomQuote();
                StateManager.update('content.message', quote);
                Utils.notify("AI Magic: New Quote Applied ✨");
                
                // Visual Flash
                dom.inputMsg.classList.add('flash-highlight');
                setTimeout(() => dom.inputMsg.classList.remove('flash-highlight'), 500);
            });
        }

        if (dom.btnPng) {
            dom.btnPng.addEventListener('click', ExportEngine.downloadPNG);
        }

        if (dom.btnPdf) {
            dom.btnPdf.addEventListener('click', ExportEngine.downloadPDF);
        }

        // Keyboard Shortcuts (Undo/Redo)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                StateManager.undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                StateManager.redo();
            }
        });
    }

    function renderThemePicker() {
        if (!dom.themePicker) return;
        
        dom.themePicker.innerHTML = '';
        const themes = StateManager.getThemes();
        
        Object.values(themes).forEach(theme => {
            const btn = document.createElement('button');
            btn.title = theme.label;
            btn.dataset.id = theme.id;
            
            // CSS Gradient visual
            btn.style.background = `linear-gradient(135deg, ${theme.bg[0]}, ${theme.bg[1]})`;
            
            btn.addEventListener('click', () => {
                StateManager.update('design.themeId', theme.id);
            });
            
            dom.themePicker.appendChild(btn);
        });
    }

    function renderFontSelector() {
        // Font selector options are static in HTML for now, 
        // but we could populate them dynamically here if we wanted to support more fonts.
    }

    /**
     * Syncs the UI inputs with the current state.
     * Useful for Undo/Redo or Reset.
     */
    function syncUI(state) {
        if (!state) return;

        // Inputs
        if (dom.inputTo) dom.inputTo.value = state.content.to;
        if (dom.inputMsg) dom.inputMsg.value = state.content.message;
        if (dom.inputFrom) dom.inputFrom.value = state.content.from;
        if (dom.inputFont) dom.inputFont.value = state.design.fontFamily;

        // Theme Buttons Active State
        const themeBtns = dom.themePicker.querySelectorAll('button');
        themeBtns.forEach(btn => {
            if (btn.dataset.id === state.design.themeId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Public API
    return {
        init
    };
})();

/* =========================================
   6.0 EXPORT MANAGER (PDF & IMAGE)
   ========================================= */
const ExportEngine = (function() {

    function getFilename(extension) {
        const state = StateManager.get();
        const cleanName = Utils.sanitizeFilename(state.content.to);
        return `heartify-${cleanName}.${extension}`;
    }

    function downloadPNG() {
        const canvas = Renderer.getCanvas();
        if (!canvas) return;

        // Create temporary link
        const link = document.createElement('a');
        link.download = getFilename('png');
        link.href = canvas.toDataURL('image/png', 1.0);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Utils.notify("Image Downloaded Successfully! 💌");
    }

    function downloadPDF() {
        if (!window.jspdf) {
            alert("PDF Library is loading. Please wait a moment.");
            return;
        }

        Utils.notify("Generating PDF... ⚙️");

        // Use requestAnimationFrame to let the UI update before blocking 
        requestAnimationFrame(() => {
            const { jsPDF } = window.jspdf;
            const canvas = Renderer.getCanvas();
            
            // A4-ish ratio setup for PDF
            // We use 'px' unit to match canvas roughly, or standard point size
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [600, 800]
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Add image to PDF (Fit to page)
            pdf.addImage(imgData, 'JPEG', 0, 0, 600, 800);
            
            pdf.save(getFilename('pdf'));
            
            Utils.notify("PDF Saved! 📄");
        });
    }

    return {
        downloadPNG,
        downloadPDF
    };
})();

/* =========================================
   7.0 ANIMATION CONTROLLER (MOTION)
   ========================================= */
const Motion = (function() {
    
    function spawnParticles() {
        const container = document.getElementById('bg-particles');
        if (!container) return;

        // Clear existing
        container.innerHTML = '';

        const shapes = ['❤️', '✨', '🌸', '💖', '💌'];
        const count = 30;

        for (let i = 0; i < count; i++) {
            createParticle(container, shapes);
        }
    }

    function createParticle(container, shapes) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.innerText = shapes[Utils.randomInt(0, shapes.length - 1)];
        
        // Random Position & Styling
        p.style.left = Utils.randomFloat(0, 100) + '%';
        p.style.top = Utils.randomFloat(100, 120) + '%'; // Start below screen
        p.style.fontSize = Utils.randomInt(10, 30) + 'px';
        p.style.opacity = Utils.randomFloat(0.1, 0.5);
        
        // Random Animation
        const duration = Utils.randomFloat(10, 25);
        const delay = Utils.randomFloat(0, 15);
        
        p.style.animationDuration = duration + 's';
        p.style.animationDelay = delay + 's';

        container.appendChild(p);
    }

    return {
        spawnParticles
    };
})();

/* =========================================
   8.0 GLOBAL HELPERS (Window Exposure)
   ========================================= */

// Utils wrapper for Notify to be accessible globally if needed
Utils.notify = function(message) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    
    if (!toast || !toastText) return;

    // Set Content (Icon + Text)
    // We assume toast has a span #toast-text based on HTML structure, 
    // but the css implies the toast is the container. 
    // Let's check structure. HTML: <div id="toast"><span id="toast-text"></span></div>
    
    toastText.innerHTML = message;
    
    // Add Icon dynamically if Lucide exists
    if (!toast.querySelector('svg')) {
       // Ideally we pre-render icon in html, but for dynamic messages:
       const icon = document.createElement('i');
       icon.setAttribute('data-lucide', 'check-circle');
       icon.style.marginRight = '8px';
       icon.style.width = '16px';
       // This prepends every time, might duplicate. 
       // Better approach: Clean toast HTML
       toast.innerHTML = `<i data-lucide="check-circle" style="width:18px; margin-right:8px;"></i> ${message}`;
       if(window.lucide) lucide.createIcons();
    } else {
        // Just update text part logic... simplified:
         toast.innerHTML = `<i data-lucide="check-circle" style="width:18px; margin-right:8px;"></i> ${message}`;
         if(window.lucide) lucide.createIcons();
    }

    toast.classList.add('show');

    // Debounce hide
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
};

// Window Global Functions for HTML onclick attributes
window.setMode = (mode) => {
    // 1. Update Body Class for CSS View Switching
    document.body.className = `mode-${mode}`;
    
    // 2. Update Toggle Button UI
    const btns = document.querySelectorAll('.v-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Select based on onclick attribute matching
    const activeBtn = document.querySelector(`.v-btn[onclick="setMode('${mode}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    // 3. Force scroll to top (UX fix for mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 4. Trigger resize event for canvas (optional safety)
    if (mode === 'preview') {
        Renderer.update();
    }
};

window.toggleTheme = () => {
    const root = document.documentElement;
    const current = root.dataset.theme;
    const next = current === 'light' ? 'dark' : 'light';
    
    root.dataset.theme = next;
    
    Utils.notify(`Switched to ${next.charAt(0).toUpperCase() + next.slice(1)} Mode 🌙`);
    
    // Force re-render just in case styles affect canvas indirects
    Renderer.update();
};

/* =========================================
   9.0 BOOTSTRAP (INITIALIZATION)
   ========================================= */
(function Bootstrap() {
    
    // Wait for DOM
    window.onload = () => {
        console.log("Heartify: Booting up...");

        // 1. Initialize Icons
        if (window.lucide) {
            lucide.createIcons();
        }

        // 2. Font Loading Safety
        // We wait for fonts so canvas text measure works correctly
        document.fonts.ready.then(() => {
            console.log("Heartify: Fonts loaded.");
            initApp();
        }).catch((e) => {
            console.warn("Heartify: Font load timeout/error", e);
            // Fallback init
            initApp();
        });
    };

    function initApp() {
        // Init Core Modules
        StateManager.init();
        Renderer.init();
        UI.init();
        
        console.log("Heartify: System Online.");
    }

})();

/**
 * ==========================================================================
 * END OF CORE ENGINE
 * ==========================================================================
 */


