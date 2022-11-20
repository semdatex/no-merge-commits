import { ExitCode } from '@actions/core'
import { log } from './util'
import { runner } from './runner'

/** Runner */
;(async () => {
  try {
    await runner()
  } catch (error: unknown) {
    if (error instanceof Error) {
      process.exitCode = ExitCode.Failure
      log(error.message, 'error')
    }
  }
})()
