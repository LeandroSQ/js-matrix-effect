import "./extensions";
import { DensityCanvas } from "./density-canvas";
import { DROP_BLUR_COLOR, DROP_SPAWN_INTERVAL, GLARE_SPAWN_INTERVAL, MAX_DROP_COUNT, MAX_GLARE_COUNT } from "./constants";
import { Drop } from "./drop";
import FontLoader from "./font-loader";
import { Glare } from "./glare";

class Main {

	constructor() {
		// Setup canvas
		this.canvas = new DensityCanvas();
		this.canvas.attachToElement(document.body);

		// Variables
		this.dropSpawnTimer = 0;
		this.glareSpawnTimer = 0;
		this.grid = { columns: 0, rows: 0, drops: 0 };
		this.glares = [];
		this.horizontalColumn = 0;

		// Frame rate variables
		this.targetFPS = 24;
		this.targetFrameTime = 1000 / this.targetFPS;
		this.frameStartTime = performance.now();
		this.lastFrameTime = performance.now();
		this.frameCount = 0;
		this.frameTimer = 0;
		this.fps = 0;
		this.paused = false;

		// Hook events
		this.#attachHooks();
	}

	#attachHooks() {
		// Attach load event
		window.addLoadEventListener(this.#onLoad.bind(this));

		// Attach resize event
		window.addEventListener("resize", this.#onResize.bind(this));

		// Attach visibility change event
		const events = ["visibilitychange", "webkitvisibilitychange", "mozvisibilitychange", "msvisibilitychange"];
		events.forEach(event => window.addEventListener(event, this.#onVisibilityChange.bind(this)));
	}

	#invalidate() {
		// Calculate the time since the last frame
		const elapsed = this.lastFrameTime - this.frameStartTime;
		let remaining = this.targetFrameTime - elapsed;

		// Clamp the remaining time to a minimum of 0ms and a maximum of the target frame interval
		if (remaining < 0) remaining = 0;
		else if (remaining > this.targetFrameTime) remaining = this.targetFrameTime;

		this.lastFrameTime = performance.now();
		setTimeout(() => {
			requestAnimationFrame(this.#onFrame.bind(this));
		}, remaining);
		// setTimeout(this.#onFrame.bind(this), remaining);
		// requestAnimationFrame(this.onFrame.bind(this));
	}

	async #onLoad() {
		// Set the sizing of the canvas
		await this.#onResize();

		// Request fullscreen
		this.canvas.fullscreen();

		// Request next frame
		this.#invalidate();
	}

	async #onResize() {
		// Define the canvas size
		const size = { width: document.body.clientWidth, height: document.body.clientHeight };
		this.canvas.setSize(size);

		// Preload font family
		await FontLoader.load(this.canvas.context);

		// Calculate the number of columns and rows
		const averageMetrics = FontLoader.averageMetrics(this.canvas.context);
		this.grid.columns = Math.floor(this.canvas.width / averageMetrics.width);
		this.grid.rows = Math.floor(this.canvas.height / averageMetrics.height);
	}

	#onVisibilityChange(event) {
		if (document.hidden) {
			this.paused = true;
		} else {
			this.paused = false;
			this.lastFrameTime = performance.now();
			this.frameStartTime = performance.now();

			this.#invalidate();
		}
	}

	#onTick(deltaTime) {
		this.#spawnDrops(deltaTime);
		this.#spawnGlares(deltaTime);
	}

	#spawnDrops(deltaTime) {
		// Spawn new drops
		this.dropSpawnTimer += deltaTime;
		if (this.dropSpawnTimer >= DROP_SPAWN_INTERVAL) {
			this.dropSpawnTimer -= DROP_SPAWN_INTERVAL;

			const averageMetrics = FontLoader.averageMetrics(this.canvas.context);

			for (let i = 0; i < Math.random() * Math.min(this.grid.columns / 12, 50) && this.grid.drops < MAX_DROP_COUNT; i++) {
				const column = Math.floor(Math.random() * this.grid.columns);
				const x = column * averageMetrics.width;

				// Check for collisions
				const rows = this.#getOnGrid(column);
				if (rows.length <= 0 || rows[rows.length - 1].trail.length >= rows[rows.length - 1].maxLength / 2) {
					this.#setOnGrid(column, new Drop({ x: x, y: 0 }));
					this.grid.drops++;
				}
			}
		}
	}

	#spawnGlares(deltaTime) {
		if (this.grid.drops <= MAX_DROP_COUNT / 4) return;

		// Spawn new glares
		if (this.glares.length < MAX_GLARE_COUNT) {
			if (this.glareSpawnTimer >= GLARE_SPAWN_INTERVAL) {
				this.glareSpawnTimer -= GLARE_SPAWN_INTERVAL;

				const x = Math.random() * this.canvas.width;
				const y = Math.random() * this.canvas.height;
				this.glares.push(new Glare({ x, y }));
			} else {
				this.glareSpawnTimer += deltaTime;
			}
		}
	}

	#onFrame() {
		if (this.paused) return;

		// Acknowledge the frame start
		this.frameStartTime = performance.now();
		const deltaTime = (this.frameStartTime - this.lastFrameTime) / 1000;

		// Estimate the frame rate
		this.frameCount++;
		this.frameTimer += deltaTime;
		if (this.frameTimer >= 1) {
			this.fps = this.frameCount;
			this.frameCount = 0;
			this.frameTimer -= 1;
		}

		// Update and render the scene
		this.#onTick(deltaTime);
		this.#onRender(deltaTime);

		// Request next frame
		this.#invalidate();
	}

	// eslint-disable-next-line max-statements
	#onRender(deltaTime) {
		this.canvas.clear();
		const ctx = this.canvas.context;
		const width = this.canvas.width;
		const height = this.canvas.height;

		// Render glares
		for (let i = this.glares.length - 1; i >= 0; i--) {
			const glare = this.glares[i];
			glare.update(deltaTime);

			if (!glare.isAlive) {
				this.glares.splice(i, 1);
			} else {
				glare.render(ctx);
			}
		}

		// Render drops
		for (let col = 0; col < this.grid.columns; col++) {
			if (!this.grid.hasOwnProperty(col)) continue;
			const rows = this.grid[col].length;

			for (let i = rows - 1; i >= 0; i--) {
				const drop = this.grid[col][i];

				if (drop.isWithinScreenBounds(width, height)) {
					drop.update(deltaTime);
					drop.render(ctx);
				} else {
					this.grid[col].splice(i, 1);
					this.grid.drops --;
				}
			}
		}

		this.#drawFps(ctx);
	}

	#drawFps(ctx) {
		// Draw FPS Counter
		ctx.fillStyle = "white";
		ctx.shadowColor = DROP_BLUR_COLOR;
		ctx.shadowBlur = 10;
		ctx.fillText(`${this.fps} FPS`, 10, 20);
	}

	#setOnGrid(x, value) {
		if (!this.grid.hasOwnProperty(x)) {
			this.grid[x] = [];
		}

		this.grid[x].push(value);
	}

	#getOnGrid(x) {
		if (!this.grid.hasOwnProperty(x)) {
			return [];
		}

		return this.grid[x];
	}

}

new Main();
