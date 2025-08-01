// scripts/convertBase64ToFiles.ts
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Define types for the script
interface Question {
  id: string
  question: string
  image?: string | null
  image_alt?: string | null
  image_caption?: string | null
  options: {
    a: string
    b: string
    c: string
    d: string
  }
  correct_answer: 'a' | 'b' | 'c' | 'd' | 'e'
  explanation: string
}

interface QuizLevel {
  level_name: string
  description: string
  questions: Question[]
}

interface QuizData {
  quiz_config: {
    title: string
    description: string
    total_levels: number
    max_mistakes_per_level: number
    image_base_url?: string
  }
  levels: Record<string, QuizLevel>
}

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function convertBase64Images(): Promise<void> {
  try {
    console.log('🔄 Starting base64 to files conversion...')
    
    // Read quiz data
    const quizDataPath = path.join(__dirname, '../static/quiz-data.json')
    const quizDataContent = await fs.readFile(quizDataPath, 'utf8')
    const quizData: QuizData = JSON.parse(quizDataContent)
    
    let totalConverted = 0
    
    // Process each level
    for (const [levelKey, level] of Object.entries(quizData.levels)) {
      console.log(`📁 Processing Level ${levelKey}...`)
      
      // Process each question in the level
      for (const question of level.questions) {
        if (question.image && typeof question.image === 'string' && question.image.startsWith('data:image')) {
          console.log(`  🔄 Converting ${question.id}...`)
          
          try {
            // Extract base64 data
            const matches = question.image.match(/^data:image\/([a-z]+);base64,(.+)$/i)
            if (matches) {
              const [, extension, base64Data] = matches
              
              // Create filename
              const filename = `${question.id}.${extension}`
              const dirPath = path.join(__dirname, `../static/images/level${levelKey}`)
              const filePath = path.join(dirPath, filename)
              
              // Create directory if it doesn't exist
              await fs.mkdir(dirPath, { recursive: true })
              
              // Write file
              await fs.writeFile(filePath, base64Data, 'base64')
              
              // Update question data
              question.image = `level${levelKey}/${filename}`
              
              console.log(`    ✅ Converted ${question.id} -> ${filename}`)
              totalConverted++
            } else {
              console.log(`    ⚠️ Invalid base64 format for ${question.id}`)
            }
          } catch (error) {
            console.error(`    ❌ Error converting ${question.id}:`, error)
          }
        } else if (question.image) {
          console.log(`    ℹ️ ${question.id} already has file path: ${question.image}`)
        }
      }
    }
    
    // Update image_base_url in config if not exists
    if (!quizData.quiz_config.image_base_url) {
      quizData.quiz_config.image_base_url = '/images/quiz/'
      console.log('📝 Added image_base_url to config')
    }
    
    // Save updated quiz data
    await fs.writeFile(quizDataPath, JSON.stringify(quizData, null, 2), 'utf8')
    
    console.log('✅ Migration completed successfully!')
    console.log(`📊 Total images converted: ${totalConverted}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run the conversion
if (import.meta.url === `file://${process.argv[1]}`) {
  convertBase64Images()
    .then(() => {
      console.log('🎉 All done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}

export { convertBase64Images }