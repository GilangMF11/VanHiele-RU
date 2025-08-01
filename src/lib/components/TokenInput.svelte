
<script lang="ts">
  import { gameState, userData } from '../stores/quiz.js'
  import { QuizAPI } from '../api.js'
  import type { UserData } from '../types/index.js'

  let token: string = ''
  let isValidating: boolean = false

  async function validateAndProceed(): Promise<void> {
    isValidating = true

    const result = await QuizAPI.validateToken(token)
    
    if (result.success) {
      userData.update((data: UserData) => ({ ...data, token }))
      gameState.set('quiz')
    } else {
      alert(result.error || 'Token tidak valid')
    }
    
    isValidating = false
  }

  function skipToken(): void {
    userData.update((data: UserData) => ({ ...data, token: '' }))
    gameState.set('quiz')
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Token Akses</h2>
      <p class="text-gray-600">Masukkan token 6 digit (opsional)</p>
    </div>

    <!-- Token Input -->
    <div class="mb-6">
      <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
        Token (6 digit)
      </label>
      <input
        id="token"
        type="text"
        bind:value={token}
        placeholder="Contoh: ABC123"
        maxlength="6"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-lg font-mono tracking-widest uppercase"
      />
      <p class="text-xs text-gray-500 mt-2 text-center">Dapatkan token dari guru Anda</p>
    </div>

    <!-- Buttons -->
    <div class="space-y-3">
      <button
        on:click={validateAndProceed}
        disabled={isValidating || !token.trim()}
        class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none"
      >
        {#if isValidating}
          <span class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memvalidasi...
          </span>
        {:else}
          Verifikasi Token
        {/if}
      </button>

      <button
        on:click={skipToken}
        class="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
      >
        Lewati (Tanpa Token)
      </button>
    </div>
  </div>
</div>
