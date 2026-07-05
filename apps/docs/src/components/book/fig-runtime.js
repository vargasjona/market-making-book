// @ts-nocheck
/* Interactive figure runtime, ported verbatim from the original single-file book
 * (docs/market-making/market-making-book.html). Each chapter page mounts
 * <FigRuntime chapter="chN" /> which calls initChapter and receives a cleanup.
 * The original chapter-visibility gates (current===N) are replaced by an
 * `alive` flag owned by the mounting component. Intentionally kept in the
 * original imperative style to stay diffable against the source book. */

export function initChapter(key) {
	let alive = true;
	const __intervals = [];
	const __setInterval = (fn, t) => {
		const id = setInterval(fn, t);
		__intervals.push(id);
		return id;
	};

	function refitVisibleFigures() {
		for (var n = 0; n < cvHandles.length; n++) {
			cvHandles[n].refit();
		}
	}

	/* ================= HELPERS ================= */
	/* Every cv() handle registers itself so we can re-fit + redraw a figure's
   canvases when its chapter becomes visible (a canvas sized while its chapter
   is display:none reads parent width 0 — the root cause of the mobile breakage:
   blank figures, wrong heights, animations that never appear). */
	var cvHandles = [];
	function cv(id) {
		var c = document.getElementById(id);
		if (!c) {
			return null;
		}
		var dpr = 1;
		var lastW = 0,
			onResize = null;
		function fit() {
			dpr = window.devicePixelRatio || 1;
			/* parent width is 0 while the chapter is hidden — keep the last good size
       (or a sensible fallback) instead of collapsing the canvas to nothing. */
			var w = c.parentElement.clientWidth;
			if (!w || w < 1) {
				if (lastW) {
					w = lastW;
				} else {
					return c.getContext("2d");
				}
			}
			lastW = w;
			c.style.height = c.getAttribute("height") + "px";
			c.width = Math.round(w * dpr);
			c.height = Math.round(+c.getAttribute("height") * dpr);
			var x = c.getContext("2d");
			x.setTransform(dpr, 0, 0, dpr, 0, 0);
			return x;
		}
		var ctx = fit();
		var handle = {
			c,
			get ctx() {
				return ctx;
			},
			W() {
				return c.width / dpr;
			},
			H() {
				return c.height / dpr;
			},
			/* re-fit only if the visible width actually changed (avoids resetting
       animations on mobile URL-bar show/hide, which fires height-only resizes) */
			refit() {
				var w = c.parentElement.clientWidth;
				if (w && Math.abs(w - lastW) > 0.5) {
					ctx = fit();
					if (onResize) {
						onResize();
					}
				}
			},
			onResize(cb) {
				onResize = cb;
			},
		};
		cvHandles.push(handle);
		return handle;
	}
	/* One debounced resize handler for the whole document. Mobile browsers fire
   resize storms (URL bar collapsing, soft keyboard, rotation); refit() ignores
   width-unchanged events so animations don't reset, and only visible canvases
   are touched so hidden chapters never get sized to 0. */
	var resizeT = null;
	var __onResize = () => {
		if (resizeT) {
			clearTimeout(resizeT);
		}
		resizeT = setTimeout(refitVisibleFigures, 150);
	};
	var __onOrient = () => {
		setTimeout(refitVisibleFigures, 250);
	};
	window.addEventListener("resize", __onResize);
	window.addEventListener("orientationchange", __onOrient);
	var C = {
		green: "#7FE3B0",
		red: "#F08A7E",
		dim: "#5D6F8A",
		text: "#C7D5E8",
		amber: "#E8B93E",
		grid: "#16233A",
		blue: "#6FA8FF",
	};
	function line(x, a, b, c2, d, col, w, dash) {
		x.strokeStyle = col;
		x.lineWidth = w || 1;
		x.setLineDash(dash || []);
		x.beginPath();
		x.moveTo(a, b);
		x.lineTo(c2, d);
		x.stroke();
		x.setLineDash([]);
	}
	var reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches;
	var figInit = {};

	/* ================= COVER TAPE ================= */
	figInit.ch0 = () => {
		var k = cv("cv-cover");
		if (!k) {
			return;
		}
		var mid = 95,
			t = 0,
			hist = [],
			dots = [];
		function step() {
			t++;
			mid += (Math.random() - 0.5) * 0.9;
			mid = Math.max(60, Math.min(130, mid));
			hist.push(mid);
			if (hist.length > 260) {
				hist.shift();
			}
			if (Math.random() < 0.1) {
				var side = Math.random() < 0.5 ? 1 : -1;
				dots.push({ i: hist.length - 1, side, age: 0 });
			}
			dots.forEach((d) => {
				d.age++;
				d.i--;
			});
			dots = dots.filter((d) => d.age < 60 && d.i > 0);
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var min = Math.min.apply(null, hist) - 3,
				max = Math.max.apply(null, hist) + 3;
			function Y(v) {
				return H - 18 - ((v - min) / (max - min)) * (H - 36);
			}
			function X(i) {
				return (i / 259) * W;
			}
			for (var g = 0; g < 5; g++) {
				line(
					x,
					0,
					18 + (g * (H - 36)) / 4,
					W,
					18 + (g * (H - 36)) / 4,
					C.grid,
					1
				);
			}
			var hs = 1.6;
			x.strokeStyle = C.green;
			x.lineWidth = 1.4;
			x.beginPath();
			hist.forEach((v, i) => {
				var y = Y(v - hs);
				i ? x.lineTo(X(i), y) : x.moveTo(X(i), y);
			});
			x.stroke();
			x.strokeStyle = C.red;
			x.beginPath();
			hist.forEach((v, i) => {
				var y = Y(v + hs);
				i ? x.lineTo(X(i), y) : x.moveTo(X(i), y);
			});
			x.stroke();
			x.strokeStyle = C.text;
			x.lineWidth = 1;
			x.setLineDash([3, 4]);
			x.beginPath();
			hist.forEach((v, i) => {
				var y = Y(v);
				i ? x.lineTo(X(i), y) : x.moveTo(X(i), y);
			});
			x.stroke();
			x.setLineDash([]);
			dots.forEach((d) => {
				if (d.i < 0 || d.i >= hist.length) {
					return;
				}
				var v = hist[d.i];
				x.fillStyle = d.side > 0 ? C.red : C.green;
				x.globalAlpha = Math.max(0, 1 - d.age / 60);
				x.beginPath();
				x.arc(X(d.i), Y(v + d.side * hs), 4, 0, 7);
				x.fill();
				x.globalAlpha = 1;
			});
			x.fillStyle = C.dim;
			x.font = "10px IBM Plex Mono";
			x.fillText("bid", 8, Y(hist[hist.length - 1] - hs) + 14);
			x.fillText("ask", 8, Y(hist[hist.length - 1] + hs) - 6);
			if (!reduceMotion && alive) {
				requestAnimationFrame(step);
			}
		}
		step();
		if (reduceMotion) {
			for (var i = 0; i < 260; i++) {
				step();
			}
		}
	};

	/* ================= CH1 ORDER BOOK ================= */
	figInit.ch1 = () => {
		var wrap = document.getElementById("ob-wrap");
		if (!wrap) {
			return;
		}
		var book,
			log = "Click a button to trade.";
		function fresh() {
			book = { asks: [], bids: [] };
			for (var i = 0; i < 5; i++) {
				book.asks.push({
					p: 52 + i,
					sz: 80 + Math.round(Math.random() * 220),
					you: 0,
				});
				book.bids.push({
					p: 48 - i,
					sz: 80 + Math.round(Math.random() * 220),
					you: 0,
				});
			}
		}
		fresh();
		function render() {
			var rows = "";
			var maxsz = 400;
			for (var i = book.asks.length - 1; i >= 0; i--) {
				var a = book.asks[i];
				rows +=
					'<div style="display:flex;align-items:center;gap:10px;padding:2px 0">' +
					'<span style="width:46px;color:' +
					(a.you ? C.amber : "#F08A7E") +
					'">' +
					a.p +
					"¢</span>" +
					'<div style="flex:1;height:14px;background:#1A0F0E;border-radius:3px;overflow:hidden"><div style="height:100%;width:' +
					Math.min(100, (a.sz / maxsz) * 100) +
					"%;background:" +
					(a.you ? "#E8B93E" : "#8C3A33") +
					'"></div></div>' +
					'<span style="width:90px;text-align:right;color:' +
					(a.you ? C.amber : "#5D6F8A") +
					'">' +
					a.sz +
					(a.you ? " · YOU" : "") +
					"</span></div>";
			}
			rows += '<div style="border-top:1px dashed #2A3B58;margin:6px 0"></div>';
			for (var j = 0; j < book.bids.length; j++) {
				var b = book.bids[j];
				rows +=
					'<div style="display:flex;align-items:center;gap:10px;padding:2px 0">' +
					'<span style="width:46px;color:' +
					(b.you ? C.amber : "#7FE3B0") +
					'">' +
					b.p +
					"¢</span>" +
					'<div style="flex:1;height:14px;background:#0C1A14;border-radius:3px;overflow:hidden"><div style="height:100%;width:' +
					Math.min(100, (b.sz / maxsz) * 100) +
					"%;background:" +
					(b.you ? "#E8B93E" : "#16614B") +
					'"></div></div>' +
					'<span style="width:90px;text-align:right;color:' +
					(b.you ? C.amber : "#5D6F8A") +
					'">' +
					b.sz +
					(b.you ? " · YOU" : "") +
					"</span></div>";
			}
			wrap.innerHTML = rows;
			var bb = book.bids[0],
				ba = book.asks[0];
			document.getElementById("ob-bb").textContent = bb ? bb.p + "¢" : "—";
			document.getElementById("ob-ba").textContent = ba ? ba.p + "¢" : "—";
			document.getElementById("ob-sp").textContent =
				bb && ba ? ba.p - bb.p + "¢" : "—";
			document.getElementById("ob-log").textContent = log;
		}
		function mkt(side) {
			var lvl = side === "buy" ? book.asks[0] : book.bids[0];
			if (!lvl) {
				return;
			}
			var take = Math.min(lvl.sz, 60 + Math.round(Math.random() * 80));
			lvl.sz -= take;
			log =
				"Market " +
				side.toUpperCase() +
				" filled " +
				take +
				" @ " +
				lvl.p +
				"¢ — you crossed the spread (taker fee applies).";
			if (lvl.you) {
				log =
					"Market order filled " +
					take +
					" against YOUR resting order — you just earned the spread as maker!";
			}
			if (lvl.sz <= 0) {
				(side === "buy" ? book.asks : book.bids).shift();
				log += " Level cleared — price moved.";
			}
			render();
		}
		document.getElementById("ob-mbuy").onclick = () => {
			mkt("buy");
		};
		document.getElementById("ob-msell").onclick = () => {
			mkt("sell");
		};
		document.getElementById("ob-lbid").onclick = () => {
			var p = book.bids[0] ? book.bids[0].p + 1 : 49;
			if (book.asks[0] && p >= book.asks[0].p) {
				p = book.asks[0].p - 1;
			}
			var ex = book.bids.find((b) => b.p === p);
			if (ex) {
				ex.sz += 100;
				ex.you = 1;
			} else {
				book.bids.unshift({ p, sz: 100, you: 1 });
				book.bids.sort((a, b) => b.p - a.p);
			}
			log =
				"You posted a limit bid 100 @ " +
				p +
				"¢ — improving the best bid and tightening the spread. You are now a maker.";
			render();
		};
		document.getElementById("ob-lask").onclick = () => {
			var p = book.asks[0] ? book.asks[0].p - 1 : 51;
			if (book.bids[0] && p <= book.bids[0].p) {
				p = book.bids[0].p + 1;
			}
			var ex = book.asks.find((a) => a.p === p);
			if (ex) {
				ex.sz += 100;
				ex.you = 1;
			} else {
				book.asks.unshift({ p, sz: 100, you: 1 });
				book.asks.sort((a, b) => a.p - b.p);
			}
			log =
				"You posted a limit ask 100 @ " +
				p +
				"¢ — you are quoting the offer side.";
			render();
		};
		document.getElementById("ob-reset").onclick = () => {
			fresh();
			log = "Book reset.";
			render();
		};
		__setInterval(() => {
			// background flow
			if (!alive) {
				return;
			}
			if (Math.random() < 0.5) {
				// replenish
				var side = Math.random() < 0.5 ? book.bids : book.asks;
				if (side.length < 6) {
					var last = side[side.length - 1];
					side.push({
						p: last
							? side === book.bids
								? last.p - 1
								: last.p + 1
							: side === book.bids
								? 48
								: 52,
						sz: 60 + Math.round(Math.random() * 200),
						you: 0,
					});
				} else {
					var l = side[Math.floor(Math.random() * side.length)];
					l.sz = Math.min(420, l.sz + 20);
				}
			}
			if (Math.random() < 0.3) {
				var s2 = Math.random() < 0.5 ? "buy" : "sell";
				var lvl = s2 === "buy" ? book.asks[0] : book.bids[0];
				if (lvl) {
					var take = Math.min(lvl.sz, 30 + Math.round(Math.random() * 60));
					lvl.sz -= take;
					if (lvl.you) {
						log =
							"A background trader hit YOUR " +
							(s2 === "buy" ? "ask" : "bid") +
							" for " +
							take +
							" @ " +
							lvl.p +
							"¢ — maker fill, spread earned.";
					}
					if (lvl.sz <= 0) {
						(s2 === "buy" ? book.asks : book.bids).shift();
					}
				}
			}
			render();
		}, 1500);
		render();
		/* — walking the book — */
		var wkc = cv("cv-walk");
		if (wkc) {
			var wkLv = [
				{ p: 51, sz: 140 },
				{ p: 52, sz: 220 },
				{ p: 53, sz: 180 },
				{ p: 54, sz: 320 },
				{ p: 55, sz: 260 },
				{ p: 56, sz: 420 },
				{ p: 57, sz: 380 },
				{ p: 58, sz: 520 },
				{ p: 59, sz: 460 },
				{ p: 60, sz: 600 },
			];
			var wkSize = 100;
			document.getElementById("wk-size").oninput = function () {
				wkSize = +this.value;
				document.getElementById("wk-size-v").textContent = wkSize;
				wkDraw();
			};
			function wkDraw() {
				var x = wkc.ctx,
					W = wkc.W(),
					H = wkc.H();
				x.clearRect(0, 0, W, H);
				var rem = wkSize,
					cost = 0,
					lvls = 0,
					cons = [];
				for (var i = 0; i < wkLv.length; i++) {
					var take = Math.min(rem, wkLv[i].sz);
					cons.push(take);
					if (take > 0) {
						cost += take * wkLv[i].p;
						lvls++;
						rem -= take;
					}
				}
				var filled = wkSize - rem,
					avg = filled ? cost / filled : 0;
				var rowH = (H - 30) / wkLv.length,
					maxsz = 620;
				for (var j = wkLv.length - 1; j >= 0; j--) {
					var l = wkLv[j],
						y = 10 + (wkLv.length - 1 - j) * rowH;
					var bw = (l.sz / maxsz) * (W - 220);
					x.fillStyle = "#3A201D";
					x.fillRect(120, y, bw, rowH - 5);
					if (cons[j] > 0) {
						x.fillStyle = C.amber;
						x.fillRect(120, y, (cons[j] / maxsz) * (W - 220), rowH - 5);
					}
					x.fillStyle = cons[j] > 0 ? C.amber : C.red;
					x.font = "10px IBM Plex Mono";
					x.fillText(l.p + "¢", 84, y + rowH / 2 + 2);
					x.fillStyle = C.dim;
					x.fillText(
						cons[j] > 0 ? cons[j] + " / " + l.sz : "" + l.sz,
						128 + bw,
						y + rowH / 2 + 2
					);
				}
				x.fillStyle = C.dim;
				x.font = "10px IBM Plex Mono";
				x.fillText("mid = 50¢ · resting ask size →", 120, H - 6);
				document.getElementById("wk-avg").textContent = filled
					? avg.toFixed(2) + "¢"
					: "—";
				var slip = filled ? avg - 50 : 0;
				document.getElementById("wk-slip").textContent = filled
					? "+" +
						slip.toFixed(2) +
						"¢ (" +
						((slip / 50) * 100).toFixed(1) +
						"%)"
					: "—";
				document.getElementById("wk-lvls").textContent = lvls;
				var lf = document.getElementById("wk-left");
				lf.textContent = rem;
				lf.className = "v " + (rem > 0 ? "neg" : "");
			}
			wkDraw();
			wkc.onResize(wkDraw);
		}
	};

	/* ================= CH2 CANDLES, EMAS & TIMEFRAMES ================= */
	figInit.ch2 = () => {
		var k = cv("cv-candle");
		if (!k) {
			return;
		}
		var tf = 24,
			emaF = 9,
			emaS = 21,
			ticks,
			drift,
			frame = 0;
		function nextTick(p) {
			if (Math.random() < 0.012) {
				drift = (Math.random() - 0.5) * 0.14;
			}
			var np = p + drift + (Math.random() - 0.5) * 0.5;
			np = Math.max(40, Math.min(180, np));
			var v = 15 + Math.random() * 60 + Math.abs(np - p) * 140;
			return { p: np, v };
		}
		function seed() {
			ticks = [];
			drift = 0;
			var p = 100;
			for (var i = 0; i < 3600; i++) {
				var tk = nextTick(p);
				p = tk.p;
				ticks.push(tk);
			}
		}
		seed();
		function setTF(n, btn) {
			tf = n;
			["cd-tf1", "cd-tf2", "cd-tf3"].forEach((id) => {
				var b = document.getElementById(id);
				b.style.borderColor = id === btn ? C.green : "";
				b.style.color = id === btn ? C.green : "";
			});
			draw();
		}
		document.getElementById("cd-tf1").onclick = () => {
			setTF(8, "cd-tf1");
		};
		document.getElementById("cd-tf2").onclick = () => {
			setTF(24, "cd-tf2");
		};
		document.getElementById("cd-tf3").onclick = () => {
			setTF(72, "cd-tf3");
		};
		document.getElementById("cd-f").oninput = function () {
			emaF = +this.value;
			document.getElementById("cd-f-v").textContent = emaF;
			draw();
		};
		document.getElementById("cd-s").oninput = function () {
			emaS = +this.value;
			document.getElementById("cd-s-v").textContent = emaS;
			draw();
		};
		document.getElementById("cd-reset").onclick = () => {
			seed();
			draw();
		};
		function aggregate() {
			var n = Math.ceil(ticks.length / tf),
				out = [];
			var start = Math.max(0, n - 44); // show last 44 candles (last one forming)
			for (var c = 0; c < n; c++) {
				var a = c * tf,
					b = Math.min(ticks.length, a + tf);
				if (b <= a) {
					break;
				}
				var o = ticks[a].p,
					h = -1e9,
					l = 1e9,
					cl = ticks[b - 1].p,
					vol = 0;
				for (var i = a; i < b; i++) {
					var tk = ticks[i];
					if (tk.p > h) {
						h = tk.p;
					}
					if (tk.p < l) {
						l = tk.p;
					}
					vol += tk.v;
				}
				out.push({ o, h, l, c: cl, v: vol, partial: b - a < tf });
			}
			return { all: out, start };
		}
		function ema(closes, N) {
			var a = 2 / (N + 1),
				e = closes[0],
				out = [e];
			for (var i = 1; i < closes.length; i++) {
				e = a * closes[i] + (1 - a) * e;
				out.push(e);
			}
			return out;
		}
		function draw() {
			var agg = aggregate(),
				cs = agg.all,
				start = agg.start;
			var closes = cs.map((c) => c.c);
			var ef = ema(closes, emaF),
				es = ema(closes, emaS);
			var view = cs.slice(start);
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var priceH = H - 72,
				volTop = H - 62;
			var lo = 1e9,
				hi = -1e9,
				vmax = 0;
			view.forEach((c, i) => {
				if (c.l < lo) {
					lo = c.l;
				}
				if (c.h > hi) {
					hi = c.h;
				}
				if (c.v > vmax) {
					vmax = c.v;
				}
				var gi = start + i;
				if (ef[gi] < lo) {
					lo = ef[gi];
				}
				if (ef[gi] > hi) {
					hi = ef[gi];
				}
				if (es[gi] < lo) {
					lo = es[gi];
				}
				if (es[gi] > hi) {
					hi = es[gi];
				}
			});
			var pad = (hi - lo) * 0.08 + 0.001;
			lo -= pad;
			hi += pad;
			function Y(v) {
				return 14 + (1 - (v - lo) / (hi - lo)) * (priceH - 20);
			}
			function X(i) {
				return 46 + ((i + 0.5) / view.length) * (W - 66);
			}
			var cw = Math.max(2, ((W - 66) / view.length) * 0.62);
			// gridlines
			for (var g = 0; g < 4; g++) {
				var gy = 14 + (g * (priceH - 20)) / 3;
				line(x, 46, gy, W - 20, gy, C.grid, 1);
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText((hi - ((hi - lo) * g) / 3).toFixed(1), 6, gy + 3);
			}
			// volume
			view.forEach((c, i) => {
				var vh = (c.v / vmax) * 44;
				x.fillStyle =
					c.c >= c.o ? "rgba(127,227,176,0.35)" : "rgba(240,138,126,0.35)";
				x.fillRect(X(i) - cw / 2, H - 12 - vh, cw, vh);
			});
			x.fillStyle = C.dim;
			x.font = "9px IBM Plex Mono";
			x.fillText("volume", 46, volTop + 6);
			// candles
			view.forEach((c, i) => {
				var up = c.c >= c.o,
					col = up ? C.green : C.red;
				x.strokeStyle = col;
				x.lineWidth = 1;
				x.beginPath();
				x.moveTo(X(i), Y(c.h));
				x.lineTo(X(i), Y(c.l));
				x.stroke();
				x.fillStyle = col;
				x.globalAlpha = c.partial ? 0.55 : 1;
				var y1 = Y(Math.max(c.o, c.c)),
					y2 = Y(Math.min(c.o, c.c));
				x.fillRect(X(i) - cw / 2, y1, cw, Math.max(1.2, y2 - y1));
				x.globalAlpha = 1;
			});
			// EMAs
			function plot(arr, col) {
				x.strokeStyle = col;
				x.lineWidth = 1.6;
				x.beginPath();
				view.forEach((c, i) => {
					var v = arr[start + i];
					i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
				});
				x.stroke();
			}
			plot(ef, C.amber);
			plot(es, C.blue);
			x.font = "10px IBM Plex Mono";
			x.fillStyle = C.amber;
			x.fillText("EMA " + emaF, W - 130, 18);
			x.fillStyle = C.blue;
			x.fillText("EMA " + emaS, W - 70, 18);
			if (view.length) {
				x.fillStyle = C.dim;
				x.fillText(
					"forming →",
					Math.min(W - 86, X(view.length - 1) - 30),
					Y(view[view.length - 1].c) - 12
				);
			}
			// readouts
			var last = view[view.length - 1],
				gi = cs.length - 1;
			document.getElementById("cd-ohlc").textContent = last
				? "O " +
					last.o.toFixed(1) +
					" · H " +
					last.h.toFixed(1) +
					" · L " +
					last.l.toFixed(1) +
					" · C " +
					last.c.toFixed(1)
				: "—";
			document.getElementById("cd-ema-f").textContent = ef[gi].toFixed(2);
			document.getElementById("cd-ema-s").textContent = es[gi].toFixed(2);
			var d = ((ef[gi] - es[gi]) / es[gi]) * 100,
				tr = document.getElementById("cd-trend");
			if (d > 0.08) {
				tr.textContent =
					"Uptrend — fast above slow (" +
					d.toFixed(2) +
					"%). MM beware: trend = inventory tax.";
				tr.className = "v pos";
			} else if (d < -0.08) {
				tr.textContent =
					"Downtrend — fast below slow (" +
					d.toFixed(2) +
					"%). MM beware: trend = inventory tax.";
				tr.className = "v neg";
			} else {
				tr.textContent =
					"Chop / crossover zone (" +
					d.toFixed(2) +
					"%) — whipsaw for trend traders, paradise for makers.";
				tr.className = "v";
			}
		}
		setTF(24, "cd-tf2");
		k.onResize(draw);
		function loop() {
			if (alive) {
				frame++;
				if (frame % 3 === 0) {
					var p = ticks[ticks.length - 1].p;
					ticks.push(nextTick(p));
					if (ticks.length > 5400) {
						ticks = ticks.slice(ticks.length - 3600);
					}
					draw();
				}
			}
			if (!reduceMotion && alive) {
				requestAnimationFrame(loop);
			}
		}
		if (!reduceMotion) {
			loop();
		}
		/* — candle anatomy — */
		var anc = cv("cv-anat");
		if (anc) {
			function anDraw() {
				var x = anc.ctx,
					W = anc.W(),
					H = anc.H();
				x.clearRect(0, 0, W, H);
				function Y(v) {
					return H - 34 - (v / 100) * (H - 64);
				}
				function cnd(x0, o, h, l, c, w) {
					var up = c >= o,
						col = up ? C.green : C.red;
					x.strokeStyle = col;
					x.lineWidth = 1.4;
					x.beginPath();
					x.moveTo(x0, Y(h));
					x.lineTo(x0, Y(l));
					x.stroke();
					x.fillStyle = col;
					x.fillRect(
						x0 - w / 2,
						Y(Math.max(o, c)),
						w,
						Math.max(2, Math.abs(Y(o) - Y(c)))
					);
				}
				function lbl(x0, v, t, col, left) {
					x.strokeStyle = col || C.dim;
					x.setLineDash([2, 3]);
					x.beginPath();
					x.moveTo(left ? x0 - 46 : x0 + 16, Y(v));
					x.lineTo(left ? x0 - 16 : x0 + 46, Y(v));
					x.stroke();
					x.setLineDash([]);
					x.fillStyle = col || C.dim;
					x.font = "10px IBM Plex Mono";
					x.textAlign = left ? "right" : "left";
					x.fillText(t, left ? x0 - 50 : x0 + 50, Y(v) + 3);
					x.textAlign = "left";
				}
				var xg = W * 0.13,
					xr = W * 0.33;
				cnd(xg, 35, 85, 20, 70, 26);
				lbl(xg, 85, "high", null, true);
				lbl(xg, 70, "close", C.green, true);
				lbl(xg, 35, "open", null, true);
				lbl(xg, 20, "low", null, true);
				cnd(xr, 70, 85, 20, 35, 26);
				lbl(xr, 70, "open");
				lbl(xr, 35, "close", C.red);
				x.fillStyle = C.green;
				x.font = "10px IBM Plex Mono";
				x.textAlign = "center";
				x.fillText("BULLISH — buyers won", xg + 24, H - 14);
				x.fillStyle = C.red;
				x.fillText("BEARISH — sellers won", xr + 18, H - 14);
				x.fillStyle = C.dim;
				x.fillText("upper wick", xg + 34, Y(79));
				x.fillText("body", xg + 34, Y(52));
				x.fillText("lower wick", xg + 34, Y(26));
				line(x, W * 0.46, 16, W * 0.46, H - 26, C.grid, 1);
				var xd = W * 0.56,
					xh = W * 0.71,
					xe = W * 0.87;
				cnd(xd, 50, 80, 22, 52, 18);
				cnd(xh, 60, 72, 20, 68, 18);
				cnd(xe - 13, 58, 62, 46, 48, 15);
				cnd(xe + 9, 44, 70, 40, 66, 19);
				x.fillStyle = C.text;
				x.font = "10px IBM Plex Mono";
				x.fillText("DOJI", xd, H - 14);
				x.fillText("HAMMER", xh, H - 14);
				x.fillText("ENGULFING", xe, H - 14);
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText("a fought draw", xd, H - 3);
				x.fillText("sell-off rejected", xh, H - 3);
				x.fillText("one side takes over", xe, H - 3);
				x.textAlign = "left";
			}
			anDraw();
			anc.onResize(anDraw);
		}
		/* — sma vs ema lab — */
		var mac = cv("cv-ma");
		if (mac) {
			var maN = 14,
				maMode = "step",
				maS = [];
			function maGen() {
				maS = [];
				var p = 100;
				for (var i = 0; i < 170; i++) {
					if (maMode === "step") {
						p = (i < 85 ? 100 : 110) + (Math.random() - 0.5) * 1.6;
					} else {
						p += (Math.random() - 0.5) * 1.4;
					}
					maS.push(p);
				}
			}
			maGen();
			document.getElementById("ma-n").oninput = function () {
				maN = +this.value;
				document.getElementById("ma-n-v").textContent = maN;
				maDraw();
			};
			document.getElementById("ma-step").onclick = () => {
				maMode = "step";
				maGen();
				maDraw();
			};
			document.getElementById("ma-walk").onclick = () => {
				maMode = "walk";
				maGen();
				maDraw();
			};
			function maDraw() {
				var sma = [],
					ema = [],
					a = 2 / (maN + 1),
					e = maS[0],
					sum = 0;
				for (var i = 0; i < maS.length; i++) {
					sum += maS[i];
					if (i >= maN) {
						sum -= maS[i - maN];
					}
					sma.push(i >= maN - 1 ? sum / maN : null);
					e = a * maS[i] + (1 - a) * e;
					ema.push(e);
				}
				var x = mac.ctx,
					W = mac.W(),
					H = mac.H();
				x.clearRect(0, 0, W, H);
				var lo = Math.min.apply(null, maS) - 1,
					hi = Math.max.apply(null, maS) + 1;
				function Y(v) {
					return 14 + (1 - (v - lo) / (hi - lo)) * (H - 44);
				}
				function X(i) {
					return 46 + (i / (maS.length - 1)) * (W - 66);
				}
				for (var g = 0; g < 4; g++) {
					var gy = 14 + (g * (H - 44)) / 3;
					line(x, 46, gy, W - 20, gy, C.grid, 1);
					x.fillStyle = C.dim;
					x.font = "9px IBM Plex Mono";
					x.fillText((hi - ((hi - lo) * g) / 3).toFixed(0), 14, gy + 3);
				}
				function plot(arr, col, wd) {
					x.strokeStyle = col;
					x.lineWidth = wd;
					x.beginPath();
					var st = false;
					arr.forEach((v, i) => {
						if (v === null) {
							st = false;
							return;
						}
						st ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
						st = true;
					});
					x.stroke();
				}
				plot(maS, "rgba(199,213,232,0.75)", 1.1);
				plot(sma, C.blue, 1.8);
				plot(ema, C.amber, 1.8);
				x.font = "10px IBM Plex Mono";
				x.fillStyle = "rgba(199,213,232,0.85)";
				x.fillText("price", W - 180, 18);
				x.fillStyle = C.blue;
				x.fillText("SMA(" + maN + ")", W - 130, 18);
				x.fillStyle = C.amber;
				x.fillText("EMA(" + maN + ")", W - 60, 18);
				// weights inset
				var ix = 52,
					iy = 20,
					iw = 170,
					ih = 56;
				x.fillStyle = "rgba(16,26,44,0.85)";
				x.fillRect(ix, iy, iw, ih);
				x.strokeStyle = C.grid;
				x.strokeRect(ix, iy, iw, ih);
				var nb = Math.min(maN, 12),
					bw2 = (iw / 2 - 14) / 12;
				for (var b = 0; b < nb; b++) {
					x.fillStyle = C.blue;
					var hS = (ih - 22) * 0.55;
					x.fillRect(ix + 8 + b * bw2, iy + ih - 8 - hS, bw2 - 1, hS);
				}
				for (var b2 = 0; b2 < 12; b2++) {
					x.fillStyle = C.amber;
					var wgt = (a * (1 - a) ** b2) / a;
					x.fillRect(
						ix + iw / 2 + 6 + b2 * bw2,
						iy + ih - 8 - (ih - 22) * wgt,
						bw2 - 1,
						(ih - 22) * wgt
					);
				}
				x.fillStyle = C.dim;
				x.font = "8px IBM Plex Mono";
				x.fillText("SMA: equal votes", ix + 8, iy + 10);
				x.fillText("EMA: recent votes more", ix + iw / 2 + 4, iy + 10);
				// lag readouts
				function lag(arr) {
					if (maMode !== "step") {
						return null;
					}
					for (var i2 = 85; i2 < arr.length; i2++) {
						if (arr[i2] !== null && arr[i2] >= 105) {
							return i2 - 85;
						}
					}
					return null;
				}
				var ls = lag(sma),
					le = lag(ema);
				document.getElementById("ma-lag-s").textContent =
					ls === null ? "—" : ls + " bars";
				document.getElementById("ma-lag-e").textContent =
					le === null ? "—" : le + " bars";
				document.getElementById("ma-read").textContent =
					maMode === "step"
						? "Same window, ~half the lag: the EMA’s recent-heavy weights catch the step first."
						: "No step to chase — note how the EMA wiggles more: speed is paid for in noise.";
			}
			maDraw();
			mac.onResize(maDraw);
		}
		/* — support/resistance stop cascade — */
		var src = cv("cv-sr");
		if (src) {
			var srPts, srStops, srIdx;
			function srBuild() {
				srPts = [];
				srStops = [];
				srIdx = 0;
				var cur = 103;
				function seg(target, n, noise) {
					for (var i = 1; i <= n; i++) {
						cur =
							cur +
							(target - cur) / (n - i + 1) +
							(Math.random() - 0.5) * noise;
						srPts.push(cur);
					}
				}
				seg(109.6, 55, 0.5);
				seg(104.5, 40, 0.5);
				seg(109.7, 50, 0.45);
				seg(105.5, 35, 0.5);
				seg(110.4, 45, 0.4);
				seg(116, 28, 0.9);
				seg(115.4, 30, 0.6);
				for (var s = 0; s < 8; s++) {
					srStops.push({ p: 110.5 + s * 0.55, hit: -1 });
				}
			}
			srBuild();
			document.getElementById("sr-replay").onclick = () => {
				srBuild();
				srDraw();
			};
			function wallAt(i) {
				return i < 57 ? 1 : i < 147 ? 0.62 : i < 200 ? 0.34 : 0;
			}
			function noteAt(i) {
				return i < 95
					? "approach 1 — the wall absorbs"
					: i < 180
						? "approach 2 — the wall is thinner"
						: i < 208
							? "third push — the wall breaks"
							: "stop cascade — forced buys gap the price";
			}
			function srDraw() {
				var x = src.ctx,
					W = src.W(),
					H = src.H();
				x.clearRect(0, 0, W, H);
				var lo = 102,
					hi = 117;
				function Y(v) {
					return 12 + (1 - (v - lo) / (hi - lo)) * (H - 36);
				}
				function X(i) {
					return 16 + (i / (srPts.length - 1)) * (W - 56);
				}
				for (var g = 0; g < 4; g++) {
					line(
						x,
						16,
						12 + (g * (H - 36)) / 3,
						W - 20,
						12 + (g * (H - 36)) / 3,
						C.grid,
						1
					);
				}
				var wd = wallAt(srIdx);
				if (wd > 0) {
					x.fillStyle = "rgba(240,138,126," + (0.1 + 0.25 * wd) + ")";
					x.fillRect(16, Y(110.25), W - 36, Y(109.75) - Y(110.25));
					x.fillStyle = C.red;
					x.font = "9px IBM Plex Mono";
					x.fillText(
						"SELL WALL @110 — depth " + Math.round(wd * 100) + "%",
						20,
						Y(110.25) - 4
					);
				} else {
					x.fillStyle = C.dim;
					x.font = "9px IBM Plex Mono";
					x.fillText("wall consumed", 20, Y(110.25) - 4);
				}
				var px =
					srIdx > 0 ? srPts[Math.min(srIdx, srPts.length) - 1] : srPts[0];
				srStops.forEach((st, j) => {
					if (st.hit < 0 && px > st.p && srIdx > 200) {
						st.hit = srIdx;
					}
					var fresh = st.hit >= 0 && srIdx - st.hit < 26;
					x.fillStyle =
						st.hit < 0 ? "#5D6F8A" : fresh ? C.amber : "rgba(93,111,138,0.25)";
					x.beginPath();
					x.arc(W - 26, Y(st.p), fresh ? 5 : 3.4, 0, 7);
					x.fill();
					if (fresh) {
						x.fillStyle = C.amber;
						x.font = "8px IBM Plex Mono";
						x.fillText("stop → BUY", W - 92, Y(st.p) + 3);
					}
				});
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText("resting stop-buys ↑", W - 130, Y(114.6));
				x.strokeStyle = C.green;
				x.lineWidth = 1.6;
				x.beginPath();
				for (var i = 0; i < Math.min(srIdx, srPts.length); i++) {
					i ? x.lineTo(X(i), Y(srPts[i])) : x.moveTo(X(i), Y(srPts[i]));
				}
				x.stroke();
				x.fillStyle = C.amber;
				x.font = "10px IBM Plex Mono";
				x.fillText(noteAt(srIdx), 20, H - 8);
			}
			function srLoop() {
				if (alive && srIdx < srPts.length) {
					srIdx += 2;
					srDraw();
				}
				if (!reduceMotion && alive) {
					requestAnimationFrame(srLoop);
				}
			}
			if (reduceMotion) {
				srIdx = srPts.length;
				srDraw();
			} else {
				srDraw();
				srLoop();
			}
		}
	};

	/* ================= CH3 SPREAD SIM ================= */
	figInit.ch3 = () => {
		var k = cv("cv-spread");
		if (!k) {
			return;
		}
		var hs = 0.3,
			vol = 1.0,
			mid,
			hist,
			q,
			cash,
			rt,
			fills,
			t;
		function reset() {
			mid = 100;
			hist = [];
			q = 0;
			cash = 0;
			rt = 0;
			fills = [];
			t = 0;
		}
		reset();
		document.getElementById("sl-hs").oninput = function () {
			hs = +this.value / 100;
			document.getElementById("sl-hs-v").textContent = hs.toFixed(2);
		};
		document.getElementById("sl-vol").oninput = function () {
			vol = +this.value / 10;
			document.getElementById("sl-vol-v").textContent = vol.toFixed(1);
		};
		document.getElementById("sp-reset").onclick = reset;
		var spreadPnl = 0;
		function step() {
			t++;
			mid += (Math.random() - 0.5) * 0.18 * vol;
			hist.push(mid);
			if (hist.length > 240) {
				hist.shift();
			}
			// arrivals: prob decays with spread
			var p = 0.16 * Math.exp(-hs * 2.2);
			if (Math.random() < p) {
				q += 1;
				cash -= mid - hs;
				spreadPnl += hs;
				rt++;
				fills.push({ i: hist.length - 1, side: -1, age: 0 });
			}
			if (Math.random() < p) {
				q -= 1;
				cash += mid + hs;
				spreadPnl += hs;
				rt++;
				fills.push({ i: hist.length - 1, side: 1, age: 0 });
			}
			fills.forEach((f) => {
				f.age++;
				f.i--;
			});
			fills = fills.filter((f) => f.age < 50 && f.i > 0);
			var invPnl = cash + q * mid - spreadPnl;
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var min = Math.min.apply(null, hist) - 1.5,
				max = Math.max.apply(null, hist) + 1.5;
			function Y(v) {
				return H - 16 - ((v - min) / (max - min)) * (H - 32);
			}
			function X(i) {
				return (i / 239) * W;
			}
			for (var g = 0; g < 4; g++) {
				line(
					x,
					0,
					16 + (g * (H - 32)) / 3,
					W,
					16 + (g * (H - 32)) / 3,
					C.grid,
					1
				);
			}
			x.strokeStyle = C.text;
			x.lineWidth = 1.2;
			x.beginPath();
			hist.forEach((v, i) => {
				i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
			});
			x.stroke();
			x.strokeStyle = C.green;
			x.setLineDash([4, 3]);
			x.beginPath();
			hist.forEach((v, i) => {
				i ? x.lineTo(X(i), Y(v - hs)) : x.moveTo(X(i), Y(v - hs));
			});
			x.stroke();
			x.strokeStyle = C.red;
			x.beginPath();
			hist.forEach((v, i) => {
				i ? x.lineTo(X(i), Y(v + hs)) : x.moveTo(X(i), Y(v + hs));
			});
			x.stroke();
			x.setLineDash([]);
			fills.forEach((f) => {
				if (f.i < 0 || f.i >= hist.length) {
					return;
				}
				x.fillStyle = f.side > 0 ? C.red : C.green;
				x.globalAlpha = Math.max(0, 1 - f.age / 50);
				x.beginPath();
				x.arc(X(f.i), Y(hist[f.i] + f.side * hs), 4.5, 0, 7);
				x.fill();
				x.globalAlpha = 1;
			});
			document.getElementById("sp-rt").textContent = rt;
			var qe = document.getElementById("sp-q");
			qe.textContent = q;
			qe.className = "v " + (Math.abs(q) > 8 ? "neg" : "");
			document.getElementById("sp-pnl1").textContent = spreadPnl.toFixed(2);
			var ie = document.getElementById("sp-pnl2");
			ie.textContent = invPnl.toFixed(2);
			ie.className = "v " + (invPnl >= 0 ? "pos" : "neg");
			var te = document.getElementById("sp-tot");
			var tot = spreadPnl + invPnl;
			te.textContent = tot.toFixed(2);
			te.className = "v " + (tot >= 0 ? "pos" : "neg");
			if (!reduceMotion && alive) {
				requestAnimationFrame(step);
			}
		}
		step();
		/* — round-trip waterfall — */
		var rtc = cv("cv-rt");
		if (rtc) {
			var R = { spr: 2.0, fee: 0.3, adv: 0.8, hdg: 0.2 };
			function rb(id, key) {
				document.getElementById(id).oninput = function () {
					R[key] = +this.value / 10;
					document.getElementById(id + "-v").textContent =
						R[key].toFixed(1) + "¢";
					rtDraw();
				};
			}
			rb("rt-spr", "spr");
			rb("rt-fee", "fee");
			rb("rt-adv", "adv");
			rb("rt-hdg", "hdg");
			function rtDraw() {
				var x = rtc.ctx,
					W = rtc.W(),
					H = rtc.H();
				x.clearRect(0, 0, W, H);
				var net = R.spr - 2 * R.fee - R.adv - R.hdg;
				var steps = [
					{ l: "+ spread", v: R.spr },
					{ l: "− fees ×2", v: -2 * R.fee },
					{ l: "− adverse", v: -R.adv },
					{ l: "− hedge", v: -R.hdg },
					{ l: "= net", v: net, isNet: true },
				];
				var cum = 0,
					tops = [];
				steps.forEach((s) => {
					if (s.isNet) {
						tops.push({ a: 0, b: net });
					} else {
						tops.push({ a: cum, b: cum + s.v });
						cum += s.v;
					}
				});
				var lo = Math.min(0, net),
					hi = Math.max(R.spr, 0.5);
				tops.forEach((t) => {
					lo = Math.min(lo, t.a, t.b);
					hi = Math.max(hi, t.a, t.b);
				});
				lo -= 0.4;
				hi += 0.5;
				function Y(v) {
					return 12 + (1 - (v - lo) / (hi - lo)) * (H - 58);
				}
				var n = steps.length,
					gw = (W - 80) / n,
					bw = gw * 0.55;
				function X(i) {
					return 60 + i * gw + gw / 2;
				}
				line(x, 40, Y(0), W - 16, Y(0), C.text, 1.1, [2, 4]);
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText("0", 26, Y(0) + 3);
				steps.forEach((s, i) => {
					var t = tops[i],
						up = t.b - t.a >= 0;
					var col = s.isNet
						? s.v >= 0
							? C.green
							: C.red
						: up
							? C.green
							: C.red;
					x.globalAlpha = s.isNet ? 1 : 0.85;
					x.fillStyle = col;
					x.fillRect(
						X(i) - bw / 2,
						Y(Math.max(t.a, t.b)),
						bw,
						Math.max(2, Math.abs(Y(t.a) - Y(t.b)))
					);
					x.globalAlpha = 1;
					if (i < n - 1 && !s.isNet) {
						line(
							x,
							X(i) + bw / 2,
							Y(t.b),
							X(i + 1) - bw / 2,
							Y(t.b),
							C.dim,
							1,
							[2, 3]
						);
					}
					x.fillStyle = col;
					x.font = "10px IBM Plex Mono";
					x.textAlign = "center";
					x.fillText(
						(s.v >= 0 ? "+" : "") + s.v.toFixed(1),
						X(i),
						Y(Math.max(t.a, t.b)) - 6
					);
					x.fillStyle = C.dim;
					x.fillText(s.l, X(i), H - 24);
					x.textAlign = "left";
				});
				var ne = document.getElementById("rt-net");
				ne.textContent = (net >= 0 ? "+" : "") + net.toFixed(2) + "¢";
				ne.className = "v " + (net >= 0 ? "pos" : "neg");
				document.getElementById("rt-verdict").textContent =
					net > 0.5
						? "Healthy: the spread comfortably pays its costs."
						: net > 0
							? "Thin: one bad fill erases many good ones — watch your markouts."
							: "Structural loss: no volume fixes a negative unit margin. Widen, cut fees, or leave.";
			}
			rtDraw();
			rtc.onResize(rtDraw);
		}
	};

	/* ================= CH4 TIMELINE ================= */
	figInit.ch4 = () => {
		var data = [
			[
				"1971",
				"NASDAQ goes electronic (sort of)",
				"The first screen-based quotation system: competing dealers post quotes on terminals. Still phone-negotiated trades — but the book is now visible.",
			],
			[
				"1987",
				"Black Monday → SOES bandits",
				'After dealers stopped answering phones during the crash, regulators made the Small Order Execution System mandatory. Day traders ("SOES bandits") exploited automatic execution to pick off slow dealer quotes — proto-HFT, at one point ~13% of NASDAQ volume.',
			],
			[
				"1994",
				"Christie & Schultz expose odd-eighths",
				"Two economists notice NASDAQ dealers mysteriously avoid odd-eighth quotes, keeping spreads at ≥1/4. The scandal triggers the 1997 Order Handling Rules integrating ECN quotes.",
			],
			[
				"2001",
				"Decimalization",
				"Tick drops from 1/16 to $0.01. Spreads collapse ~90% over the decade; human dealers can no longer pay for their seats. The field opens for machines.",
			],
			[
				"2005",
				"Reg NMS",
				"Order protection (Rule 611), access-fee caps, penny ticks — the modern fragmented-but-linked US equity market. HFT market makers (Citadel Securities, Virtu, Jane Street, Jump) become the de facto specialists, without the obligations.",
			],
			[
				"2008",
				"Avellaneda–Stoikov published",
				"The inventory-control framework of Chapter 6 appears in Quantitative Finance — and becomes the lingua franca of every quoting engine since, including Hummingbot\u2019s.",
			],
			[
				"2010",
				"The Flash Crash",
				"May 6: ~9% plunge in minutes. HFTs hot-potato 27,000+ E-mini contracts in 14 seconds (~49% of volume) while liquidity evaporates; trades print against $0.01 stub quotes. Aftermath: stub quotes banned, Limit Up-Limit Down introduced, VPIN celebrated and disputed.",
			],
			[
				"2017",
				"Crypto-native MMs",
				"Wintermute founded; with GSR, Cumberland, B2C2, Jump Crypto and (until 2022) Alameda, a new generation makes markets 24/7 across fragmented unregulated venues — the wild-west rerun of the 1990s.",
			],
			[
				"2021",
				"PFOF under the microscope",
				"GameStop. Robinhood\u2019s revenue is ~77% transaction-based; brokerages collect $3.8B in payment for order flow; Citadel Securities, Virtu and G1 handle 80%+ of retail orders. The kiosk moved inside the broker.",
			],
			[
				"2021",
				"Kalshi launches",
				"The first CFTC-regulated event-contract exchange. Prediction markets get a legal US venue — and a maker-friendly API.",
			],
			[
				"2025",
				"Hyperliquid & the JELLY stress test",
				"Protocol-owned market making (HLP) democratizes the business — then survives a $13M weaponized-liquidation attack that becomes Chapter 11\u2019s case study.",
			],
			[
				"2026",
				"Prediction markets go mainstream",
				"Kalshi: $22.9B volume in 2025, sports ≈89% of fee revenue, $22B valuation. ICE invests up to $2B in Polymarket. The youngest terrain in this book is also the fastest-growing.",
			],
		];
		var tl = document.getElementById("timeline");
		data.forEach((d, i) => {
			var el = document.createElement("div");
			el.className = "tl-item" + (i === 0 ? " open" : "");
			el.innerHTML =
				'<div class="tl-year">' +
				d[0] +
				'</div><div class="tl-head">' +
				d[1] +
				'</div><div class="tl-body">' +
				d[2] +
				"</div>";
			el.onclick = () => {
				var was = el.classList.contains("open");
				tl.querySelectorAll(".tl-item").forEach((x) => {
					x.classList.remove("open");
				});
				if (!was) {
					el.classList.add("open");
				}
			};
			tl.appendChild(el);
		});
	};

	/* ================= CH5 ADVERSE SELECTION ================= */
	figInit.ch5 = () => {
		var k = cv("cv-adv");
		if (!k) {
			return;
		}
		var mu = 0.1,
			hs = 0.3,
			mid,
			pnlHist,
			pnl,
			nN,
			nI,
			t,
			flash;
		function reset() {
			mid = 100;
			pnlHist = [];
			pnl = 0;
			nN = 0;
			nI = 0;
			t = 0;
			flash = 0;
		}
		reset();
		document.getElementById("adv-mu").oninput = function () {
			mu = +this.value / 100;
			document.getElementById("adv-mu-v").textContent =
				Math.round(mu * 100) + "%";
		};
		document.getElementById("adv-hs").oninput = function () {
			hs = +this.value / 100;
			document.getElementById("adv-hs-v").textContent = hs.toFixed(2);
		};
		document.getElementById("adv-reset").onclick = reset;
		function step() {
			t++;
			flash = Math.max(0, flash - 1);
			mid += (Math.random() - 0.5) * 0.05;
			if (Math.random() < 0.22) {
				// a trader arrives
				if (Math.random() < mu) {
					// informed: jump follows in their favor
					var jump = 0.8 + Math.random() * 1.2;
					pnl -= jump - hs;
					nI++;
					mid += (Math.random() < 0.5 ? 1 : -1) * jump;
					flash = 12;
				} else {
					pnl += hs;
					nN++;
				}
			}
			pnlHist.push(pnl);
			if (pnlHist.length > 280) {
				pnlHist.shift();
			}
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var min = Math.min.apply(null, pnlHist),
				max = Math.max.apply(null, pnlHist);
			if (max - min < 2) {
				max += 1;
				min -= 1;
			}
			function Y(v) {
				return H - 18 - ((v - min) / (max - min)) * (H - 36);
			}
			function X(i) {
				return (i / 279) * W;
			}
			for (var g = 0; g < 4; g++) {
				line(
					x,
					0,
					18 + (g * (H - 36)) / 3,
					W,
					18 + (g * (H - 36)) / 3,
					C.grid,
					1
				);
			}
			if (min < 0 && max > 0) {
				line(x, 0, Y(0), W, Y(0), C.dim, 1, [2, 4]);
			}
			x.strokeStyle = pnl >= 0 ? C.green : C.red;
			x.lineWidth = 1.8;
			x.beginPath();
			pnlHist.forEach((v, i) => {
				i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
			});
			x.stroke();
			if (flash > 0) {
				x.fillStyle = "rgba(232,185,62," + (flash / 12) * 0.25 + ")";
				x.fillRect(0, 0, W, H);
				x.fillStyle = C.amber;
				x.font = "11px IBM Plex Mono";
				x.fillText("INFORMED TRADER", W - 150, 24);
			}
			x.fillStyle = C.dim;
			x.font = "10px IBM Plex Mono";
			x.fillText("cumulative P&L", 10, 16);
			document.getElementById("adv-n").textContent = nN;
			document.getElementById("adv-i").textContent = nI;
			var pe = document.getElementById("adv-pnl");
			pe.textContent = pnl.toFixed(2);
			pe.className = "v " + (pnl >= 0 ? "pos" : "neg");
			var ev = hs * (1 - mu) - (1.4 - hs) * mu; // rough expectation per arrival
			document.getElementById("adv-verdict").textContent =
				ev > 0.02
					? "Viable: noise income outruns informed losses."
					: ev > -0.02
						? "Marginal: spread barely covers toxicity."
						: "Toxic: no spread this size survives μ=" +
							Math.round(mu * 100) +
							"%. Stop quoting.";
			if (!reduceMotion && alive) {
				requestAnimationFrame(step);
			}
		}
		step();
		/* — glosten–milgrom belief updater — */
		var gmc = cv("cv-gm");
		if (gmc) {
			var gmMu = 0.3,
				gmP = 0.5,
				gmHist = [{ p: 0.5, side: 0 }],
				gmAuto = false,
				gmTrue = Math.random() < 0.5 ? 1 : 0,
				gmTick = 0;
			function gmQ(p, m) {
				var b1 = m + (1 - m) / 2,
					b0 = (1 - m) / 2;
				return {
					ask: (p * b1) / (p * b1 + (1 - p) * b0),
					bid: (p * b0) / (p * b0 + (1 - p) * b1),
				};
			}
			function gmTrade(side) {
				var q = gmQ(gmP, gmMu);
				gmP = side > 0 ? q.ask : q.bid;
				gmP = Math.min(0.995, Math.max(0.005, gmP));
				gmHist.push({ p: gmP, side });
				if (gmHist.length > 60) {
					gmHist.shift();
				}
				gmDraw();
			}
			document.getElementById("gm-mu").oninput = function () {
				gmMu = +this.value / 100;
				document.getElementById("gm-mu-v").textContent =
					Math.round(gmMu * 100) + "%";
				gmDraw();
			};
			document.getElementById("gm-buy").onclick = () => {
				gmAuto = false;
				gmTrade(1);
			};
			document.getElementById("gm-sell").onclick = () => {
				gmAuto = false;
				gmTrade(-1);
			};
			document.getElementById("gm-reset").onclick = () => {
				gmAuto = false;
				gmP = 0.5;
				gmHist = [{ p: 0.5, side: 0 }];
				gmTrue = Math.random() < 0.5 ? 1 : 0;
				document.getElementById("gm-auto").textContent = "Auto-flow ▸";
				gmDraw();
			};
			document.getElementById("gm-auto").onclick = function () {
				gmAuto = !gmAuto;
				this.textContent = gmAuto ? "Auto-flow ❚❚" : "Auto-flow ▸";
			};
			function gmLoop() {
				gmTick++;
				if (gmAuto && alive && gmTick % 26 === 0) {
					var informed = Math.random() < gmMu;
					var side = informed
						? gmTrue === 1
							? 1
							: -1
						: Math.random() < 0.5
							? 1
							: -1;
					gmTrade(side);
				}
				if (!reduceMotion && alive) {
					requestAnimationFrame(gmLoop);
				}
			}
			function gmDraw() {
				var x = gmc.ctx,
					W = gmc.W(),
					H = gmc.H();
				x.clearRect(0, 0, W, H);
				function Y(p) {
					return 14 + (1 - p) * (H - 44);
				}
				function X(i) {
					return 50 + (i / 59) * (W - 70);
				}
				[0, 0.25, 0.5, 0.75, 1].forEach((g) => {
					line(x, 50, Y(g), W - 20, Y(g), C.grid, 1);
					x.fillStyle = C.dim;
					x.font = "9px IBM Plex Mono";
					x.fillText(Math.round(g * 100) + "¢", 14, Y(g) + 3);
				});
				x.fillStyle = "rgba(111,168,255,0.13)";
				x.beginPath();
				gmHist.forEach((h, i) => {
					var q = gmQ(h.p, gmMu);
					i ? x.lineTo(X(i), Y(q.ask)) : x.moveTo(X(i), Y(q.ask));
				});
				for (var i2 = gmHist.length - 1; i2 >= 0; i2--) {
					var q2 = gmQ(gmHist[i2].p, gmMu);
					x.lineTo(X(i2), Y(q2.bid));
				}
				x.closePath();
				x.fill();
				x.strokeStyle = C.amber;
				x.lineWidth = 1.8;
				x.beginPath();
				gmHist.forEach((h, i) => {
					i ? x.lineTo(X(i), Y(h.p)) : x.moveTo(X(i), Y(h.p));
				});
				x.stroke();
				gmHist.forEach((h, i) => {
					if (!h.side) {
						return;
					}
					x.fillStyle = h.side > 0 ? C.green : C.red;
					x.beginPath();
					x.arc(X(i), Y(h.p), 3.2, 0, 7);
					x.fill();
				});
				if (gmAuto) {
					x.fillStyle = C.dim;
					x.font = "10px IBM Plex Mono";
					x.fillText("auto-flow: hidden true value = $" + gmTrue, 54, 16);
				}
				var q = gmQ(gmP, gmMu);
				document.getElementById("gm-px").textContent =
					(gmP * 100).toFixed(1) + "¢";
				document.getElementById("gm-bid").textContent =
					(q.bid * 100).toFixed(1) + "¢";
				document.getElementById("gm-ask").textContent =
					(q.ask * 100).toFixed(1) + "¢";
				document.getElementById("gm-spr").textContent =
					((q.ask - q.bid) * 100).toFixed(1) + "¢";
			}
			gmDraw();
			if (!reduceMotion) {
				gmLoop();
			}
		}
	};

	/* ================= CH6 AS EXPLORER ================= */
	figInit.ch6 = () => {
		var k = cv("cv-as");
		if (!k) {
			return;
		}
		var P = { q: 0, g: 0.1, s: 2.0, t: 1.0, k: 1.5 };
		function bind(id, key, div, fmt) {
			var el = document.getElementById(id);
			el.oninput = function () {
				P[key] = +this.value / div;
				document.getElementById(id + "-v").textContent = fmt(P[key]);
				draw();
			};
		}
		bind("as-q", "q", 1, (v) => v.toFixed(0));
		bind("as-g", "g", 100, (v) => v.toFixed(2));
		bind("as-s", "s", 10, (v) => v.toFixed(1));
		bind("as-t", "t", 100, (v) => v.toFixed(2));
		bind("as-k", "k", 10, (v) => v.toFixed(1));
		function draw() {
			var s = 100;
			var r = s - P.q * P.g * P.s * P.s * P.t;
			var spr = P.g * P.s * P.s * P.t + (2 / P.g) * Math.log(1 + P.g / P.k);
			var bid = r - spr / 2,
				ask = r + spr / 2;
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var lo = Math.min(bid, 90),
				hi = Math.max(ask, 110);
			var pad = (hi - lo) * 0.12;
			lo -= pad;
			hi += pad;
			function Y(v) {
				return H - 26 - ((v - lo) / (hi - lo)) * (H - 52);
			}
			// axis
			line(x, 70, 12, 70, H - 12, C.grid, 1);
			for (var v = Math.ceil(lo); v <= hi; v += 2) {
				line(x, 66, Y(v), 74, Y(v), "#23344F", 1);
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText(v, 30, Y(v) + 3);
			}
			function band(y1, y2, col) {
				x.fillStyle = col;
				x.fillRect(80, Math.min(y1, y2), W - 100, Math.abs(y2 - y1));
			}
			band(Y(bid), Y(ask), "rgba(111,168,255,0.07)");
			function mark(v, col, label, dash) {
				line(x, 80, Y(v), W - 20, Y(v), col, 2, dash);
				x.fillStyle = col;
				x.font = "11px IBM Plex Mono";
				x.fillText(label + "  " + v.toFixed(2), 84, Y(v) - 5);
			}
			mark(s, "#C7D5E8", "mid s", [5, 4]);
			mark(r, C.amber, "reservation r", []);
			mark(bid, C.green, "BID", []);
			mark(ask, C.red, "ASK", []);
			document.getElementById("as-r").textContent = r.toFixed(2);
			document.getElementById("as-bid").textContent = bid.toFixed(2);
			document.getElementById("as-ask").textContent = ask.toFixed(2);
			document.getElementById("as-spr").textContent = spr.toFixed(2);
		}
		draw();
		k.onResize(draw);
		/* — fill-rate trade-off — */
		var lmc = cv("cv-lam");
		if (lmc) {
			var lamK = 1.5,
				lamD = 0.67;
			document.getElementById("lam-k").oninput = function () {
				lamK = +this.value / 10;
				document.getElementById("lam-k-v").textContent = lamK.toFixed(1);
				lamDraw();
			};
			document.getElementById("lam-d").oninput = function () {
				lamD = +this.value / 100;
				document.getElementById("lam-d-v").textContent = lamD.toFixed(2);
				lamDraw();
			};
			function lamDraw() {
				var x = lmc.ctx,
					W = lmc.W(),
					H = lmc.H();
				x.clearRect(0, 0, W, H);
				var DMAX = 3,
					opt = 1 / lamK,
					pmax = opt * Math.exp(-1);
				function X(d) {
					return 50 + (d / DMAX) * (W - 70);
				}
				function Y(v) {
					return 14 + (1 - v) * (H - 48);
				}
				for (var g = 0; g < 4; g++) {
					line(
						x,
						50,
						14 + (g * (H - 48)) / 3,
						W - 20,
						14 + (g * (H - 48)) / 3,
						C.grid,
						1
					);
				}
				[0, 1, 2, 3].forEach((d) => {
					x.fillStyle = C.dim;
					x.font = "9px IBM Plex Mono";
					x.fillText(d + "", X(d) - 3, H - 20);
				});
				x.fillStyle = C.dim;
				x.fillText("distance from mid δ →", W - 170, H - 6);
				x.strokeStyle = C.green;
				x.lineWidth = 1.5;
				x.beginPath();
				for (var d1 = 0; d1 <= DMAX; d1 += 0.02) {
					var v1 = Math.exp(-lamK * d1);
					d1 ? x.lineTo(X(d1), Y(v1)) : x.moveTo(X(d1), Y(v1));
				}
				x.stroke();
				x.strokeStyle = "rgba(199,213,232,0.4)";
				x.lineWidth = 1.2;
				x.beginPath();
				for (var d2 = 0; d2 <= DMAX; d2 += 0.02) {
					var v2 = d2 / DMAX;
					d2 ? x.lineTo(X(d2), Y(v2)) : x.moveTo(X(d2), Y(v2));
				}
				x.stroke();
				x.strokeStyle = C.amber;
				x.lineWidth = 2.2;
				x.beginPath();
				for (var d3 = 0; d3 <= DMAX; d3 += 0.02) {
					var v3 = (d3 * Math.exp(-lamK * d3)) / pmax;
					d3 ? x.lineTo(X(d3), Y(v3)) : x.moveTo(X(d3), Y(v3));
				}
				x.stroke();
				if (opt < DMAX) {
					line(x, X(opt), 14, X(opt), H - 34, C.dim, 1, [3, 3]);
					x.fillStyle = C.dim;
					x.font = "10px IBM Plex Mono";
					x.fillText("δ* = " + opt.toFixed(2), X(opt) + 5, 26);
				}
				var you =
					(Math.min(lamD, DMAX) * Math.exp(-lamK * Math.min(lamD, DMAX))) /
					pmax;
				x.fillStyle = C.amber;
				x.beginPath();
				x.arc(X(Math.min(lamD, DMAX)), Y(Math.min(you, 1)), 5.5, 0, 7);
				x.fill();
				x.font = "10px IBM Plex Mono";
				x.fillStyle = C.green;
				x.fillText("fill rate λ(δ)", W - 140, 24);
				x.fillStyle = "rgba(199,213,232,0.7)";
				x.fillText("profit per fill δ", W - 140, 38);
				x.fillStyle = C.amber;
				x.fillText("expected δ·λ(δ)", W - 140, 52);
				document.getElementById("lam-opt").textContent = opt.toFixed(2);
				document.getElementById("lam-you").textContent = (
					lamD * Math.exp(-lamK * lamD)
				).toFixed(3);
				var pct = you * 100,
					pe = document.getElementById("lam-pct");
				pe.textContent = pct.toFixed(0) + "%";
				pe.className = "v " + (pct > 85 ? "pos" : pct > 50 ? "" : "neg");
			}
			lamDraw();
			lmc.onResize(lamDraw);
		}
	};

	/* ================= CH7 MICROPRICE ================= */
	figInit.ch7 = () => {
		var k = cv("cv-micro");
		if (!k) {
			return;
		}
		var Qb = 500,
			Qa = 500,
			Pb = 49,
			Pa = 51;
		document.getElementById("mi-b").oninput = function () {
			Qb = +this.value;
			document.getElementById("mi-b-v").textContent = Qb;
			draw();
		};
		document.getElementById("mi-a").oninput = function () {
			Qa = +this.value;
			document.getElementById("mi-a-v").textContent = Qa;
			draw();
		};
		function draw() {
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var mid = (Pb + Pa) / 2;
			var wm = (Pa * Qb + Pb * Qa) / (Qb + Qa);
			function X(p) {
				return 60 + ((p - 47.5) / (52.5 - 47.5)) * (W - 120);
			}
			var base = H - 58;
			// bars
			var bw = 70;
			x.fillStyle = "#16614B";
			x.fillRect(X(Pb) - bw / 2, base - Qb * 0.1, bw, Qb * 0.1);
			x.fillStyle = "#8C3A33";
			x.fillRect(X(Pa) - bw / 2, base - Qa * 0.1, bw, Qa * 0.1);
			x.fillStyle = C.green;
			x.font = "11px IBM Plex Mono";
			x.textAlign = "center";
			x.fillText("BID " + Pb + "¢", X(Pb), base + 16);
			x.fillText(Qb, X(Pb), base - Qb * 0.1 - 6);
			x.fillStyle = C.red;
			x.fillText("ASK " + Pa + "¢", X(Pa), base + 16);
			x.fillText(Qa, X(Pa), base - Qa * 0.1 - 6);
			line(x, 60, base, W - 60, base, "#23344F", 1);
			// mid & wm markers
			function tri(px, col, label, up) {
				x.fillStyle = col;
				x.beginPath();
				x.moveTo(px, base + 24);
				x.lineTo(px - 6, base + 36);
				x.lineTo(px + 6, base + 36);
				x.closePath();
				x.fill();
				x.fillText(label, px, base + 50);
			}
			tri(X(mid), "#C7D5E8", "mid " + mid.toFixed(2));
			tri(X(wm), C.amber, "weighted " + wm.toFixed(2));
			x.textAlign = "left";
			var imb = (Qb - Qa) / (Qb + Qa);
			document.getElementById("mi-mid").textContent = mid.toFixed(2) + "¢";
			document.getElementById("mi-wm").textContent = wm.toFixed(2) + "¢";
			document.getElementById("mi-imb").textContent =
				(imb >= 0 ? "+" : "") +
				(imb * 100).toFixed(0) +
				"% " +
				(imb > 0.05
					? "(buy pressure)"
					: imb < -0.05
						? "(sell pressure)"
						: "(balanced)");
		}
		draw();
		k.onResize(draw);
		/* — queue position — */
		var quc = cv("cv-queue");
		if (quc) {
			var quAhead,
				quBehind,
				quYou = 100,
				quBenign = 0,
				quSwept = 0,
				quFrame = 0,
				quFlash = 0,
				quMsg = "You joined the back of the queue at this price level.";
			function quJoin() {
				quAhead = 320 + Math.round(Math.random() * 280);
				quBehind = 0;
			}
			quJoin();
			document.getElementById("qu-cancel").onclick = () => {
				quAhead += quBehind;
				quBehind = 0;
				quMsg =
					"Cancelled & replaced: everyone who was behind you is now ahead.";
				quDraw();
			};
			document.getElementById("qu-reset").onclick = () => {
				quBenign = 0;
				quSwept = 0;
				quJoin();
				quMsg = "Stats reset — fresh queue.";
				quDraw();
			};
			function quLoop() {
				quFrame++;
				quFlash = Math.max(0, quFlash - 1);
				if (alive && quFrame % 18 === 0) {
					var r = Math.random();
					if (r < 0.6) {
						var take = 20 + Math.round(Math.random() * 70);
						if (quAhead > 0) {
							quAhead = Math.max(0, quAhead - take);
							quMsg =
								"Taker bought " + take + " — the queue ahead of you shrinks.";
						} else {
							quBenign++;
							quMsg =
								"Front of queue: benign fill — you earn the spread. Rejoining at the back.";
							quJoin();
						}
					} else if (r < 0.92) {
						var add = 20 + Math.round(Math.random() * 60);
						quBehind += add;
						quMsg = add + " contracts joined behind you.";
					} else if (r < 0.985) {
						quMsg = "…quiet tape…";
					} else {
						quSwept++;
						quFlash = 14;
						quMsg =
							"SWEEP — the level was cleared and price ran through. You were filled on the wrong side.";
						quJoin();
					}
					quDraw();
				}
				if (!reduceMotion && alive) {
					requestAnimationFrame(quLoop);
				}
			}
			function quDraw() {
				var x = quc.ctx,
					W = quc.W(),
					H = quc.H();
				x.clearRect(0, 0, W, H);
				var total = quAhead + quYou + quBehind,
					bx = 30,
					bw = W - 60,
					by = H / 2 - 24,
					bh = 46;
				x.strokeStyle = C.grid;
				x.strokeRect(bx, by, bw, bh);
				function seg(start, len, col) {
					if (len <= 0) {
						return;
					}
					x.fillStyle = col;
					x.fillRect(
						bx + (start / total) * bw,
						by,
						Math.max(1.5, (len / total) * bw),
						bh
					);
				}
				seg(0, quAhead, "#41506B");
				seg(quAhead, quYou, C.amber);
				seg(quAhead + quYou, quBehind, "#26334A");
				x.font = "10px IBM Plex Mono";
				x.fillStyle = C.dim;
				x.fillText(
					"← market orders consume from the front (FIFO)",
					bx,
					by - 10
				);
				x.fillStyle = C.amber;
				var yx = bx + ((quAhead + quYou / 2) / total) * bw;
				x.fillText(
					"YOU",
					Math.min(W - 60, Math.max(bx, yx - 12)),
					by + bh + 16
				);
				x.fillStyle = C.dim;
				x.fillText("ahead: " + quAhead, bx, by + bh + 16);
				var bt = "behind: " + quBehind;
				x.fillText(bt, bx + bw - x.measureText(bt).width, by + bh + 16);
				if (quFlash > 0) {
					x.fillStyle = "rgba(240,138,126," + (quFlash / 14) * 0.3 + ")";
					x.fillRect(0, 0, W, H);
					x.fillStyle = C.red;
					x.font = "12px IBM Plex Mono";
					x.fillText("SWEEP", W / 2 - 22, by - 10);
				}
				document.getElementById("qu-ahead").textContent = quAhead;
				document.getElementById("qu-behind").textContent = quBehind;
				document.getElementById("qu-benign").textContent = quBenign;
				document.getElementById("qu-swept").textContent = quSwept;
				document.getElementById("qu-msg").textContent = quMsg;
			}
			quDraw();
			if (!reduceMotion) {
				quLoop();
			}
		}
		/* — vpin toxicity alarm — */
		var vpc = cv("cv-vpin");
		if (vpc) {
			var vpBuckets = [],
				vpHist = [],
				vpToxic = 0,
				vpFrame = 0,
				vpVal = 0,
				VPTH = 0.5;
			function vpPush() {
				var bf =
					vpToxic > 0
						? 0.8 + Math.random() * 0.15
						: 0.5 + (Math.random() - 0.5) * 0.34;
				if (vpToxic > 0) {
					vpToxic--;
				} else if (Math.random() < 0.004) {
					vpToxic = 12;
				}
				vpBuckets.push(bf);
				if (vpBuckets.length > 46) {
					vpBuckets.shift();
				}
				var w = vpBuckets.slice(-14);
				vpVal = w.reduce((a, b) => a + Math.abs(2 * b - 1), 0) / w.length;
				vpHist.push(vpVal);
				if (vpHist.length > 92) {
					vpHist.shift();
				}
			}
			document.getElementById("vp-burst").onclick = () => {
				vpToxic = 14;
			};
			function vpDraw() {
				var x = vpc.ctx,
					W = vpc.W(),
					H = vpc.H();
				x.clearRect(0, 0, W, H);
				var stripH = 54,
					stripY = H - stripH - 16,
					topH = stripY - 22;
				// buckets strip
				var bw = (W - 66) / 46;
				vpBuckets.forEach((bf, i) => {
					var bx = 46 + i * bw,
						bh = stripH;
					x.fillStyle = "rgba(127,227,176,0.7)";
					x.fillRect(bx, stripY + bh * (1 - bf), bw - 1.5, bh * bf);
					x.fillStyle = "rgba(240,138,126,0.7)";
					x.fillRect(bx, stripY, bw - 1.5, bh * (1 - bf));
				});
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText(
					"equal-volume buckets: buy share (green) vs sell share (red)",
					46,
					H - 4
				);
				// vpin line
				function Y(v) {
					return 14 + (1 - v) * (topH - 14);
				}
				function X(i) {
					return 46 + (i / 91) * (W - 66);
				}
				[0, 0.5, 1].forEach((g) => {
					line(x, 46, Y(g), W - 20, Y(g), C.grid, 1);
					x.fillStyle = C.dim;
					x.fillText(g.toFixed(1), 18, Y(g) + 3);
				});
				line(x, 46, Y(VPTH), W - 20, Y(VPTH), C.red, 1.2, [4, 3]);
				x.fillStyle = C.red;
				x.fillText("alarm threshold", W - 120, Y(VPTH) - 5);
				x.strokeStyle = vpVal > VPTH ? C.red : C.green;
				x.lineWidth = 1.8;
				x.beginPath();
				vpHist.forEach((v, i) => {
					i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
				});
				x.stroke();
				if (vpVal > VPTH) {
					x.fillStyle = "rgba(232,185,62,0.10)";
					x.fillRect(0, 0, W, H);
					x.fillStyle = C.amber;
					x.font = "12px IBM Plex Mono";
					x.fillText("TOXIC — WIDEN OR PULL", W / 2 - 90, 26);
				}
				var ve = document.getElementById("vp-val");
				ve.textContent = vpVal.toFixed(2);
				ve.className =
					"v " + (vpVal > VPTH ? "neg" : vpVal > 0.35 ? "" : "pos");
				document.getElementById("vp-regime").textContent =
					vpVal > VPTH
						? "Alarm: pull quotes or widen hard — the flow is one-sided."
						: vpVal > 0.35
							? "Elevated: widen a tick, shrink size, watch markouts."
							: "Normal two-way flow — quote normally.";
			}
			for (var sv = 0; sv < 34; sv++) {
				vpPush();
			}
			function vpLoop() {
				vpFrame++;
				if (alive && vpFrame % 14 === 0) {
					vpPush();
					vpDraw();
				}
				if (!reduceMotion && alive) {
					requestAnimationFrame(vpLoop);
				}
			}
			vpDraw();
			if (!reduceMotion) {
				vpLoop();
			}
		}
	};

	/* ================= CH8 JUMP VS BROWNIAN ================= */
	figInit.ch8 = () => {
		var k = cv("cv-jump");
		if (!k) {
			return;
		}
		var bm,
			tn,
			evts,
			t,
			T = 520;
		function reset() {
			bm = [100];
			tn = [0.55];
			evts = [];
			t = 0;
		}
		reset();
		document.getElementById("jp-reset").onclick = reset;
		function step() {
			if (t < T) {
				t++;
				bm.push(bm[bm.length - 1] + (Math.random() - 0.5) * 0.7);
				var p = tn[tn.length - 1];
				var np = p + (Math.random() - 0.5) * 0.002;
				if (t % 34 === 0) {
					// a point resolves
					var fav = Math.random() < p ? 1 : -1;
					var mag =
						(0.025 + Math.random() * 0.05) *
						(4 * p * (1 - p)) *
						(1 + (t / T) * 1.2);
					np = p + fav * mag;
					evts.push({ i: t, big: mag > 0.05 });
				}
				np = Math.max(0.01, Math.min(0.99, np));
				// pull to boundary near the end
				if (t > T * 0.86) {
					np =
						np +
						(((np > 0.5 ? 1 : -1) * 0.004 * (t - T * 0.86)) / (T * 0.14)) * 3;
				}
				np = Math.max(0.005, Math.min(0.995, np));
				tn.push(np);
			}
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var half = W / 2 - 12;
			function panel(ox, title) {
				x.fillStyle = C.dim;
				x.font = "10px IBM Plex Mono";
				x.fillText(title, ox + 8, 16);
				x.strokeStyle = C.grid;
				x.strokeRect(ox, 22, half, H - 34);
			}
			panel(0, "BROWNIAN — a stock");
			panel(W / 2 + 12, "JUMP-DIFFUSION — match-winner probability");
			// left
			var min = Math.min.apply(null, bm) - 1,
				max = Math.max.apply(null, bm) + 1;
			x.strokeStyle = C.blue;
			x.lineWidth = 1.3;
			x.beginPath();
			bm.forEach((v, i) => {
				var X0 = (i / T) * (half - 12) + 6,
					Y0 = H - 18 - ((v - min) / (max - min)) * (H - 62);
				i ? x.lineTo(X0, Y0) : x.moveTo(X0, Y0);
			});
			x.stroke();
			// right
			var ox = W / 2 + 12;
			function YR(p) {
				return H - 18 - p * (H - 62);
			}
			[0, 0.25, 0.5, 0.75, 1].forEach((g) => {
				line(x, ox + 2, YR(g), ox + half - 2, YR(g), C.grid, 1);
				x.fillStyle = C.dim;
				x.font = "8px IBM Plex Mono";
				x.fillText(Math.round(g * 100) + "¢", ox + half - 26, YR(g) - 2);
			});
			x.strokeStyle = C.green;
			x.lineWidth = 1.5;
			x.beginPath();
			tn.forEach((p, i) => {
				var X0 = ox + 6 + (i / T) * (half - 12);
				i ? x.lineTo(X0, YR(p)) : x.moveTo(X0, YR(p));
			});
			x.stroke();
			evts.forEach((e) => {
				if (e.i >= tn.length) {
					return;
				}
				var X0 = ox + 6 + (e.i / T) * (half - 12);
				x.fillStyle = e.big ? C.amber : C.dim;
				x.beginPath();
				x.arc(X0, YR(tn[e.i]), e.big ? 3.5 : 2, 0, 7);
				x.fill();
			});
			if (t >= T) {
				x.fillStyle = C.amber;
				x.font = "11px IBM Plex Mono";
				x.fillText(
					tn[tn.length - 1] > 0.5 ? "→ resolves to $1" : "→ resolves to $0",
					ox + 10,
					36
				);
			}
			if (!reduceMotion && alive) {
				requestAnimationFrame(step);
			} else if (t < T) {
				while (t < T) {
					step();
				}
			}
		}
		step();
		/* — logit lens — */
		var lgc = cv("cv-logit");
		if (lgc) {
			var lgP = 0.8;
			function lx(p) {
				return Math.log(p / (1 - p));
			}
			document.getElementById("lg-p").oninput = function () {
				lgP = +this.value / 100;
				document.getElementById("lg-p-v").textContent =
					Math.round(lgP * 100) + "¢";
				lgDraw();
			};
			function lgDraw() {
				var x = lgc.ctx,
					W = lgc.W(),
					H = lgc.H();
				x.clearRect(0, 0, W, H);
				var XR = 4.6;
				function X(v) {
					return 50 + ((v + XR) / (2 * XR)) * (W - 70);
				}
				function Y(p) {
					return 14 + (1 - p) * (H - 58);
				}
				[0, 0.25, 0.5, 0.75, 1].forEach((g) => {
					line(x, 50, Y(g), W - 20, Y(g), C.grid, 1);
					x.fillStyle = C.dim;
					x.font = "9px IBM Plex Mono";
					x.fillText(Math.round(g * 100) + "¢", 16, Y(g) + 3);
				});
				[-4, -2, 0, 2, 4].forEach((v) => {
					line(x, X(v), 14, X(v), H - 44, C.grid, 1);
					x.fillStyle = C.dim;
					x.fillText((v > 0 ? "+" : "") + v, X(v) - 7, H - 30);
				});
				x.fillStyle = C.dim;
				x.fillText("log-odds x (belief space) →", W - 190, H - 6);
				x.strokeStyle = C.green;
				x.lineWidth = 2;
				x.beginPath();
				for (var v = -XR; v <= XR; v += 0.05) {
					var p = 1 / (1 + Math.exp(-v));
					v > -XR ? x.lineTo(X(v), Y(p)) : x.moveTo(X(v), Y(p));
				}
				x.stroke();
				var p1 = lgP - 0.02,
					p2 = lgP + 0.02,
					x0 = lx(lgP),
					x1 = lx(p1),
					x2 = lx(p2);
				// price band (vertical span on the price axis)
				x.fillStyle = "rgba(240,138,126,0.12)";
				x.fillRect(50, Y(p2), W - 70, Y(p1) - Y(p2));
				line(x, 50, Y(p1), X(x1), Y(p1), C.red, 1, [3, 3]);
				line(x, 50, Y(p2), X(x2), Y(p2), C.red, 1, [3, 3]);
				// belief span projected on the x axis
				line(x, X(x1), Y(p1), X(x1), H - 44, C.amber, 1, [3, 3]);
				line(x, X(x2), Y(p2), X(x2), H - 44, C.amber, 1, [3, 3]);
				x.fillStyle = "rgba(232,185,62,0.5)";
				x.fillRect(X(x1), H - 48, Math.max(2, X(x2) - X(x1)), 7);
				x.fillStyle = C.amber;
				x.font = "10px IBM Plex Mono";
				x.fillText("belief shock Δx", Math.min(X(x1), W - 130), H - 52);
				x.fillStyle = C.red;
				x.fillText("±2¢", 54, Y(lgP) + 3);
				x.fillStyle = C.amber;
				x.beginPath();
				x.arc(X(x0), Y(lgP), 5.5, 0, 7);
				x.fill();
				var dx = x2 - x1,
					dx50 = lx(0.52) - lx(0.48);
				document.getElementById("lg-x").textContent =
					(x0 >= 0 ? "+" : "") + x0.toFixed(2);
				document.getElementById("lg-dx").textContent =
					dx.toFixed(2) + " logit units";
				document.getElementById("lg-eq").textContent =
					"×" + (dx / dx50).toFixed(1) + " the information";
			}
			lgDraw();
			lgc.onResize(lgDraw);
		}
	};

	/* ================= CH9 KALSHI FEE ================= */
	figInit.ch9 = () => {
		var k = cv("cv-fee");
		if (!k) {
			return;
		}
		var p = 50;
		document.getElementById("fee-p").oninput = function () {
			p = +this.value;
			document.getElementById("fee-p-v").textContent = p + "¢";
			draw();
		};
		function fee(pp) {
			return Math.ceil(0.07 * pp * (100 - pp)) / 100;
		} // cents per contract
		function draw() {
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			function X(pp) {
				return 46 + ((pp - 1) / 98) * (W - 66);
			}
			function Y(f) {
				return H - 34 - (f / 1.8) * (H - 70);
			}
			// 30-70 band
			x.fillStyle = "rgba(127,227,176,0.08)";
			x.fillRect(X(30), 18, X(70) - X(30), H - 52);
			x.fillStyle = C.dim;
			x.font = "9px IBM Plex Mono";
			x.fillText("MM band 30–70¢", X(30) + 6, 30);
			line(x, 46, H - 34, W - 20, H - 34, "#23344F", 1);
			[1, 25, 50, 75, 99].forEach((g) => {
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText(g + "¢", X(g) - 8, H - 18);
			});
			[0.5, 1.0, 1.5].forEach((f) => {
				line(x, 46, Y(f), W - 20, Y(f), C.grid, 1);
				x.fillStyle = C.dim;
				x.fillText(f.toFixed(1) + "¢", 8, Y(f) + 3);
			});
			x.strokeStyle = C.red;
			x.lineWidth = 2;
			x.beginPath();
			for (var pp = 1; pp <= 99; pp++) {
				var Y0 = Y((0.07 * pp * (100 - pp)) / 100);
				pp === 1 ? x.moveTo(X(pp), Y0) : x.lineTo(X(pp), Y0);
			}
			x.stroke();
			line(x, 46, Y(0.02), W - 20, Y(0.02), C.green, 1.5, [5, 4]);
			x.fillStyle = C.green;
			x.font = "10px IBM Plex Mono";
			x.fillText("maker fee ≈ 0 (most markets)", 50, Y(0.02) - 6);
			// marker
			var f = fee(p);
			line(x, X(p), 18, X(p), H - 34, C.amber, 1, [3, 3]);
			x.fillStyle = C.amber;
			x.beginPath();
			x.arc(X(p), Y((0.07 * p * (100 - p)) / 100), 5, 0, 7);
			x.fill();
			document.getElementById("fee-f").textContent = f.toFixed(2) + "¢";
			document.getElementById("fee-pct").textContent =
				((f / p) * 100).toFixed(2) + "%";
			document.getElementById("fee-ticks").textContent =
				f.toFixed(1) + " ticks (" + (f * 2).toFixed(1) + " round-trip)";
		}
		draw();
		k.onResize(draw);
	};

	/* ================= CH10 POLY REWARD ================= */
	figInit.ch10 = () => {
		var k = cv("cv-poly");
		if (!k) {
			return;
		}
		var d = 1.0,
			m = 3.0;
		document.getElementById("po-d").oninput = function () {
			d = +this.value / 10;
			document.getElementById("po-d-v").textContent = d.toFixed(1) + "¢";
			draw();
		};
		document.getElementById("po-m").oninput = function () {
			m = +this.value / 10;
			document.getElementById("po-m-v").textContent = m.toFixed(1) + "¢";
			draw();
		};
		function score(dd) {
			return dd >= m ? 0 : ((m - dd) / m) ** 2;
		}
		function draw() {
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			function X(dd) {
				return 46 + (dd / 6) * (W - 66);
			}
			function Y(s) {
				return H - 30 - s * (H - 60);
			}
			line(x, 46, H - 30, W - 20, H - 30, "#23344F", 1);
			[0, 1, 2, 3, 4, 5, 6].forEach((g) => {
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText(g + "¢", X(g) - 6, H - 14);
			});
			[0.25, 0.5, 0.75, 1].forEach((s) => {
				line(x, 46, Y(s), W - 20, Y(s), C.grid, 1);
			});
			x.strokeStyle = C.green;
			x.lineWidth = 2;
			x.beginPath();
			for (var dd = 0; dd <= 6; dd += 0.05) {
				var Y0 = Y(score(dd));
				dd === 0 ? x.moveTo(X(dd), Y0) : x.lineTo(X(dd), Y0);
			}
			x.stroke();
			if (m < 6) {
				line(x, X(m), 20, X(m), H - 30, C.red, 1, [3, 3]);
				x.fillStyle = C.red;
				x.font = "9px IBM Plex Mono";
				x.fillText("max spread — score 0 beyond", X(m) + 5, 32);
			}
			var s = score(d);
			x.fillStyle = C.amber;
			x.beginPath();
			x.arc(X(d), Y(s), 5, 0, 7);
			x.fill();
			x.fillStyle = C.dim;
			x.font = "10px IBM Plex Mono";
			x.fillText("distance from midpoint →", W - 200, H - 2);
			x.save();
			x.translate(12, H / 2);
			x.rotate(-Math.PI / 2);
			x.fillText("relative score", 0, 0);
			x.restore();
			document.getElementById("po-s").textContent = (s * 100).toFixed(0) + "%";
			document.getElementById("po-read").textContent =
				s === 0
					? "Outside the scoring band: zero reward — pure inventory risk."
					: s > 0.6
						? "Premium zone: maximum salary, maximum adverse-selection exposure."
						: s > 0.25
							? "Balanced: meaningful reward with breathing room against jumps."
							: "Cheap seats: low reward, low risk — only worth it in big pools.";
		}
		draw();
		k.onResize(draw);
	};

	/* ================= CH12 FEE LADDER ================= */
	figInit.ch12 = () => {
		var k = cv("cv-tier");
		if (!k) {
			return;
		}
		// indicative Binance USDT-M futures fees, bps: [maker, taker]
		var tiers = [
			["V0", 2.0, 5.0],
			["V1", 1.6, 4.0],
			["V2", 1.4, 3.5],
			["V3", 1.2, 3.2],
			["V4", 1.0, 3.0],
			["V5", 0.8, 2.7],
			["V6", 0.6, 2.5],
			["V7", 0.4, 2.2],
			["V8", 0.2, 2.0],
			["V9", 0.0, 1.7],
			["MM", -0.5, 1.7],
		];
		var spr = 6.0;
		document.getElementById("tier-spr").oninput = function () {
			spr = +this.value / 10;
			document.getElementById("tier-spr-v").textContent = spr.toFixed(1);
			draw();
		};
		function draw() {
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var n = tiers.length,
				baseY = H - 46;
			var mA = tiers.map((t) => spr - 2 * t[1]); // both legs maker
			var mB = tiers.map((t) => spr - t[1] - t[2]); // maker + taker hedge
			var lo = Math.min(0, Math.min.apply(null, mA.concat(mB))) - 0.5;
			var hi = Math.max(1, Math.max.apply(null, mA.concat(mB))) + 0.5;
			function Y(v) {
				return 14 + (1 - (v - lo) / (hi - lo)) * (H - 76);
			}
			function X(i) {
				return 56 + ((i + 0.5) / n) * (W - 76);
			}
			var gw = (W - 76) / n,
				bw = gw * 0.3;
			for (var g = 0; g < 4; g++) {
				var gv = lo + ((hi - lo) * g) / 3;
				line(x, 56, Y(gv), W - 20, Y(gv), C.grid, 1);
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText(gv.toFixed(1), 14, Y(gv) + 3);
			}
			line(x, 56, Y(0), W - 20, Y(0), C.text, 1.2, [2, 4]);
			x.fillStyle = C.dim;
			x.font = "9px IBM Plex Mono";
			x.fillText("break-even", W - 86, Y(0) - 4);
			var vMM = -1,
				vMT = -1;
			tiers.forEach((t, i) => {
				var cx = X(i);
				function bar(v, off, alpha) {
					x.globalAlpha = alpha;
					x.fillStyle = v >= 0 ? C.green : C.red;
					var y0 = Y(Math.max(0, v)),
						h = Math.abs(Y(v) - Y(0));
					x.fillRect(cx + off, y0, bw, Math.max(1.2, h));
					x.globalAlpha = 1;
				}
				bar(mA[i], -bw - 2, 0.95);
				bar(mB[i], 2, 0.45);
				if (mA[i] >= 0 && vMM < 0) {
					vMM = i;
				}
				if (mB[i] >= 0 && vMT < 0) {
					vMT = i;
				}
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.textAlign = "center";
				x.fillText(t[0], cx, baseY + 16);
				x.fillText(t[1].toFixed(1) + "/" + t[2].toFixed(1), cx, baseY + 28);
				x.textAlign = "left";
			});
			x.font = "10px IBM Plex Mono";
			x.fillStyle = C.green;
			x.fillText("■ both maker", 60, 18);
			x.globalAlpha = 0.5;
			x.fillText("■ maker + taker hedge", 160, 18);
			x.globalAlpha = 1;
			x.fillStyle = C.dim;
			x.fillText(
				"tier · maker/taker bps",
				60,
				baseY + 40 > H ? H - 4 : baseY + 40
			);
			var em = document.getElementById("tier-mm");
			em.textContent = vMM < 0 ? "never at this spread" : tiers[vMM][0];
			em.className = "v " + (vMM < 0 ? "neg" : vMM <= 2 ? "pos" : "");
			var et = document.getElementById("tier-mt");
			et.textContent = vMT < 0 ? "never at this spread" : tiers[vMT][0];
			et.className = "v " + (vMT < 0 ? "neg" : vMT <= 2 ? "pos" : "");
			document.getElementById("tier-edge").textContent =
				mA[0].toFixed(1) + " / " + mA[9].toFixed(1) + " bps";
		}
		draw();
		k.onResize(draw);
	};

	/* ================= CH15 ALGORITHM CATALOG ================= */
	figInit.ch15 = () => {
		/* --- AS vs GLFT: the inventory bound --- */
		(() => {
			var k = cv("cv-glft");
			if (!k) {
				return;
			}
			var q = 0,
				Q = 8;
			function draw() {
				var x = k.ctx,
					W = k.W(),
					H = k.H();
				x.clearRect(0, 0, W, H);
				var mid = H / 2,
					px = (p) => mid - (p - 100) * 22;
				var skew = q * 0.35,
					spr = 1.6;
				var asBid = 100 - skew - spr / 2,
					asAsk = 100 - skew + spr / 2;
				var glQ = Math.max(-Q, Math.min(Q, q)),
					glSkew = glQ * 0.35;
				var glBid = 100 - glSkew - spr / 2,
					glAsk = 100 - glSkew + spr / 2;
				var bidOff = q >= Q,
					askOff = q <= -Q;
				for (var g = 0; g < 5; g++) {
					var gy = 14 + (g * (H - 28)) / 4;
					line(x, 60, gy, W - 16, gy, C.grid, 1);
				}
				line(x, 60, px(100), W - 16, px(100), C.dim, 1, [2, 4]);
				x.fillStyle = C.dim;
				x.font = "10px IBM Plex Mono";
				x.fillText("mid = 100", W - 92, px(100) - 5);
				var colA = C.blue;
				function quote(y, col, label, x0, x1, dead) {
					if (dead) {
						x.globalAlpha = 0.18;
					}
					line(x, x0, y, x1, y, col, 3);
					x.fillStyle = col;
					x.font = "10px IBM Plex Mono";
					x.fillText(label, x0, y - 5);
					x.globalAlpha = 1;
				}
				var L0 = 70,
					L1 = (W - 16) / 2 - 14,
					R0 = (W - 16) / 2 + 14,
					R1 = W - 24;
				x.fillStyle = colA;
				x.font = "11px IBM Plex Mono";
				x.fillText("AS (unbounded)", L0, 16);
				x.fillStyle = C.amber;
				x.fillText("GLFT · bound Q=" + Q, R0, 16);
				quote(px(asAsk), colA, "ask " + asAsk.toFixed(2), L0, L1, false);
				quote(px(asBid), colA, "bid " + asBid.toFixed(2), L0, L1, false);
				quote(
					px(glAsk),
					C.amber,
					askOff ? "ask OFF" : "ask " + glAsk.toFixed(2),
					R0,
					R1,
					askOff
				);
				quote(
					px(glBid),
					C.amber,
					bidOff ? "bid OFF" : "bid " + glBid.toFixed(2),
					R0,
					R1,
					bidOff
				);
				document.getElementById("gl2-as").textContent =
					asBid.toFixed(2) + " / " + asAsk.toFixed(2);
				document.getElementById("gl2-gl").textContent =
					(bidOff ? "— " : glBid.toFixed(2) + " ") +
					"/ " +
					(askOff ? "—" : glAsk.toFixed(2));
				var st = document.getElementById("gl2-st");
				st.textContent = bidOff
					? "At +Q: bid switched off — sell-only until inventory drops"
					: askOff
						? "At −Q: ask switched off — buy-only until inventory recovers"
						: "Inside bounds: same skew as AS";
			}
			document.getElementById("gl2-q").oninput = function () {
				q = +this.value;
				document.getElementById("gl2-q-v").textContent = q;
				draw();
			};
			document.getElementById("gl2-Q").oninput = function () {
				Q = +this.value;
				document.getElementById("gl2-Q-v").textContent = Q;
				draw();
			};
			draw();
			k.onResize(draw);
		})();

		/* --- Grid trading: vending machine or falling knife --- */
		(() => {
			var k = cv("cv-grid");
			if (!k) {
				return;
			}
			var drift = 0,
				price,
				hist,
				lots,
				rungs,
				rungPnl,
				T = 520,
				step = 2,
				center = 100,
				flash,
				fee = 0.1;
			function reset() {
				price = center;
				hist = [];
				lots = [];
				rungs = 0;
				rungPnl = 0;
				flash = 0;
			}
			reset();
			document.getElementById("gr-tr").oninput = function () {
				drift = +this.value / 10;
				document.getElementById("gr-tr-v").textContent =
					drift === 0
						? "ranging"
						: (drift > 0 ? "up-trend " : "down-trend ") +
							Math.abs(drift).toFixed(1);
			};
			document.getElementById("gr-reset").onclick = reset;
			function tick() {
				var d = (Math.random() - 0.5) * 1.6 + drift * 0.12;
				var p2 = price + d;
				for (var l = -5; l <= 5; l++) {
					var lv = center + l * step;
					if (l === 0) {
						continue;
					}
					if (l < 0 && price > lv && p2 <= lv) {
						lots.push(lv);
						flash = 6;
					} // buy rung fills
					if (l > 0 && price < lv && p2 >= lv && lots.length) {
						// sell rung completes
						var lp = lots.pop();
						rungs++;
						rungPnl += lv - lp - 2 * fee;
						flash = 6;
					}
				}
				price = Math.max(84, Math.min(116, p2));
				hist.push(price);
				if (hist.length > T) {
					hist.shift();
				}
			}
			function draw() {
				var x = k.ctx,
					W = k.W(),
					H = k.H();
				x.clearRect(0, 0, W, H);
				var lo = 84,
					hi = 116;
				function Y(v) {
					return 12 + (1 - (v - lo) / (hi - lo)) * (H - 40);
				}
				function X(i) {
					return 52 + (i / (T - 1)) * (W - 72);
				}
				for (var l = -5; l <= 5; l++) {
					var lv = center + l * step;
					if (l === 0) {
						continue;
					}
					var col = l < 0 ? "rgba(15,123,95,0.5)" : "rgba(193,62,62,0.5)";
					line(x, 52, Y(lv), W - 20, Y(lv), col, 1, [4, 4]);
					x.fillStyle = col;
					x.font = "8px IBM Plex Mono";
					x.fillText(lv.toFixed(0), 34, Y(lv) + 3);
				}
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText("sells above", W - 92, Y(center + 4 * step) - 4);
				x.fillText("buys below", W - 92, Y(center - 4 * step) + 12);
				x.strokeStyle = flash > 0 ? C.amber : C.text;
				x.lineWidth = 1.6;
				x.beginPath();
				hist.forEach((v, i) => {
					i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
				});
				x.stroke();
				if (flash > 0) {
					flash--;
				}
				var mtm = 0;
				for (var m = 0; m < lots.length; m++) {
					mtm += price - lots[m];
				}
				document.getElementById("gr-rungs").textContent = rungs;
				document.getElementById("gr-pnl").textContent = rungPnl.toFixed(1);
				document.getElementById("gr-inv").textContent = lots.length;
				var em = document.getElementById("gr-mtm");
				em.textContent = mtm.toFixed(1);
				em.className = "v " + (mtm >= 0 ? "pos" : "neg");
				var tot = rungPnl + mtm;
				var et = document.getElementById("gr-tot");
				et.textContent = tot.toFixed(1);
				et.className = "v " + (tot >= 0 ? "pos" : "neg");
			}
			function loop() {
				if (alive) {
					tick();
					tick();
					draw();
				}
				if (!reduceMotion && alive) {
					requestAnimationFrame(loop);
				}
			}
			if (reduceMotion) {
				for (var i = 0; i < T; i++) {
					tick();
				}
				draw();
			} else {
				loop();
			}
			k.onResize(draw);
		})();

		/* --- Cross-exchange hedged MM: fill here, hedge there --- */
		(() => {
			var k = cv("cv-xmm");
			if (!k) {
				return;
			}
			var lat = 8,
				n = 0,
				sumSpr = 0,
				sumCost = 0,
				net = 0,
				anim = [],
				t = 0,
				deepMid = 100;
			document.getElementById("xm-lat").oninput = function () {
				lat = +this.value;
				document.getElementById("xm-lat-v").textContent = lat * 10 + "ms";
			};
			function draw() {
				var x = k.ctx,
					W = k.W(),
					H = k.H();
				x.clearRect(0, 0, W, H);
				var bw = (W - 70) / 2,
					Lx = 20,
					Rx = W - 20 - bw,
					top = 26,
					bh = H - 64;
				function book(x0, mid, tight, label, depth) {
					x.fillStyle = C.dim;
					x.font = "10px IBM Plex Mono";
					x.fillText(label, x0, 16);
					for (var i = 0; i < 5; i++) {
						var szA =
							depth * (1 - i * 0.12) * (0.7 + Math.sin(t * 0.05 + i) * 0.1);
						var szB =
							depth * (1 - i * 0.12) * (0.7 + Math.cos(t * 0.04 + i) * 0.1);
						var yA = top + bh / 2 - 12 - i * 11,
							yB = top + bh / 2 + 12 + i * 11;
						x.fillStyle = "rgba(193,62,62,0.55)";
						x.fillRect(x0 + bw / 2, yA, Math.min(bw / 2 - 4, szA), 8);
						x.fillStyle = "rgba(15,123,95,0.55)";
						x.fillRect(
							x0 + bw / 2 - Math.min(bw / 2 - 4, szB),
							yB,
							Math.min(bw / 2 - 4, szB),
							8
						);
					}
					line(x, x0, top + bh / 2, x0 + bw, top + bh / 2, C.dim, 1, [2, 4]);
				}
				book(Lx, 100, false, "QUIET VENUE — you quote wide", 26);
				book(Rx, deepMid, true, "DEEP VENUE — you hedge", 60);
				// your quotes on quiet venue
				line(
					x,
					Lx + 8,
					top + bh / 2 - 26,
					Lx + bw - 8,
					top + bh / 2 - 26,
					C.amber,
					2
				);
				line(
					x,
					Lx + 8,
					top + bh / 2 + 26,
					Lx + bw - 8,
					top + bh / 2 + 26,
					C.amber,
					2
				);
				x.fillStyle = C.amber;
				x.font = "9px IBM Plex Mono";
				x.fillText("your ask", Lx + 8, top + bh / 2 - 30);
				x.fillText("your bid", Lx + 8, top + bh / 2 + 38);
				// animated hedge packets
				anim.forEach((a) => {
					var px = Lx + bw + (Rx - Lx - bw) * a.p,
						py = top + bh / 2 + (a.side > 0 ? 26 : -26) * (1 - a.p);
					x.fillStyle = a.landed ? C.green : C.amber;
					x.beginPath();
					x.arc(px, py, 5, 0, 7);
					x.fill();
				});
				document.getElementById("xm-n").textContent = n;
				document.getElementById("xm-spr").textContent = n
					? (sumSpr / n).toFixed(2)
					: "—";
				document.getElementById("xm-slip").textContent = n
					? (sumCost / n).toFixed(2)
					: "—";
				var en = document.getElementById("xm-net");
				en.textContent = net.toFixed(1);
				en.className = "v " + (net >= 0 ? "pos" : "neg");
			}
			function loop() {
				t++;
				if (alive) {
					deepMid += (Math.random() - 0.5) * 0.25;
					deepMid = Math.max(97, Math.min(103, deepMid));
					if (t % 70 === 0) {
						// a fill arrives on quiet venue
						anim.push({
							p: 0,
							side: Math.random() < 0.5 ? 1 : -1,
							born: t,
							mid0: deepMid,
							landed: false,
						});
					}
					anim.forEach((a) => {
						if (!a.landed) {
							a.p = Math.min(1, (t - a.born) / (lat * 6));
							if (a.p >= 1) {
								a.landed = true;
								a.die = t + 24;
								var spread = 2.2,
									slip = Math.abs(deepMid - a.mid0) + 0.35; // drift while in flight + fees
								n++;
								sumSpr += spread;
								sumCost += slip;
								net += spread - slip;
							}
						}
					});
					anim = anim.filter((a) => !a.landed || t < a.die);
					draw();
				}
				if (!reduceMotion && alive) {
					requestAnimationFrame(loop);
				}
			}
			if (reduceMotion) {
				t = 1;
				deepMid = 100.4;
				anim = [];
				n = 8;
				sumSpr = 8 * 2.2;
				sumCost = 8 * (0.35 + lat * 0.05);
				net = sumSpr - sumCost;
				draw();
			} else {
				loop();
			}
			k.onResize(draw);
		})();

		/* --- RL policy heatmap: watch a policy get learned --- */
		(() => {
			var k = cv("cv-rl");
			if (!k) {
				return;
			}
			var N = 11,
				train = 0;
			// deterministic pseudo-noise (no Math.random at draw time for stability)
			function noise(i, j) {
				var v = Math.sin(i * 127.1 + j * 311.7) * 43_758.5;
				return (v - Math.floor(v)) * 2 - 1;
			}
			function policy(qi, bi) {
				// true structure: skew = -(inventory) + (imbalance)
				var q = (qi - (N - 1) / 2) / ((N - 1) / 2),
					b = (bi - (N - 1) / 2) / ((N - 1) / 2);
				return Math.max(-1, Math.min(1, -0.8 * q + 0.55 * b));
			}
			function draw() {
				var x = k.ctx,
					W = k.W(),
					H = k.H();
				x.clearRect(0, 0, W, H);
				var m = Math.min((W - 120) / N, (H - 58) / N),
					x0 = 64,
					y0 = 34;
				var a = train / 100;
				for (var i = 0; i < N; i++) {
					for (var j = 0; j < N; j++) {
						var v = (1 - a) * noise(i, j) + a * policy(i, j);
						var col; // green positive skew-up, red negative
						if (v >= 0) {
							col = "rgba(15,123,95," + (0.12 + 0.75 * v) + ")";
						} else {
							col = "rgba(193,62,62," + (0.12 + 0.75 * -v) + ")";
						}
						x.fillStyle = col;
						x.fillRect(x0 + i * m, y0 + j * m, m - 1, m - 1);
					}
				}
				x.fillStyle = C.dim;
				x.font = "10px IBM Plex Mono";
				x.fillText(
					"short ← inventory → long",
					x0 + (N * m) / 2 - 72,
					y0 + N * m + 16
				);
				x.save();
				x.translate(x0 - 10, y0 + (N * m) / 2 + 62);
				x.rotate(-Math.PI / 2);
				x.fillText("sellers queuing ← imbalance → buyers queuing", 0, 0);
				x.restore();
				// highlight the "long + buyers queuing" cell
				var hi = N - 2,
					hj = N - 2;
				x.strokeStyle = C.amber;
				x.lineWidth = 2;
				x.strokeRect(x0 + hi * m, y0 + hj * m, m - 1, m - 1);
				var v = (1 - a) * noise(hi, hj) + a * policy(hi, hj);
				var el = document.getElementById("rl-a");
				el.textContent =
					(v > 0 ? "skew up " : "skew down ") + Math.abs(v).toFixed(2);
				document.getElementById("rl-read").textContent =
					train < 15
						? "Untrained: actions are random noise"
						: train < 60
							? "Learning: inventory discipline appears first (left-right gradient)"
							: "Trained: skew ≈ −inventory + imbalance — the textbook, rediscovered";
			}
			document.getElementById("rl-t").oninput = function () {
				train = +this.value;
				document.getElementById("rl-t-v").textContent = train + "%";
				draw();
			};
			draw();
			k.onResize(draw);
		})();
	};

	/* ================= CH17 CRYPTO PRACTICUM ================= */
	figInit.ch17 = () => {
		/* --- Bar Portion explorer --- */
		(() => {
			var k = cv("cv-bp");
			if (!k) {
				return;
			}
			var c = 80; // close position within range, -100..100
			function draw() {
				var x = k.ctx,
					W = k.W(),
					H = k.H();
				x.clearRect(0, 0, W, H);
				var cx = W * 0.28,
					top = 24,
					bot = H - 30,
					range = bot - top;
				// candle: high at top, low at bottom; open at middle, close per slider
				var openY = top + range * 0.5;
				var closeY = top + range * (0.5 - (c / 100) * 0.48);
				var up = closeY < openY;
				line(x, cx, top, cx, bot, up ? C.green : C.red, 2);
				var bodyTop = Math.min(openY, closeY),
					bodyH = Math.max(4, Math.abs(closeY - openY));
				x.fillStyle = up ? C.green : C.red;
				x.fillRect(cx - 16, bodyTop, 32, bodyH);
				x.fillStyle = C.dim;
				x.font = "10px IBM Plex Mono";
				x.fillText("high", cx + 24, top + 8);
				x.fillText("low", cx + 24, bot);
				x.fillText("open", cx - 62, openY + 3);
				x.fillText("close", cx + 24, closeY + 3);
				var bp = c / 100;
				// BP gauge
				var gx = W * 0.58,
					gw = W * 0.34,
					gy = H / 2;
				line(x, gx, gy, gx + gw, gy, C.grid, 6);
				line(x, gx + gw / 2, gy - 10, gx + gw / 2, gy + 10, C.dim, 1);
				var px = gx + gw / 2 + (bp * gw) / 2;
				x.fillStyle = bp > 0.15 ? C.green : bp < -0.15 ? C.red : C.text;
				x.beginPath();
				x.arc(px, gy, 7, 0, 7);
				x.fill();
				x.fillStyle = C.dim;
				x.font = "10px IBM Plex Mono";
				x.fillText("-1", gx - 14, gy + 4);
				x.fillText("+1", gx + gw + 4, gy + 4);
				x.fillText("Bar Portion", gx + gw / 2 - 32, gy - 18);
				// implication arrow
				var iy = gy + 38;
				x.font = "11px IBM Plex Mono";
				if (Math.abs(bp) > 0.15) {
					x.fillStyle = bp > 0 ? C.red : C.green;
					x.fillText(
						bp > 0
							? "→ signal: lean DOWN (mean reversion)"
							: "→ signal: lean UP (mean reversion)",
						gx - 10,
						iy
					);
				} else {
					x.fillStyle = C.dim;
					x.fillText("→ signal: neutral (doji)", gx - 10, iy);
				}
				document.getElementById("bp-val").textContent = bp.toFixed(2);
				document.getElementById("bp-sig").textContent =
					Math.abs(bp) < 0.15
						? "No edge — quote symmetric around the mid"
						: bp > 0
							? "Bar kept " +
								Math.round(bp * 100) +
								"% of its range going up → shade the reference price DOWN"
							: "Bar kept " +
								Math.round(-bp * 100) +
								"% of its range going down → shade the reference price UP";
				var lbl = document.getElementById("bp-c-v");
				lbl.textContent =
					c > 60
						? "top"
						: c > 15
							? "upper half"
							: c > -15
								? "middle (doji)"
								: c > -60
									? "lower half"
									: "bottom";
			}
			document.getElementById("bp-c").oninput = function () {
				c = +this.value;
				draw();
			};
			draw();
			k.onResize(draw);
		})();

		/* --- Volatility → spread calibration --- */
		(() => {
			var k = cv("cv-cal");
			if (!k) {
				return;
			}
			var vol = 15;
			// fixed pseudo-random scatter of "coins" around the 4.5x line
			var pts = [];
			(() => {
				for (var i = 0; i < 30; i++) {
					var v = 6 + ((i * 1.13) % 32);
					var f = Math.sin(i * 12.9898) * 43_758.5;
					f = f - Math.floor(f);
					pts.push({ v, s: (((v * (4 + f * 1.2)) / 100) * 4.5) / 4.5 });
				}
			})();
			function draw() {
				var x = k.ctx,
					W = k.W(),
					H = k.H();
				x.clearRect(0, 0, W, H);
				var x0 = 56,
					y0 = H - 32,
					pw = W - 80,
					ph = H - 58;
				function X(v) {
					return x0 + ((v - 4) / 38) * pw;
				}
				function Y(s) {
					return y0 - (s / 2.2) * ph;
				}
				for (var g = 0; g < 5; g++) {
					var gy = y0 - (g * ph) / 4;
					line(x, x0, gy, x0 + pw, gy, C.grid, 1);
					x.fillStyle = C.dim;
					x.font = "9px IBM Plex Mono";
					x.fillText(((2.2 * g) / 4).toFixed(1) + "%", 10, gy + 3);
				}
				x.fillStyle = C.dim;
				x.fillText("monthly volatility →", x0 + pw / 2 - 56, H - 8);
				x.save();
				x.translate(14, y0 - ph / 2);
				x.rotate(-Math.PI / 2);
				x.fillText("optimal spread", 0, 0);
				x.restore();
				// the 4x–5x band: spread% scaled to per-quote distances (coef · vol, rescaled to display units)
				function sp(v, coef) {
					return ((coef * v) / 100) * 10;
				}
				x.beginPath();
				x.moveTo(X(4), Y(sp(4, 4)));
				x.lineTo(X(42), Y(sp(42, 4)));
				x.lineTo(X(42), Y(sp(42, 5)));
				x.lineTo(X(4), Y(sp(4, 5)));
				x.closePath();
				x.fillStyle = "rgba(232,185,62,0.15)";
				x.fill();
				line(
					x,
					X(4),
					Y(sp(4, 4.5)),
					X(42),
					Y(sp(42, 4.5)),
					C.amber,
					1.5,
					[5, 4]
				);
				// scatter
				pts.forEach((p, i) => {
					var f = Math.sin(i * 78.233) * 43_758.5;
					f = f - Math.floor(f);
					x.fillStyle = "rgba(111,168,255,0.7)";
					x.beginPath();
					x.arc(X(p.v), Y(sp(p.v, 4 + f * 1.15)), 3.5, 0, 7);
					x.fill();
				});
				// your coin
				x.fillStyle = C.green;
				x.beginPath();
				x.arc(X(vol), Y(sp(vol, 4.5)), 7, 0, 7);
				x.fill();
				x.strokeStyle = C.green;
				x.lineWidth = 1;
				x.setLineDash([3, 3]);
				x.beginPath();
				x.moveTo(X(vol), y0);
				x.lineTo(X(vol), Y(sp(vol, 4.5)));
				x.stroke();
				x.setLineDash([]);
				var s = sp(vol, 4.5);
				document.getElementById("cal-s").textContent = s.toFixed(2) + "%";
				document.getElementById("cal-p").textContent =
					(s * 0.9).toFixed(2) + "%";
				document.getElementById("cal-read").textContent =
					vol < 10
						? "Calm major — quote tight, compete on queue"
						: vol < 22
							? "Mid-vol — the sweet spot for retail-scale quoting"
							: "Meme-coin regime — wide quotes, small size, hard barriers";
				document.getElementById("cal-v-v").textContent = vol + "%";
			}
			document.getElementById("cal-v").oninput = function () {
				vol = +this.value;
				draw();
			};
			draw();
			k.onResize(draw);
		})();
	};

	/* ================= CH16 KILL SWITCH ================= */
	figInit.ch16 = () => {
		var k = cv("cv-kill");
		if (!k) {
			return;
		}
		var T = 760,
			limit = 6.0,
			stream,
			toxic,
			idx,
			A,
			B,
			peakB,
			halted,
			halts,
			histA,
			histB,
			haltMask,
			mddA,
			mddB,
			peakA;
		function newStream() {
			stream = [];
			toxic = [];
			var left = 0,
				bleed = 0;
			for (var i = 0; i < T; i++) {
				if (left <= 0 && Math.random() < 0.008) {
					left = 30 + Math.round(Math.random() * 40);
					bleed = 0.35 + Math.random() * 0.5;
				}
				var d = 0.05 + (Math.random() - 0.5) * 0.06;
				if (left > 0) {
					d -= bleed * (0.6 + Math.random() * 0.8);
					left--;
					toxic.push(1);
				} else {
					toxic.push(0);
				}
				stream.push(d);
			}
		}
		function resetReplay() {
			idx = 0;
			A = 0;
			B = 0;
			peakA = 0;
			peakB = 0;
			halted = 0;
			halts = 0;
			mddA = 0;
			mddB = 0;
			histA = [];
			histB = [];
			haltMask = [];
		}
		newStream();
		resetReplay();
		function kick() {
			if (reduceMotion) {
				while (idx < T) {
					stepOnce();
				}
				draw();
			}
		}
		document.getElementById("kl-dd").oninput = function () {
			limit = +this.value / 10;
			document.getElementById("kl-dd-v").textContent = limit.toFixed(1);
			resetReplay();
			kick();
		};
		document.getElementById("kl-reset").onclick = () => {
			newStream();
			resetReplay();
			kick();
		};
		function stepOnce() {
			if (idx >= T) {
				return;
			}
			var d = stream[idx];
			A += d;
			if (A > peakA) {
				peakA = A;
			}
			if (peakA - A > mddA) {
				mddA = peakA - A;
			}
			if (halted > 0) {
				halted--;
				haltMask.push(1);
				if (halted === 0) {
					peakB = B;
				}
			} else {
				B += d;
				if (B > peakB) {
					peakB = B;
				}
				if (peakB - B > mddB) {
					mddB = peakB - B;
				}
				haltMask.push(0);
				if (peakB - B >= limit) {
					halted = 90;
					halts++;
				}
			}
			histA.push(A);
			histB.push(B);
			idx++;
		}
		function draw() {
			var x = k.ctx,
				W = k.W(),
				H = k.H();
			x.clearRect(0, 0, W, H);
			var n = histA.length;
			if (!n) {
				return;
			}
			var lo = 0,
				hi = 0;
			for (var i = 0; i < n; i++) {
				var a = histA[i],
					b = histB[i];
				if (a < lo) {
					lo = a;
				}
				if (b < lo) {
					lo = b;
				}
				if (a > hi) {
					hi = a;
				}
				if (b > hi) {
					hi = b;
				}
			}
			var pad = (hi - lo) * 0.1 + 0.5;
			lo -= pad;
			hi += pad;
			function Y(v) {
				return 14 + (1 - (v - lo) / (hi - lo)) * (H - 44);
			}
			function X(i) {
				return 46 + (i / (T - 1)) * (W - 66);
			}
			// toxic + halt bands
			for (var i2 = 0; i2 < n; i2++) {
				if (toxic[i2]) {
					x.fillStyle = "rgba(240,138,126,0.10)";
					x.fillRect(X(i2), 14, Math.max(1, X(1) - X(0)), H - 44);
				}
				if (haltMask[i2]) {
					x.fillStyle = "rgba(232,185,62,0.14)";
					x.fillRect(X(i2), 14, Math.max(1, X(1) - X(0)), H - 44);
				}
			}
			for (var g = 0; g < 4; g++) {
				var gy = 14 + (g * (H - 44)) / 3;
				line(x, 46, gy, W - 20, gy, C.grid, 1);
				x.fillStyle = C.dim;
				x.font = "9px IBM Plex Mono";
				x.fillText((hi - ((hi - lo) * g) / 3).toFixed(0), 10, gy + 3);
			}
			if (lo < 0 && hi > 0) {
				line(x, 46, Y(0), W - 20, Y(0), C.dim, 1, [2, 4]);
			}
			x.globalAlpha = 0.75;
			x.strokeStyle = C.red;
			x.lineWidth = 1.2;
			x.beginPath();
			for (var i3 = 0; i3 < n; i3++) {
				i3 ? x.lineTo(X(i3), Y(histA[i3])) : x.moveTo(X(i3), Y(histA[i3]));
			}
			x.stroke();
			x.globalAlpha = 1;
			x.strokeStyle = C.green;
			x.lineWidth = 1.8;
			x.beginPath();
			for (var i4 = 0; i4 < n; i4++) {
				i4 ? x.lineTo(X(i4), Y(histB[i4])) : x.moveTo(X(i4), Y(histB[i4]));
			}
			x.stroke();
			x.font = "10px IBM Plex Mono";
			x.fillStyle = C.red;
			x.fillText("no kill switch", W - 220, 18);
			x.fillStyle = C.green;
			x.fillText("kill switch @ " + limit.toFixed(1), W - 120, 18);
			var ae = document.getElementById("kl-a");
			ae.textContent = A.toFixed(2);
			ae.className = "v " + (A >= 0 ? "pos" : "neg");
			var be = document.getElementById("kl-b");
			be.textContent = B.toFixed(2);
			be.className = "v " + (B >= 0 ? "pos" : "neg");
			document.getElementById("kl-mdd").textContent =
				mddA.toFixed(1) + " / " + mddB.toFixed(1);
			document.getElementById("kl-h").textContent = halts;
		}
		function loop() {
			if (alive && idx < T) {
				stepOnce();
				stepOnce();
				stepOnce();
				draw();
			}
			if (!reduceMotion && alive) {
				requestAnimationFrame(loop);
			}
		}
		if (reduceMotion) {
			while (idx < T) {
				stepOnce();
			}
			draw();
		} else {
			loop();
		}

		/* --- Triple barrier --- */
		(() => {
			var k2 = cv("cv-tb");
			if (!k2) {
				return;
			}
			var tp = 20,
				sl = 20,
				tl = 60,
				paths = [],
				stats = { tp: 0, sl: 0, tl: 0, pnl: 0, n: 0 };
			function newPath() {
				var T2 = Math.round((200 * tl) / 100),
					p = [0],
					v = 0;
				for (var i = 1; i <= 200; i++) {
					v = v * 0.9 + (Math.random() - 0.5) * 1.3;
					p.push(p[i - 1] + v);
				}
				// walk until a barrier
				var out = [],
					hit = "tl",
					hi = tp / 10,
					lo = -sl / 10,
					end = T2;
				for (var j = 0; j <= 200; j++) {
					out.push(p[j] * 0.32);
					if (out[j] >= hi) {
						hit = "tp";
						end = j;
						out[j] = hi;
						break;
					}
					if (out[j] <= lo) {
						hit = "sl";
						end = j;
						out[j] = lo;
						break;
					}
					if (j >= T2) {
						hit = "tl";
						end = j;
						break;
					}
				}
				return { pts: out, hit, end, final: out[out.length - 1] };
			}
			function runMany(n) {
				for (var i = 0; i < n; i++) {
					var r = newPath();
					stats[r.hit]++;
					stats.pnl += r.final;
					stats.n++;
					paths.push(r);
					if (paths.length > 14) {
						paths.shift();
					}
				}
				draw();
			}
			function reset() {
				paths = [];
				stats = { tp: 0, sl: 0, tl: 0, pnl: 0, n: 0 };
				runMany(6);
			}
			function draw() {
				var x = k2.ctx,
					W = k2.W(),
					H = k2.H();
				x.clearRect(0, 0, W, H);
				var x0 = 54,
					pw = W - 140,
					y0 = H / 2,
					scale = (H - 50) / 2;
				var hi = tp / 10,
					lo = -sl / 10,
					T2 = Math.round((200 * tl) / 100);
				function Y(v) {
					return y0 - ((v / (Math.max(hi, -lo) * 1.25)) * scale) / 1.6;
				}
				function X(i) {
					return x0 + (i / 200) * pw;
				}
				// barriers
				line(x, x0, Y(hi), X(T2), Y(hi), C.green, 2);
				line(x, x0, Y(lo), X(T2), Y(lo), C.red, 2);
				line(x, X(T2), Y(hi), X(T2), Y(lo), C.amber, 2);
				x.font = "10px IBM Plex Mono";
				x.fillStyle = C.green;
				x.fillText(
					"take-profit +" + (tp / 10).toFixed(1) + "%",
					x0 + 4,
					Y(hi) - 5
				);
				x.fillStyle = C.red;
				x.fillText(
					"stop-loss −" + (sl / 10).toFixed(1) + "%",
					x0 + 4,
					Y(lo) + 13
				);
				x.fillStyle = C.amber;
				x.fillText("time", X(T2) + 5, y0);
				line(x, x0, y0, X(T2), y0, C.grid, 1, [2, 4]);
				x.fillStyle = C.dim;
				x.fillText("entry", x0 - 44, y0 + 3);
				paths.forEach((r, pi) => {
					var last = pi === paths.length - 1;
					x.globalAlpha = last ? 1 : 0.25;
					x.strokeStyle =
						r.hit === "tp" ? C.green : r.hit === "sl" ? C.red : C.amber;
					x.lineWidth = last ? 1.8 : 1;
					x.beginPath();
					r.pts.forEach((v, i) => {
						i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v));
					});
					x.stroke();
					x.beginPath();
					x.arc(X(r.pts.length - 1), Y(r.final), last ? 5 : 3, 0, 7);
					x.fillStyle = x.strokeStyle;
					x.fill();
				});
				x.globalAlpha = 1;
				function pct(v) {
					return stats.n ? Math.round((100 * v) / stats.n) + "%" : "—";
				}
				document.getElementById("tb-ntp").textContent = pct(stats.tp);
				document.getElementById("tb-nsl").textContent = pct(stats.sl);
				document.getElementById("tb-ntl").textContent = pct(stats.tl);
				var avg = stats.n ? stats.pnl / stats.n : 0;
				var ea = document.getElementById("tb-avg");
				ea.textContent = (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";
				ea.className = "v " + (avg >= 0 ? "pos" : "neg");
			}
			document.getElementById("tb-tp").oninput = function () {
				tp = +this.value;
				document.getElementById("tb-tp-v").textContent =
					"+" + (tp / 10).toFixed(1) + "%";
				reset();
			};
			document.getElementById("tb-sl").oninput = function () {
				sl = +this.value;
				document.getElementById("tb-sl-v").textContent =
					"−" + (sl / 10).toFixed(1) + "%";
				reset();
			};
			document.getElementById("tb-tl").oninput = function () {
				tl = +this.value;
				document.getElementById("tb-tl-v").textContent = tl + "%";
				reset();
			};
			document.getElementById("tb-run").onclick = () => {
				runMany(100);
			};
			reset();
			k2.onResize(draw);
		})();
	};

	/* ================= CH19 GLOSSARY ================= */
	figInit.ch20 = () => {
		var q = document.getElementById("gl-q");
		if (!q) {
			return;
		}
		var items = [].slice.call(document.querySelectorAll("#gl-list .gl-item"));
		var count = document.getElementById("gl-n");
		function filter() {
			var s = q.value.trim().toLowerCase(),
				n = 0;
			items.forEach((it) => {
				var hit = !s || it.textContent.toLowerCase().indexOf(s) >= 0;
				it.style.display = hit ? "" : "none";
				if (hit) {
					n++;
				}
			});
			count.textContent =
				n +
				" of " +
				items.length +
				" terms" +
				(s ? " matching “" + q.value.trim() + "”" : "");
		}
		q.addEventListener("input", filter);
		filter();
	};

	if (figInit[key]) {
		figInit[key]();
	}
	requestAnimationFrame(refitVisibleFigures);

	return function cleanup() {
		alive = false;
		for (const id of __intervals) {
			clearInterval(id);
		}
		window.removeEventListener("resize", __onResize);
		window.removeEventListener("orientationchange", __onOrient);
	};
}
