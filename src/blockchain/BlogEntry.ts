/**
 * Type to describe result returned by the follow_api's get_blog_entries.
 */
export interface BlogEntry {
    /**
     * Who authored the post (different if the post was reblogged).
     */
    author: string;

    /**
     * Permlink of the post.
     */
    permlink: string;

    /**
     * On whom blog the post is present. get_blog_entries(username) returns entries with blog=username.
     */
    blog: string;

    /**
     * ISO datetime string (eg. 1970-01-01T00:00:00)
     */
    reblog_on: string;

    /**
     * It is incremented for each new entry user creates. So the first entry has id=0, the second id=1, and so on.
     */
    entry_id: number;
}