import { setFailed } from '@actions/core'
import { runner } from './runner'

try {
  runner()
} catch (error: unknown) {
  if (error instanceof Error) {
    setFailed(`Error: ${error.message}`)
  }
}
