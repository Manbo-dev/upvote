import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductBySlug } from '../services/products';
import {
  getSuggestions,
  voteSuggestion,
  createSuggestion,
} from '../services/suggestions';
import { getComments, addComment } from '../services/comments';
import type { SuggestionResponse } from '../services/suggestions';
import SuggestionCard from '../components/SuggestionCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

export default function PublicBoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<SuggestionResponse | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authWarning, setAuthWarning] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
  });

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

  const voteMutation = useMutation({
    mutationFn: (id: string) => voteSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', slug] });
    },
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

  const commentMutation = useMutation({
    mutationFn: () => addComment(selectedSuggestion!.id, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', selectedSuggestion?.id],
      });
      setCommentText('');
    },
  });

  const handleVote = (id: string) => {
    if (!isAuthenticated) {
      setAuthWarning(true);
      setTimeout(() => setAuthWarning(false), 3000);
      return;
    }
    voteMutation.mutate(id);
  };

  const handleNewSuggestion = () => {
    if (!isAuthenticated) {
      setAuthWarning(true);
      setTimeout(() => setAuthWarning(false), 3000);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div
            className="mb-2 h-1.5 w-12 rounded-full"
            style={{ backgroundColor: product?.widgetColor || '#6366f1' }}
          />
          <h1 className="text-2xl font-bold text-gray-900">
            {product?.name || 'Carregando...'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vote nas sugestoes que voce mais deseja ou crie a sua
          </p>
        </div>
      </header>

      {/* Aviso de autenticação */}
      {authWarning && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            Voce precisa estar logado para votar ou criar sugestoes.{' '}
            <a href="/login" className="font-medium underline">
              Fazer login
            </a>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleNewSuggestion}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Nova Sugestao
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : suggestions?.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              Nenhuma sugestao ainda. Seja o primeiro a criar uma!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions?.map((suggestion) => (
              <div key={suggestion.id}>
                <SuggestionCard
                  suggestion={suggestion}
                  onVote={handleVote}
                  onClick={() =>
                    setSelectedSuggestion(
                      selectedSuggestion?.id === suggestion.id
                        ? null
                        : suggestion,
                    )
                  }
                />

                {/* Comentários expandidos */}
                {selectedSuggestion?.id === suggestion.id && (
                  <div className="ml-[4.5rem] mt-2 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <StatusBadge status={suggestion.status} />
                    </div>

                    <h4 className="mb-2 text-sm font-semibold text-gray-700">
                      Comentarios
                    </h4>
                    <div className="mb-3 space-y-2">
                      {comments?.length === 0 && (
                        <p className="text-sm text-gray-400">
                          Nenhum comentario.
                        </p>
                      )}
                      {comments?.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-lg bg-gray-50 p-3 text-sm"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium">
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

                    {isAuthenticated && (
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
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        Powered by <span className="font-medium text-primary-500">Upvote</span>
      </footer>

      {/* Modal nova sugestão */}
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
            />
          </div>
          <div className="flex justify-end gap-3">
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
              Criar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
