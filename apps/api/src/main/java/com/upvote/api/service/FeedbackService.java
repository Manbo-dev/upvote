package com.upvote.api.service;

import com.upvote.api.ai.AiService;
import com.upvote.api.ai.GroupSuggestion;
import com.upvote.api.ai.PageContext;
import com.upvote.api.ai.SimilarityResult;
import com.upvote.api.domain.*;
import com.upvote.api.dto.FeedbackGroupResponse;
import com.upvote.api.dto.FeedbackSubmitRequest;
import com.upvote.api.dto.FeedbackSubmitResponse;
import com.upvote.api.dto.FollowUpRequest;
import com.upvote.api.repository.FeedbackGroupRepository;
import com.upvote.api.repository.FeedbackRepository;
import com.upvote.api.repository.CanalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para processamento inteligente de feedbacks
 */
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackGroupRepository feedbackGroupRepository;
    private final CanalRepository canalRepository;
    private final AiService aiService;

    /**
     * Submete um feedback enviado pelo widget (endpoint público, sem auth)
     * Canal identificado pela API key enviada no header
     */
    @Transactional
    public FeedbackSubmitResponse submitFeedback(String apiKey, FeedbackSubmitRequest request) {
        // 1. Busca o canal pela API key
        Canal canal = canalRepository.findByApiKey(apiKey)
                .orElseThrow(() -> new IllegalArgumentException("Chave de API inválida"));

        // 2. Cria PageContext a partir do request
        PageContext pageContext = new PageContext(
                request.pageUrl(),
                request.pageTitle(),
                request.triggerType(),
                request.lastInteraction(),
                request.deviceType()
        );

        // 3. Usa AiService para sintetizar o comentário
        String synthesized = aiService.synthesizeFeedback(request.message(), pageContext);

        // 4. Busca grupos existentes do canal
        List<FeedbackGroup> existingGroups = feedbackGroupRepository
                .findByCanalIdOrderByVoteCountDesc(canal.getId());

        // 5. Usa AiService para encontrar feedback similar
        SimilarityResult similarity = aiService.findSimilarFeedback(synthesized, existingGroups);

        // 6. Se alta confiança (isMatch) → agrupa no grupo existente
        if (similarity.isMatch() && similarity.matchedGroupId() != null) {
            FeedbackGroup matchedGroup = feedbackGroupRepository.findById(similarity.matchedGroupId())
                    .orElseThrow(() -> new IllegalStateException("Grupo de feedback não encontrado"));

            // Incrementa voteCount do grupo existente
            matchedGroup.setVoteCount(matchedGroup.getVoteCount() + 1);
            feedbackGroupRepository.save(matchedGroup);

            // Salva feedback vinculado ao grupo
            Feedback feedback = buildFeedback(canal, request, synthesized, pageContext);
            feedback.setFeedbackGroup(matchedGroup);
            feedback.setStatus(FeedbackStatus.PROCESSED);
            feedback = feedbackRepository.save(feedback);

            return new FeedbackSubmitResponse(feedback.getId(), null, true);
        }

        // 7. Se confiança baixa (encontrou candidato mas não bateu threshold)
        if (similarity.confidence() > 0.0 && !similarity.isMatch()) {
            String followUpQuestion = aiService.generateFollowUpQuestion(request.message(), pageContext);

            Feedback feedback = buildFeedback(canal, request, synthesized, pageContext);
            feedback.setFollowUpQuestion(followUpQuestion);
            feedback.setStatus(FeedbackStatus.AWAITING_FOLLOW_UP);
            feedback = feedbackRepository.save(feedback);

            return new FeedbackSubmitResponse(feedback.getId(), followUpQuestion, false);
        }

        // 8. Se não encontrou nenhum similar → cria novo grupo
        GroupSuggestion groupSuggestion = aiService.suggestGroup(synthesized, pageContext);

        FeedbackGroup newGroup = FeedbackGroup.builder()
                .canal(canal)
                .title(groupSuggestion.title())
                .summary(groupSuggestion.summary())
                .build();
        newGroup = feedbackGroupRepository.save(newGroup);

        Feedback feedback = buildFeedback(canal, request, synthesized, pageContext);
        feedback.setFeedbackGroup(newGroup);
        feedback.setStatus(FeedbackStatus.PROCESSED);
        feedback = feedbackRepository.save(feedback);

        return new FeedbackSubmitResponse(feedback.getId(), null, false);
    }

    /**
     * Processa resposta do follow-up do usuário
     */
    @Transactional
    public FeedbackSubmitResponse processFollowUp(UUID feedbackId, FollowUpRequest request) {
        // 1. Busca o feedback pelo id
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback não encontrado"));

        // 2. Salva a resposta do follow-up
        feedback.setFollowUpAnswer(request.answer());

        // 3. Re-analisa com a mensagem original + resposta
        PageContext pageContext = new PageContext(
                feedback.getPageUrl(),
                feedback.getPageTitle(),
                feedback.getTriggerType(),
                feedback.getLastInteraction(),
                feedback.getDeviceType()
        );

        String combinedMessage = feedback.getRawMessage() + " — " + request.answer();
        String reSynthesized = aiService.synthesizeFeedback(combinedMessage, pageContext);
        feedback.setSynthesizedMessage(reSynthesized);

        // 4. Busca grupos existentes e tenta agrupar novamente
        List<FeedbackGroup> existingGroups = feedbackGroupRepository
                .findByCanalIdOrderByVoteCountDesc(feedback.getCanal().getId());

        SimilarityResult similarity = aiService.findSimilarFeedback(reSynthesized, existingGroups);

        if (similarity.isMatch() && similarity.matchedGroupId() != null) {
            // Agrupa no grupo existente
            FeedbackGroup matchedGroup = feedbackGroupRepository.findById(similarity.matchedGroupId())
                    .orElseThrow(() -> new IllegalStateException("Grupo de feedback não encontrado"));

            matchedGroup.setVoteCount(matchedGroup.getVoteCount() + 1);
            feedbackGroupRepository.save(matchedGroup);

            feedback.setFeedbackGroup(matchedGroup);
            feedback.setStatus(FeedbackStatus.PROCESSED);
            feedbackRepository.save(feedback);

            return new FeedbackSubmitResponse(feedback.getId(), null, true);
        }

        // 5. Cria novo grupo se não conseguiu agrupar
        GroupSuggestion groupSuggestion = aiService.suggestGroup(reSynthesized, pageContext);

        FeedbackGroup newGroup = FeedbackGroup.builder()
                .canal(feedback.getCanal())
                .title(groupSuggestion.title())
                .summary(groupSuggestion.summary())
                .build();
        newGroup = feedbackGroupRepository.save(newGroup);

        feedback.setFeedbackGroup(newGroup);
        feedback.setStatus(FeedbackStatus.PROCESSED);
        feedbackRepository.save(feedback);

        return new FeedbackSubmitResponse(feedback.getId(), null, false);
    }

    /**
     * Lista grupos de feedback para o dashboard (endpoint autenticado)
     */
    public List<FeedbackGroupResponse> getFeedbackGroups(String canalSlug, String status) {
        Canal canal = canalRepository.findBySlug(canalSlug)
                .orElseThrow(() -> new IllegalArgumentException("Canal não encontrado"));

        List<FeedbackGroup> groups;

        if (status != null && !status.isBlank()) {
            FeedbackGroupStatus groupStatus = FeedbackGroupStatus.valueOf(status.toUpperCase());
            groups = feedbackGroupRepository
                    .findByCanalIdAndStatusOrderByVoteCountDesc(canal.getId(), groupStatus);
        } else {
            groups = feedbackGroupRepository
                    .findByCanalIdOrderByVoteCountDesc(canal.getId());
        }

        return groups.stream()
                .map(this::toGroupResponse)
                .toList();
    }

    /**
     * Constrói a entidade Feedback a partir do request
     */
    private Feedback buildFeedback(Canal canal, FeedbackSubmitRequest request,
                                   String synthesized, PageContext pageContext) {
        return Feedback.builder()
                .canal(canal)
                .rawMessage(request.message())
                .synthesizedMessage(synthesized)
                .pageUrl(pageContext.pageUrl())
                .pageTitle(pageContext.pageTitle())
                .triggerType(pageContext.triggerType())
                .lastInteraction(pageContext.lastInteraction())
                .deviceType(pageContext.deviceType())
                .build();
    }

    /**
     * Converte um FeedbackGroup para o DTO de resposta
     */
    private FeedbackGroupResponse toGroupResponse(FeedbackGroup group) {
        // Monta o topContext a partir dos feedbacks mais recentes do grupo
        String topContext = buildTopContext(group);

        return new FeedbackGroupResponse(
                group.getId(),
                group.getTitle(),
                group.getSummary(),
                group.getVoteCount(),
                group.getStatus().name(),
                topContext,
                group.getCreatedAt(),
                group.getUpdatedAt()
        );
    }

    /**
     * Constrói o contexto mais relevante do grupo para exibição no dashboard
     * Exemplo: "após 'botão Pagar' na tela de checkout"
     */
    private String buildTopContext(FeedbackGroup group) {
        List<Feedback> feedbacks = feedbackRepository.findByFeedbackGroupId(group.getId());

        if (feedbacks.isEmpty()) {
            return null;
        }

        // Pega o feedback mais recente que tenha contexto de interação
        return feedbacks.stream()
                .filter(f -> f.getLastInteraction() != null && !f.getLastInteraction().isBlank())
                .reduce((first, second) -> second) // pega o último (mais recente)
                .map(f -> {
                    StringBuilder ctx = new StringBuilder();
                    if (f.getLastInteraction() != null) {
                        ctx.append("após '").append(f.getLastInteraction()).append("'");
                    }
                    if (f.getPageTitle() != null) {
                        ctx.append(" na tela de ").append(f.getPageTitle());
                    }
                    return ctx.toString().trim();
                })
                .orElse(null);
    }
}
