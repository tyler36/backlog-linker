import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);
    const payload = github.context.payload;

    if (payload?.action !== 'created') {
      core.info('This action must be triggered by an "issue_comment" event.')
      return
    }

    if (!payload?.comment || !payload?.repository) {
      core.info('No comment was found.')
      return
    }

    const body = payload?.comment?.body;
    const updatedBody = body.replace(/(?<!\[)#backlog-(\d+)/g, `[#backlog-$1](https://example.com/backlog-$1)`);

    if (updatedBody !== body) {
      await octokit.rest.issues.updateComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        comment_id: payload.comment.id,
        body: updatedBody,
      });
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
};

/* v8 ignore next 3 */
if (!process.env.VITEST_WORKER_ID) {
  run()
}
