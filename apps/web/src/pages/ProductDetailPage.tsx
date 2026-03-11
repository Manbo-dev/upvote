import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuggestions,
  createSuggestion,
  voteSuggestion,
  updateSuggestionStatus,
  type SuggestionStatus,
  type SuggestionResponse,
} from '../services/suggestions';
import { getComments, addComment } from '../services/comments';
import SuggestionCard from '../components/SuggestionCard';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const STATUS_TABS: { label: string; value: SuggestionStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Abertas', value: 'OPEN' },
  { label: 'Planejadas', value: 'PLANNED' },
  { label: 'Em Progresso', value: 'IN_PROGRESS' },
  { label: 'Concluidas', value: 'DONE' },
];

const ALL_STATUSES: SuggestionStatus[] = [
  'OPEN',
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
  'CLOSED',
];

export default function ProductDetailPage() {
  const { productId: slug } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SuggestionStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<SuggestionResponse | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestions', slug],
    queryFn: () => getSuggestions(slug!),
    enabled: !!slug,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', selectedSuggestion?.id],
    queryFn: () => getComments(selectedSuggestion!.id),
    enabled: !!selectedSuggestion,
  });

  const createMutation = useMutation({
    mutationFn: () => createSuggestion(slug!, { title, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', slug] });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    },
  });

  const voteMutation = useMutation({
    mutationFn: (id: string) => voteSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', slug] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: SuggestionStatus;
    }) => updateSuggestionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', slug] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment(selectedSuggestion!.id, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', selectedSuggestion?.id],
      });
      setCommentText('');
    },
  });

  const filtered =
    activeTab === 'ALL'
      ? suggestions
      : suggestions?.filter((s) => s.status === activeTab);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sugestoes</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Nova Sugestao
        </button>
      </div>

      {/* Filtro por status */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((suggestion) => (
            <div key={suggestion.id}>
              <SuggestionCard
                suggestion={suggestion}
                onVote={(id) => voteMutation.mutate(id)}
                onClick={() =>
                  setSelectedSuggestion(
                    selectedSuggestion?.id === suggestion.id
                      ? null
                      : suggestion,
                  )
                }
                isVoting={voteMutation.isPending}
              />

              {/* Painel expandido com comentários e controle de status */}
              {selectedSuggestion?.id === suggestion.id && (
                <div className="ml-[4.5rem] mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {/* Alterar status */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <select
                      value={suggestion.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: suggestion.id,
                          status: e.target.value as SuggestionStatus,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <StatusBadge status={suggestion.status} />
                  </div>

                  {/* Comentários */}
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">
                    Comentarios
                  </h4>
                  <div className="mb-3 space-y-2">
                    {comments?.length === 0 && (
                      <p className="text-sm text-gray-400">
                        Nenhum comentario ainda.
                      </p>
                    )}
                    {comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg bg-white p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {comment.authorName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString(
                              'pt-BR',
                            )}
                          </span>
                        </div>
                        <p className="text-gray-600">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Adicionar comentário */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      commentMutation.mutate();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escreva um comentario..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={
                        !commentText.trim() || commentMutation.isPending
                      }
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para nova sugestão */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Sugestao"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Titulo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Resumo da sugestao"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descricao
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Descreva sua sugestao em detalhes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Sugestao'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
