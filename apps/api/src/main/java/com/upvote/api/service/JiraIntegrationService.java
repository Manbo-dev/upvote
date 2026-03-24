package com.upvote.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upvote.api.domain.Integration;
import com.upvote.api.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Handles Jira REST API v3 calls: OAuth token exchange, issue creation, project listing.
 */
@Service
@Slf4j
public class JiraIntegrationService {

    private static final String AUTH_URL = "https://auth.atlassian.com/authorize";
    private static final String TOKEN_URL = "https://auth.atlassian.com/oauth/token";
    private static final String RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources";
    private static final String API_BASE = "https://api.atlassian.com/ex/jira/";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.integrations.jira.client-id:}")
    private String clientId;

    @Value("${app.integrations.jira.client-secret:}")
    private String clientSecret;

    @Value("${app.integrations.oauth-callback-base-url:http://localhost:5173}")
    private String callbackBaseUrl;

    public JiraIntegrationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    /**
     * Builds the Jira OAuth2 authorization URL.
     */
    public String buildAuthorizationUrl(String state) {
        return AUTH_URL
                + "?audience=api.atlassian.com"
                + "&client_id=" + clientId
                + "&scope=read%3Ajira-work%20write%3Ajira-work%20offline_access"
                + "&redirect_uri=" + callbackBaseUrl + "/integrations/jira/callback"
                + "&state=" + state
                + "&response_type=code"
                + "&prompt=consent";
    }

    /**
     * Exchanges the OAuth authorization code for access + refresh tokens.
     * Returns a map with: accessToken, refreshToken, expiresIn.
     */
    public Map<String, Object> exchangeCodeForTokens(String code) {
        Map<String, String> body = Map.of(
                "grant_type", "authorization_code",
                "client_id", clientId,
                "client_secret", clientSecret,
                "code", code,
                "redirect_uri", callbackBaseUrl + "/integrations/jira/callback"
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
                    "accessToken", node.path("access_token").asText(),
                    "refreshToken", node.path("refresh_token").asText(""),
                    "expiresIn", node.path("expires_in").asInt(3600)
            );
        } catch (Exception e) {
            log.error("[JIRA] Failed to parse token response", e);
            throw new BusinessException("Failed to complete Jira authentication");
        }
    }

    /**
     * Refreshes an expired access token using the refresh token.
     */
    public Map<String, Object> refreshAccessToken(String refreshToken) {
        Map<String, String> body = Map.of(
                "grant_type", "refresh_token",
                "client_id", clientId,
                "client_secret", clientSecret,
                "refresh_token", refreshToken
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
                    "accessToken", node.path("access_token").asText(),
                    "refreshToken", node.path("refresh_token").asText(refreshToken),
                    "expiresIn", node.path("expires_in").asInt(3600)
            );
        } catch (Exception e) {
            log.error("[JIRA] Failed to refresh token", e);
            throw new BusinessException("Failed to refresh Jira credentials");
        }
    }

    /**
     * Fetches the list of accessible Jira cloud resources (sites).
     * Returns first site's cloudId and site URL.
     */
    public Map<String, String> getAccessibleResources(String accessToken) {
        String response = restClient.get()
                .uri(RESOURCES_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(String.class);

        try {
            JsonNode nodes = objectMapper.readTree(response);
            if (nodes.isEmpty()) {
                throw new BusinessException("No Jira sites found for this account");
            }
            JsonNode site = nodes.get(0);
            return Map.of(
                    "cloudId", site.path("id").asText(),
                    "siteUrl", site.path("url").asText(),
                    "siteName", site.path("name").asText()
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[JIRA] Failed to fetch accessible resources", e);
            throw new BusinessException("Failed to fetch Jira site information");
        }
    }

    /**
     * Lists projects for the connected Jira site.
     */
    public List<Map<String, String>> listProjects(Integration integration) {
        ensureTokenValid(integration);
        String url = API_BASE + integration.getCloudId() + "/rest/api/3/project/search";

        try {
            String response = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + integration.getAccessToken())
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            List<Map<String, String>> projects = new ArrayList<>();
            for (JsonNode p : root.path("values")) {
                projects.add(Map.of(
                        "key", p.path("key").asText(),
                        "name", p.path("name").asText(),
                        "id", p.path("id").asText()
                ));
            }
            return projects;
        } catch (HttpStatusCodeException e) {
            log.error("[JIRA] HTTP error listing projects: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("Failed to list Jira projects: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("[JIRA] Failed to list projects", e);
            throw new BusinessException("Failed to list Jira projects");
        }
    }

    /**
     * Lists issue types available for a specific project.
     * Returns a list of maps with keys: id, name.
     */
    public List<Map<String, String>> listIssueTypes(Integration integration, String projectKey) {
        ensureTokenValid(integration);
        String url = API_BASE + integration.getCloudId() + "/rest/api/3/project/" + projectKey;

        try {
            String response = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + integration.getAccessToken())
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            List<Map<String, String>> issueTypes = new ArrayList<>();
            for (JsonNode t : root.path("issueTypes")) {
                if (!t.path("subtask").asBoolean(false)) {
                    issueTypes.add(Map.of(
                            "id", t.path("id").asText(),
                            "name", t.path("name").asText()
                    ));
                }
            }
            return issueTypes;
        } catch (HttpStatusCodeException e) {
            log.error("[JIRA] HTTP error listing issue types for project={}: status={}, body={}", projectKey, e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("Failed to list Jira issue types: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("[JIRA] Failed to list issue types for project={}", projectKey, e);
            throw new BusinessException("Failed to list Jira issue types");
        }
    }

    /**
     * Creates an issue in Jira and returns the issue key and URL.
     */
    public Map<String, String> createIssue(Integration integration, String projectKey,
                                            String issueType, String title, String description) {
        ensureTokenValid(integration);
        String url = API_BASE + integration.getCloudId() + "/rest/api/3/issue";

        String effectiveIssueType = issueType != null ? issueType : "Task";

        Map<String, Object> body = Map.of(
                "fields", Map.of(
                        "project", Map.of("key", projectKey),
                        "summary", title,
                        "description", Map.of(
                                "type", "doc",
                                "version", 1,
                                "content", List.of(Map.of(
                                        "type", "paragraph",
                                        "content", List.of(Map.of(
                                                "type", "text",
                                                "text", description
                                        ))
                                ))
                        ),
                        "issuetype", Map.of("name", effectiveIssueType)
                )
        );

        try {
            String response = restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + integration.getAccessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            String issueKey = node.path("key").asText();
            String issueUrl = integration.getSiteUrl() + "/browse/" + issueKey;
            return Map.of(
                    "issueKey", issueKey,
                    "issueUrl", issueUrl,
                    "issueId", node.path("id").asText()
            );
        } catch (HttpStatusCodeException e) {
            log.error("[JIRA] HTTP error creating issue: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("Failed to create Jira issue: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("[JIRA] Failed to create issue", e);
            throw new BusinessException("Failed to create Jira issue");
        }
    }

    /**
     * Ensures the integration token is still valid; refreshes if expired.
     */
    private void ensureTokenValid(Integration integration) {
        if (integration.getTokenExpiry() != null
                && integration.getTokenExpiry().isBefore(LocalDateTime.now().plusMinutes(5))) {
            log.info("[JIRA] Token expiring soon, refreshing for userId={}", integration.getUser().getId());
            Map<String, Object> tokens = refreshAccessToken(integration.getRefreshToken());
            integration.setAccessToken((String) tokens.get("accessToken"));
            String newRefresh = (String) tokens.get("refreshToken");
            if (newRefresh != null && !newRefresh.isBlank()) {
                integration.setRefreshToken(newRefresh);
            }
            int expiresIn = (int) tokens.get("expiresIn");
            integration.setTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn));
            // The caller (IntegrationService) is @Transactional, so this will be saved
        }
    }
}
