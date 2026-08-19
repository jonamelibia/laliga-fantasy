<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();

  let selectedSeason = $state(data.seasonStats.length > 0 ? data.seasonStats[0].temporada : '');

  let currentStats = $derived(data.seasonStats.find(s => s.temporada === selectedSeason) ?? null);

  let totalPosiciones = $derived(() => {
    if (!currentStats) return { suma: 0, count: 0, media: 0 };
    let suma = 0;
    let count = 0;
    for (const r of currentStats.rankings) {
      suma += r.posicion;
      count++;
    }
    return { suma, count, media: count > 0 ? Math.round(suma / count * 10) / 10 : 0 };
  });
</script>

<svelte:head>
  <title>{data.profile?.displayName || data.jugador} - Estadísticas - Fantasy Liga</title>
</svelte:head>

<div class="page">
  {#if data.totalSeasons === 0}
    <div class="empty">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#777" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <p>Este jugador no tiene datos en ninguna temporada</p>
    </div>
  {:else}
    <!-- Header -->
    <header class="player-header">
      <div class="player-avatar">
        {#if data.profile?.photoUrl}
          <img src={data.profile.photoUrl} alt={data.jugador} />
        {:else}
          <span>{(data.profile?.displayName || data.jugador).charAt(0)}</span>
        {/if}
      </div>
      <div class="player-info">
        <h1>{data.profile?.displayName || data.jugador}</h1>
        <p>Estadísticas por temporada</p>
      </div>
    </header>

    <!-- Season Tabs -->
    <nav class="season-tabs">
      {#each data.seasonStats as season}
        <button
          class="season-tab"
          class:active={selectedSeason === season.temporada}
          onclick={() => selectedSeason = season.temporada}
        >
          {season.temporada}
        </button>
      {/each}
    </nav>

    {#if currentStats}
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card main">
          <span class="summary-value">{currentStats.totalPuntos}</span>
          <span class="summary-label">Puntos Totales</span>
        </div>
        <div class="summary-card">
          <span class="summary-value">{currentStats.avgPuntos}</span>
          <span class="summary-label">Media / Jornada</span>
        </div>
        <div class="summary-card">
          <span class="summary-value">#{totalPosiciones().media}</span>
          <span class="summary-label">Posición Media</span>
        </div>
        <div class="summary-card">
          <span class="summary-value">{currentStats.jornadasPlayed}</span>
          <span class="summary-label">Jornadas</span>
        </div>
        <div class="summary-card">
          <span class="summary-value multa">{currentStats.totalMulta}€</span>
          <span class="summary-label">Multas Totales</span>
        </div>
      </div>

      <!-- Best / Worst -->
      <div class="highlight-row">
        {#if currentStats.bestJornada.num > 0}
          <div class="highlight-card best">
            <div class="highlight-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#E30613" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <div class="highlight-text">
              <span class="highlight-num">{currentStats.bestJornada.puntos} pts</span>
              <span class="highlight-desc">Mejor Jornada — J{currentStats.bestJornada.num}</span>
            </div>
          </div>
        {/if}
        {#if currentStats.worstJornada.num > 0}
          <div class="highlight-card worst">
            <div class="highlight-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m15 9-6 6"/>
                <path d="m9 9 6 6"/>
              </svg>
            </div>
            <div class="highlight-text">
              <span class="highlight-num">{currentStats.worstJornada.puntos} pts</span>
              <span class="highlight-desc">Peor Jornada — J{currentStats.worstJornada.num}</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Journey Table -->
      {#if currentStats.rankings.length > 0}
        <div class="table-card">
          <h2>Detalle por Jornada</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jornada</th>
                  <th>Puntos</th>
                  <th>Posición</th>
                  <th>Multa</th>
                </tr>
              </thead>
              <tbody>
                {#each currentStats.rankings as r}
                  <tr>
                    <td class="j-num">J{r.numJornada}</td>
                    <td class="j-pts">{r.puntos}</td>
                    <td>
                      <span
                        class="pos-badge"
                        class:pos-1={r.posicion === 1}
                        class:pos-top3={r.posicion >= 2 && r.posicion <= 3}
                      >
                        #{r.posicion}
                      </span>
                    </td>
                    <td class="j-multa">{r.multa > 0 ? `${r.multa}€` : '—'}</td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr>
                  <td class="j-total">Total</td>
                  <td class="j-pts">{currentStats.totalPuntos}</td>
                  <td></td>
                  <td class="j-multa">{currentStats.totalMulta > 0 ? `${currentStats.totalMulta}€` : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    background: #080808;
    min-height: 100vh;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
    color: #777;
    font-size: 15px;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }

  .player-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 32px;
  }

  .player-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    padding: 3px;
    background: conic-gradient(from 0deg, #AA151B, #6b0f12, rgba(170,21,27,0.3), #6b0f12, #AA151B);
    flex-shrink: 0;
  }

  .player-avatar img,
  .player-avatar span {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #121212;
  }

  .player-avatar img {
    object-fit: cover;
  }

  .player-avatar span {
    background: linear-gradient(135deg, #AA151B, #6b0f12);
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    font-family: 'Oswald', system-ui, sans-serif;
  }

  .player-info h1 {
    margin: 0;
    font-family: 'Oswald', system-ui, sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .player-info p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #777;
  }

  .season-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 32px;
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
  }

  .season-tab {
    flex-shrink: 0;
    padding: 8px 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(18,18,18,0.8);
    color: #aaa;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  .season-tab:hover {
    border-color: rgba(255,255,255,0.18);
    color: #fff;
  }

  .season-tab.active {
    background: #AA151B;
    border-color: #AA151B;
    color: #fff;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .summary-card {
    background: rgba(18,18,18,0.8);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 10px;
    padding: 18px 14px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .summary-card.main {
    border-color: rgba(170,21,27,0.3);
    background: rgba(170,21,27,0.06);
  }

  .summary-value {
    font-family: 'Oswald', system-ui, sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #E30613;
    line-height: 1;
  }

  .summary-card.main .summary-value {
    font-size: 32px;
  }

  .summary-value.multa {
    color: #aaa;
  }

  .summary-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #777;
  }

  .highlight-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 28px;
  }

  .highlight-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 10px;
    background: rgba(18,18,18,0.8);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .highlight-card.best {
    border-color: rgba(170,21,27,0.25);
  }

  .highlight-card.worst {
    border-color: rgba(255,255,255,0.06);
  }

  .highlight-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: rgba(170,21,27,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .highlight-num {
    font-family: 'Oswald', system-ui, sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    display: block;
  }

  .highlight-desc {
    font-size: 12px;
    color: #777;
  }

  .table-card {
    background: rgba(18,18,18,0.8);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
    overflow: hidden;
  }

  .table-card h2 {
    margin: 0;
    padding: 16px 20px;
    font-family: 'Oswald', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #E30613;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(170,21,27,0.04);
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    padding: 10px 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #555;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  td {
    padding: 10px 20px;
    font-size: 14px;
    color: #ccc;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  tr:last-child td {
    border-bottom: none;
  }

  tfoot td {
    border-top: 1px solid rgba(255,255,255,0.10);
    border-bottom: none;
    font-weight: 700;
    color: #fff;
  }

  .j-num {
    font-weight: 600;
    color: #fff;
  }

  .j-pts {
    font-family: 'Oswald', system-ui, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #E30613;
  }

  .j-multa {
    color: #aaa;
  }

  .j-total {
    font-family: 'Oswald', system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #777;
    font-size: 12px;
  }

  .pos-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Oswald', system-ui, sans-serif;
  }

  .pos-1 {
    background: #AA151B;
    color: #fff;
  }

  .pos-top3 {
    border: 1px solid #AA151B;
    color: #E30613;
  }

  @media (max-width: 768px) {
    .page {
      padding: 24px 16px 60px;
    }

    .player-header {
      flex-direction: column;
      text-align: center;
    }

    .player-info h1 {
      font-size: 26px;
    }

    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .summary-card.main {
      grid-column: 1 / -1;
    }

    .highlight-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .player-header {
      gap: 16px;
    }

    .player-avatar-ring {
      width: 80px;
      height: 80px;
    }

    .player-info h1 {
      font-size: 22px;
    }

    .summary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .summary-card {
      padding: 14px 10px;
    }

    .summary-value {
      font-size: 22px;
    }

    .summary-value.main {
      font-size: 26px;
    }

    .highlight-row {
      gap: 10px;
    }

    .highlight-card {
      padding: 14px 12px;
    }

    .highlight-num {
      font-size: 18px;
    }

    .table th,
    .table td {
      padding: 8px 10px;
      font-size: 13px;
    }

    .season-tabs {
      gap: 6px;
    }

    .season-tab {
      padding: 6px 12px;
      font-size: 13px;
    }
  }
</style>
