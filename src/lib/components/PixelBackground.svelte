<script lang="ts">
	let canvas: HTMLCanvasElement;

	interface Pixel {
		x: number;
		y: number;
		size: number;
		opacity: number;
		state: 'waiting' | 'in' | 'hold' | 'out';
		timer: number;
	}

	const SINGLE_COUNT = 22;
	const GROUP_CELL = 24;
	const GROUP_GRID = 4;
	const GROUP_MIN_CELLS = 5;
	const GROUP_MAX_CELLS = 9;

	function randomBetween(min: number, max: number) {
		return min + Math.random() * (max - min);
	}

	function spawnSingle(width: number, height: number): Pixel {
		return {
			x: randomBetween(0, width),
			y: randomBetween(0, height),
			size: randomBetween(8, 18),
			opacity: 0,
			state: 'waiting',
			timer: randomBetween(200, 5000)
		};
	}

	function buildGroup(width: number, height: number): Pixel[] {
		const span = GROUP_GRID * GROUP_CELL;
		const originX = randomBetween(0, Math.max(0, width - span));
		const originY = randomBetween(0, Math.max(0, height - span));
		const cellCount = Math.round(randomBetween(GROUP_MIN_CELLS, GROUP_MAX_CELLS));

		const cells = new Set<string>();
		let cx = Math.floor(GROUP_GRID / 2);
		let cy = Math.floor(GROUP_GRID / 2);
		cells.add(`${cx},${cy}`);
		while (cells.size < cellCount) {
			const dir = Math.floor(Math.random() * 4);
			if (dir === 0) cx = Math.min(GROUP_GRID - 1, cx + 1);
			else if (dir === 1) cx = Math.max(0, cx - 1);
			else if (dir === 2) cy = Math.min(GROUP_GRID - 1, cy + 1);
			else cy = Math.max(0, cy - 1);
			cells.add(`${cx},${cy}`);
		}

		const order = Array.from(cells).sort(() => Math.random() - 0.5);

		return order.map((key, index) => {
			const [gx, gy] = key.split(',').map(Number);
			return {
				x: originX + gx * GROUP_CELL,
				y: originY + gy * GROUP_CELL,
				size: GROUP_CELL - 2,
				opacity: 0,
				state: 'waiting' as const,
				timer: index * randomBetween(150, 260)
			};
		});
	}

	function advance(p: Pixel, dt: number, respawnable: boolean, spawner: () => Pixel) {
		p.timer -= dt;
		if (p.timer <= 0) {
			if (p.state === 'waiting') {
				p.state = 'in';
				p.timer = randomBetween(300, 600);
			} else if (p.state === 'in') {
				p.state = 'hold';
				p.timer = randomBetween(300, 1200);
			} else if (p.state === 'hold') {
				p.state = 'out';
				p.timer = randomBetween(400, 800);
			} else if (respawnable) {
				Object.assign(p, spawner());
			}
		}

		if (p.state === 'in') {
			p.opacity = Math.min(1, p.opacity + dt / 550);
		} else if (p.state === 'out') {
			p.opacity = Math.max(0, p.opacity - dt / 650);
		} else if (p.state === 'hold') {
			p.opacity = 1;
		}
	}

	$effect(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let width = 0;
		let height = 0;
		let singles: Pixel[] = [];
		let group: Pixel[] = [];
		let groupIdleTimer = randomBetween(500, 2000);

		function resize() {
			const rect = canvas.parentElement!.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			width = rect.width;
			height = rect.height;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			singles = Array.from({ length: SINGLE_COUNT }, () => spawnSingle(width, height));
			group = [];
			groupIdleTimer = randomBetween(500, 2000);
		}

		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(canvas.parentElement!);

		let raf = requestAnimationFrame(tick);
		let last = performance.now();

		function tick(now: number) {
			raf = requestAnimationFrame(tick);
			const dt = Math.min(now - last, 100);
			last = now;

			const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#4ade80';

			ctx!.clearRect(0, 0, width, height);
			ctx!.fillStyle = accent;

			for (const p of singles) {
				advance(p, dt, true, () => spawnSingle(width, height));
				if (p.opacity <= 0) continue;
				ctx!.globalAlpha = p.opacity * 0.5;
				ctx!.fillRect(p.x, p.y, p.size, p.size);
			}

			if (group.length === 0) {
				groupIdleTimer -= dt;
				if (groupIdleTimer <= 0) {
					group = buildGroup(width, height);
				}
			} else {
				let allDone = true;
				for (const p of group) {
					advance(p, dt, false, () => p);
					if (!(p.state === 'out' && p.opacity <= 0)) allDone = false;
					if (p.opacity <= 0) continue;
					ctx!.globalAlpha = p.opacity * 0.65;
					ctx!.fillRect(p.x, p.y, p.size, p.size);
				}
				if (allDone) {
					group = [];
					groupIdleTimer = randomBetween(1500, 4000);
				}
			}

			ctx!.globalAlpha = 1;
		}

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none absolute inset-0 h-full w-full"
	style="mask-image: radial-gradient(circle at center, transparent 15%, black 75%); -webkit-mask-image: radial-gradient(circle at center, transparent 15%, black 75%);"
></canvas>
