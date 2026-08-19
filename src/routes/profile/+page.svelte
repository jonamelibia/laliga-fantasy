<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();
  let displayName = $state('');
  let password = $state('');
  let uploading = $state(false);
  let photoPreview = $state('');
  let photoChanged = $state(false);
  let lastMessage = $state<{ type: string; text: string } | null>(null);

  $effect(() => {
    displayName = data.profile.displayName;
    photoPreview = data.profile.photoUrl;
  });

  function handlePhotoSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        lastMessage = { type: 'error', text: 'La imagen no puede superar 5MB' };
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxPx = 200;
          let w = img.width;
          let h = img.height;
          if (w > maxPx || h > maxPx) {
            const ratio = Math.min(maxPx / w, maxPx / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          photoPreview = canvas.toDataURL('image/jpeg', 0.7);
          photoChanged = true;
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  $effect(() => {
    if (form?.success) {
      lastMessage = { type: 'success', text: form.message || 'Guardado' };
      if (form.photoUrl) {
        photoPreview = form.photoUrl;
      }
      photoChanged = false;
      password = '';
      setTimeout(() => { lastMessage = null; }, 3000);
    } else if (form?.error) {
      lastMessage = { type: 'error', text: form.error };
      setTimeout(() => { lastMessage = null; }, 5000);
    }
  });
</script>

<svelte:head>
  <title>Mi Perfil - Fantasy Liga</title>
</svelte:head>

<div class="page">
  <header class="page-header">
    <h1>Mi Perfil</h1>
  </header>

  {#if lastMessage}
    <div class="toast toast-{lastMessage.type}">{lastMessage.text}</div>
  {/if}

  <div class="profile-grid">
    <div class="card photo-card">
      <div class="photo-section">
        <div class="photo-ring">
          {#if photoPreview}
            <img src={photoPreview} alt="Avatar" class="profile-photo" />
          {:else}
            <div class="profile-photo-placeholder">
              {data.profile.displayName?.charAt(0) || data.profile.jugador?.charAt(0) || '?'}
            </div>
          {/if}
        </div>

        <form
          method="POST"
          action="?/uploadPhoto"
          enctype="multipart/form-data"
          use:enhance={() => {
            uploading = true;
            return async ({ result, update }) => {
              uploading = false;
              await update();
            };
          }}
        >
          {#if photoChanged}
            <input type="hidden" name="photoBase64" value={photoPreview} />
          {/if}
          <div class="photo-actions">
            <label class="btn btn-outline upload-btn">
              Cambiar Foto
              <input
                type="file"
                name="photo"
                accept="image/*"
                onchange={handlePhotoSelect}
                style="display: none;"
              />
            </label>
            <button type="submit" class="btn btn-primary" disabled={uploading || !photoPreview}>
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>

        <div class="photo-info">
          <span class="info-label">Jugador</span>
          <strong>{data.profile.jugador}</strong>
        </div>
      </div>
    </div>

    <div class="card form-card">
      <div class="form-card-header">
        <h2>Datos Personales</h2>
      </div>

      <form
        method="POST"
        action="?/updateProfile"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') await invalidateAll();
          };
        }}
      >
        <div class="form-group">
          <label class="label" for="displayName">Nombre para Mostrar</label>
          <input
            type="text"
            name="displayName"
            id="displayName"
            class="input"
            bind:value={displayName}
            required
          />
        </div>

        <div class="form-group">
          <label class="label" for="password">Nueva Contraseña</label>
          <input
            type="password"
            name="password"
            id="password"
            class="input"
            bind:value={password}
            placeholder="Dejar vacío para no cambiar"
          />
        </div>

        <button type="submit" class="btn btn-primary save-btn">Guardar Cambios</button>
      </form>
    </div>
  </div>
</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    background: var(--bg, #080808);
    min-height: 100vh;
  }

  .page-header {
    padding-bottom: 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    text-align: center;
  }

  .page-header h1 {
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 32px;
    font-weight: 600;
    color: var(--white, #fff);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0;
  }

  .page-header h1::after {
    content: '';
    display: block;
    width: 48px;
    height: 3px;
    background: var(--red, #AA151B);
    margin: 8px auto 0;
    border-radius: 2px;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 28px;
    align-items: start;
  }

  .card {
    background: var(--bg-card, rgba(18,18,18,0.8));
    backdrop-filter: blur(12px);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius, 12px);
    overflow: hidden;
  }

  .photo-card {
    text-align: center;
    padding: 32px 28px;
  }

  .photo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .photo-ring {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    padding: 4px;
    background: conic-gradient(
      from 0deg,
      var(--red, #AA151B),
      #6b0f12,
      rgba(170,21,27,0.3),
      #6b0f12,
      var(--red, #AA151B)
    );
    box-shadow: 0 0 24px var(--red-glow, rgba(170,21,27,0.3));
    position: relative;
  }

  .profile-photo {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    border: 3px solid var(--bg-card-solid, #121212);
  }

  .profile-photo-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--red, #AA151B), #6b0f12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white, #fff);
    font-size: 64px;
    font-weight: 700;
    font-family: var(--font-display, 'Oswald', sans-serif);
    border: 3px solid var(--bg-card-solid, #121212);
  }

  .photo-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .upload-btn {
    cursor: pointer;
  }

  .photo-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--text-secondary, #888);
    font-size: 13px;
    padding-top: 12px;
    border-top: 1px solid var(--border, rgba(255,255,255,0.06));
    width: 100%;
  }

  .info-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text-muted, #555);
  }

  .photo-info strong {
    color: var(--white, #fff);
    font-size: 15px;
  }

  .form-card {
    padding: 0;
  }

  .form-card-header {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    background: rgba(170,21,27,0.06);
  }

  .form-card-header h2 {
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 16px;
    font-weight: 600;
    color: var(--red-bright, #E30613);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
  }

  .form-card form {
    padding: 28px 32px 32px;
  }

  .form-group {
    margin-bottom: 22px;
  }

  .label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted, #555);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
    display: block;
  }

  .input {
    width: 100%;
    padding: 10px 14px;
    border-radius: var(--radius-sm, 8px);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    background: var(--bg-card-solid, #121212);
    color: var(--white, #fff);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .input::placeholder {
    color: var(--text-muted, #555);
  }

  .input:focus {
    border-color: var(--red, #AA151B);
    box-shadow: 0 0 0 2px var(--red-glow, rgba(170,21,27,0.3));
  }

  .save-btn {
    width: 100%;
    margin-top: 8px;
    padding: 12px 32px;
    font-size: 14px;
    letter-spacing: 0.04em;
    font-family: inherit;
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
    color: var(--text-secondary, #888);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
  }

  .btn-outline:hover {
    border-color: var(--border-hover, rgba(255,255,255,0.12));
    color: var(--white, #fff);
    background: rgba(255,255,255,0.04);
  }

  .toast {
    padding: 12px 20px;
    border-radius: var(--radius-sm, 8px);
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(12px);
    animation: slideIn 0.3s ease;
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

  @media (max-width: 768px) {
    .page {
      padding: 20px 16px 48px;
    }

    .profile-grid {
      grid-template-columns: 1fr;
    }

    .photo-ring {
      width: 150px;
      height: 150px;
    }

    .profile-photo-placeholder {
      font-size: 52px;
    }

    .photo-card {
      padding: 28px 20px;
    }

    .form-card-header {
      padding: 16px 20px;
    }

    .form-card form {
      padding: 24px 20px 28px;
    }

    .page-header h1 {
      font-size: 26px;
    }
  }

  @media (max-width: 480px) {
    .photo-ring {
      width: 120px;
      height: 120px;
    }

    .photo-card {
      padding: 20px 16px;
    }

    .form-card form {
      padding: 20px 16px 24px;
    }

    .form-card-header {
      padding: 14px 16px;
    }
  }
</style>
