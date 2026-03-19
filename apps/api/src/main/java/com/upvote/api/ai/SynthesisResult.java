package com.upvote.api.ai;

import java.util.List;

/**
 * Structured result returned by the AI after synthesizing a raw feedback message.
 *
 * @param synthesizedText clean, concise version of the original message (max 120 chars)
 * @param category        feedback classification: BUG, SUGGESTION, COMPLAINT, or PRAISE
 * @param tags            list of 2–5 short lowercase keywords extracted from the message
 */
public record SynthesisResult(
        String synthesizedText,
        String category,
        List<String> tags
) {
}
