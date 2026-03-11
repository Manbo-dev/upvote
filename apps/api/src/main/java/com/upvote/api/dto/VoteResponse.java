package com.upvote.api.dto;

public record VoteResponse(
        boolean voted,
        int voteCount
) {}
