import { FONT_FAMILY, SYMBOLS } from "./constants";

class FontLoader {

	constructor() {
		this.cache = { };
	}

	/**
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 */
	async load(ctx) {
		const font = FONT_FAMILY;
		if (!document.fonts.check(font)) {
			await document.fonts.load(font);

			// Cache all symbols
			for (const symbol of SYMBOLS) {
				this.measure(ctx, symbol);
			}
		}

		ctx.font = font;
	}
	
	/**
	 * Calculate the width and height of a symbol
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {string} symbol
	 *
	 * @return {Object} - { width, height }
	 */
	measure(ctx, symbol) {
		if (ctx && !this.cache.hasOwnProperty(symbol)) {
			const metrics = ctx.measureText(symbol);
			this.cache[symbol] = {
				width: metrics.width,
				height: metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
			};
		}

		return this.cache[symbol];
	}

	averageMetrics(ctx) {
		return this.measure(ctx, "M");
	}

}

const instance = new FontLoader();
export default instance;