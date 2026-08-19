<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Stats | Fantasy LaLiga</title>
</svelte:head>

<div class="page">
  <div class="header">
    <h1>Estadísticas</h1>
    <p class="subtitle">Selecciona un jugador para ver sus estadísticas históricas</p>
  </div>

  <div class="players-grid">
    {#each data.players as player}
      <a href="/stats/{encodeURIComponent(player.jugador)}" class="player-card">
        <div class="player-avatar">
          {#if player.photoUrl}
            <img src={player.photoUrl} alt={player.displayName} />
          {:else}
            <span>{player.jugador.charAt(0)}</span>
          {/if}
        </div>
        <div class="player-info">
          <span class="player-name">{player.displayName}</span>
          <span class="player-id">{player.jugador}</span>
        </div>
        <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </a>
    {/each}
  </div>
</div>

<style>
  .page {
    max-width: 700px;
    margin: 0 auto;
    padding: 48px 24px 64px;
  }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  .header h1 {
    font-family: var(--font-display, 'Oswald', system-ui, sans-serif);
    font-size: 48px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 8px;
  }

  .subtitle {
    font-size: 15px;
    color: var(--text-secondary, #aaa);
    margin: 0;
  }

  .players-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .player-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--bg-card, rgba(18, 18, 18, 0.8));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .player-card:hover {
    border-color: var(--red, #AA151B);
    background: rgba(170, 21, 27, 0.08);
  }

  .player-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--bg-card-solid, #121212);
    border: 2px solid var(--border, rgba(255, 255, 255, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .player-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .player-avatar span {
    font-family: var(--font-display, 'Oswald', system-ui, sans-serif);
    font-size: 18px;
    font-weight: 700;
    color: var(--red, #AA151B);
  }

  .player-info {
    flex: 1;
    min-width: 0;
  }

  .player-name {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-id {
    display: block;
    font-size: 13px;
    color: var(--text-muted, #777);
    margin-top: 2px;
  }

  .arrow {
    color: var(--text-muted, #555);
    flex-shrink: 0;
    transition: color 0.2s;
  }

  .player-card:hover .arrow {
    color: var(--red, #AA151B);
  }

  @media (max-width: 480px) {
    .page {
      padding: 32px 16px 48px;
    }

    .header h1 {
      font-size: 36px;
    }

    .player-card {
      padding: 14px 16px;
    }
  }
</style>
