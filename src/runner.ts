import { getInput, info, error } from '@actions/core'
import { context, getOctokit } from '@actions/github'

export async function runner(): Promise<void> {
  const token = getInput('token', { required: true })
  const client = getOctokit(token)
  const pull = context.issue.number

  info(`Retrieving commits of PR #${pull}.`)

  const { data: commits, status } = await client.rest.pulls.listCommits({
    ...context.repo,
    pull_number: context.issue.number,
  })

  if (status !== 200) {
    throw new Error(`Retrieving the commits of the pull request failed with HTTP ${status} status code.`)
  }

  info(`${commits.length} commits(s) found in this pull request.`)

  let mergeCommits = 0

  for (const { sha, html_url, parents } of commits) {
    if (parents.length > 1) {
      error(`Commit SHA [${sha}](${html_url}) is a merge commit!`)
      mergeCommits++
    }
  }

  if (mergeCommits > 0) {
    throw new Error('Merge commits were found in this pull request.')
  }

  info('No merge commits found in this pull request.')
}
