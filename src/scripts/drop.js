import { DROP_BLUR_COLOR, DROP_TIME_TO_STACK, DROP_TIME_TO_SWAP_SYMBOLS, SYMBOLS, TRAIL_LENGTH } from "./constants";
import FontLoader from "./font-loader";

const timeToSpawn = 0.075;
const timeToSwap = 0.050;

export class Drop {

	constructor({ x, y }) {
		this.position = { x, y };
		this.velocity = Math.random() * 100 + 25;

		this.moveTimer = 0;
		this.spawnTimer = 0;
		this.swapTimer = 0;

		this.letterSpacing = 0;

		this.trail = [];
	}

	update(deltaTime) {
		// Update trail size
		this.spawnTimer += deltaTime;
		if (this.spawnTimer >= DROP_TIME_TO_STACK) {
			this.spawnTimer -= DROP_TIME_TO_STACK;

			// Add new symbol to trail
			this.trail.unshift(this.#getRandomSymbol());
			if (this.trail.length > TRAIL_LENGTH) this.trail.pop();

			// Update vertical position, falling
			this.position.y += FontLoader.measure(null, this.trail[0])?.height ?? 0 + this.letterSpacing;
		}

		// Update letter swap
		if (this.swapTimer >= DROP_TIME_TO_SWAP_SYMBOLS && Math.random() <= 0.25) {
			this.swapTimer -= DROP_TIME_TO_SWAP_SYMBOLS;
			this.trail[0] = this.#getRandomSymbol();

			// Randomly swap symbols in trail
			if (Math.random() <= 0.5) {
				this.trail[1 + Math.floor(Math.random() * this.trail.length - 2)] = this.#getRandomSymbol();
			}
		} else this.swapTimer += deltaTime;
	}

	/**
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 */
	render(ctx) {
		// Draw current symbol
		let verticalOffset = 0;
		for (let i = 0; i < this.trail.length; i++) {
			const darknessPercentage = 1 - i / (this.trail.length + 1);
			const symbol = this.trail[i];
			const color = i == 0 ? "#afa" : this.#getColor(darknessPercentage);
			const size = FontLoader.measure(ctx, symbol);

			this.#renderSymbol(ctx, symbol, darknessPercentage, -size.width / 2, -verticalOffset, color);

			verticalOffset += size.height + this.letterSpacing;
		}
	}

	isWithinScreenBounds(width, height) {
		return this.position.x >= 0 && this.position.x <= width && this.position.y >= 0 && this.position.y - this.trail.length * 20 <= height;
	}

	#getRandomSymbol() {
		return SYMBOLS.random();
	}

	#getColor(darknessPercentage) {
		const r = Math.floor(10 * (1 - darknessPercentage));
		const g = Math.floor(255 * (darknessPercentage));
		const b = Math.floor(10 * (1 - darknessPercentage));

		return `rgb(${r}, ${g}, ${b})`;
		// return `rgba(10, 245, 10, ${darknessPercentage.toFixed(2)})`;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {string} symbol
	 * @param {number} darknessPercentage
	 * @param {number} horizontalOffset
	 * @param {number} verticalOffset
	 * @param {string} color
	 */
	// eslint-disable-next-line max-params
	#renderSymbol(ctx, symbol, darknessPercentage, horizontalOffset, verticalOffset, color) {
		// Set color
		ctx.fillStyle = color;

		// Apply blur when symbol is light enough
		if (darknessPercentage > 0.5) {
			ctx.shadowColor = DROP_BLUR_COLOR;
			ctx.shadowBlur = 10;
		} else {
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
		}
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;

		// Draw symbol
		ctx.fillText(symbol, this.position.x + horizontalOffset, this.position.y + verticalOffset);
	}

}