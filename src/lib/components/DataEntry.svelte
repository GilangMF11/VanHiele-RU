<script lang="ts">
  import { gameState, userData } from '../stores/quiz.js'
  import { QuizAPI } from '../api.js'
  import type { UserData } from '../types/index.js'

  let name: string = ''
  let studentClass: string = ''
  let school: string = ''
  let isLoading: boolean = false

  // Function untuk convert ke uppercase
  function toUpperCase(value: string): string {
    return value.toUpperCase()
  }

  // Event handlers untuk auto-uppercase
  function handleNameInput(event: Event): void {
    const target = event.target as HTMLInputElement
    name = toUpperCase(target.value)
  }

  function handleClassInput(event: Event): void {
    const target = event.target as HTMLInputElement
    studentClass = toUpperCase(target.value)
  }

  function handleSchoolInput(event: Event): void {
    const target = event.target as HTMLInputElement
    school = toUpperCase(target.value)
  }

  async function submitData(): Promise<void> {
    if (!name.trim() || !studentClass.trim() || !school.trim()) {
      alert('Mohon lengkapi semua data')
      return
    }

    isLoading = true
    
    // Pastikan semua data dalam uppercase sebelum disimpan
    const userInfo: UserData = { 
      name: name.trim().toUpperCase(), 
      class: studentClass.trim().toUpperCase(), 
      school: school.trim().toUpperCase(),
      token: ''
    }
    
    // Save to store
    userData.update((data: UserData) => ({ ...data, ...userInfo }))
    
    // Save to database
    const result = await QuizAPI.saveUserData(userInfo)
    
    if (result.success) {
      gameState.set('tokenInput')
    } else {
      alert('Gagal menyimpan data. Silakan coba lagi.')
    }
    
    isLoading = false
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">DATA PESERTA</h2>
      <p class="text-gray-600">Lengkapi data diri Anda</p>
    </div>

    <!-- Form -->
    <form on:submit|preventDefault={submitData} class="space-y-6">
      <!-- Name Input -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          NAMA LENGKAP
        </label>
        <input
          id="name"
          type="text"
          bind:value={name}
          on:input={handleNameInput}
          placeholder="MASUKKAN NAMA LENGKAP"
          style="text-transform: uppercase;"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
          required
        />
      </div>

      <!-- Class Input - Changed to text input -->
      <div>
        <label for="class" class="block text-sm font-medium text-gray-700 mb-2">
          KELAS
        </label>
        <input
          id="class"
          type="text"
          bind:value={studentClass}
          on:input={handleClassInput}
          placeholder="MASUKKAN KELAS (CONTOH: XII IPA 1)"
          style="text-transform: uppercase;"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
          required
        />
        <p class="text-xs text-gray-500 mt-1">Contoh: X, XI IPA, XII IPS, XI IPA 1, XII IPS 2</p>
      </div>

      <!-- School Input -->
      <div>
        <label for="school" class="block text-sm font-medium text-gray-700 mb-2">
          SEKOLAH
        </label>
        <input
          id="school"
          type="text"
          bind:value={school}
          on:input={handleSchoolInput}
          placeholder="NAMA SEKOLAH"
          style="text-transform: uppercase;"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
          required
        />
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        disabled={isLoading}
        class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none"
      >
        {#if isLoading}
          <span class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            MENYIMPAN...
          </span>
        {:else}
          LANJUTKAN
        {/if}
      </button>
    </form>

    <!-- Preview Data (optional) -->
    {#if name || studentClass || school}
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-medium text-gray-700 mb-2">PREVIEW DATA:</h3>
        <div class="text-sm text-gray-600 space-y-1">
          {#if name}<p><strong>Nama:</strong> {name.toUpperCase()}</p>{/if}
          {#if studentClass}<p><strong>Kelas:</strong> {studentClass.toUpperCase()}</p>{/if}
          {#if school}<p><strong>Sekolah:</strong> {school.toUpperCase()}</p>{/if}
        </div>
      </div>
    {/if}
  </div>
</div>