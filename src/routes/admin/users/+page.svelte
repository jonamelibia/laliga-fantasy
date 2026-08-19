<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();
  let editing = $state<string | null>(null);
  let editDisplayName = $state('');
  let editPassword = $state('');
  let editIsAdmin = $state(false);
  let editPhotoChanged = $state(false);
  let editPhotoPreview = $state('');
  let showAdd = $state(false);
  let newJugador = $state('');
  let newDisplayName = $state('');
  let newPassword = $state('');
  let lastMessage = $state<{ type: string; text: string } | null>(null);

  function startEdit(u: { jugador: string; displayName: string; password: string; isAdmin: boolean; photoUrl: string }) {
    editing = u.jugador;
    editDisplayName = u.displayName;
    editPassword = '';
    editIsAdmin = u.isAdmin;
    editPhotoChanged = false;
    editPhotoPreview = u.photoUrl || '';
  }

  function cancelEdit() {
    editing = null;
  }

  function handleEditPhotoSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
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
          editPhotoPreview = canvas.toDataURL('image/jpeg', 0.7);
          editPhotoChanged = true;
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleDeleteUserPhoto(jugador: string) {
    try {
      const fd = new FormData();
      fd.set('jugador', jugador);
      fd.set('photoUrl', '');
      const res = await fetch('?/updateUsuarioPhoto', { method: 'POST', body: fd });
      const result = await res.json();
      if (result.type === 'success') {
        lastMessage = { type: 'success', text: 'Foto eliminada' };
        editing = null;
        await invalidateAll();
        setTimeout(() => { lastMessage = null; }, 3000);
      }
    } catch {
      lastMessage = { type: 'error', text: 'Error al eliminar foto' };
      setTimeout(() => { lastMessage = null; }, 5000);
    }
  }

  $effect(() => {
    if (form?.success) {
      lastMessage = { type: 'success', text: form.message || 'Guardado' };
      editing = null;
      setTimeout(() => { lastMessage = null; }, 3000);
    } else if (form?.error) {
      lastMessage = { type: 'error', text: form.error };
      setTimeout(() => { lastMessage = null; }, 5000);
    }
  });
</script>

<svelte:head>
  <title>Gestión de Usuarios - Fantasy Liga</title>
</svelte:head>

<div class="page">
  <header class="page-header">
    <div class="header-left">
      <h1>Gestión de Usuarios</h1>
      <p class="subtitle">Edita nombres, contraseñas y permisos de los jugadores</p>
    </div>
    <div class="header-right">
      <a href="/admin" class="btn btn-outline btn-sm">← Admin</a>
      <button class="btn btn-primary btn-sm" onclick={() => { showAdd = !showAdd; editing = null; }}>
        {showAdd ? 'Cancelar' : '+ Nuevo'}
      </button>
    </div>
  </header>

  {#if lastMessage}
    <div class="toast toast-{lastMessage.type}">{lastMessage.text}</div>
  {/if}

  {#if showAdd}
    <div class="card add-card">
      <h3 class="card-title">Crear Usuario</h3>
      <form
        method="POST"
        action="?/addUsuario"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              showAdd = false;
              newJugador = '';
              newDisplayName = '';
              newPassword = '';
              await invalidateAll();
            }
          };
        }}
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="label" for="newJugador">ID Jugador</label>
            <input type="text" name="newJugador" id="newJugador" class="input" bind:value={newJugador} placeholder="Ej: NuevoJugador" required />
          </div>
          <div class="form-group">
            <label class="label" for="newDisplayName">Nombre Visible</label>
            <input type="text" name="newDisplayName" id="newDisplayName" class="input" bind:value={newDisplayName} placeholder="Nombre para mostrar" />
          </div>
          <div class="form-group">
            <label class="label" for="newPassword">Contraseña</label>
            <input type="text" name="newPassword" id="newPassword" class="input" bind:value={newPassword} placeholder="Contraseña" required />
          </div>
          <div class="form-group form-actions">
            <button type="submit" class="btn btn-primary">Crear</button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Foto</th>
          <th>ID</th>
          <th>Nombre Visible</th>
          <th>Contraseña</th>
          <th>Admin</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each data.usuarios as u}
          {#if editing === u.jugador}
            <tr class="editing-row">
              <td>
                {#if editPhotoPreview}
                  <img src={editPhotoPreview} alt="" class="avatar" />
                {:else}
                  <div class="avatar-placeholder">{u.displayName?.charAt(0) || u.jugador.charAt(0)}</div>
                {/if}
              </td>
              <td class="id-cell">{u.jugador}</td>
              <td colspan="4">
                <form
                  method="POST"
                  action="?/updateUsuario"
                  enctype="multipart/form-data"
                  use:enhance={() => {
                    return async ({ result }) => {
                      if (result.type === 'success') {
                        editing = null;
                        editPhotoChanged = false;
                        await invalidateAll();
                      }
                    };
                  }}
                >
                  <input type="hidden" name="jugador" value={u.jugador} />
                  {#if editPhotoChanged}
                    <input type="hidden" name="photoBase64" value={editPhotoPreview} />
                  {/if}
                  <div class="edit-form">
                    <input type="text" name="displayName" class="input" bind:value={editDisplayName} placeholder="Nombre" />
                    <input type="text" name="password" class="input" bind:value={editPassword} placeholder="Nueva contraseña (vacío = no cambiar)" />
                    <label class="checkbox-label">
                      <input type="checkbox" name="isAdmin" bind:checked={editIsAdmin} />
                      Admin
                    </label>
                    <label class="btn btn-outline btn-sm photo-upload-btn">
                      Foto
                      <input type="file" accept="image/*" onchange={handleEditPhotoSelect} style="display:none;" />
                    </label>
                    {#if editPhotoPreview}
                      <button type="button" class="btn btn-outline btn-sm delete-photo-btn" onclick={() => handleDeleteUserPhoto(u.jugador)}>
                        Borrar Foto
                      </button>
                    {/if}
                    <button type="submit" class="btn btn-primary btn-sm">Guardar</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick={cancelEdit}>Cancelar</button>
                  </div>
                </form>
              </td>
            </tr>
          {:else}
            <tr>
              <td>
                {#if u.photoUrl}
                  <img src={u.photoUrl} alt="" class="avatar" />
                {:else}
                  <div class="avatar-placeholder">{u.displayName?.charAt(0) || u.jugador.charAt(0)}</div>
                {/if}
              </td>
              <td class="id-cell">{u.jugador}</td>
              <td><strong>{u.displayName || u.jugador}</strong></td>
              <td class="password-cell">{'•'.repeat(6)}</td>
              <td>
                {#if u.isAdmin}
                  <span class="badge badge-admin">Admin</span>
                {:else}
                  <span class="badge badge-player">Jugador</span>
                {/if}
              </td>
              <td>
                <button class="btn btn-outline btn-sm" onclick={() => startEdit(u)}>Editar</button>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    background: var(--bg, #080808);
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    margin-bottom: 28px;
  }

  .header-left h1 {
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 30px;
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
    color: var(--text-secondary, #888);
    margin: 8px 0 0;
    font-size: 13px;
  }

  .header-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 13px;
    border-radius: var(--radius-sm, 8px);
    border: none;
    cursor: pointer;
    padding: 8px 18px;
    transition: all 0.2s ease;
    text-decoration: none;
    white-space: nowrap;
    font-family: inherit;
  }

  .btn-primary {
    background: var(--red, #AA151B);
    color: var(--white, #fff);
  }

  .btn-primary:hover {
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

  .btn-sm {
    padding: 6px 14px;
    font-size: 12px;
  }

  .toast {
    padding: 12px 20px;
    border-radius: var(--radius-sm, 8px);
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(12px);
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

  .card {
    background: var(--bg-card, rgba(18,18,18,0.8));
    backdrop-filter: blur(16px);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius, 12px);
    padding: 24px 28px;
    margin-bottom: 24px;
  }

  .card-title {
    font-family: var(--font-display, 'Oswald', sans-serif);
    font-size: 16px;
    font-weight: 600;
    color: var(--white, #fff);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 20px;
  }

  .form-grid {
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
    color: var(--text-muted, #555);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }

  .input {
    background: var(--bg-card-solid, #121212);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius-sm, 8px);
    padding: 9px 14px;
    font-size: 13px;
    color: var(--white, #fff);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: inherit;
  }

  .input::placeholder {
    color: var(--text-muted, #555);
  }

  .input:focus {
    border-color: var(--red, #AA151B);
    box-shadow: 0 0 0 2px var(--red-glow, rgba(170,21,27,0.3));
  }

  .table-container {
    background: var(--bg-card, rgba(18,18,18,0.8));
    backdrop-filter: blur(16px);
    border: 1px solid var(--border, rgba(255,255,255,0.06));
    border-radius: var(--radius, 12px);
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead tr {
    background: rgba(170,21,27,0.08);
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
  }

  th {
    padding: 14px 16px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--red, #AA151B);
    text-align: left;
    font-family: var(--font-display, 'Oswald', sans-serif);
  }

  td {
    padding: 14px 16px;
    font-size: 13px;
    color: var(--white, #fff);
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
    vertical-align: middle;
  }

  tbody tr {
    transition: background 0.15s;
  }

  tbody tr:hover {
    background: rgba(255,255,255,0.02);
  }

  .id-cell {
    font-family: 'SF Mono', 'Cascadia Code', monospace;
    font-size: 12px;
    color: var(--text-secondary, #888);
  }

  .password-cell {
    color: var(--text-muted, #555);
    letter-spacing: 3px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--red, #AA151B);
  }

  .avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--red, #AA151B), #6b0f12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white, #fff);
    font-weight: 800;
    font-size: 14px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .badge-admin {
    background: rgba(170,21,27,0.15);
    color: var(--red-bright, #E30613);
    border: 1px solid rgba(170,21,27,0.3);
  }

  .badge-player {
    background: rgba(136,136,136,0.1);
    color: var(--text-secondary, #888);
    border: 1px solid rgba(136,136,136,0.15);
  }

  .editing-row td {
    background: rgba(170,21,27,0.05);
    border-bottom-color: var(--border, rgba(255,255,255,0.06));
    padding: 16px;
  }

  .edit-form {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .edit-form .input {
    width: 180px;
    padding: 7px 12px;
    font-size: 12px;
  }

  .edit-form .input:focus {
    border-color: var(--red, #AA151B);
    box-shadow: 0 0 0 2px var(--red-glow, rgba(170,21,27,0.3));
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--white, #fff);
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    accent-color: var(--red, #AA151B);
    width: 15px;
    height: 15px;
  }

  .photo-upload-btn {
    cursor: pointer;
  }

  .delete-photo-btn {
    color: var(--red-bright, #E30613);
    border-color: rgba(227, 6, 19, 0.3);
  }

  .delete-photo-btn:hover {
    background: rgba(227, 6, 19, 0.1);
    border-color: rgba(227, 6, 19, 0.5);
    color: #fff;
  }

  @media (max-width: 768px) {
    .page {
      padding: 20px 16px 48px;
    }

    .page-header {
      flex-direction: column;
      gap: 14px;
    }

    .header-left h1 {
      font-size: 24px;
    }

    .header-right {
      width: 100%;
      justify-content: flex-start;
    }

    .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    table {
      min-width: 700px;
    }

    .edit-form .input {
      width: 140px;
    }
  }
</style>
