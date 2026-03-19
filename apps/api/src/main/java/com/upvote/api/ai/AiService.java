package com.upvote.api.ai;

/**
 * Injectable AI service abstraction — allows swapping providers (OpenAI, Anthropic, etc.)
 * without changing the consumers.
 */
public interface AiService {

    /**
     * Synthesizes the raw user message into a structured result.
     * The implementation is responsible for loading the system prompt and
     * returning a parsed {@link SynthesisResult}.
     *
     * @param rawMessage the original text submitted by the end user
     * @param context    automatic page context captured by the widget
     * @return structured synthesis with clean text, category and tags
     */
    SynthesisResult synthesizeFeedback(String rawMessage, PageContext context);

    /**
     * Generates a title and summary for a new feedback group.
     *
     * @param synthesizedMessage the AI-synthesized version of the feedback
     * @param context            automatic page context captured by the widget
     * @return suggested title and summary for the new group
     */
    GroupSuggestion suggestGroup(String synthesizedMessage, PageContext context);
}
