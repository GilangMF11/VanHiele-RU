<!-- lib/components/admin/TokenManagement.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { adminUser } from "$lib/stores/admin";
  import type { TokenData } from "$lib/types/index";

  // Component state
  let tokens: TokenData[] = [];
  let loading = false;
  let error: string | null = null;

  // Modal states
  let showCreateModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedToken: TokenData | null = null;

  // Form data
  let formData = {
    token_name: "",
    max_usage: 1,
    expires_at: ""
  };

  // Search and filter
  let searchTerm = "";
  let selectedStatus = "all";

  // Fetch tokens from API
  async function fetchTokens() {
    loading = true;
    error = null;

    try {
      const response = await fetch("/api/admin/token", { 
        credentials: 'include' 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        tokens = data.data || [];
        console.log("✅ Fetched", tokens.length, "tokens from API");
      } else {
        throw new Error(data.error || "Failed to fetch tokens");
      }
    } catch (err) {
      console.error("❌ Error fetching tokens:", err);
      error = err instanceof Error ? err.message : "Failed to fetch data";
      tokens = [];
    } finally {
      loading = false;
    }
  }

  // Create token
  async function createToken() {
    try {
      const response = await fetch("/api/admin/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          created_by: $adminUser?.id || 1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        showCreateModal = false;
        resetForm();
        await fetchTokens();
        return true;
      } else {
        throw new Error(data.error || "Failed to create token");
      }
    } catch (err) {
      console.error("❌ Error creating token:", err);
      alert(`Gagal membuat token: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    }
  }

  // Update token
  async function updateToken() {
    if (!selectedToken) return false;

    try {
      const response = await fetch(`/api/admin/token?token=${selectedToken.token_code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          token_name: formData.token_name,
          max_usage: formData.max_usage,
          expires_at: formData.expires_at || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        showEditModal = false;
        selectedToken = null;
        resetForm();
        await fetchTokens();
        return true;
      } else {
        throw new Error(data.error || "Failed to update token");
      }
    } catch (err) {
      console.error("❌ Error updating token:", err);
      alert(`Gagal mengupdate token: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    }
  }

  // Delete token
  async function deleteToken() {
    if (!selectedToken) return false;

    try {
      const response = await fetch(`/api/admin/token?token=${selectedToken.token_code}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        showDeleteModal = false;
        selectedToken = null;
        await fetchTokens();
        return true;
      } else {
        throw new Error(data.error || "Failed to delete token");
      }
    } catch (err) {
      console.error("❌ Error deleting token:", err);
      alert(`Gagal menghapus token: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    }
  }

  // Helper functions
  function resetForm() {
    formData = {
      token_name: "",
      max_usage: 1,
      expires_at: ""
    };
  }

  function handleCreate() {
    resetForm();
    showCreateModal = true;
  }

  function handleEdit(token: TokenData) {
    selectedToken = token;
    formData = {
      token_name: token.token_name || "",
      max_usage: token.max_usage || 1,
      expires_at: token.expires_at ? new Date(token.expires_at).toISOString().split('T')[0] : ""
    };
    showEditModal = true;
  }

  function handleDelete(token: TokenData) {
    selectedToken = token;
    showDeleteModal = true;
  }

  function handleRefresh() {
    fetchTokens();
  }

  // Load data on component mount
  onMount(() => {
    fetchTokens();
  });

  // Filtered tokens
  $: filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      searchTerm === "" ||
      token.token_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (token.token_name && token.token_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && token.is_active) ||
      (selectedStatus === "inactive" && !token.is_active);

    return matchesSearch && matchesStatus;
  });

  // Format date
  function formatDate(dateString: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID");
  }

  // Get usage percentage
  function getUsagePercentage(token: TokenData): number {
    if (!token.max_usage) return 0;
    return Math.round((token.usage_count / token.max_usage) * 100);
  }
</script>

<div class="token-container">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h2 class="title">Token Management</h2>
      <p class="subtitle">
        Menampilkan {filteredTokens.length} dari {tokens.length} token
      </p>
    </div>
    <div class="header-actions">
      <button on:click={handleRefresh} class="refresh-btn" disabled={loading}>
        🔄 Refresh
      </button>
      <button on:click={handleCreate} class="create-btn">
        ➕ Buat Token
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="search-box">
      <input
        type="text"
        placeholder="Cari token atau deskripsi..."
        bind:value={searchTerm}
        class="search-input"
      />
    </div>

    <div class="filter-controls">
      <select bind:value={selectedStatus} class="filter-select">
        <option value="all">Semua Status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Tidak Aktif</option>
      </select>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Memuat data token...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p class="error-message">{error}</p>
        <button on:click={fetchTokens} class="retry-btn">Coba Lagi</button>
      </div>
    {:else if filteredTokens.length === 0}
      <div class="empty-state">
        <p>Tidak ada token ditemukan</p>
        <button on:click={handleCreate} class="create-first-btn">Buat Token Pertama</button>
      </div>
    {:else}
      <!-- Token Table -->
      <div class="table-container">
        <table class="token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Deskripsi</th>
              <th>Penggunaan</th>
              <th>Status</th>
              <th>Batas Waktu</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredTokens as token}
              <tr>
                <td>
                  <div class="token-code">
                    <code>{token.token_code}</code>
                    <button
                      class="copy-btn"
                      on:click={() => navigator.clipboard.writeText(token.token_code)}
                      title="Salin token"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td>
                  <span class="token-description">
                    {token.token_name || "-"}
                  </span>
                </td>
                <td>
                  <div class="usage-info">
                    <div class="usage-text">
                      {token.usage_count} / {token.max_usage || "∞"}
                    </div>
                    {#if token.max_usage}
                      <div class="usage-bar">
                        <div 
                          class="usage-fill" 
                          style="width: {getUsagePercentage(token)}%"
                          class:warning={getUsagePercentage(token) > 80}
                          class:danger={getUsagePercentage(token) > 95}
                        ></div>
                      </div>
                    {/if}
                  </div>
                </td>
                <td>
                  <span class="status-badge" class:active={token.is_active}>
                    {token.is_active ? "Aktif" : "Tidak Aktif"}
                  </span>
                </td>
                <td>
                  <span class="expiry-date">
                    {token.expires_at ? formatDate(token.expires_at) : "Tidak Ada"}
                  </span>
                </td>
                <td>
                  <span class="created-date">
                    {formatDate(token.created_date?.toString() || "")}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="action-btn edit"
                      on:click={() => handleEdit(token)}
                      title="Edit Token"
                    >
                      ✏️
                    </button>
                    <button
                      class="action-btn delete"
                      on:click={() => handleDelete(token)}
                      title="Hapus Token"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Create Token Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={() => (showCreateModal = false)}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Buat Token Baru</h3>
        <button class="modal-close" on:click={() => (showCreateModal = false)}>
          ✕
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="token-name">Nama/Deskripsi Token</label>
          <input
            id="token-name"
            type="text"
            bind:value={formData.token_name}
            placeholder="Contoh: Token untuk kelas X IPA"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="max-usage">Maksimal Penggunaan</label>
          <input
            id="max-usage"
            type="number"
            bind:value={formData.max_usage}
            min="1"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="expires-at">Batas Waktu (Opsional)</label>
          <input
            id="expires-at"
            type="date"
            bind:value={formData.expires_at}
            class="form-input"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" on:click={() => (showCreateModal = false)}>
          Batal
        </button>
        <button class="btn primary" on:click={createToken}>Buat Token</button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Token Modal -->
{#if showEditModal && selectedToken}
  <div class="modal-overlay" on:click={() => (showEditModal = false)}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Edit Token</h3>
        <button class="modal-close" on:click={() => (showEditModal = false)}>
          ✕
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Token Code</label>
          <input
            type="text"
            value={selectedToken.token_code}
            disabled
            class="form-input disabled"
          />
        </div>
        <div class="form-group">
          <label for="edit-token-name">Nama/Deskripsi Token</label>
          <input
            id="edit-token-name"
            type="text"
            bind:value={formData.token_name}
            placeholder="Contoh: Token untuk kelas X IPA"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="edit-max-usage">Maksimal Penggunaan</label>
          <input
            id="edit-max-usage"
            type="number"
            bind:value={formData.max_usage}
            min="1"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="edit-expires-at">Batas Waktu (Opsional)</label>
          <input
            id="edit-expires-at"
            type="date"
            bind:value={formData.expires_at}
            class="form-input"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" on:click={() => (showEditModal = false)}>
          Batal
        </button>
        <button class="btn primary" on:click={updateToken}>Update Token</button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && selectedToken}
  <div class="modal-overlay" on:click={() => (showDeleteModal = false)}>
    <div class="modal-content small" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Konfirmasi Hapus</h3>
        <button class="modal-close" on:click={() => (showDeleteModal = false)}>
          ✕
        </button>
      </div>
      <div class="modal-body">
        <p>
          Apakah Anda yakin ingin menghapus token <strong>{selectedToken.token_code}</strong>?
        </p>
        <p class="warning">Tindakan ini tidak dapat dibatalkan.</p>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" on:click={() => (showDeleteModal = false)}>
          Batal
        </button>
        <button class="btn danger" on:click={deleteToken}>Hapus</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .token-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
  }

  .header-left {
    flex: 1;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }

  .subtitle {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .create-btn,
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .create-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .create-btn:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-1px);
  }

  .refresh-btn {
    background: #f1f5f9;
    color: #64748b;
  }

  .refresh-btn:hover:not(:disabled) {
    background: #e2e8f0;
    color: #475569;
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Filters */
  .filters {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .search-box {
    position: relative;
    flex: 1;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .filter-controls {
    display: flex;
    gap: 0.75rem;
  }

  .filter-select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    font-size: 0.875rem;
    min-width: 120px;
  }

  /* Content */
  .content {
    padding: 1.5rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    color: #dc2626;
    margin-bottom: 1rem;
  }

  .retry-btn,
  .create-first-btn {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-btn:hover,
  .create-first-btn:hover {
    background: #2563eb;
  }

  /* Table */
  .table-container {
    overflow-x: auto;
  }

  .token-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .token-table th {
    background: #f8fafc;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }

  .token-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }

  .token-table tr:hover {
    background: #f9fafb;
  }

  .token-code {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .token-code code {
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #374151;
  }

  .copy-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .token-description {
    color: #374151;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .usage-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .usage-text {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .usage-bar {
    width: 100px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .usage-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
  }

  .usage-fill.warning {
    background: #f59e0b;
  }

  .usage-fill.danger {
    background: #ef4444;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    background: #fef2f2;
    color: #dc2626;
  }

  .status-badge.active {
    background: #f0fdf4;
    color: #16a34a;
  }

  .expiry-date,
  .created-date {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
  }

  .action-btn.edit {
    background: #fef3c7;
    color: #d97706;
  }

  .action-btn.edit:hover {
    background: #fde68a;
    color: #b45309;
  }

  .action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
  }

  .action-btn.delete:hover {
    background: #fee2e2;
    color: #b91c1c;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-content.small {
    max-width: 400px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  .modal-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
    font-size: 1.25rem;
  }

  .modal-close:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn.primary {
    background: #3b82f6;
    color: white;
  }

  .btn.primary:hover {
    background: #2563eb;
  }

  .btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn.secondary:hover {
    background: #e5e7eb;
  }

  .btn.danger {
    background: #dc2626;
    color: white;
  }

  .btn.danger:hover {
    background: #b91c1c;
  }

  .warning {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .header-actions {
      justify-content: flex-end;
    }

    .filters {
      flex-direction: column;
    }

    .filter-controls {
      justify-content: flex-end;
    }

    .token-table {
      font-size: 0.75rem;
    }

    .token-table th,
    .token-table td {
      padding: 0.75rem 0.5rem;
    }

    .action-buttons {
      flex-direction: column;
      gap: 0.25rem;
    }

    .action-btn {
      padding: 0.25rem;
    }
  }
</style>
