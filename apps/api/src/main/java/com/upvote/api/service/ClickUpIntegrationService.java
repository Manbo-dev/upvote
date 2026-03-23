package com.upvote.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upvote.api.domain.Integration;
import com.upvote.api.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Handles ClickUp API v2 calls: OAuth token exchange, task creation, space/list listing.
 */
@Service
@Slf4j
public class ClickUpIntegrationService {

    private static final String AUTH_URL = "https://app.clickup.com/api";
    private static final String TOKEN_URL = "https://api.clickup.com/api/v2/oauth/token";
    private static final String API_BASE = "https://api.clickup.com/api/v2";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.integrations.clickup.client-id:}")
    private String clientId;

    @Value("${app.integrations.clickup.client-secret:}")
    private String clientSecret;

    @Value("${app.integrations.oauth-callback-base-url:http://localhost:5173}")
    private String callbackBaseUrl;

    public ClickUpIntegrationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    /**
     * Builds the ClickUp OAuth2 authorization URL.
     */
    public String buildAuthorizationUrl(String state) {
        return AUTH_URL
                + "?client_id=" + clientId
                + "&redirect_uri=" + callbackBaseUrl + "/integrations/clickup/callback"
                + "&state=" + state;
    }

    /**
     * Exchanges the OAuth authorization code for an access token.
     * ClickUp tokens do not expire (no refresh token needed).
     */
    public Map<String, Object> exchangeCodeForTokens(String code) {
        Map<String, String> body = Map.of(
                "client_id", clientId,
                "client_secret", clientSecret,
                "code", code
        );

        String response = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode node = objectMapper.readTree(response);
            return Map.of(
                    "accessToken", node.path("access_token").asText()
            );
        } catch (Exception e) {
            log.error("[CLICKUP] Failed to parse token response", e);
            throw new BusinessException("Failed to complete ClickUp authentication");
        }
    }

    /**
     * Fetches the authorized user's teams (workspaces).
     * Returns the first team's ID and name.
     */
    public Map<String, String> getTeamInfo(String accessToken) {
        String response = restClient.get()
                .uri(API_BASE + "/team")
                .header("Authorization", accessToken)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode teams = root.path("teams");
            if (teams.isEmpty()) {
                throw new BusinessException("No ClickUp workspaces found for this account");
            }
            JsonNode team = teams.get(0);
            return Map.of(
                    "teamId", team.path("id").asText(),
                    "teamName", team.path("name").asText()
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[CLICKUP] Failed to fetch team info", e);
            throw new BusinessException("Failed to fetch ClickUp workspace information");
        }
    }

    /**
     * Lists spaces for a given team, then lists folders/lists within each space.
     * Returns a flat list of lists the user can create tasks in.
     */
    public List<Map<String, String>> listLists(Integration integration) {
        String teamId = integration.getTeamId();
        String token = integration.getAccessToken();

        // Get spaces
        String spacesResponse = restClient.get()
                .uri(API_BASE + "/team/" + teamId + "/space?archived=false")
                .header("Authorization", token)
                .retrieve()
                .body(String.class);

        List<Map<String, String>> allLists = new ArrayList<>();

        try {
            JsonNode spaces = objectMapper.readTree(spacesResponse).path("spaces");
            for (JsonNode space : spaces) {
                String spaceId = space.path("id").asText();
                String spaceName = space.path("name").asText();

                // Folderless lists
                String folderlessResponse = restClient.get()
                        .uri(API_BASE + "/space/" + spaceId + "/list?archived=false")
                        .header("Authorization", token)
                        .retrieve()
                        .body(String.class);

                JsonNode folderlessLists = objectMapper.readTree(folderlessResponse).path("lists");
                for (JsonNode list : folderlessLists) {
                    allLists.add(Map.of(
                            "id", list.path("id").asText(),
                            "name", spaceName + " / " + list.path("name").asText()
                    ));
                }

                // Folders and their lists
                String foldersResponse = restClient.get()
                        .uri(API_BASE + "/space/" + spaceId + "/folder?archived=false")
                        .header("Authorization", token)
                        .retrieve()
                        .body(String.class);

                JsonNode folders = objectMapper.readTree(foldersResponse).path("folders");
                for (JsonNode folder : folders) {
                    String folderName = folder.path("name").asText();
                    for (JsonNode list : folder.path("lists")) {
                        allLists.add(Map.of(
                                "id", list.path("id").asText(),
                                "name", spaceName + " / " + folderName + " / " + list.path("name").asText()
                        ));
                    }
                }
            }
        } catch (Exception e) {
            log.error("[CLICKUP] Failed to list lists for teamId={}", teamId, e);
            throw new BusinessException("Failed to list ClickUp lists");
        }

        return allLists;
    }

    /**
     * Creates a task in a ClickUp list. Returns task ID and URL.
     */
    public Map<String, String> createTask(Integration integration, String listId,
                                           String title, String description) {
        String url = API_BASE + "/list/" + listId + "/task";

        Map<String, Object> body = Map.of(
                "name", title,
                "description", description
        );

        String response = restClient.post()
                .uri(url)
                .header("Authorization", integration.getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode node = objectMapper.readTree(response);
            return Map.of(
                    "taskId", node.path("id").asText(),
                    "taskUrl", node.path("url").asText()
            );
        } catch (Exception e) {
            log.error("[CLICKUP] Failed to create task", e);
            throw new BusinessException("Failed to create ClickUp task");
        }
    }

    /**
     * Registers a webhook for task status updates.
     */
    public String registerWebhook(Integration integration, String webhookUrl) {
        String url = API_BASE + "/team/" + integration.getTeamId() + "/webhook";

        Map<String, Object> body = Map.of(
                "endpoint", webhookUrl,
                "events", List.of("taskStatusUpdated")
        );

        String response = restClient.post()
                .uri(url)
                .header("Authorization", integration.getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode node = objectMapper.readTree(response);
            return node.path("id").asText();
        } catch (Exception e) {
            log.error("[CLICKUP] Failed to register webhook", e);
            throw new BusinessException("Failed to register ClickUp webhook");
        }
    }
}
