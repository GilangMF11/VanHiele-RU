
<script lang="ts">
  import { gameState } from '../stores/quiz.js'
  import { onMount } from 'svelte'

  let showContent = false

  onMount(() => {
    // Smooth entrance animation
    setTimeout(() => {
      showContent = true
    }, 100)
  })

  function startQuiz(): void {
    gameState.set('dataEntry')
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
  <!-- Background decorative elements -->
  <div class="absolute inset-0 opacity-10">
    <div class="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
    <div class="absolute top-32 right-16 w-16 h-16 bg-yellow-300 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
    <div class="absolute bottom-20 left-20 w-12 h-12 bg-pink-300 rounded-full animate-pulse" style="animation-delay: 1s"></div>
    <div class="absolute bottom-32 right-32 w-24 h-24 bg-green-300 rounded-full animate-bounce" style="animation-delay: 1.5s"></div>
  </div>

  <!-- Main content -->
  <div 
    class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md text-center relative z-10 transform transition-all duration-700"
    class:translate-y-8={!showContent}
    class:opacity-0={!showContent}
    class:translate-y-0={showContent}
    class:opacity-100={showContent}
  >
    <!-- Logo/Icon -->
    <div class="mb-8">
      <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
    </div>

    <!-- Title and Description -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        VanHiele.RU
      </h1>
      <!-- <p class="text-gray-600 text-lg leading-relaxed">
        Sistem Quiz Ujian Masuk Perguruan Tinggi
      </p> -->
    </div>

    <!-- Features/Info Cards -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
      <h3 class="font-semibold text-gray-900 mb-4 flex items-center justify-center">
        <svg class="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        Informasi Soal
      </h3>
      
      <div class="space-y-3 text-left">
          <!-- <div class="flex items-center text-sm text-gray-700">
            <div class="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 flex-shrink-0"></div>
            <span>Terdapat <strong class="text-blue-600">5 level soal</strong></span>
          </div> -->
        
        <!-- <div class="flex items-center text-sm text-gray-700">
          <div class="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-3 flex-shrink-0"></div>
          <span>Setiap level berisi <strong class="text-green-600">5 soal pilihan ganda</strong></span>
        </div>
         -->
        <div class="flex items-center text-sm text-gray-700">
          <div class="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-3 flex-shrink-0"></div>
          <span>Jawaban <strong class="text-purple-600">tersimpan otomatis</strong></span>
        </div>
        
        <div class="flex items-center text-sm text-gray-700">
          <div class="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-3 flex-shrink-0"></div>
          <span>Tingkat kesulitan <strong class="text-orange-600">bertahap meningkat</strong></span>
        </div>
      </div>
    </div>

    <!-- Level Progress Indicator -->
    <div class="mb-8">
      <div class="flex justify-center space-x-2">
        {#each Array(5) as _, i}
          <div class="relative">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
              {i + 0}
            </div>
            {#if i < 4}
              <div class="absolute top-4 left-8 w-4 h-0.5 bg-gray-300"></div>
            {/if}
          </div>
        {/each}
      </div>
      <p class="text-xs text-gray-500 mt-2">Level 0 → Level 4</p>
    </div>

    <!-- Start Button -->
    <button 
      on:click={startQuiz}
      class="group w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
    >
      <!-- Button shine effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
      
      <div class="relative flex items-center justify-center">
        <svg class="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        Mulai Quiz
      </div>
    </button>

    <!-- Additional info -->
    <p class="text-xs text-gray-500 mt-4 leading-relaxed">
      Pastikan koneksi internet stabil untuk pengalaman terbaik
    </p>
  </div>

  <!-- Floating particles animation -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute animate-float-slow">
      <div class="w-1 h-1 bg-white/30 rounded-full" style="top: 20%; left: 15%;"></div>
    </div>
    <div class="absolute animate-float-medium">
      <div class="w-1 h-1 bg-white/20 rounded-full" style="top: 60%; left: 80%;"></div>
    </div>
    <div class="absolute animate-float-fast">
      <div class="w-1 h-1 bg-white/40 rounded-full" style="top: 80%; left: 10%;"></div>
    </div>
  </div>
</div>

<style>
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(120deg); }
  }
  
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(90deg); }
  }
  
  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }
  
  .animate-float-medium {
    animation: float-medium 4s ease-in-out infinite;
    animation-delay: 2s;
  }
  
  .animate-float-fast {
    animation: float-fast 3s ease-in-out infinite;
    animation-delay: 1s;
  }
</style>