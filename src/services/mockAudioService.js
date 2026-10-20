import { MOCK_AUDIO_INPUTS, MOCK_AUDIO_OUTPUTS } from '../data/mockData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getInputDevices = async () => {
    await delay(100);
    return [...MOCK_AUDIO_INPUTS];
};

export const getOutputDevices = async () => {
    await delay(100);
    return [...MOCK_AUDIO_OUTPUTS];
};
