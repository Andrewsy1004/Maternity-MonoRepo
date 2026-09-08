import { useState, useEffect, useCallback } from 'react';
import {
  getChatHistory,
  sendChatMessage,
  deleteChatHistory,
  type ChatMessage,
} from '../../services/iaService';

// Extendemos la interfaz localmente para anticipar lo que el backend enviará
interface ExtendedChatMessage extends ChatMessage {
  nivel_riesgo?: 'verde' | 'amarillo' | 'rojo';
  alerta_generada?: boolean;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar el banner de escalamiento al hospital en la UI
  const [escalatedAlert, setEscalatedAlert] = useState<{ active: boolean; nivel?: string } | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChatHistory();
      setMessages(response.mensajes);
    } catch (err: any) {
      console.error('Error loading chat history:', err);
      setError(
        err.response?.data?.detail || 'No se pudo cargar el historial de conversación.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    const userMessage: ExtendedChatMessage = {
      id: `user-msg-${Date.now()}`,
      rol: 'user',
      contenido: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Realizar POST al backend
      const assistantMessage: ExtendedChatMessage = await sendChatMessage(text);
      setMessages((prev) => [...prev, assistantMessage]);

      // HOOK INTEGRACIÓN: Si el backend envía riesgo 'rojo' o alerta_generada, disparamos alerta visual y recarga de semáforo
      if (assistantMessage.nivel_riesgo === 'rojo' || assistantMessage.alerta_generada) {
        setEscalatedAlert({ active: true, nivel: assistantMessage.nivel_riesgo });
        window.dispatchEvent(new CustomEvent('refresh-risk-summary'));
      }
    } catch (err: any) {
      console.error('Error sending chat message:', err);
      setError(
        err.response?.data?.detail || 'No se pudo enviar el mensaje. Intenta nuevamente.'
      );
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteChatHistory();
      setMessages([]);
      setEscalatedAlert(null); // Limpiar alertas al borrar historial
      return true;
    } catch (err: any) {
      console.error('Error clearing chat history:', err);
      setError(
        err.response?.data?.detail || 'No se pudo eliminar el historial.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    clearHistory,
    refreshHistory: loadHistory,
    escalatedAlert,
    clearEscalatedAlert: () => setEscalatedAlert(null),
  };
};