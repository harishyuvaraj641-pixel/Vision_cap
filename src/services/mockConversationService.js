import { MOCK_CONVERSATION } from '../data/mockData';

let history = [...MOCK_CONVERSATION];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getHistory = async () => {
    await delay(100);
    return [...history];
};

export const clearHistory = async () => {
    await delay(100);
    history = [];
    return { success: true };
};

export const addMessage = async (msg) => {
    await delay(100);
    const newMsg = {
        id: `msg_${Date.now()}`,
        ...msg
    };
    history.push(newMsg);
    return newMsg;
};
