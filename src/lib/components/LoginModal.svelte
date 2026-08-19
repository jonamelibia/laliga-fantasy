<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';

  let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

  let jugador = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  const players = ['Ame FC', 'Mvg1712', 'Rakiticismo', 'Mariooon', 'Babin5', 'a|t0r'];

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const formData = new FormData();
      formData.set('jugador', jugador);
      formData.set('password', password);

      const res = await fetch('/api/login', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (res.ok && result.success) {
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get('returnTo');
        await invalidateAll();
        onclose();
        if (returnTo) {
          goto(decodeURIComponent(returnTo));
        }
      } else {
        error = result.error || 'Error al iniciar sesión';
      }
    } catch {
      error = 'Error de conexión';
    } finally {
      loading = false;
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    onclick={handleOverlayClick}
  >
    <div class="modal">
      <button class="close-btn" onclick={onclose} aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>

      <h2 class="title">Acceder</h2>
      <div class="divider"></div>

      <form onsubmit={handleSubmit}>
        <div class="field">
          <label class="label" for="jugador-login">Jugador</label>
          <select
            id="jugador-login"
            class="input"
            bind:value={jugador}
            required
          >
            <option value="" disabled>Selecciona tu nombre</option>
            {#each players as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </div>

        <div class="field">
          <label class="label" for="password-login">Contraseña</label>
          <input
            id="password-login"
            type="password"
            class="input"
            placeholder="••••"
            bind:value={password}
            required
          />
        </div>

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button
          type="submit"
          class="submit-btn"
          disabled={loading || !jugador || !password}
        >
          {#if loading}
            <span class="spinner"></span>
          {:else}
            Entrar
          {/if}
        </button>
      </form>

      <p class="footer-hint">Contraseña por defecto: 1234</p>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }

  .modal {
    background: #121212;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 36px 32px 28px;
    width: 100%;
    max-width: 400px;
    position: relative;
    animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #fff;
  }

  .title {
    font-family: 'Oswald', 'Inter', system-ui, sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 16px;
  }

  .divider {
    height: 2px;
    background: #AA151B;
    border-radius: 1px;
    margin-bottom: 28px;
  }

  .field {
    margin-bottom: 20px;
  }

  .label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 8px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .input {
    width: 100%;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    color: #fff;
    background: #080808;
    outline: none;
    transition: all 0.2s;
  }

  .input:hover {
    border-color: rgba(255, 255, 255, 0.12);
  }

  .input:focus {
    border-color: #fff;
    box-shadow: 0 0 0 3px rgba(170, 21, 27, 0.3);
  }

  .input option {
    background: #121212;
    color: #fff;
  }

  .error {
    color: #E30613;
    font-size: 13px;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .submit-btn {
    width: 100%;
    padding: 12px;
    background: #AA151B;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
  }

  .submit-btn:hover:not(:disabled) {
    background: #E30613;
    box-shadow: 0 4px 20px rgba(170, 21, 27, 0.3);
  }

  .submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .footer-hint {
    text-align: center;
    margin-top: 20px;
    font-size: 12px;
    color: #555;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .overlay {
      padding: 16px;
    }

    .modal {
      padding: 24px 20px 20px;
    }

    .title {
      font-size: 20px;
    }
  }
</style>
