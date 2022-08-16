import "./extensions";
import { DensityCanvas } from "./density-canvas";
import { DROP_SPAWN_INTERVAL, MAX_DROP_COUNT, SYMBOLS } from "./constants";
import { Drop } from "./drop";
import FontLoader from "./font-loader";

class Main {

	constructor() {
		// Setup canvas
		this.canvas = new DensityCanvas();
		this.canvas.attachToElement(document.body);

		// Variables
		this.dropSpawnTimer = 0;
		this.drops = [];
		this.horizontalColumn = 0;

		// Frame rate variables
		this.targetFPS = 24;
		this.targetFrameTime = 1000 / this.targetFPS;
		this.frameStartTime = performance.now();
		this.lastFrameTime = performance.now();
		this.frameCount = 0;
		this.frameTimer = 0;
		this.fps = 0;

		// Hook events
		window.addLoadEventListener(this.#onLoad.bind(this));
		window.addEventListener("resize", this.#onResize.bind(this));
	}

	#invalidate() {
		// Calculate the time since the last frame
		const elapsed = this.lastFrameTime - this.frameStartTime;
		let remaining = this.targetFrameTime - elapsed;

		// Clamp the remaining time to a minimum of 0ms and a maximum of the target frame interval
		if (remaining < 0) remaining = 0;
		else if (remaining > this.targetFrameTime) remaining = this.targetFrameTime;

		this.lastFrameTime = performance.now();
		setTimeout(this.#onFrame.bind(this), remaining);
		// requestAnimationFrame(this.onFrame.bind(this));
	}

	async #onLoad() {
		// Define the canvas size
		const size = { width: document.body.clientWidth, height: document.body.clientHeight };
		this.canvas.setSize(size);

		// Preload font family
		await FontLoader.load(this.canvas.context);

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
	}

	#onTick(deltaTime) {
		// Spawn new drops
		this.dropSpawnTimer += deltaTime;
		if (this.dropSpawnTimer >= DROP_SPAWN_INTERVAL) {
			this.dropSpawnTimer -= DROP_SPAWN_INTERVAL;
			for (let i = 0; i < Math.random() * 50 && this.drops.length < MAX_DROP_COUNT; i++) {
				const averageMetrics = FontLoader.averageMetrics(this.canvas.context);
				const columns = Math.floor(this.canvas.width / averageMetrics.width);
				const x = Math.floor(Math.random() * columns) * averageMetrics.width;

				this.drops.push(new Drop({ x, y: 0 }));
			}
		}
	}

	#onFrame() {
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

	#onRender(deltaTime) {
		this.canvas.clear();
		const ctx = this.canvas.context;
		const width = this.canvas.width;
		const height = this.canvas.height;

		for (let i = this.drops.length - 1; i >= 0; i--) {
			const drop = this.drops[i];

			if (drop.isWithinScreenBounds(width, height)) {
				drop.update(deltaTime);
				drop.render(ctx);
			} else {
				this.drops.splice(i, 1);
			}
		}

		// Draw FPS Counter
		// const ctx = this.canvas.context;
		// ctx.fillStyle = "white";
		// ctx.fillText(`${this.fps} FPS`, 10, 20);
	}

}

new Main();
