package com.upvote.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Gemini AI implementation of {@link AiService}.
 * Active only when the {@code app.gemini.api-key} property is set.
 * Uses the {@code gemini-2.0-flash-lite} model by default (cheapest tier).
 */
@Service
@Primary
@ConditionalOnExpression("!'${app.gemini.api-key:}'.isEmpty()")
public class GeminiAiService implements AiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);
    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String synthesisPrompt;
    private final String groupSuggestionPrompt;

    public GeminiAiService(
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model:gemini-2.0-flash-lite}") String model,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
        try {
            this.synthesisPrompt = loadPrompt("ai/prompts/feedback_synthesis.txt");
            this.groupSuggestionPrompt = loadPrompt("ai/prompts/group_suggestion.txt");
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load AI prompts", e);
        }
        log.info("GeminiAiService initialized with model: {}", model);
    }

    @Override
    public SynthesisResult synthesizeFeedback(String rawMessage, PageContext context) {
        String userMessage = buildSynthesisUserMessage(rawMessage, context);
        String responseJson = callGemini(synthesisPrompt, userMessage);
        return parseSynthesisResult(responseJson, rawMessage);
    }

    @Override
    public GroupSuggestion suggestGroup(String synthesizedMessage, PageContext context) {
        String userMessage = buildGroupSuggestionUserMessage(synthesizedMessage, context);
        String responseJson = callGemini(groupSuggestionPrompt, userMessage);
        return parseGroupSuggestion(responseJson, synthesizedMessage);
    }

    private String callGemini(String systemPrompt, String userMessage) {
        String url = GEMINI_BASE_URL + model + ":generateContent?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("parts", List.of(Map.of("text", userMessage)))),
                "generationConfig", Map.of("responseMimeType", "application/json")
        );

        String raw = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(raw);
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();
        } catch (Exception e) {
            log.error("Failed to extract text from Gemini response: {}", raw, e);
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    private String buildSynthesisUserMessage(String rawMessage, PageContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Raw message: ").append(rawMessage).append("\n");
        if (context != null) {
            sb.append("Page context:\n");
            if (context.pageUrl() != null) sb.append("- pageUrl: ").append(context.pageUrl()).append("\n");
            if (context.pageTitle() != null) sb.append("- pageTitle: ").append(context.pageTitle()).append("\n");
            if (context.triggerType() != null) sb.append("- triggerType: ").append(context.triggerType()).append("\n");
            if (context.lastInteraction() != null) sb.append("- lastInteraction: ").append(context.lastInteraction()).append("\n");
            if (context.deviceType() != null) sb.append("- deviceType: ").append(context.deviceType()).append("\n");
        }
        return sb.toString();
    }

    private String buildGroupSuggestionUserMessage(String synthesizedMessage, PageContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Synthesized feedback: ").append(synthesizedMessage).append("\n");
        if (context != null && context.pageTitle() != null) {
            sb.append("Page: ").append(context.pageTitle()).append("\n");
        }
        return sb.toString();
    }

    private SynthesisResult parseSynthesisResult(String json, String fallback) {
        try {
            JsonNode node = objectMapper.readTree(json);
            String text = node.path("synthesizedText").asText(fallback);
            String category = node.path("category").asText("SUGGESTION");
            List<String> tags = objectMapper.convertValue(
                    node.path("tags"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
            return new SynthesisResult(text, category, tags.isEmpty() ? List.of("feedback") : tags);
        } catch (Exception e) {
            log.error("Failed to parse SynthesisResult from JSON: {}", json, e);
            return new SynthesisResult(fallback, "SUGGESTION", List.of("feedback"));
        }
    }

    private GroupSuggestion parseGroupSuggestion(String json, String fallback) {
        try {
            JsonNode node = objectMapper.readTree(json);
            String title = node.path("title").asText(fallback);
            String summary = node.path("summary").asText(fallback);
            return new GroupSuggestion(title, summary);
        } catch (Exception e) {
            log.error("Failed to parse GroupSuggestion from JSON: {}", json, e);
            return new GroupSuggestion(fallback, fallback);
        }
    }

    private String loadPrompt(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
    }
}
