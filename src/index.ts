import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run() {
  try {
    const token = core.getInput('github-token')
    const backlogUrl = core.getInput('backlog-url')
    const backlogProjectId = core.getInput('backlog-project-id')

    const octokit = github.getOctokit(token)
    const payload = github.context.payload

    if (payload?.action !== 'created') {
      core.info('This action must be triggered by an "issue_comment" event.')
      return
    }

    if (!payload?.comment || !payload?.repository) {
      core.info('No comment was found.')
      return
    }

    // Replace body string with link to Backlog issue.
    const body = payload?.comment?.body
    const regex = new RegExp(`(?<!\\[)#${backlogProjectId}-(\\d+)`, 'gi')
    const updatedBody = body.replace(
      regex,
      `[#${backlogProjectId}-$1](${backlogUrl}/view/${backlogProjectId}-$1)`,
    )

    if (updatedBody !== body) {
      await octokit.rest.issues.updateComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        comment_id: payload.comment.id,
        body: updatedBody,
      })
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

/* v8 ignore next 3 */
if (!process.env.VITEST_WORKER_ID) {
  run()
}
