<!-- lib/components/admin/ResultsTable.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { exportResultsToExcel, exportDetailedAnswers, exportDetailedAnswersNew } from "$lib/utils/excelExport";
  import { formatDateTime } from "$lib/utils/dateFormatter";
  import type { StudentResult } from "$lib/types/admin";

  // Component state - fetch data directly
  let results: StudentResult[] = [];
  let loading = false;
  let error: string | null = null;

  // Define valid sort keys as a type
  type SortableKeys = keyof Pick<
    StudentResult,
    | "student_name"
    | "student_class"
    | "level"
    | "score_percentage"
    | "completion_date"
  >;

  // Search and filter states
  let searchTerm = "";
  let selectedLevel = "all";
  let selectedStatus = "all";
  let selectedClass = "all";
  let sortBy: SortableKeys = "completion_date";
  let sortOrder: "asc" | "desc" = "desc";

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalCount = 0;

  // Modal states
  let showDetailModal = false;
  let selectedResult: StudentResult | null = null;
  let showDeleteModal = false;
  let resultToDelete: StudentResult | null = null;

  // Fetch data from API
  async function fetchResults() {
    loading = true;
    error = null;

    try {
      console.log("📊 Fetching results from API...");

      // Build query parameters
      const params = new URLSearchParams({
        limit: "1000",
        offset: "0",
        detailed: "1" // request with answers for export
      });

      const response = await fetch(`/api/admin/results?${params}`, { credentials: 'include' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        results = data.results || [];
        totalCount = data.total || results.length;
        console.log("✅ Fetched", results.length, "results from API");
      } else {
        throw new Error(data.error || "Failed to fetch results");
      }
    } catch (err) {
      console.error("❌ Error fetching results:", err);
      error = err instanceof Error ? err.message : "Failed to fetch data";
      results = [];
    } finally {
      loading = false;
    }
  }

  // Delete result via API
  async function deleteResult(resultId: string) {
    try {
      console.log("🗑️ Deleting result:", resultId);

      const response = await fetch("/api/admin/results", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ resultId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ Result deleted successfully");
        // Remove from local results array
        results = results.filter((r) => r.id !== resultId);
        // Refresh data to be sure
        await fetchResults();
        return true;
      } else {
        throw new Error(data.error || "Failed to delete result");
      }
    } catch (err) {
      console.error("❌ Error deleting result:", err);
      alert(
        `Gagal menghapus data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      return false;
    }
  }

  // Load data on component mount
  onMount(() => {
    fetchResults();
  });

  // Get unique values for filters
  $: uniqueLevels = [...new Set(results.map((r) => r.level))].sort(
    (a, b) => a - b,
  );
  $: uniqueClasses = [...new Set(results.map((r) => r.student_class))]
    .filter(Boolean)
    .sort();

  // Filtered and sorted results
  $: filteredResults = results
    .filter((result) => {
      const matchesSearch =
        searchTerm === "" ||
        result.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student_class
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        result.student_school?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel =
        selectedLevel === "all" || result.level.toString() === selectedLevel;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "completed" && result.completion_date) ||
        (selectedStatus === "in_progress" && !result.completion_date);
      const matchesClass =
        selectedClass === "all" || result.student_class === selectedClass;

      return matchesSearch && matchesLevel && matchesStatus && matchesClass;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case "student_name":
          aVal = a.student_name || "";
          bVal = b.student_name || "";
          break;
        case "student_class":
          aVal = a.student_class || "";
          bVal = b.student_class || "";
          break;
        case "score_percentage":
          aVal = a.score_percentage || 0;
          bVal = b.score_percentage || 0;
          break;
        case "completion_date":
          aVal = a.completion_date ? new Date(a.completion_date).getTime() : 0;
          bVal = b.completion_date ? new Date(b.completion_date).getTime() : 0;
          break;
        case "level":
          aVal = a.level || 0;
          bVal = b.level || 0;
          break;
        default:
          aVal = "";
          bVal = "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Paginated results
  $: totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  $: paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset pagination when filters change
  $: if (searchTerm || selectedLevel || selectedStatus || selectedClass) {
    currentPage = 1;
  }

  function handleSort(column: SortableKeys) {
    if (sortBy === column) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortBy = column;
      sortOrder = "desc";
    }
  }

  function handleExport() {
    console.log("Export clicked, data:", filteredResults.length);
    if (filteredResults.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    try {
      const filename = `quiz_results_${new Date().toISOString().split("T")[0]}.csv`;
      exportResultsToExcel(filteredResults, filename);
      console.log("Export berhasil");
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengekspor: " + error);
    }
  }

  function handleExportDetailed() {
    if (filteredResults.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    try {
      exportDetailedAnswers(filteredResults);
      console.log("Export detail berhasil");
    } catch (error) {
      console.error("Export detailed error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Gagal mengekspor data detail: " + errorMessage);
    }
  }

  function handleExportDetailedNew() {
    if (filteredResults.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    try {
      exportDetailedAnswersNew(filteredResults);
      console.log("Export detail format baru berhasil");
    } catch (error) {
      console.error("Export detailed new error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Gagal mengekspor data detail format baru: " + errorMessage);
    }
  }

  // function handleExportDetailed() {
  //   if (filteredResults.length === 0) {
  //     alert("Tidak ada data untuk diekspor");
  //     return;
  //   }

  //   try {
  //     exportDetailedAnswers(filteredResults);
  //   } catch (error) {
  //     console.error("Export detailed error:", error);
  //     alert("Gagal mengekspor data detail: " + error.message);
  //   }
  // }

  // Add refresh button functionality
  function handleRefresh() {
    fetchResults();
  }

  function handleViewDetail(result: StudentResult) {
    selectedResult = result;
    showDetailModal = true;
  }

  function handleDeleteResult(result: StudentResult) {
    resultToDelete = result;
    showDeleteModal = true;
  }

  function confirmDelete() {
    if (resultToDelete) {
      deleteResult(resultToDelete.id).then((success) => {
        if (success) {
          showDeleteModal = false;
          resultToDelete = null;
        }
      });
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "excellent";
    if (score >= 70) return "good";
    if (score >= 60) return "average";
    return "poor";
  }

  function getLevelBadgeColor(level: number): string {
    const colors = ["blue", "green", "purple", "orange", "red"];
    return colors[level % colors.length];
  }

  function formatLevel(level: number): string {
    return `Level ${level}`;
  }
</script>

<div class="results-container">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h2 class="title">Hasil Quiz Siswa</h2>
      <p class="subtitle">
        Menampilkan {filteredResults.length} dari {results.length} hasil
      </p>
    </div>
    <div class="header-actions">
      <button on:click={handleRefresh} class="refresh-btn" disabled={loading}>
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </button>
      <button
        on:click={handleExport}
        class="export-btn"
        disabled={filteredResults.length === 0}
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Excel
      </button>
      <button
        on:click={handleExportDetailed}
        class="export-btn secondary"
        disabled={filteredResults.length === 0}
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Detail
      </button>
      <button
        on:click={handleExportDetailedNew}
        class="export-btn secondary"
        disabled={filteredResults.length === 0}
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Detail Baru
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="search-box">
      <svg
        class="search-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Cari nama, kelas, atau sekolah..."
        bind:value={searchTerm}
        class="search-input"
      />
    </div>

    <select bind:value={selectedLevel} class="filter-select">
      <option value="all">Semua Level</option>
      {#each uniqueLevels as level}
        <option value={level.toString()}>{formatLevel(level)}</option>
      {/each}
    </select>

    <select bind:value={selectedStatus} class="filter-select">
      <option value="all">Semua Status</option>
      <option value="completed">Selesai</option>
      <option value="in_progress">In Progress</option>
    </select>

    <select bind:value={selectedClass} class="filter-select">
      <option value="all">Semua Kelas</option>
      {#each uniqueClasses as studentClass}
        <option value={studentClass}>{studentClass}</option>
      {/each}
    </select>

    <select bind:value={itemsPerPage} class="filter-select">
      <option value={10}>10 per halaman</option>
      <option value={25}>25 per halaman</option>
      <option value={50}>50 per halaman</option>
      <option value={100}>100 per halaman</option>
    </select>
  </div>

  <!-- Table Container -->
  <div class="table-container">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat data hasil quiz...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <svg
          class="error-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3>Gagal memuat data</h3>
        <p>{error}</p>
        <button class="retry-btn" on:click={fetchResults}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Coba Lagi
        </button>
      </div>
    {:else if filteredResults.length === 0}
      <div class="empty-state">
        <svg
          class="empty-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3>Tidak ada hasil ditemukan</h3>
        <p>Coba ubah filter atau kata kunci pencarian</p>
      </div>
    {:else}
      <div class="table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th
                class="sortable"
                class:active={sortBy === "student_name"}
                on:click={() => handleSort("student_name")}
              >
                <div class="th-content">
                  Nama
                  <svg
                    class="sort-icon"
                    class:desc={sortBy === "student_name" &&
                      sortOrder === "desc"}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th
                class="sortable"
                class:active={sortBy === "student_class"}
                on:click={() => handleSort("student_class")}
              >
                <div class="th-content">
                  Kelas
                  <svg
                    class="sort-icon"
                    class:desc={sortBy === "student_class" &&
                      sortOrder === "desc"}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th>Sekolah</th>
              <th
                class="sortable"
                class:active={sortBy === "level"}
                on:click={() => handleSort("level")}
              >
                <div class="th-content">
                  Level
                  <svg
                    class="sort-icon"
                    class:desc={sortBy === "level" && sortOrder === "desc"}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <!-- <th class="sortable" class:active={sortBy === 'score_percentage'} on:click={() => handleSort('score_percentage')}>
                <div class="th-content">
                  Skor
                  <svg class="sort-icon" class:desc={sortBy === 'score_percentage' && sortOrder === 'desc'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                  </svg>
                </div>
              </th> -->
              <th>Status</th>
              <th
                class="sortable"
                class:active={sortBy === "completion_date"}
                on:click={() => handleSort("completion_date")}
              >
                <div class="th-content">
                  Tanggal Selesai
                  <svg
                    class="sort-icon"
                    class:desc={sortBy === "completion_date" &&
                      sortOrder === "desc"}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </th>
              <th class="actions-header">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedResults as result, index}
              <tr class="table-row">
                <td class="student-info">
                  <div class="student-avatar">
                    {result.student_name?.charAt(0) || "S"}
                  </div>
                  <div class="student-details">
                    <div class="student-name">
                      {result.student_name || "N/A"}
                    </div>
                    <div class="student-id">ID: {result.id}</div>
                  </div>
                </td>
                <td>
                  <span class="class-badge"
                    >{result.student_class || "N/A"}</span
                  >
                </td>
                <td class="school-name">{result.student_school || "N/A"}</td>
                <td>
                  <span class="level-badge {getLevelBadgeColor(result.level)}"
                    >{formatLevel(result.level)}</span
                  >
                </td>
                <!-- <td>
                  <div class="score-container">
                    <span class="score {getScoreColor(result.score_percentage || 0)}">
                      {result.score_percentage || 0}%
                    </span>
                    <div class="score-bar">
                      <div class="score-fill {getScoreColor(result.score_percentage || 0)}" style="width: {result.score_percentage || 0}%"></div>
                    </div>
                  </div>
                </td> -->
                <td>
                  <span
                    class="status-badge"
                    class:completed={result.completion_date}
                    class:in-progress={!result.completion_date}
                  >
                    {result.completion_date ? "Selesai" : "In Progress"}
                  </span>
                </td>
                <td class="completion-date">
                  {result.completion_date
                    ? formatDateTime(result.completion_date)
                    : "-"}
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <button
                      class="action-btn detail"
                      on:click={() => handleViewDetail(result)}
                      title="Lihat Detail"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      class="action-btn delete"
                      on:click={() => handleDeleteResult(result)}
                      title="Hapus"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="pagination">
          <div class="pagination-info">
            Halaman {currentPage} dari {totalPages}
            ({(currentPage - 1) * itemsPerPage + 1}-{Math.min(
              currentPage * itemsPerPage,
              filteredResults.length,
            )} dari {filteredResults.length})
          </div>
          <div class="pagination-controls">
            <button
              class="pagination-btn"
              disabled={currentPage === 1}
              on:click={() => (currentPage = 1)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              class="pagination-btn"
              disabled={currentPage === 1}
              on:click={() => currentPage--}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {#each Array(Math.min(5, totalPages)) as _, i}
              {@const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i}
              {#if pageNum <= totalPages}
                <button
                  class="pagination-btn page-number"
                  class:active={pageNum === currentPage}
                  on:click={() => (currentPage = pageNum)}
                >
                  {pageNum}
                </button>
              {/if}
            {/each}

            <button
              class="pagination-btn"
              disabled={currentPage === totalPages}
              on:click={() => currentPage++}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              class="pagination-btn"
              disabled={currentPage === totalPages}
              on:click={() => (currentPage = totalPages)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedResult}
  <div class="modal-overlay" on:click={() => (showDetailModal = false)}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Detail Hasil Quiz</h3>
        <button class="modal-close" on:click={() => (showDetailModal = false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <label>Nama Siswa</label>
            <span>{selectedResult.student_name}</span>
          </div>
          <div class="detail-item">
            <label>Kelas</label>
            <span>{selectedResult.student_class}</span>
          </div>
          <div class="detail-item">
            <label>Sekolah</label>
            <span>{selectedResult.student_school}</span>
          </div>
          <div class="detail-item">
            <label>Level Quiz</label>
            <span class="level-badge {getLevelBadgeColor(selectedResult.level)}"
              >{formatLevel(selectedResult.level)}</span
            >
          </div>
          <div class="detail-item">
            <label>Total Soal</label>
            <span>{selectedResult.total_questions}</span>
          </div>
          <div class="detail-item">
            <label>Jawaban Benar</label>
            <span class="correct-answers">{selectedResult.correct_answers}</span
            >
          </div>
          <div class="detail-item">
            <label>Jawaban Salah</label>
            <span class="wrong-answers">{selectedResult.wrong_answers}</span>
          </div>
          <div class="detail-item">
            <label>Akurasi</label>
            <span
              class="score {getScoreColor(
                selectedResult.score_percentage || 0,
              )}">{selectedResult.score_percentage}%</span
            >
          </div>
          <div class="detail-item">
            <label>Waktu Pengerjaan</label>
            <span
              >{Math.floor((selectedResult.time_taken || 0) / 60)} menit {(selectedResult.time_taken ||
                0) % 60} detik</span
            >
          </div>
          <div class="detail-item">
            <label>Status</label>
            <span
              class="status-badge"
              class:completed={selectedResult.completion_date}
            >
              {selectedResult.completion_date ? "Selesai" : "In Progress"}
            </span>
          </div>
          <div class="detail-item">
            <label>Token Sesi</label>
            <span class="token">{selectedResult.session_token}</span>
          </div>
          <div class="detail-item">
            <label>Tanggal Selesai</label>
            <span
              >{selectedResult.completion_date
                ? formatDateTime(selectedResult.completion_date)
                : "Belum selesai"}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && resultToDelete}
  <div class="modal-overlay" on:click={() => (showDeleteModal = false)}>
    <div class="modal-content small" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Konfirmasi Hapus</h3>
        <button class="modal-close" on:click={() => (showDeleteModal = false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p>
          Apakah Anda yakin ingin menghapus hasil quiz untuk <strong
            >{resultToDelete.student_name}</strong
          >?
        </p>
        <p class="warning">Tindakan ini tidak dapat dibatalkan.</p>
      </div>
      <div class="modal-footer">
        <button
          class="btn secondary"
          on:click={() => (showDeleteModal = false)}
        >
          Batal
        </button>
        <button class="btn danger" on:click={confirmDelete}> Hapus </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .results-container {
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

  .export-btn,
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

  .export-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .export-btn.secondary {
    background: linear-gradient(135deg, #64748b, #475569);
    color: white;
  }

  .refresh-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
  }

  .export-btn:hover,
  .refresh-btn:hover {
    transform: translateY(-1px);
  }

  .export-btn:hover {
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .refresh-btn:hover {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .export-btn:disabled,
  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .icon {
    width: 16px;
    height: 16px;
  }

  /* Filters */
  .filters {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 250px;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: #64748b;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Table */
  .table-container {
    min-height: 400px;
  }

  .loading-state,
  .empty-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .empty-icon,
  .error-icon {
    width: 48px;
    height: 48px;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .error-icon {
    color: #dc2626;
  }

  .empty-state h3,
  .error-state h3 {
    color: #374151;
    margin: 0 0 0.5rem 0;
  }

  .error-state h3 {
    color: #dc2626;
  }

  .empty-state p,
  .error-state p {
    color: #64748b;
    margin: 0 0 1rem 0;
  }

  .retry-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .retry-btn svg {
    width: 16px;
    height: 16px;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
  }

  .results-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    background: #f8fafc;
    border-bottom: 2px solid #e5e7eb;
    white-space: nowrap;
  }

  .results-table th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .results-table th.sortable:hover {
    background: #f1f5f9;
  }

  .results-table th.active {
    background: #e0f2fe;
    color: #0369a1;
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-icon {
    width: 14px;
    height: 14px;
    transition: transform 0.2s;
  }

  .sort-icon.desc {
    transform: rotate(180deg);
  }

  .results-table td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .table-row:hover {
    background: #f8fafc;
  }

  /* Student Info */
  .student-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .student-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .student-details {
    flex: 1;
  }

  .student-name {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 0.125rem;
  }

  .student-id {
    font-size: 0.75rem;
    color: #64748b;
  }

  .class-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .school-name {
    color: #374151;
    font-size: 0.875rem;
  }

  .level-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .level-badge.blue {
    background: #dbeafe;
    color: #1e40af;
  }
  .level-badge.green {
    background: #d1fae5;
    color: #065f46;
  }
  .level-badge.purple {
    background: #ede9fe;
    color: #5b21b6;
  }
  .level-badge.orange {
    background: #fed7aa;
    color: #9a3412;
  }
  .level-badge.red {
    background: #fecaca;
    color: #991b1b;
  }

  /* Score */
  .score-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .score {
    font-weight: 600;
    font-size: 0.875rem;
    min-width: 40px;
  }

  .score.excellent {
    color: #059669;
  }
  .score.good {
    color: #0369a1;
  }
  .score.average {
    color: #d97706;
  }
  .score.poor {
    color: #dc2626;
  }

  .score-bar {
    width: 60px;
    height: 4px;
    background: #f1f5f9;
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .score-fill.excellent {
    background: #10b981;
  }
  .score-fill.good {
    background: #3b82f6;
  }
  .score-fill.average {
    background: #f59e0b;
  }
  .score-fill.poor {
    background: #ef4444;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.completed {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.in-progress {
    background: #fef3c7;
    color: #92400e;
  }

  .completion-date {
    color: #64748b;
    font-size: 0.875rem;
  }

  /* Actions */
  .actions {
    text-align: center;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-btn svg {
    width: 14px;
    height: 14px;
  }

  .action-btn.detail {
    background: #dbeafe;
    color: #1e40af;
  }

  .action-btn.detail:hover {
    background: #bfdbfe;
    transform: translateY(-1px);
  }

  .action-btn.delete {
    background: #fecaca;
    color: #991b1b;
  }

  .action-btn.delete:hover {
    background: #fca5a5;
    transform: translateY(-1px);
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-top: 1px solid #f1f5f9;
    background: #fafbfc;
  }

  .pagination-info {
    color: #64748b;
    font-size: 0.875rem;
  }

  .pagination-controls {
    display: flex;
    gap: 0.25rem;
  }

  .pagination-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .pagination-btn svg {
    width: 14px;
    height: 14px;
  }

  .pagination-btn.page-number {
    font-weight: 500;
    font-size: 0.875rem;
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
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-content.small {
    max-width: 400px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: #f1f5f9;
    color: #374151;
  }

  .modal-close svg {
    width: 16px;
    height: 16px;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
  }

  .detail-item label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-item span {
    color: #1e293b;
    font-weight: 500;
  }

  .correct-answers {
    color: #059669;
  }
  .wrong-answers {
    color: #dc2626;
  }
  .token {
    font-family: monospace;
    font-size: 0.75rem;
  }

  .warning {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1.5rem;
    border-top: 1px solid #f1f5f9;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .btn.secondary {
    background: #f8fafc;
    color: #64748b;
    border-color: #e2e8f0;
  }

  .btn.secondary:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .btn.danger {
    background: #dc2626;
    color: white;
  }

  .btn.danger:hover {
    background: #b91c1c;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .filters {
      gap: 0.5rem;
    }

    .search-box {
      min-width: 200px;
    }

    .filter-select {
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
    }

    .results-table th,
    .results-table td {
      padding: 0.75rem 0.5rem;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .filters {
      flex-direction: column;
      gap: 0.75rem;
    }

    .search-box {
      min-width: auto;
    }

    .pagination {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .student-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .score-container {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .score-bar {
      width: 80px;
    }

    .action-buttons {
      flex-direction: column;
      gap: 0.25rem;
    }

    .modal-content {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
  }
</style>
