<script lang="ts">
  import { onMount } from 'svelte'
  import { gameState, currentLevel, currentQuestionIndex, wrongCount, userData, answers } from '../stores/quiz.js'
  import { QuizAPI } from '../api.js'
  import type { QuizData, Question, AnswerData, UserData } from '../types/index.js'

  let quizData: QuizData | null = null
  let currentQuestion: Question | null = null
  let selectedAnswer: 'a' | 'b' | 'c' | 'd' | 'e' | null = null
  let isSubmitting: boolean = false

  // Image states
  let imageLoading: boolean = false
  let imageError: boolean = false

  let level: number = 0 // Start from level 0
  let questionIndex: number = 0
  let mistakes: number = 0
  let user: UserData = { name: '', class: '', school: '', token: '' }

  // Subscribe to stores
  currentLevel.subscribe((value: number) => level = value)
  currentQuestionIndex.subscribe((value: number) => questionIndex = value)
  wrongCount.subscribe((value: number) => mistakes = value)
  userData.subscribe((value: UserData) => user = value)

  onMount(async (): Promise<void> => {
    const result = await QuizAPI.loadQuizData()
    if (result.success && result.data) {
      quizData = result.data
      
      // Initialize level 0
      currentLevel.set(0)
      currentQuestionIndex.set(0)
      wrongCount.set(0)
      
      loadCurrentQuestion()
    } else {
      console.error('Failed to load quiz data:', result.error)
      alert('Gagal memuat soal quiz. Silakan refresh halaman.')
    }
  })

  function loadCurrentQuestion(): void {
    if (!quizData) return
    
    const levelData = quizData.levels[level.toString()]
    if (levelData && levelData.questions[questionIndex]) {
      currentQuestion = levelData.questions[questionIndex]
      selectedAnswer = null
      
      // Reset image states
      imageLoading = !!currentQuestion.image
      imageError = false
      
      console.log(`📖 Loaded question: Level ${level}, Question ${questionIndex + 1}/${levelData.questions.length}`)
    }
  }

  // Function untuk get image URL
  function getImageUrl(imagePath: string): string {
    if (!imagePath) return ''
    
    // Jika sudah URL lengkap (http/https), return as-is
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Gunakan image_base_url dari config atau default
    const baseUrl = quizData?.quiz_config?.image_base_url || '/images/'
    return baseUrl + imagePath
  }

  // Handle image loading
  function handleImageLoad(): void {
    imageLoading = false
    imageError = false
    console.log('✅ Image loaded successfully')
  }

  // Handle image error
  function handleImageError(): void {
    imageLoading = false  
    imageError = true
    console.error('❌ Failed to load image:', currentQuestion?.image)
  }

  async function submitAnswer(): Promise<void> {
    if (!selectedAnswer || isSubmitting || !currentQuestion) return

    isSubmitting = true
    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    console.log(`🎯 Submitting answer: ${selectedAnswer} (correct: ${currentQuestion.correct_answer})`)

    // Save answer to database
    const answerData: AnswerData = {
      level: level,
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      is_correct: isCorrect,
      user_data: user,
      time_taken: undefined,
      session_token: user.token
    }

    try {
      const result = await QuizAPI.saveAnswer(answerData)
      if (result.success) {
        console.log('✅ Answer saved to database')
      } else {
        console.error('❌ Failed to save answer:', result.error)
      }
    } catch (error) {
      console.error('❌ Error saving answer:', error)
    }

    // Update local store
    answers.update((arr: AnswerData[]) => [...arr, answerData])

    // Update mistakes count untuk level ini
    if (!isCorrect) {
      wrongCount.update((count: number) => {
        const newCount = count + 1
        console.log(`❌ Wrong answer! Level ${level} mistakes: ${newCount}/3`)
        return newCount
      })
    } else {
      console.log(`✅ Correct answer! Level ${level}`)
    }

    isSubmitting = false

    // Langsung proceed ke next tanpa delay
    proceedToNext()
  }

  function proceedToNext(): void {
    console.log(`📊 Current state - Level: ${level}, Question: ${questionIndex + 1}, Mistakes: ${mistakes}`)
    
    // ATURAN: Jika salah 3 kali atau lebih di level ini, STOP (maksimal salah < 3)
    if (mistakes >= 3) {
      console.log(`🛑 Quiz stopped! ${mistakes} mistakes in Level ${level} (max allowed: 2)`)
      gameState.set('thankYou')
      return
    }

    // Lanjut ke pertanyaan/level berikutnya
    nextQuestion()
  }

  function nextQuestion(): void {
    if (!quizData) return
    
    const levelData = quizData.levels[level.toString()]
    
    if (questionIndex < levelData.questions.length - 1) {
      // Masih ada pertanyaan di level yang sama
      console.log(`➡️ Next question in Level ${level}`)
      currentQuestionIndex.update((index: number) => index + 1)
    } else {
      // Level selesai, cek apakah bisa naik level
      const availableLevels = Object.keys(quizData.levels).map(Number).sort()
      const maxLevel = Math.max(...availableLevels)
      
      if (level < maxLevel) {
        const nextLevelIndex = availableLevels.indexOf(level) + 1
        const nextLevel = availableLevels[nextLevelIndex]
        
        console.log(`🎉 Level ${level} completed! Moving to Level ${nextLevel}`)
        console.log(`🔄 Reset mistakes from ${mistakes} to 0`)
        
        // Naik level dan RESET mistake counter
        currentLevel.set(nextLevel)
        currentQuestionIndex.set(0)
        wrongCount.set(0)
      } else {
        // Semua level selesai
        console.log('🏆 All levels completed!')
        gameState.set('thankYou')
        return
      }
    }
    
    // Load pertanyaan berikutnya
    loadCurrentQuestion()
  }

  // Get available levels for display
  $: availableLevels = quizData ? Object.keys(quizData.levels).map(Number).sort() : []
  $: totalLevels = availableLevels.length
  $: currentLevelIndex = availableLevels.indexOf(level) + 1

  // Get total questions and current position
  $: totalQuestions = quizData ? 
    Object.values(quizData.levels).reduce((total, level) => total + level.questions.length, 0) : 0
  
  $: currentQuestionNumber = quizData ? 
    availableLevels.slice(0, availableLevels.indexOf(level))
      .reduce((total, levelKey) => total + quizData!.levels[levelKey.toString()].questions.length, 0) + questionIndex + 1 : 0

  // Debug reactive statement
  $: {
    if (typeof mistakes !== 'undefined' && currentQuestion) {
      console.log(`🎯 State: Level ${level}, Question ${questionIndex + 1}, Mistakes: ${mistakes}/3, Question ID: ${currentQuestion.id}`)
    }
  }

  // Reactive statement to reload question when stores change
  $: if (quizData && (level >= 0 || questionIndex >= 0)) {
    loadCurrentQuestion()
  }
</script>

{#if currentQuestion && quizData}
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
      <div class="flex justify-between items-center text-white">
        <div class="text-sm font-medium">
          Level {level} dari {availableLevels.length > 0 ? Math.max(...availableLevels) : 3}
        </div>
        <div class="text-sm font-medium">
          Soal {questionIndex + 1} dari {quizData.levels[level.toString()].questions.length}
        </div>
        <div class="text-sm font-medium">
          Salah: {mistakes}/3
        </div>
      </div>
      
      <!-- Progress Bar Level -->
      <div class="w-full bg-white/20 rounded-full h-2 mt-3">
        <div 
          class="bg-white h-2 rounded-full transition-all duration-500"
          style="width: {((questionIndex + 1) / quizData.levels[level.toString()].questions.length) * 100}%"
        ></div>
      </div>
      
      <!-- Overall Progress -->
      <div class="flex justify-between items-center mt-2 text-xs text-white/80">
        <span>Progress Keseluruhan</span>
        <span>{currentQuestionNumber} / {totalQuestions}</span>
      </div>
      <div class="w-full bg-white/20 rounded-full h-1 mt-1">
        <div 
          class="bg-white/60 h-1 rounded-full transition-all duration-500"
          style="width: {(currentQuestionNumber / totalQuestions) * 100}%"
        ></div>
      </div>
    </div>

    <!-- Question Card -->
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl mx-auto">
      <!-- Question Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {currentQuestion.id}
          </div>
          <div class="text-sm text-gray-500">
            {quizData.levels[level.toString()].level_name}
          </div>
        </div>
      </div>

      <!-- Image Section -->
      {#if currentQuestion.image}
        <div class="mb-8">
          <div class="relative bg-gray-50 rounded-lg overflow-hidden border">
            <img 
              src="{getImageUrl(currentQuestion.image)}" 
              alt="{currentQuestion.image_alt || 'Question illustration'}"
              class="max-w-full h-auto mx-auto block transition-opacity duration-300"
              class:opacity-0={imageLoading}
              class:opacity-100={!imageLoading && !imageError}
              style="max-height: 500px; object-fit: contain;"
              on:error={handleImageError}
              on:load={handleImageLoad}
            />
            
            <!-- Loading placeholder -->
            {#if imageLoading}
              <div class="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                  <p class="text-sm text-gray-600">Memuat gambar...</p>
                </div>
              </div>
            {/if}
            
            <!-- Error placeholder -->
            {#if imageError}
              <div class="absolute inset-0 flex items-center justify-center bg-gray-100 border border-gray-300">
                <div class="text-center p-4">
                  <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                  <p class="text-sm text-gray-500">Gagal memuat gambar</p>
                  <button 
                    class="text-xs text-blue-600 hover:underline mt-1"
                    on:click={() => {
                      imageError = false
                      imageLoading = true
                      const img = document.querySelector(`img[src*="${currentQuestion?.image}"]`) as HTMLImageElement
                      if (img) {
                        img.src = img.src + '?retry=' + Date.now()
                      }
                    }}
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Image caption -->
          {#if currentQuestion.image_caption}
            <p class="text-sm text-gray-600 text-center mt-2 italic">
              {currentQuestion.image_caption}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Question Text -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 leading-relaxed">
          {currentQuestion.question}
        </h2>
      </div>

      <!-- Options - No result indicators -->
      <div class="space-y-3 mb-8">
        {#each Object.entries(currentQuestion.options) as [key, option]}
          <button
            on:click={() => selectedAnswer = key as 'a' | 'b' | 'c' | 'd' | 'e'}
            disabled={isSubmitting}
            class="w-full p-4 text-left border-2 rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:transform-none"
            class:bg-gray-50={!selectedAnswer || selectedAnswer !== key}
            class:hover:bg-blue-50={!selectedAnswer && !isSubmitting}
            class:border-gray-200={!selectedAnswer || selectedAnswer !== key}
            class:hover:border-blue-300={!selectedAnswer && !isSubmitting}
            class:bg-blue-100={selectedAnswer === key}
            class:border-blue-500={selectedAnswer === key}
          >
            <div class="flex items-start gap-4">
              <span class="font-bold text-blue-600 text-lg flex-shrink-0 mt-1 min-w-[32px]">
                {key.toUpperCase()}.
              </span>
              <span class="text-gray-800 font-medium flex-1 text-left">
                {option}
              </span>
            </div>
          </button>
        {/each}
      </div>

      <!-- Submit Button -->
      <div class="text-center">
        <button
          on:click={submitAnswer}
          disabled={!selectedAnswer || isSubmitting}
          class="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
        >
          {#if isSubmitting}
            <span class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              MENYIMPAN...
            </span>
          {:else}
            SUBMIT JAWABAN
          {/if}
        </button>
        
        {#if selectedAnswer}
          <p class="text-sm text-gray-600 mt-2">
            Jawaban Anda: <strong class="text-blue-600">{selectedAnswer.toUpperCase()}</strong>
          </p>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- Loading State -->
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
    <div class="text-center text-white">
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
      <p class="text-lg mb-2">Memuat soal quiz...</p>
      <p class="text-sm opacity-80">Mohon tunggu sebentar</p>
    </div>
  </div>
{/if}

<style>
  /* Custom scrollbar untuk mobile */
  :global(*) {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }
  
  :global(*::-webkit-scrollbar) {
    width: 6px;
  }
  
  :global(*::-webkit-scrollbar-track) {
    background: transparent;
  }
  
  :global(*::-webkit-scrollbar-thumb) {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
</style>