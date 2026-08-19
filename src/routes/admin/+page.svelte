<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let localScores = $state<Record<string, Record<number, number>>>({});
  $effect(() => { localScores = JSON.parse(JSON.stringify(data.scores)); });
  let hasChanges = $state(false);
  let saving = $state(false);
  let showAddPlayer = $state(false);
  let showCreateSeason = $state(false);
  let newSeasonName = $state('');
  let newPlayerName = $state('');
  let newPlayerDisplay = $state('');
  let newPlayerPass = $state('');
  let selectedJornadas = $state<number[]>([]);
  let lastMessage = $state<{ type: string; text: string } | null>(null);

  const jugadores = $derived(Object.keys(localScores));
  const jornadas = $derived(data.jornadas || []);
  const allJornadas = $derived(Array.from({ length: 38 }, (_, i) => i + 1));
  const filteredJornadas = $derived(selectedJornadas.length > 0 ? jornadas.filter(j => selectedJornadas.includes(j)) : jornadas);

  function updateScore(jugador: string, jornada: number, value: string) {
    const num = parseFloat(value) || 0;
    if (!localScores[jugador]) localScores[jugador] = {};
    localScores[jugador][jornada] = num;
    hasChanges = true;
  }

  function addNewJornada(num: number) {
    if (!localScores || jornadas.includes(num)) return;
    for (const jugador of jugadores) {
      if (!localScores[jugador]) localScores[jugador] = {};
      localScores[jugador][num] = 0;
    }
    hasChanges = true;
  }

  function removeJornada(num: number) {
    for (const jugador of jugadores) {
      if (localScores[jugador]) {
        delete localScores[jugador][num];
      }
    }
    hasChanges = true;
  }

  function duplicateJornada(sourceNum: number, targetNum: number) {
    for (const jugador of jugadores) {
      if (localScores[jugador]) {
        localScores[jugador][targetNum] = localScores[jugador][sourceNum] || 0;
      }
    }
    hasChanges = true;
  }

  function getRanking(jornada: number) {
    const scores: Record<string, number> = {};
    for (const j of jugadores) {
      scores[j] = localScores[j]?.[jornada] ?? 0;
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const ranked: { jugador: string; puntos: number; posicion: number; multa: number }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      ranked.push({ jugador: sorted[i][0], puntos: sorted[i][1], posicion: 0, multa: 0 });
    }
    let pos = 1;
    let i = 0;
    while (i < ranked.length) {
      let j = i;
      while (j < ranked.length && ranked[j].puntos === ranked[i].puntos) j++;
      const worstOrdinal = j;
      const multa = worstOrdinal <= 3 ? 0 : worstOrdinal - 3;
      for (let k = i; k < j; k++) {
        ranked[k].posicion = pos;
        ranked[k].multa = multa;
      }
      pos = j + 1;
      i = j;
    }
    return ranked;
  }

  function getCellColor(jugador: string, jornada: number) {
    const ranking = getRanking(jornada);
    const rank = ranking.find(r => r.jugador === jugador);
    if (!rank) return '';
    if (rank.posicion === 1) return 'cell-gold';
    if (rank.posicion === 2) return 'cell-silver';
    if (rank.posicion === 3) return 'cell-bronze';
    if (rank.posicion >= 4) return 'cell-fine';
    return '';
  }

  function handleSave() {
    saving = true;
    const formEl = document.getElementById('save-form') as HTMLFormElement;
    if (formEl) {
      const input = formEl.querySelector('input[name="scores"]') as HTMLInputElement;
      input.value = JSON.stringify(localScores);
      formEl.requestSubmit();
    }
  }

  async function handleBulkUpdate() {
    if (selectedJornadas.length === 0) return;
    const scoresJson = JSON.stringify(localScores);
    const formData = new FormData();
    formData.append('scores', scoresJson);

    saving = true;
    try {
      const response = await fetch('?/updateScores', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.type === 'success') {
        hasChanges = false;
        lastMessage = { type: 'success', message: 'Puntuaciones guardadas correctamente' };
        await invalidateAll();
      } else {
        lastMessage = { type: 'error', message: result.data?.error || 'Error al guardar' };
      }
    } catch {
      lastMessage = { type: 'error', message: 'Error de conexión' };
    }
    saving = false;
  }

  function toggleJornada(num: number) {
    if (selectedJornadas.includes(num)) {
      selectedJornadas = selectedJornadas.filter(j => j !== num);
    } else {
      selectedJornadas = [...selectedJornadas, num];
    }
  }

  function selectAllJornadas() {
    selectedJornadas = [...jornadas];
  }

  function clearSelection() {
    selectedJornadas = [];
  }

  let migrating = $state(false);
  let migrationDone = $state(data.jugadores.length > 0);

  async function runMigration() {
    if (!confirm('Esto leerá los datos del formato antiguo y los convertirá al formato matriz. ¿Continuar?')) return;
    migrating = true;
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: data.temporada })
      });
      const data2 = await res.json();
      if (data2.success) {
        lastMessage = { type: 'success', text: `Migración completada: ${data2.jugadores} jugadores, ${data2.jornadas} jornadas, ${data2.records} registros` };
        migrationDone = true;
        await invalidateAll();
      } else {
        lastMessage = { type: 'error', text: data2.error || 'No se encontraron datos en el formato antiguo' };
      }
    } catch {
      lastMessage = { type: 'error', text: 'Error al conectar con el servidor' };
    }
    migrating = false;
  }

  $effect(() => {
    if (form?.success) {
      hasChanges = false;
      saving = false;
      lastMessage = { type: 'success', text: form.message || 'Guardado' };
      setTimeout(() => { lastMessage = null; }, 3000);
    } else if (form?.error) {
      saving = false;
      lastMessage = { type: 'error', text: form.error };
      setTimeout(() => { lastMessage = null; }, 5000);
    }
  });
</script>

<svelte:head>
  <title>Admin - Fantasy Liga</title>
</svelte:head>

<div class="page">
  <header class="page-header">
    <div class="header-left">
      <h1>Panel de Administración</h1>
      <p class="subtitle">Gestiona puntuaciones, jugadores y temporadas</p>
      <div class="season-bar">
        <label class="label" for="admin-season">Temporada</label>
        <select
          id="admin-season"
          class="input season-select"
          onchange={(e) => { const val = (e.target as HTMLSelectElement).value; goto(`/admin?t=${val}`); }}
        >
          {#each data.temporadas as t}
            <option value={t} selected={t === data.temporada}>{t}</option>
          {/each}
        </select>
        <button class="btn btn-outline btn-sm" onclick={() => showCreateSeason = !showCreateSeason}>
          + Temporada
        </button>
      </div>
    </div>
    <div class="header-right">
      <a href="/admin/users" class="btn btn-outline btn-sm">Usuarios</a>
      {#if !migrationDone}
        <button class="btn btn-outline btn-sm" onclick={runMigration} disabled={migrating}>
          {migrating ? 'Migrando...' : 'Migrar datos'}
        </button>
      {/if}
      <button class="btn btn-outline btn-sm" onclick={() => showAddPlayer = !showAddPlayer}>
        + Jugador
      </button>
    </div>
  </header>

  {#if lastMessage}
    <div class="toast toast-{lastMessage.type}">
      <span class="toast-icon">{lastMessage.type === 'success' ? '✓' : '⚠'}</span>
      {lastMessage.text || lastMessage.message}
    </div>
  {/if}

  {#if showCreateSeason}
    <div class="card">
      <h3 class="card-title">Crear Nueva Temporada</h3>
      <p class="card-hint">Formato: Año corto, ej: 25-26 para la temporada 2025-2026</p>
      <form
        method="POST"
        action="?/createSeason"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              showCreateSeason = false;
              newSeasonName = '';
              await invalidateAll();
            }
          };
        }}
      >
        <div class="form-row">
          <div class="form-group">
            <label class="label" for="nuevaTemporada">Nombre</label>
            <input type="text" name="nuevaTemporada" id="nuevaTemporada" class="input" bind:value={newSeasonName} placeholder="25-26 o 2025-2026" required />
          </div>
          <div class="form-group form-actions">
            <button type="submit" class="btn btn-primary">Crear</button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  {#if showAddPlayer}
    <div class="card">
      <h3 class="card-title">Añadir Jugador</h3>
      <form
        method="POST"
        action="?/addJugador"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              showAddPlayer = false;
              newPlayerName = '';
              newPlayerDisplay = '';
              newPlayerPass = '';
              await invalidateAll();
            }
          };
        }}
      >
        <div class="form-row">
          <div class="form-group">
            <label class="label" for="nombre">Nombre (ID)</label>
            <input type="text" name="nombre" id="nombre" class="input" bind:value={newPlayerName} placeholder="Ej: NuevoJugador" required />
          </div>
          <div class="form-group">
            <label class="label" for="displayName">Nombre Visible</label>
            <input type="text" name="displayName" id="displayName" class="input" bind:value={newPlayerDisplay} placeholder="Nombre para mostrar" />
          </div>
          <div class="form-group">
            <label class="label" for="password">Contraseña</label>
            <input type="text" name="password" id="password" class="input" bind:value={newPlayerPass} placeholder="1234" />
          </div>
          <div class="form-group form-actions">
            <button type="submit" class="btn btn-primary">Añadir</button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  <div class="toolbar-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="label">Jornadas</span>
        <div class="jornada-chips">
          {#each jornadas as j}
            <button
              class="chip"
              class:selected={selectedJornadas.includes(j)}
              onclick={() => toggleJornada(j)}
            >
              J{j}
            </button>
          {/each}
        </div>
        <button class="btn btn-outline btn-xs" onclick={selectAllJornadas}>Todas</button>
        <button class="btn btn-outline btn-xs" onclick={clearSelection}>Ninguna</button>
      </div>
      <div class="toolbar-right">
        <button
          class="btn btn-primary"
          disabled={!hasChanges || saving}
          onclick={handleSave}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  </div>

  <form id="save-form" method="POST" action="?/updateScores" use:enhance style="display: none;">
    <input type="hidden" name="scores" value="" />
  </form>

  <div class="matrix-wrapper">
    <table class="matrix-table">
      <thead>
        <tr>
          <th class="sticky-col player-header">JUGADOR</th>
          {#each filteredJornadas as j}
            <th class="jornada-header">
              <div class="jornada-th">
                <span>J{j}</span>
                <button class="remove-btn" onclick={() => removeJornada(j)} title="Eliminar jornada">&times;</button>
              </div>
            </th>
          {/each}
          <th class="add-col">
            <select class="jornada-add" onchange={(e) => { addNewJornada(parseInt((e.target as HTMLSelectElement).value)); (e.target as HTMLSelectElement).value = ''; }}>
              <option value="">+J</option>
              {#each allJornadas.filter(j => !jornadas.includes(j)) as j}
                <option value={j}>J{j}</option>
              {/each}
            </select>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each jugadores as jugador, idx}
          <tr>
            <td class="sticky-col player-name-cell">
              <span class="player-dot" style="background: {['#E30613','#888','#555','#E30613','#888','#555'][idx % 6]}"></span>
              {jugador}
            </td>
            {#each filteredJornadas as j}
              <td class="score-cell {getCellColor(jugador, j)}">
                <input
                  type="number"
                  class="matrix-input"
                  value={localScores[jugador]?.[j] ?? 0}
                  oninput={(e) => updateScore(jugador, j, (e.target as HTMLInputElement).value)}
                  min="0"
                />
                {#if getRanking(j).find(r => r.jugador === jugador)}
                  <span class="cell-rank">{
                    getRanking(j).find(r => r.jugador === jugador)!.posicion
                  }º</span>
                {/if}
              </td>
            {/each}
            <td class="add-col"></td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr class="totals-row">
          <td class="sticky-col"><strong>TOTAL</strong></td>
          {#each filteredJornadas as j}
            <td class="total-cell">
              <strong>{jugadores.reduce((sum, jugador) => sum + (localScores[jugador]?.[j] ?? 0), 0)}</strong>
            </td>
          {/each}
          <td class="add-col"></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

<style>
  .page {
    max-width: 100%;
    padding: 32px 24px 64px;
    background: var(--bg, #080808);
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-left h1 {
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 32px;
    font-weight: 600;
    color: var(--white, #fff);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0;
    line-height: 1.1;
  }

  .header-left h1::after {
    content: '';
    display: block;
    width: 48px;
    height: 3px;
    background: var(--red, #AA151B);
    margin-top: 8px;
    border-radius: 2px;
  }

  .subtitle {
    color: var(--text-secondary, #AAA);
    font-size: 13px;
    margin: 8px 0 0;
  }

  .header-right {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .season-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
  }

  .season-bar .label {
    margin-bottom: 0;
  }

  .season-select {
    width: auto;
    min-width: 100px;
    font-weight: 700;
  }

  .card {
    background: var(--bg-card, rgba(18,18,18,0.8));
    backdrop-filter: blur(12px);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius, 12px);
    padding: 24px;
    margin-bottom: 20px;
  }

  .card-title {
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 16px;
    font-weight: 600;
    color: var(--white, #fff);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 4px;
  }

  .card-hint {
    color: var(--text-secondary, #AAA);
    font-size: 12px;
    margin: 0 0 16px;
  }

  .btn {
    padding: 8px 18px;
    border-radius: var(--radius-sm, 8px);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--red, #AA151B);
    color: var(--white, #fff);
    border-color: var(--red, #AA151B);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--red-bright, #E30613);
    box-shadow: 0 0 20px var(--red-glow, rgba(170,21,27,0.3));
    transform: translateY(-1px);
  }

  .btn-outline {
    background: transparent;
    color: var(--text-secondary, #AAA);
    border-color: var(--border, rgba(255,255,255,0.06));
  }

  .btn-outline:hover {
    color: var(--white, #fff);
    border-color: var(--border-hover, rgba(255,255,255,0.12));
    background: rgba(255,255,255,0.04);
  }

  .btn-sm {
    padding: 6px 14px;
    font-size: 12px;
  }

  .btn-xs {
    padding: 4px 10px;
    font-size: 11px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
    align-items: end;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-actions {
    align-self: flex-end;
  }

  .label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary, #AAA);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .input {
    padding: 9px 12px;
    border-radius: var(--radius-sm, 8px);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    background: var(--bg-card-solid, #121212);
    color: var(--white, #fff);
    font-size: 13px;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .input:focus {
    outline: none;
    border-color: var(--red, #AA151B);
    box-shadow: 0 0 0 2px var(--red-glow, rgba(170,21,27,0.3));
  }

  .input::placeholder {
    color: var(--text-secondary, #AAA);
  }

  .toast {
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 14px 22px;
    border-radius: var(--radius-sm, 8px);
    font-size: 13px;
    font-weight: 600;
    z-index: 1000;
    backdrop-filter: blur(16px);
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toast-icon {
    font-size: 15px;
  }

  .toast-success {
    background: rgba(18,18,18,0.92);
    color: #34D399;
    border-left: 3px solid #34D399;
  }

  .toast-error {
    background: rgba(18,18,18,0.92);
    color: var(--red-bright, #E30613);
    border-left: 3px solid var(--red-bright, #E30613);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .toolbar-card {
    background: var(--bg-card, rgba(18,18,18,0.8));
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius, 12px);
    padding: 14px 20px;
    margin-bottom: 16px;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .jornada-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .chip {
    padding: 4px 10px;
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    background: var(--bg-card-solid, #121212);
    color: var(--text-secondary, #AAA);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .chip:hover {
    border-color: var(--red, #AA151B);
    color: var(--red-bright, #E30613);
  }

  .chip.selected {
    background: rgba(170,21,27,0.15);
    color: var(--red-bright, #E30613);
    border-color: var(--red, #AA151B);
    box-shadow: 0 0 8px var(--red-glow, rgba(170,21,27,0.3));
  }

  .matrix-wrapper {
    overflow-x: auto;
    background: var(--bg-card-solid, #121212);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius, 12px);
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }

  .matrix-table {
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
    width: max-content;
    min-width: 100%;
  }

  .sticky-col {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-card-solid, #121212);
    min-width: 140px;
  }

  .player-header {
    background: var(--bg-card-solid, #121212) !important;
    color: var(--red-bright, #E30613);
    z-index: 3;
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-weight: 600;
    letter-spacing: 1px;
    font-size: 12px;
    padding: 10px 16px;
    text-align: left;
    border-bottom: 2px solid var(--red, #AA151B);
  }

  .jornada-header {
    background: var(--bg-card-solid, #121212);
    color: var(--red-bright, #E30613);
    text-align: center;
    padding: 8px 4px;
    font-weight: 700;
    font-size: 11px;
    min-width: 80px;
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 2px solid var(--red, #AA151B);
  }

  .jornada-th {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .remove-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.2);
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
    transition: color 0.15s;
  }

  .remove-btn:hover {
    color: var(--red-bright, #E30613);
  }

  .player-name-cell {
    padding: 10px 16px;
    font-weight: 700;
    color: var(--white, #fff);
    white-space: nowrap;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .player-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .score-cell {
    text-align: center;
    padding: 4px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    position: relative;
    min-width: 80px;
    transition: background 0.15s;
  }

  .score-cell:hover {
    background: rgba(255,255,255,0.03);
  }

  .matrix-input {
    width: 60px;
    padding: 6px 4px;
    text-align: center;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    background: transparent;
    color: var(--white, #fff);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .matrix-input:hover {
    border-color: var(--border-hover, rgba(255,255,255,0.12));
    background: rgba(18,18,18,0.6);
  }

  .matrix-input:focus {
    outline: none;
    border-color: var(--red, #AA151B);
    background: var(--bg-card-solid, #121212);
    box-shadow: 0 0 0 2px var(--red-glow, rgba(170,21,27,0.3));
  }

  .cell-rank {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 9px;
    color: var(--text-secondary, #AAA);
    font-weight: 700;
  }

  .cell-gold .matrix-input { color: #E30613; text-shadow: 0 0 6px rgba(227,6,19,0.3); }
  .cell-gold { background: rgba(227,6,19,0.06); }

  .cell-silver .matrix-input { color: #888; }
  .cell-silver { background: rgba(136,136,136,0.04); }

  .cell-bronze .matrix-input { color: #CD7F32; }
  .cell-bronze { background: rgba(205,127,50,0.04); }

  .cell-fine .matrix-input { color: var(--red-bright, #E30613); }
  .cell-fine { background: rgba(170,21,27,0.04); }

  .add-col {
    min-width: 50px;
    text-align: center;
    padding: 4px;
  }

  .jornada-add {
    padding: 4px 8px;
    border: 1px dashed var(--border, rgba(255,255,255,0.06));
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    background: var(--bg-card-solid, #121212);
    color: var(--text-secondary, #AAA);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .jornada-add:hover {
    border-color: var(--red, #AA151B);
    color: var(--red-bright, #E30613);
  }

  .totals-row td {
    border-top: 2px solid var(--red, #AA151B);
    padding: 10px 8px;
    font-weight: 700;
    background: var(--bg-card-solid, #121212);
    color: var(--red-bright, #E30613);
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 13px;
    letter-spacing: 0.5px;
  }

  .total-cell {
    text-align: center;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .page {
      padding: 16px 12px 48px;
    }

    .page-header {
      flex-direction: column;
    }

    .header-left h1 {
      font-size: 24px;
    }

    .toolbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .card {
      padding: 16px;
    }

    .toast {
      left: 12px;
      right: 12px;
    }
  }

  @media (max-width: 480px) {
    .matrix-wrapper {
      max-height: calc(100vh - 340px);
    }

    .toolbar-card {
      padding: 12px;
    }

    .header-right {
      gap: 8px;
    }

    .jornada-chips {
      gap: 4px;
    }

    .cell-rank {
      font-size: 11px;
      min-width: 24px;
      padding: 6px;
    }

    .cell-name {
      font-size: 12px;
      min-width: 80px;
      padding: 6px 8px;
    }

    .score-cell {
      min-width: 70px;
      padding: 6px 8px;
    }

    .jornada-header {
      min-width: 70px;
      padding: 8px;
      font-size: 12px;
    }
  }
</style>
