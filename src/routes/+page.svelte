<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import Chart from 'chart.js/auto';

  let { data } = $props<{ data: PageData }>();
  let chartsInitialized = $state(false);

  const COLORS = ['#E30613', '#FFD700', '#1E90FF', '#32CD32', '#FF69B4', '#FF4500', '#00CED1', '#FF8C00'];

  function getColor(idx: number) {
    return COLORS[idx % COLORS.length];
  }

  onMount(() => {
    if (chartsInitialized) return;
    chartsInitialized = true;

    const labels = data.jornadas.map(j => `J${j}`);

    Chart.defaults.color = '#AAAAAA';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

    createChart('chart-evolution', {
      type: 'line',
      data: {
        labels,
        datasets: data.jugadores.map((j, i) => ({
          label: j,
          data: data.evolutionData[j],
          borderColor: getColor(i),
          backgroundColor: getColor(i) + '20',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Evolución de Puntos por Jornada', font: { size: 14, weight: 'bold', family: "'Oswald', sans-serif" }, color: '#E30613' },
          legend: { labels: { color: '#AAAAAA', usePointStyle: true, pointStyle: 'circle', padding: 16 } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Puntos' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          x: { grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });

    createChart('chart-cumulative', {
      type: 'line',
      data: {
        labels,
        datasets: data.jugadores.map((j, i) => ({
          label: j,
          data: data.cumulativeData[j],
          borderColor: getColor(i),
          backgroundColor: getColor(i) + '20',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Puntos Acumulados', font: { size: 14, weight: 'bold', family: "'Oswald', sans-serif" }, color: '#E30613' },
          legend: { labels: { color: '#AAAAAA', usePointStyle: true, pointStyle: 'circle', padding: 16 } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Puntos Acumulados' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          x: { grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });

    createChart('chart-positions', {
      type: 'line',
      data: {
        labels,
        datasets: data.jugadores.map((j, i) => ({
          label: j,
          data: data.positionData[j],
          borderColor: getColor(i),
          backgroundColor: getColor(i) + '20',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Posición por Jornada', font: { size: 14, weight: 'bold', family: "'Oswald', sans-serif" }, color: '#E30613' },
          legend: { labels: { color: '#AAAAAA', usePointStyle: true, pointStyle: 'circle', padding: 16 } }
        },
        scales: {
          y: {
            reverse: true,
            beginAtZero: false,
            title: { display: true, text: 'Posición' },
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          x: { grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });

    createChart('chart-fines', {
      type: 'bar',
      data: {
        labels,
        datasets: data.jugadores.map((j, i) => ({
          label: j,
          data: data.finesData[j],
          backgroundColor: getColor(i) + 'CC',
          borderColor: getColor(i),
          borderWidth: 1,
          borderRadius: 4
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Multas por Jornada (€)', font: { size: 14, weight: 'bold', family: "'Oswald', sans-serif" }, color: '#E30613' },
          legend: { labels: { color: '#AAAAAA', usePointStyle: true, pointStyle: 'circle', padding: 16 } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '€' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });

    createChart('chart-box', {
      type: 'bar',
      data: {
        labels: data.jugadores,
        datasets: [{
          label: 'Puntos por Jornada',
          data: data.jugadores.map(j => {
            const vals = data.evolutionData[j];
            return vals.reduce((a, b) => a + b, 0) / vals.length;
          }),
          backgroundColor: data.jugadores.map((_, i) => getColor(i) + 'CC'),
          borderColor: data.jugadores.map((_, i) => getColor(i)),
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Media de Puntos por Jugador', font: { size: 14, weight: 'bold', family: "'Oswald', sans-serif" }, color: '#E30613' },
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Media Puntos' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
  });

  function createChart(canvasId: string, config: any) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    new Chart(canvas, config);
  }
</script>

<svelte:head>
  <title>Fantasy Liga - La Liga Fantasy</title>
</svelte:head>

{#if data.maxJornada > 0}

  <!-- ═══════════════ HERO ═══════════════ -->
  <section class="hero">
    <div class="hero-bg-circle hero-circle-1"></div>
    <div class="hero-bg-circle hero-circle-2"></div>

    <div class="hero-ball">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ballGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1.5"/>
        <circle cx="100" cy="100" r="90" fill="url(#ballGrad)"/>
        <path d="M100 10 L130 40 L115 75 L85 75 L70 40 Z" fill="none" stroke="rgba(227,6,19,0.25)" stroke-width="1"/>
        <path d="M190 100 L160 130 L125 115 L125 85 L160 70 Z" fill="none" stroke="rgba(227,6,19,0.15)" stroke-width="1"/>
        <path d="M100 190 L70 160 L85 125 L115 125 L130 160 Z" fill="none" stroke="rgba(227,6,19,0.25)" stroke-width="1"/>
        <path d="M10 100 L40 70 L75 85 L75 115 L40 130 Z" fill="none" stroke="rgba(227,6,19,0.15)" stroke-width="1"/>
        <line x1="100" y1="10" x2="100" y2="40" stroke="rgba(255,255,255,0.06)" stroke-width="0.8"/>
        <line x1="190" y1="100" x2="160" y2="100" stroke="rgba(255,255,255,0.06)" stroke-width="0.8"/>
        <line x1="100" y1="190" x2="100" y2="160" stroke="rgba(255,255,255,0.06)" stroke-width="0.8"/>
        <line x1="10" y1="100" x2="40" y2="100" stroke="rgba(255,255,255,0.06)" stroke-width="0.8"/>
      </svg>
    </div>

    <div class="hero-light hero-light-1"></div>
    <div class="hero-light hero-light-2"></div>

    <div class="hero-content">
      <span class="eyebrow">La Liga Fantasy</span>
      <h1 class="hero-title">
        <span class="hero-title-white">Fantasy</span>
        <span class="hero-title-red">Liga</span>
      </h1>

      <div class="season-bar">
        <select
          class="season-select"
          onchange={(e) => { const val = (e.target as HTMLSelectElement).value; goto(`/?t=${val}`); }}
        >
          {#each data.temporadas as t}
            <option value={t} selected={t === data.temporada}>{t}</option>
          {/each}
        </select>
        <div class="season-line"></div>
        <span class="season-label">Temporada {data.temporada}</span>
      </div>

      <div class="scroll-indicator">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>
  </section>

  <!-- ═══════════════ STANDINGS ═══════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Clasificación</h2>
        <div class="section-line"></div>
      </div>

      <div class="standings">
        {#each data.clasificacion as player, i}
          <div class="standing-row" class:top3={i < 3}>
            <div class="rank" class:rank-top={i < 3}>
              {i + 1}
            </div>
            <div class="standing-avatar" style:border-color={getColor(i)}>
              {#if player.photoUrl}
                <img src={player.photoUrl} alt="" />
              {:else}
                <span>{player.jugador.charAt(0)}</span>
              {/if}
            </div>
            <div class="standing-info">
              <a href="/stats/{encodeURIComponent(player.jugador)}" class="standing-name">{player.jugador}</a>
              <span class="standing-meta">{player.jornadasPlayed} jornadas · Media {player.avgPuntos}</span>
            </div>
            <div class="standing-right">
              <div class="standing-multa" class:has-multa={player.totalMulta > 0}>{player.totalMulta}€</div>
              <div class="standing-points">{player.totalPuntos}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ═══════════════ STATS ═══════════════ -->
  <section class="section section-dark">
    <div class="container">
      <div class="stats-row">
        {#if data.bestJornada.jugador}
          <div class="stat-card stat-good">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E30613" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <div>
              <div class="stat-value">{data.bestJornada.puntos} pts</div>
              <div class="stat-label">Mejor Jornada — {data.bestJornada.jugador} (J{data.bestJornada.numJornada})</div>
            </div>
          </div>
        {/if}
        {#if data.worstJornada.jugador && data.worstJornada.puntos < Infinity}
          <div class="stat-card stat-bad">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E30613" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m15 9-6 6"/>
                <path d="m9 9 6 6"/>
              </svg>
            </div>
            <div>
              <div class="stat-value">{data.worstJornada.puntos} pts</div>
              <div class="stat-label">Peor Jornada — {data.worstJornada.jugador} (J{data.worstJornada.numJornada})</div>
            </div>
          </div>
        {/if}
      </div>

      <div class="kpi-row">
        {#each data.clasificacion as player, i}
          <div class="kpi-mini">
            <div class="kpi-mini-top" style:color={getColor(i)}>
              {player.totalPuntos}
            </div>
            <div class="kpi-mini-name">{player.jugador}</div>
            <div class="kpi-mini-avg">{player.avgPuntos} pts/j</div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ═══════════════ CHARTS ═══════════════ -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Estadísticas</h2>
        <div class="section-line"></div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <canvas id="chart-evolution"></canvas>
        </div>
        <div class="chart-card">
          <canvas id="chart-cumulative"></canvas>
        </div>
        <div class="chart-card">
          <canvas id="chart-positions"></canvas>
        </div>
        <div class="chart-card">
          <canvas id="chart-fines"></canvas>
        </div>
        <div class="chart-card chart-full">
          <canvas id="chart-box"></canvas>
        </div>
      </div>
    </div>
  </section>

{:else}

  <!-- ═══════════════ EMPTY STATE ═══════════════ -->
  <section class="empty-section">
    <div class="empty-circle">0</div>
    <h2 class="empty-title">Sin Datos</h2>
    <p class="empty-text">Las puntuaciones aparecerán aquí cuando se registren jornadas.</p>
    <a href="/admin" class="empty-btn">Ir a Admin</a>
  </section>

{/if}

<style>
  /* ════════════════════════════════════════════════
     HERO
     ════════════════════════════════════════════════ */

  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #080808;
    overflow: hidden;
  }

  .hero-bg-circle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .hero-circle-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(170, 21, 27, 0.05) 0%, transparent 70%);
    top: -100px;
    right: -150px;
  }

  .hero-circle-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(170, 21, 27, 0.04) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
  }

  .hero-ball {
    position: absolute;
    width: clamp(280px, 40vw, 500px);
    height: clamp(280px, 40vw, 500px);
    opacity: 0.6;
    animation: ballFloat 8s ease-in-out infinite, ballSpin 30s linear infinite;
    pointer-events: none;
  }

  @keyframes ballFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes ballSpin {
    from { rotate: 0deg; }
    to { rotate: 360deg; }
  }

  .hero-light {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80px);
  }

  .hero-light-1 {
    width: 300px;
    height: 300px;
    background: rgba(227, 6, 19, 0.08);
    top: 20%;
    left: 15%;
    animation: lightPulse 6s ease-in-out infinite;
  }

  .hero-light-2 {
    width: 250px;
    height: 250px;
    background: rgba(255, 215, 0, 0.05);
    bottom: 20%;
    right: 15%;
    animation: lightPulse 6s ease-in-out infinite 3s;
  }

  @keyframes lightPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  .hero-content {
    position: relative;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .eyebrow {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #E30613;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 16px;
  }

  .hero-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 0.9;
    margin: 0;
  }

  .hero-title-white {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: clamp(4rem, 14vw, 12rem);
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.03em;
    text-transform: uppercase;
  }

  .hero-title-red {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: clamp(4rem, 14vw, 12rem);
    font-weight: 900;
    color: #E30613;
    letter-spacing: -0.03em;
    text-transform: uppercase;
  }

  .season-bar {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .season-select {
    background: rgba(18, 18, 18, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    color: #fff;
    padding: 8px 16px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }

  .season-select:hover {
    border-color: rgba(255, 255, 255, 0.12);
  }

  .season-select:focus {
    border-color: #E30613;
    box-shadow: 0 0 0 3px rgba(170, 21, 27, 0.3);
  }

  .season-select option {
    background: #121212;
    color: #fff;
  }

  .season-line {
    width: 40px;
    height: 2px;
    background: #AA151B;
    border-radius: 1px;
  }

  .season-label {
    font-size: 13px;
    color: #888;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .scroll-indicator {
    position: absolute;
    bottom: -120px;
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  /* ════════════════════════════════════════════════
     SECTIONS
     ════════════════════════════════════════════════ */

  .section {
    padding: 80px 0;
  }

  .section-dark {
    background: #0a0a0a;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 32px;
  }

  .section-header {
    margin-bottom: 48px;
  }

  .section-title {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin: 0 0 12px;
  }

  .section-line {
    width: 48px;
    height: 3px;
    background: #E30613;
    border-radius: 2px;
  }

  /* ════════════════════════════════════════════════
     STANDINGS
     ════════════════════════════════════════════════ */

  .standings {
    display: flex;
    flex-direction: column;
  }

  .standing-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition: background 0.2s;
  }

  .standing-row:hover {
    background: rgba(170, 21, 27, 0.04);
  }

  .standing-row:last-child {
    border-bottom: none;
  }

  .standing-row.top3 {
    padding: 20px 0;
  }

  .rank {
    width: 36px;
    text-align: center;
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #888;
    flex-shrink: 0;
  }

  .rank-top {
    font-size: 22px;
    color: #E30613;
  }

  .standing-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
  }

  .standing-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .standing-avatar span {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #fff;
  }

  .standing-info {
    flex: 1;
    min-width: 0;
  }

  .standing-name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    transition: color 0.2s;
  }

  .standing-name:hover {
    color: var(--red, #E30613);
  }

  .standing-meta {
    font-size: 12px;
    color: #888;
  }

  .standing-points {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #E30613;
    text-align: right;
  }

  .standing-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    min-width: 60px;
    gap: 2px;
  }

  .standing-multa {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    transition: color 0.2s;
  }

  .standing-multa.has-multa {
    color: #E30613;
  }

  /* ════════════════════════════════════════════════
     STATS
     ════════════════════════════════════════════════ */

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(18, 18, 18, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 20px;
  }

  .stat-good {
    border-color: rgba(170, 21, 27, 0.2);
  }

  .stat-bad {
    border-color: rgba(255, 255, 255, 0.06);
  }

  .stat-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(170, 21, 27, 0.08);
    border-radius: 12px;
  }

  .stat-value {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
  }

  .stat-label {
    font-size: 13px;
    color: #888;
    margin-top: 2px;
  }

  .kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .kpi-mini {
    background: rgba(18, 18, 18, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    transition: border-color 0.2s;
  }

  .kpi-mini:hover {
    border-color: rgba(255, 255, 255, 0.12);
  }

  .kpi-mini-top {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .kpi-mini-name {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    margin-top: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kpi-mini-avg {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
  }

  /* ════════════════════════════════════════════════
     CHARTS
     ════════════════════════════════════════════════ */

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .chart-card {
    background: rgba(18, 18, 18, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 20px;
    height: 360px;
    transition: border-color 0.2s;
  }

  .chart-card:hover {
    border-color: rgba(255, 255, 255, 0.12);
  }

  .chart-full {
    grid-column: 1 / -1;
  }

  /* ════════════════════════════════════════════════
     EMPTY STATE
     ════════════════════════════════════════════════ */

  .empty-section {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 64px 24px;
    background: #080808;
  }

  .empty-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid rgba(170, 21, 27, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 48px;
    font-weight: 900;
    color: #E30613;
    margin-bottom: 24px;
    background: rgba(170, 21, 27, 0.05);
  }

  .empty-title {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 8px;
  }

  .empty-text {
    font-size: 14px;
    color: #888;
    margin: 0 0 24px;
  }

  .empty-btn {
    display: inline-flex;
    align-items: center;
    padding: 12px 28px;
    background: #AA151B;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
  }

  .empty-btn:hover {
    background: #E30613;
    box-shadow: 0 4px 20px rgba(170, 21, 27, 0.3);
    color: #fff;
  }

  /* ════════════════════════════════════════════════
     RESPONSIVE
     ════════════════════════════════════════════════ */

  @media (max-width: 768px) {
    .section {
      padding: 48px 0;
    }

    .container {
      padding: 0 16px;
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }

    .standing-avatar {
      width: 36px;
      height: 36px;
    }

    .standing-points {
      font-size: 20px;
    }

    .kpi-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

@media (max-width: 480px) {
  .section {
    padding: 40px 0;
  }

  .section-header {
    margin-bottom: 24px;
  }

  .standing-avatar {
    width: 30px;
    height: 30px;
  }

  .standing-points {
    min-width: 48px;
    font-size: 16px;
  }

  .rank {
    width: 28px;
    font-size: 13px;
  }

  .kpi-row {
    grid-template-columns: 1fr;
  }

  .chart-card {
    height: 280px;
    padding: 14px;
  }

  .chart-card h3 {
    font-size: 14px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-card {
    padding: 16px;
  }

  .empty-circle {
    width: 90px;
    height: 90px;
  }

  .empty-circle span {
    font-size: 36px;
  }

  .empty-title {
    font-size: 26px;
  }

  .season-bar {
    margin-top: 28px;
  }
}
</style>
