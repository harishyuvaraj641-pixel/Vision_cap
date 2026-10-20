const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const askVisionQuestion = async (question, cameraId = null, imageBase64 = null, language = 'en') => {
    await delay(1200);
    const isTamil = (language || '').toLowerCase().startsWith('ta') || /[\u0B80-\u0BFF]/.test(question || '');

    const englishAnswers = [
        `In front of you is a clear pathway with a desk and computer setup. Lighting is clear with no immediate hazards.`,
        `I observe a room with standard interior lighting. The foreground contains a flat desk surface with no obstacles.`,
        `Visible in the scene is a workspace area. The path ahead is open and safe to navigate.`
    ];

    const tamilAnswers = [
        `உங்கள் முன்னால் ஒரு மேசையும் கணினியும் உள்ளன. பாதை தெளிவாக உள்ளது, எந்தத் தடைகளும் இல்லை.`,
        `அறைக்குள் நல்ல வெளிச்சம் உள்ளது. உங்கள் முன் மேசை பரப்பில் எந்த ஆபத்தான பொருட்களும் இல்லை.`,
        `உங்கள் பணியிடம் காட்சியளிக்கிறது. நேராகச் செல்லும் பாதை பாதுகாப்பாகவும் தெளிவாகவும் உள்ளது.`
    ];

    const pool = isTamil ? tamilAnswers : englishAnswers;
    const answer = pool[Math.floor(Math.random() * pool.length)];
    return {
        success: true,
        answer: answer,
        text: answer,
        question: question,
        frame_id: `demo_${Date.now()}`,
        camera_id: cameraId || 'laptop_webcam',
        latency_ms: 1200,
        is_demo: true,
        isDemo: true
    };
};
