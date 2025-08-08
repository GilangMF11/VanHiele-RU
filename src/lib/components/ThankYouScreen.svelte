<!-- src/lib/components/ThankYouScreen.svelte - LEVEL 0-3 DISPLAY -->
<script lang="ts">
  import { onMount } from "svelte";
  import {
    gameState,
    currentLevel,
    wrongCount,
    userData,
    answers,
  } from "../stores/quiz.js";
  import type {
    AnswerData,
    UserData,
    ResultSummaryData,
  } from "../types/index.js";
  import { QuizAPI } from "../api.js";
  import { Result } from "postcss";

  let level: number = 0;
  let mistakes: number = 0;
  let userAnswers: AnswerData[] = [];
  let user: UserData = { name: "", class: "", school: "", token: "" };
  let showContent = false;
  let showConfetti = false;

  // Subscribe to stores
  currentLevel.subscribe((value: number) => (level = value));
  wrongCount.subscribe((value: number) => (mistakes = value));
  answers.subscribe((value: AnswerData[]) => (userAnswers = value));
  userData.subscribe((value: UserData) => (user = value));

  // LEVEL 0-3 SYSTEM (Tanpa konversi)
  // Level 0 = Level Mudah
  // Level 1 = Level Sedang
  // Level 2 = Level Sulit
  // Level 3 = Level Expert

  // Calculate completed levels
  $: completedLevels = (() => {
    // Jika berhasil menyelesaikan quiz (mistakes <= 2)
    if (mistakes <= 2) {
      return level + 1; // Selesaikan level saat ini
    }
    // Jika gagal karena salah > 2
    return level; // Hanya sampai level sebelumnya
  })();

  $: totalQuestions = userAnswers.length;
  $: correctAnswers = userAnswers.filter((a) => a.is_correct).length;
  $: wrongAnswers = userAnswers.filter((a) => !a.is_correct).length;
  $: accuracy =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  // Full completion = menyelesaikan level 3 dengan mistakes <= 2
  $: isFullCompletion = level === 3 && mistakes <= 2;

  // Messages based on performance
  $: performanceMessage = getPerformanceMessage(completedLevels, accuracy);
  $: encouragementMessage = getEncouragementMessage(completedLevels, accuracy);

  onMount(async () => {
    // Smooth entrance animation
    setTimeout(() => {
      showContent = true;
    }, 100);

    // Show confetti for excellent performance
    if (isFullCompletion || accuracy >= 80) {
      setTimeout(() => {
        showConfetti = true;
      }, 500);
    }

    // Save quiz results summary to database
    await saveQuizSummary();
  });

  // REPLACE saveQuizSummary function in ThankYouScreen.svelte:

  async function saveQuizSummary() {
    try {
      console.log("🎯 Creating FINAL quiz summary from ThankYouScreen");
      console.log("🔍 Current user data:", {
        name: user.name,
        class: user.class,
        school: user.school,
        token: user.token,
        level: level,
        mistakes: mistakes,
        totalQuestions: totalQuestions,
        accuracy: accuracy,
      });

      // ✅ CHECK SESSION TOKEN
      if (!user.token || user.token.trim() === "") {
        console.warn("❌ No session token available for final summary");
        console.warn("📋 User object:", user);
        console.warn("📋 UserAnswers length:", userAnswers.length);

        // If no token but we have answers, try to get token from answers
        if (userAnswers.length > 0 && userAnswers[0]?.session_token) {
          const tokenFromAnswers = userAnswers[0].session_token;
          console.log("🔄 Found token in userAnswers:", tokenFromAnswers);
          user.token = tokenFromAnswers;
        } else {
          console.error(
            "❌ Cannot create final summary - no session token available",
          );
          return;
        }
      }

      console.log("✅ Using session token:", user.token);

      // ✅ CALL COMPLETE-QUIZ API FOR FINAL SUMMARY (server akan hitung dari quiz_answers)
      const requestBody = {
        session_token: user.token,
        status: "completed",
      };

      console.log("📤 Sending request to /api/complete-quiz:", requestBody);

      const response = await fetch("/api/complete-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ FINAL quiz summary result:", result);

        if (result.success) {
          if (result.duplicate) {
            console.log("ℹ️ Summary already existed, no duplicate created");
          } else if (result.summary) {
            console.log("🎊 NEW final summary created:", {
              id: result.summary.id,
              score: result.summary.percentage,
              status: result.summary.status,
              level_reached: result.summary.highest_level_reached,
            });
          }
        } else {
          console.warn("⚠️ API returned success=false:", result);
        }
      } else {
        const errorText = await response.text();
        console.warn(
          "⚠️ Failed to create final summary - Status:",
          response.status,
        );
        console.warn("⚠️ Error response:", errorText);

        try {
          const errorJson = JSON.parse(errorText);
          console.warn("⚠️ Error details:", errorJson);
        } catch (e) {
          console.warn("⚠️ Raw error response:", errorText);
        }
      }
    } catch (error) {
      console.error("❌ Error creating final quiz summary:", error);
      console.error("❌ Error details:", {
        message: error,
        stack: error,
      });
    }
  }

  function calculateTimeSpent(): number {
    // Calculate from first to last answer timestamp if available
    // This is a placeholder - implement based on your timestamp tracking
    return 0;
  }

  function getPerformanceMessage(levels: number, acc: number): string {
    if (levels === 4 && acc >= 90) {
      return "🏆 LUAR BIASA! SEMPURNA!";
    } else if (levels === 4 && acc >= 80) {
      return "🌟 EXCELLENT! SANGAT BAGUS!";
    } else if (levels >= 3 && acc >= 70) {
      return "👍 GREAT JOB! KERJA BAGUS!";
    } else if (levels >= 2 && acc >= 60) {
      return "💪 GOOD EFFORT! USAHA BAIK!";
    } else if (levels >= 1) {
      return "📚 KEEP LEARNING! TERUS BELAJAR!";
    } else {
      return "🌱 NICE TRY! COBA LAGI!";
    }
  }

  function getEncouragementMessage(levels: number, acc: number): string {
    if (levels === 4) {
      return "Anda berhasil menyelesaikan semua level! Persiapan UMP Anda sangat baik!";
    } else if (levels >= 3) {
      return "Pencapaian yang bagus! Anda sudah siap menghadapi ujian yang sesungguhnya!";
    } else if (levels >= 2) {
      return "Progres yang solid! Dengan sedikit latihan lagi, Anda akan semakin baik!";
    } else if (levels >= 1) {
      return "Awal yang baik! Terus berlatih untuk meningkatkan kemampuan Anda!";
    } else {
      return "Jangan menyerah! Setiap usaha adalah langkah menuju kesuksesan!";
    }
  }

  function restartQuiz(): void {
    // Reset all stores
    gameState.set("welcome");
    currentLevel.set(0); // Start from level 0
    wrongCount.set(0);
    answers.set([]);
    userData.set({ name: "", class: "", school: "", token: "" });
  }

  function goHome(): void {
    window.location.href = "/";
  }

  function getGradeColor(acc: number): string {
    if (acc >= 90) return "text-green-600";
    if (acc >= 80) return "text-blue-600";
    if (acc >= 70) return "text-yellow-600";
    if (acc >= 60) return "text-orange-600";
    return "text-red-600";
  }

  function getLevelBadgeColor(level: number): string {
    if (level === 4)
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (level === 3)
      return "bg-gradient-to-r from-purple-400 to-purple-600 text-white";
    if (level === 2)
      return "bg-gradient-to-r from-blue-400 to-blue-600 text-white";
    if (level === 1)
      return "bg-gradient-to-r from-green-400 to-green-600 text-white";
    return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
  }

  function getLevelName(lvl: number): string {
    switch (lvl) {
      case 0:
        return "Mudah";
      case 1:
        return "Sedang";
      case 2:
        return "Sulit";
      case 3:
        return "Expert";
      default:
        return "Level " + lvl;
    }
  }
</script>

<div
  class="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden"
>
  <!-- Background decorative elements -->
  <div class="absolute inset-0 opacity-10">
    <div
      class="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"
    ></div>
    <div
      class="absolute top-32 right-16 w-16 h-16 bg-yellow-300 rounded-full animate-bounce"
      style="animation-delay: 0.5s"
    ></div>
    <div
      class="absolute bottom-20 left-20 w-12 h-12 bg-pink-300 rounded-full animate-pulse"
      style="animation-delay: 1s"
    ></div>
    <div
      class="absolute bottom-32 right-32 w-24 h-24 bg-green-300 rounded-full animate-bounce"
      style="animation-delay: 1.5s"
    ></div>
  </div>

  <!-- Confetti animation -->
  {#if showConfetti}
    <div class="absolute inset-0 pointer-events-none">
      {#each Array(20) as _, i}
        <div
          class="absolute w-2 h-2 bg-yellow-400 animate-ping"
          style="top: {Math.random() * 100}%; left: {Math.random() *
            100}%; animation-delay: {Math.random() * 2}s;"
        ></div>
      {/each}
    </div>
  {/if}

  <!-- Main content -->
  <div
    class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-2xl text-center relative z-10 transform transition-all duration-700"
    class:translate-y-8={!showContent}
    class:opacity-0={!showContent}
    class:translate-y-0={showContent}
    class:opacity-100={showContent}
  >
    <!-- Success Icon -->
    <div class="mb-8">
      <div
        class="w-24 h-24 {getLevelBadgeColor(
          completedLevels,
        )} rounded-full mx-auto flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300"
      >
        {#if isFullCompletion}
          <svg
            class="w-12 h-12 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        {:else}
          <svg
            class="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {/if}
      </div>
    </div>

    <!-- Title and Performance Message -->
    <div class="mb-8">
      <h1
        class="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
      >
        {performanceMessage}
      </h1>
      <p class="text-xl text-gray-600 leading-relaxed">
        {encouragementMessage}
      </p>
    </div>

    <!-- User Info Card -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100"
    >
      <h3
        class="font-semibold text-gray-900 mb-4 flex items-center justify-center"
      >
        <svg
          class="w-5 h-5 text-blue-600 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clip-rule="evenodd"
          />
        </svg>
        Informasi Peserta
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="text-center">
          <p class="text-gray-600">Nama</p>
          <p class="font-bold text-gray-900">{user.name}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Kelas</p>
          <p class="font-bold text-gray-900">{user.class}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Sekolah</p>
          <p class="font-bold text-gray-900 truncate">{user.school}</p>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-8">
      <h3
        class="font-semibold text-gray-900 mb-6 flex items-center justify-center"
      >
        <svg
          class="w-5 h-5 text-green-600 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        Ringkasan Hasil
      </h3>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <!-- Level Reached -->
        <div class="text-center">
          <div
            class="w-16 h-16 {getLevelBadgeColor(
              level,
            )} rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg"
          >
            <span class="text-2xl font-bold">{level}</span>
          </div>
          <p class="text-xs text-gray-600 mb-1">Level Terakhir</p>
          <p class="font-bold text-gray-900">{getLevelName(level)}</p>
        </div>

        <!-- Total Questions -->
        <div class="text-center">
          <div
            class="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-xs text-gray-600 mb-1">Total Soal</p>
          <p class="font-bold text-gray-900">{totalQuestions}</p>
        </div>

        <!-- Correct Answers -->
        <div class="text-center">
          <div
            class="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <p class="text-xs text-gray-600 mb-1">Jawaban Benar</p>
          <p class="font-bold text-green-600">{correctAnswers}</p>
        </div>

        <!-- Accuracy -->
        <div class="text-center">
          <div
            class="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg"
          >
            <span class="text-xl font-bold text-white">{accuracy}%</span>
          </div>
          <p class="text-xs text-gray-600 mb-1">Akurasi</p>
          <p class="font-bold {getGradeColor(accuracy)}">{accuracy}%</p>
        </div>
      </div>

      <!-- Additional Stats -->
      <div
        class="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm"
      >
        <div class="flex justify-between">
          <span class="text-gray-600">Level Selesai:</span>
          <span class="font-bold text-blue-600">{completedLevels}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Total Kesalahan:</span>
          <span
            class="font-bold {mistakes > 2 ? 'text-red-600' : 'text-green-600'}"
            >{mistakes}</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Status:</span>
          <span
            class="font-bold {mistakes > 2
              ? 'text-orange-600'
              : 'text-green-600'}"
          >
            {mistakes > 2
              ? "Dihentikan"
              : isFullCompletion
                ? "Sempurna"
                : "Selesai"}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Total Poin:</span>
          <span class="font-bold text-purple-600"
            >{correctAnswers * 10 * (level + 1)}</span
          >
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-4">
      <button
        on:click={restartQuiz}
        class="group w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"
        ></div>

        <div class="relative flex items-center justify-center">
          <svg
            class="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Coba Lagi
        </div>
      </button>

      <button
        on:click={goHome}
        class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-200"
      >
        <div class="flex items-center justify-center">
          <svg
            class="w-6 h-6 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Kembali ke Beranda
        </div>
      </button>
    </div>

    <!-- Footer Message -->
    <div class="mt-8 pt-6 border-t border-gray-200">
      <p class="text-sm text-gray-500 leading-relaxed">
        💡 <strong>Tips:</strong> Terus berlatih soal-soal UMP untuk meningkatkan
        kemampuan Anda!
      </p>
    </div>
  </div>
</div>

<style>
  @keyframes float-slow {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
    }
  }

  @keyframes float-medium {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-15px) rotate(120deg);
    }
  }

  @keyframes float-fast {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-10px) rotate(90deg);
    }
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
