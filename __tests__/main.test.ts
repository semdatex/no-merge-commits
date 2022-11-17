import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as github from '@actions/github'
import { runner } from '../src/runner'
import { EOL } from 'os'

describe('nexusphp/no-merge-commits', () => {
  beforeEach(() => {
    process.env['INPUT_TOKEN'] = 'someToken'

    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'me',
        repo: 'awesome',
      }
    })
    jest.spyOn(github.context, 'issue', 'get').mockImplementation(() => {
      return {
        number: 1,
        owner: 'me',
        repo: 'awesome',
      }
    })
    jest.spyOn(process.stdout, 'write').mockImplementation(jest.fn<() => boolean>())
    jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn<() => boolean>())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function assertWritten(calls: string[]): void {
    expect(process.stdout.write).toHaveBeenCalledTimes(calls.length)

    for (let i = 0; i < calls.length; i++) {
      expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i])
    }
  }

  it('fails when no token is provided', async () => {
    process.env['INPUT_TOKEN'] = ''

    await expect(runner()).rejects.toThrowError('Input required and not supplied: token')
  })

  it('fails when status code is not HTTP 200', async () => {
    jest.spyOn(github, 'getOctokit').mockImplementation(
      jest.fn<ReturnType<any>>((token: string) => {
        return {
          rest: {
            pulls: {
              listCommits: () => {
                return {
                  data: {},
                  status: 422,
                }
              },
            },
          },
        }
      })
    )

    await expect(runner()).rejects.toThrowError('Retrieving the commits of the pull request failed with HTTP 422 status code.')
    assertWritten([`Retrieving commits of PR #1.${EOL}`])
  })

  it('succeeds checking no merge commits', async () => {
    jest.spyOn(github, 'getOctokit').mockImplementation(
      jest.fn<ReturnType<any>>((token: string) => {
        return {
          rest: {
            pulls: {
              listCommits: () => {
                return {
                  data: [
                    {
                      sha: '447553',
                      html_url: 'https://some.place',
                      parents: [
                        {
                          sha: '16c886',
                          url: 'https://api.some.place',
                          html_url: 'https://some.place',
                        },
                      ],
                    },
                  ],
                  status: 200,
                }
              },
            },
          },
        }
      })
    )

    await runner()

    assertWritten([
      `Retrieving commits of PR #1.${EOL}`,
      `1 commits(s) found in this pull request.${EOL}`,
      `No merge commits found in this pull request.${EOL}`,
    ])
  })

  it('fails when a merge commit is detected', async () => {
    jest.spyOn(github, 'getOctokit').mockImplementation(
      jest.fn<ReturnType<any>>((token: string) => {
        return {
          rest: {
            pulls: {
              listCommits: () => {
                return {
                  data: [
                    {
                      sha: '447553',
                      html_url: 'https://some.place',
                      parents: [
                        {
                          sha: '16c886',
                          url: 'https://api.some.place',
                          html_url: 'https://some.place',
                        },
                        {
                          sha: '17adfe',
                          url: 'https://api.some.place',
                          html_url: 'https://some.place',
                        },
                      ],
                    },
                  ],
                  status: 200,
                }
              },
            },
          },
        }
      })
    )

    await expect(runner()).rejects.toThrowError('Merge commits were found in this pull request.')

    assertWritten([
      `Retrieving commits of PR #1.${EOL}`,
      `1 commits(s) found in this pull request.${EOL}`,
      `::error::Commit SHA [447553](https://some.place) is a merge commit!${EOL}`,
    ])
  })
})
