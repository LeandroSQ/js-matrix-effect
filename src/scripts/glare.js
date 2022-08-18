export class Glare {

	constructor({ x, y }) {
		this.position = { x, y };
		this.initialRadius = Math.random() * 500 + 400;
		this.radius = this.initialRadius;
		this.velocity = {
			x: Math.random() * 300 - 150,
			y: Math.random() * 300 - 150
		};

		this.timeToLive = Math.random() * 2 + 2.5;
		this.timeLived = 0;
		this.isAlive = true;
	}

	update(deltaTime) {
		if (!this.isAlive) return;

		// Update time lived
		this.timeLived += deltaTime;
		if (this.timeLived >= this.timeToLive) this.isAlive = false;

		// Update position
		this.position.x += this.velocity.x * deltaTime + (Math.random() * 2 - 1) * 5;
		this.position.y += this.velocity.y * deltaTime + (Math.random() * 2 - 1) * 5;

		// Update radius
		// Grow when alive, shrink when dead
		const progress = 0.5 - Math.abs(this.timeLived / this.timeToLive - 0.5);
		this.radius = Math.max(this.initialRadius * progress * 2 + ((Math.random() * 2 - 1) * this.initialRadius * 0.1), 0);
	}

	/**
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 */
	render(ctx) {
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";

		const gradient = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, this.radius);
		const progress = Math.min(1 - this.timeLived / this.timeToLive, 1) / 12;
		gradient.addColorStop(0, `rgba(15, 250, 25, ${progress.toFixed(2)})`);
		gradient.addColorStop(1, "transparent");

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
	}

}