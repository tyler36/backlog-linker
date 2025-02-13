import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../src';

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
}));

vi.mock('@actions/github', () => ({
  context: {},
  getOctokit: vi.fn(),
}));
const mockUpdateComment = vi.hoisted(() => vi.fn())

describe('Backlog-linker workflow', () => {
  beforeEach(() => {
    core.getInput.mockImplementation((name) => {
      const lookup = {}

      return lookup[name] || `FAKE-${name}`
    })

    github.context = {
      payload: {
        action: 'created',
        comment: {
          body: "This relates to #backlog-123",
          id: 48
        },
        repository: {
          owner: {
            login: "test-owner"
          },
          name: "test-repo"
        }
      }
    }

    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          updateComment: mockUpdateComment,
        },
      },
    });
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it( 'does NOT run if payload is not "issue_comment"', async () => {
    const setInfoMock = vi.spyOn(core, "info");
    github.context = {payload: {}}

    await run()

    expect(setInfoMock).toHaveBeenCalledWith('This action must be triggered by an "issue_comment" event.');
  } );

  it( 'does NOT run if comment is absent', async () => {
    const setInfoMock = vi.spyOn(core, "info");
    github.context.payload.comment = null

    await run()

    expect(setInfoMock).toHaveBeenCalledWith('No comment was found.');
  } );

  it('replaces backlog references with links', async () => {
    core.getInput.mockImplementation((name) => {
      const lookup = {
        'backlog-url': 'https://example.com',
        'backlog-project-id': 'backlog'
      }

      return lookup[name] || `FAKE-${name}`
    })

    github.context.payload.comment.body = 'This relates to #backlog-123'

    await run();

    expect(mockUpdateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      comment_id: 48,
      body: 'This relates to [#backlog-123](https://example.com/view/backlog-123)',
    });
  });

  it( 'ignores Backlog IDs already in a markdown link', async () => {
    github.context.payload.comment.body = 'This relates to [#backlog-123](https://example.com/view/backlog-123)'

    await run();

    expect(mockUpdateComment).toHaveBeenCalledTimes(0);
  } );

  it("does not update if no backlog reference exists", async () => {
    github.context.payload.comment.body = 'This relates to nothing.'

    await run();

    expect(mockUpdateComment).toHaveBeenCalledTimes(0);
  });

  it('uses action input for configuration', async () => {
    core.getInput.mockImplementation((name) => {
      const lookup = {
        'backlog-url': 'https://space.backlog.jp',
        'backlog-project-id': 'banana'
      }

      return lookup[name] || `FAKE-${name}`
    })

    github.context.payload.comment.body = 'The issue #backlog-123 relates to #banana-456'

    await run();

    expect(mockUpdateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      comment_id: 48,
      body: 'The issue #backlog-123 relates to [#banana-456](https://space.backlog.jp/view/banana-456)',
    });
  });

  it('configuration is case insensitive', async () => {
    core.getInput.mockImplementation((name) => {
      const lookup = {
        'backlog-project-id': 'issue'
      }

      return lookup[name] || `FAKE-${name}`
    })
    github.context.payload.comment.body = 'This relates to #IsSuE-123'

    await run();

    expect(mockUpdateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      comment_id: 48,
      body: 'This relates to [#issue-123](FAKE-backlog-url/view/issue-123)',
    });
  });

  it( 'catches any errors', async () => {
    const setFailedMock = vi.spyOn(core, "setFailed");

    github.getOctokit.mockImplementation(() => {
      throw new Error('test error');
    })

    await run()

    expect(setFailedMock).toHaveBeenCalledWith('test error');
  } );
});
