/**
 * Twitter/X MCP tool implementations using the bird library.
 */

import {
  getTwitterClient,
  checkTwitterCredentials,
  TwitterClientError,
} from '../twitter-client.js';
import type {
  TwitterUser,
  TweetData,
  NewsItem,
  ExploreTab,
} from '@steipete/bird';

// Error response for missing credentials
function noCredentialsError() {
  return {
    error: 'Twitter credentials not found',
    instructions: [
      'Open x.com in Safari, Chrome, or Firefox',
      'Log in to your Twitter/X account',
      'Return here and retry',
    ],
  };
}

// Wrap API errors consistently
function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { error: message };
}

/**
 * twitter_check - Verify credentials and show logged-in user
 */
export async function twitterCheck() {
  try {
    const result = await checkTwitterCredentials();

    if (!result.valid) {
      return {
        authenticated: false,
        source: result.source,
        warnings: result.warnings,
        instructions: [
          'Open x.com in Safari, Chrome, or Firefox',
          'Log in to your Twitter/X account',
          'Return here and retry',
        ],
      };
    }

    return {
      authenticated: true,
      source: result.source,
      user: result.user,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    };
  } catch (error) {
    return apiError(error);
  }
}

/**
 * twitter_whoami - Get current user info
 */
export async function twitterWhoami() {
  try {
    const client = await getTwitterClient();
    const result = await client.getCurrentUser();

    if (!result.success || !result.user) {
      return { error: result.error ?? 'Failed to get current user' };
    }

    return {
      id: result.user.id,
      username: result.user.username,
      name: result.user.name,
      profileUrl: `https://x.com/${result.user.username}`,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_following - Get following list
 */
export async function twitterFollowing(args: {
  username?: string;
  userId?: string;
  count?: number;
  all?: boolean;
  cursor?: string;
}) {
  try {
    const client = await getTwitterClient();

    // Get user ID if username provided
    let targetUserId = args.userId;
    if (!targetUserId) {
      if (args.username) {
        // Look up user by username
        const lookupResult = await client.getUserIdByUsername(args.username);
        if (!lookupResult.success || !lookupResult.userId) {
          return { error: lookupResult.error ?? `User @${args.username} not found` };
        }
        targetUserId = lookupResult.userId;
      } else {
        // Default to current user
        const currentUser = await client.getCurrentUser();
        if (!currentUser.success || !currentUser.user) {
          return { error: currentUser.error ?? 'Failed to get current user' };
        }
        targetUserId = currentUser.user.id;
      }
    }

    const allUsers: TwitterUser[] = [];
    let cursor = args.cursor;
    const pageSize = args.count ?? (args.all ? 200 : 50);

    do {
      const result = await client.getFollowing(targetUserId, pageSize, cursor);

      if (!result.success) {
        if (allUsers.length > 0) {
          // Return partial results if we got some
          return {
            users: allUsers,
            count: allUsers.length,
            partial: true,
            error: result.error,
          };
        }
        return { error: result.error ?? 'Failed to get following list' };
      }

      if (result.users) {
        allUsers.push(...result.users);
      }

      cursor = result.nextCursor;

      // If not fetching all, just get one page
      if (!args.all) {
        return {
          users: formatUsers(allUsers),
          count: allUsers.length,
          nextCursor: cursor,
        };
      }
    } while (cursor);

    return {
      users: formatUsers(allUsers),
      count: allUsers.length,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_followers - Get followers list
 */
export async function twitterFollowers(args: {
  username?: string;
  userId?: string;
  count?: number;
  cursor?: string;
}) {
  try {
    const client = await getTwitterClient();

    // Get user ID if username provided
    let targetUserId = args.userId;
    if (!targetUserId) {
      if (args.username) {
        const lookupResult = await client.getUserIdByUsername(args.username);
        if (!lookupResult.success || !lookupResult.userId) {
          return { error: lookupResult.error ?? `User @${args.username} not found` };
        }
        targetUserId = lookupResult.userId;
      } else {
        const currentUser = await client.getCurrentUser();
        if (!currentUser.success || !currentUser.user) {
          return { error: currentUser.error ?? 'Failed to get current user' };
        }
        targetUserId = currentUser.user.id;
      }
    }

    const pageSize = args.count ?? 50;
    const result = await client.getFollowers(targetUserId, pageSize, args.cursor);

    if (!result.success) {
      return { error: result.error ?? 'Failed to get followers list' };
    }

    return {
      users: formatUsers(result.users ?? []),
      count: result.users?.length ?? 0,
      nextCursor: result.nextCursor,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_bookmarks - Get bookmarked tweets
 */
export async function twitterBookmarks(args: {
  count?: number;
  all?: boolean;
  cursor?: string;
}) {
  try {
    const client = await getTwitterClient();

    if (args.all) {
      const result = await client.getAllBookmarks({ cursor: args.cursor });

      if (!result.success) {
        return { error: result.error ?? 'Failed to get bookmarks' };
      }

      return {
        tweets: formatTweets(result.tweets ?? []),
        count: result.tweets?.length ?? 0,
        nextCursor: result.nextCursor,
      };
    }

    const count = args.count ?? 20;
    const result = await client.getBookmarks(count);

    if (!result.success) {
      return { error: result.error ?? 'Failed to get bookmarks' };
    }

    return {
      tweets: formatTweets(result.tweets ?? []),
      count: result.tweets?.length ?? 0,
      nextCursor: result.nextCursor,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_news - Get trending news from Explore
 */
export async function twitterNews(args: {
  count?: number;
  tab?: string;
  tabs?: string[];
  withTweets?: boolean;
}) {
  try {
    const client = await getTwitterClient();

    const validTabs: ExploreTab[] = ['forYou', 'news', 'sports', 'entertainment'];
    let tabs: ExploreTab[] | undefined;

    if (args.tab) {
      const tab = args.tab as ExploreTab;
      if (validTabs.includes(tab)) {
        tabs = [tab];
      }
    } else if (args.tabs) {
      tabs = args.tabs.filter((t): t is ExploreTab => validTabs.includes(t as ExploreTab));
    }

    const result = await client.getNews(args.count ?? 10, {
      tabs,
      withTweets: args.withTweets,
    });

    if (!result.success) {
      return { error: result.error ?? 'Failed to get news' };
    }

    return {
      items: formatNewsItems(result.items),
      count: result.items.length,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_search - Search tweets by query
 */
export async function twitterSearch(args: {
  query: string;
  count?: number;
  cursor?: string;
}) {
  try {
    const client = await getTwitterClient();
    const count = args.count ?? 20;

    const result = await client.search(args.query, count);

    if (!result.success) {
      return { error: result.error ?? 'Search failed' };
    }

    return {
      tweets: formatTweets(result.tweets ?? []),
      count: result.tweets?.length ?? 0,
      query: args.query,
      nextCursor: result.nextCursor,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_likes - Get liked tweets
 */
export async function twitterLikes(args: {
  count?: number;
  all?: boolean;
  cursor?: string;
}) {
  try {
    const client = await getTwitterClient();

    if (args.all) {
      const result = await client.getAllLikes({ cursor: args.cursor });

      if (!result.success) {
        return { error: result.error ?? 'Failed to get likes' };
      }

      return {
        tweets: formatTweets(result.tweets ?? []),
        count: result.tweets?.length ?? 0,
        nextCursor: result.nextCursor,
      };
    }

    const count = args.count ?? 20;
    const result = await client.getLikes(count);

    if (!result.success) {
      return { error: result.error ?? 'Failed to get likes' };
    }

    return {
      tweets: formatTweets(result.tweets ?? []),
      count: result.tweets?.length ?? 0,
      nextCursor: result.nextCursor,
    };
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

/**
 * twitter_read - Read a specific tweet by ID or URL
 */
export async function twitterRead(args: {
  tweetId?: string;
  url?: string;
  includeReplies?: boolean;
  includeThread?: boolean;
}) {
  try {
    const client = await getTwitterClient();

    // Extract tweet ID from URL if provided
    let tweetId = args.tweetId;
    if (!tweetId && args.url) {
      const match = args.url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
      if (match) {
        tweetId = match[1];
      } else {
        return { error: 'Invalid tweet URL format' };
      }
    }

    if (!tweetId) {
      return { error: 'Either tweetId or url is required' };
    }

    const result = await client.getTweet(tweetId);

    if (!result.success || !result.tweet) {
      return { error: result.error ?? 'Tweet not found' };
    }

    const response: {
      tweet: ReturnType<typeof formatTweet>;
      replies?: ReturnType<typeof formatTweets>;
      thread?: ReturnType<typeof formatTweets>;
    } = {
      tweet: formatTweet(result.tweet),
    };

    // Optionally fetch replies
    if (args.includeReplies) {
      const repliesResult = await client.getReplies(tweetId);
      if (repliesResult.success && repliesResult.tweets) {
        response.replies = formatTweets(repliesResult.tweets);
      }
    }

    // Optionally fetch full thread
    if (args.includeThread) {
      const threadResult = await client.getThread(tweetId);
      if (threadResult.success && threadResult.tweets) {
        response.thread = formatTweets(threadResult.tweets);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof TwitterClientError && error.code === 'NO_CREDENTIALS') {
      return noCredentialsError();
    }
    return apiError(error);
  }
}

// Helper functions for formatting output

function formatUser(user: TwitterUser) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    description: user.description,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    isBlueVerified: user.isBlueVerified,
    profileImageUrl: user.profileImageUrl?.replace('_normal', '_400x400'),
    profileUrl: `https://x.com/${user.username}`,
  };
}

function formatUsers(users: TwitterUser[]) {
  return users.map(formatUser);
}

interface FormattedTweet {
  id: string;
  text: string;
  author: { username: string; name: string };
  authorId?: string;
  createdAt?: string;
  replyCount?: number;
  retweetCount?: number;
  likeCount?: number;
  url: string;
  conversationId?: string;
  inReplyToStatusId?: string;
  quotedTweet?: FormattedTweet;
  media?: TweetData['media'];
}

function formatTweet(tweet: TweetData): FormattedTweet {
  return {
    id: tweet.id,
    text: tweet.text,
    author: tweet.author,
    authorId: tweet.authorId,
    createdAt: tweet.createdAt,
    replyCount: tweet.replyCount,
    retweetCount: tweet.retweetCount,
    likeCount: tweet.likeCount,
    url: `https://x.com/${tweet.author.username}/status/${tweet.id}`,
    conversationId: tweet.conversationId,
    inReplyToStatusId: tweet.inReplyToStatusId,
    quotedTweet: tweet.quotedTweet ? formatTweet(tweet.quotedTweet) : undefined,
    media: tweet.media,
  };
}

function formatTweets(tweets: TweetData[]) {
  return tweets.map(formatTweet);
}

function formatNewsItems(items: NewsItem[]) {
  return items.map((item) => ({
    id: item.id,
    headline: item.headline,
    category: item.category,
    timeAgo: item.timeAgo,
    postCount: item.postCount,
    description: item.description,
    url: item.url,
    tweets: item.tweets ? formatTweets(item.tweets) : undefined,
  }));
}
