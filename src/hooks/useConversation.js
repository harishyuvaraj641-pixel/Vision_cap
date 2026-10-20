import { useState, useEffect, useCallback } from 'react';
import { getHistory, clearHistory as clearHistoryService, addMessage as addMessageService } from '../services/mockConversationService';

export const useConversation = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        const history = await getHistory();
        setMessages(history);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const addMessage = useCallback(async (role, text, metadata = {}) => {
        const msg = { role, text, ...metadata };
        const savedMsg = await addMessageService(msg);
        setMessages(prev => [...prev, savedMsg]);
        return savedMsg;
    }, []);

    const clearHistory = useCallback(async () => {
        await clearHistoryService();
        setMessages([]);
    }, []);

    return {
        messages,
        isLoading,
        addMessage,
        clearHistory
    };
};
