import * as core from '@actions/core'

export async function color(type: string): Promise<string> {
  switch (type) {
    case 'error':
      return '\x1B[31m'

    case 'warning':
      return '\x1B[33m'

    case 'debug':
    case 'notice':
      return '\x1B[37m'

    case 'reset':
      return '\x1B[0m'

    case 'info':
    default:
      return '\x1B[32m'
  }
}

export async function log(message: string, type: string): Promise<void> {
  let callable

  switch (type) {
    case 'debug':
      callable = core.debug
      break

    case 'error':
      callable = core.error
      break

    case 'notice':
    case 'info':
    default:
      callable = core.info
  }

  callable(`${await color(type)}[${type.toUpperCase()}] ${message}${await color('reset')}`)
}

export async function inflect(iterable: any[], singular: string, plural: string): Promise<string> {
  return (iterable.length > 1 && plural) || singular
}
