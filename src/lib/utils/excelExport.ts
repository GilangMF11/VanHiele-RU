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
      'Skor (%)',
      'Waktu (detik)',
      'Tanggal Selesai',
      'Token'
    ]
  
    const rows = results.map(result => [
      result.student_name,
      result.student_class,
      result.student_school,
      result.level.toString(),
      result.total_questions.toString(),
      result.correct_answers.toString(),
      result.wrong_answers.toString(),
      result.score_percentage.toString(),
      result.time_taken.toString(),
      new Date(result.completion_date?.toString() || '').toLocaleString('id-ID'),
      result.session_token
    ])
  
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  
    return csvContent
  }
  
  // For detailed answers export
  export function exportDetailedAnswers(results: StudentResult[]) {
    const headers = [
      'Nama Siswa',
      'Kelas',
      'Sekolah',
      'Level',
      'ID Soal',
      'Pertanyaan',
      'Jawaban Siswa',
      'Jawaban Benar',
      'Status',
      'Waktu Jawab'
    ]
  
    const rows = results.flatMap(result => 
      result.answers.map(answer => [
        result.student_name,
        result.student_class,
        result.student_school,
        answer.level.toString(),
        answer.question_id,
        answer.question_text,
        answer.selected_answer,
        answer.correct_answer,
        answer.is_correct ? 'Benar' : 'Salah',
        //new Date(answer.timestamp.toString()).toLocaleString('id-ID')
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