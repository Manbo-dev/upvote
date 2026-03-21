package com.upvote.api.ai;

import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Stub implementation of {@link AiService} using simple heuristics.
 * Active when {@code GEMINI_API_KEY} is not set — no real AI calls are made.
 */
@Service
public class StubAiService implements AiService {

    @Override
    public SynthesisResult synthesizeFeedback(String rawMessage, PageContext context) {
        String text = rawMessage == null ? "" : rawMessage.trim();
        if (text.length() > 120) {
            text = text.substring(0, 117) + "...";
        }
        return new SynthesisResult(text, "SUGGESTION", List.of("feedback"));
    }

    @Override
    public GroupSuggestion suggestGroup(String synthesizedMessage, PageContext context) {
        String title = synthesizedMessage;
        if (title != null && title.length() > 80) {
            title = title.substring(0, 80) + "...";
        }
        return new GroupSuggestion(title, synthesizedMessage);
    }
}
