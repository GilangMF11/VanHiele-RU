  import type { StudentResult } from '$lib/types/admin'
  
  export function exportResultsToExcel(results: StudentResult[], filename?: string) {
    // Create CSV content (since we can't use xlsx in browser without bundling)
    const csvContent = generateCSV(results)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `quiz_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  function generateCSV(results: StudentResult[]): string {
    const headers = [
      'Nama',
      'Kelas',
      'Sekolah',
      'Level',
      'Total Soal',
      'Jawaban Benar',
      'Jawaban Salah',
      'Akurasi (%)',
      'Waktu (detik)',
      'Tanggal Selesai',
      'Token',
      'Detail Jawaban (kode:status)'
    ];
  
    // Helper function to safely convert values to strings
    const safeToString = (value: any): string => {
      if (value === null || value === undefined) return '';
      return value.toString();
    };
  
    const rows = results.map(result => {
      const detail = Array.isArray(result.answers) && result.answers.length > 0
        ? result.answers
            .map(a => `${a.question_id}:${a.is_correct ? 'Benar' : 'Salah'}`)
            .join(' | ')
        : ''
      return [
        safeToString(result.student_name),
        safeToString(result.student_class),
        safeToString(result.student_school),
        safeToString(result.level),
        safeToString(result.total_questions),
        safeToString(result.correct_answers),
        safeToString(result.wrong_answers),
        safeToString(result.score_percentage),
        safeToString(result.time_taken),
        result.completion_date ? new Date(result.completion_date).toLocaleString('id-ID') : '',
        safeToString(result.session_token),
        detail
      ]
    });
  
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  
    return csvContent;
  }
  
  // For detailed answers export - MODIFIED VERSION
  export function exportDetailedAnswers(results: StudentResult[]) {
    const headers = [
      'Nama Siswa',
      'Kelas', 
      'Sekolah',
      'Level',
      'Token Session',
      'Tanggal Selesai',
      'Total Soal',
      'Jawaban Benar',
      'Jawaban Salah',
      'Akurasi (%)',
      'Waktu (detik)',
      'Kode Soal',
      'Status Jawaban'
    ]

    const rows = results.flatMap(result => 
      result.answers.map((answer, index) => [
        // Data siswa (hanya tampil di baris pertama)
        index === 0 ? result.student_name : '',
        index === 0 ? result.student_class : '',
        index === 0 ? result.student_school : '',
        index === 0 ? answer.level.toString() : '',
        index === 0 ? result.session_token : '',
        index === 0 ? (result.completion_date ? new Date(result.completion_date).toLocaleString('id-ID') : '') : '',
        index === 0 ? result.total_questions.toString() : '',
        index === 0 ? result.correct_answers.toString() : '',
        index === 0 ? result.wrong_answers.toString() : '',
        index === 0 ? result.score_percentage.toString() : '',
        index === 0 ? result.time_taken.toString() : '',
        // Data soal per baris
        answer.question_id,
        answer.is_correct ? 'Benar' : 'Salah'
      ])
    )

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `quiz_detailed_answers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

// Alternative compact format for detailed answers export
export function exportDetailedAnswersCompact(results: StudentResult[]) {
  const headers = [
    'Nama Siswa',
    'Kelas', 
    'Sekolah',
    'Level',
    'Token Session',
    'Tanggal Selesai',
    'Total Soal',
    'Jawaban Benar',
    'Jawaban Salah',
    'Akurasi (%)',
    'Waktu (detik)',
    'Kode Soal',
    'Status Jawaban'
  ]

  const rows = results.flatMap(result => {
    // Baris pertama dengan data lengkap siswa
    const firstRow = [
      result.student_name,
      result.student_class,
      result.student_school,
      result.level.toString(),
      result.session_token,
      result.completion_date ? new Date(result.completion_date).toLocaleString('id-ID') : '',
      result.total_questions.toString(),
      result.correct_answers.toString(),
      result.wrong_answers.toString(),
      result.score_percentage.toString(),
      result.time_taken.toString(),
      '', // Kode soal kosong untuk baris header siswa
      ''  // Status kosong untuk baris header siswa
    ]

    // Baris-baris untuk setiap soal
    const answerRows = result.answers.map(answer => [
      '', // Nama kosong
      '', // Kelas kosong
      '', // Sekolah kosong
      '', // Level kosong
      '', // Token kosong
      '', // Tanggal kosong
      '', // Total soal kosong
      '', // Jawaban benar kosong
      '', // Jawaban salah kosong
      '', // Akurasi kosong
      '', // Waktu kosong
      answer.question_id,
      answer.is_correct ? 'Benar' : 'Salah'
    ])

    return [firstRow, ...answerRows]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `quiz_detailed_answers_compact_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// New format: One row per question with student info and question status
export function exportDetailedAnswersNew(results: StudentResult[]) {
  const headers = [
    'Nama Siswa',
    'Kelas', 
    'Sekolah',
    'Level',
    'Token Session',
    'Tanggal Selesai',
    'Total Soal',
    'Jawaban Benar',
    'Jawaban Salah',
    'Akurasi (%)',
    'Waktu (detik)',
    'Kode Soal',
    'Status Jawaban'
  ]

  const rows = results.flatMap(result => 
    result.answers.map(answer => [
      result.student_name,
      result.student_class,
      result.student_school,
      result.level.toString(),
      result.session_token,
      result.completion_date ? new Date(result.completion_date).toLocaleString('id-ID') : '',
      result.total_questions.toString(),
      result.correct_answers.toString(),
      result.wrong_answers.toString(),
      result.score_percentage.toString(),
      result.time_taken.toString(),
      answer.question_id,
      answer.is_correct ? 'Benar' : 'Salah'
    ])
  )

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `quiz_detailed_answers_new_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}