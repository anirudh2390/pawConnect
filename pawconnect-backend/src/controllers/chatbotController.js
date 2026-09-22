const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

exports.handleChatbotMessage = async (req, res, next) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                success: false, 
                message: 'AI API Key is missing. Please contact support.' 
            });
        }

        const systemInstruction = "You are PawConnect AI, a friendly, empathetic, and knowledgeable assistant for the PawConnect pet adoption platform. Your goal is to help users find pets to adopt, provide general advice on pet care, and guide users on how to use the PawConnect website (like browsing pets, registering, and contacting shelters). Keep your responses concise, helpful, and formatted clearly.";

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-3.8-flash',
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemInstruction }]
            }
        });
        
        // Convert frontend history format to Gemini format if provided, otherwise start fresh
        let chatHistory = [];
        if (history && history.length > 0) {
            chatHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));
        }
        
        // Gemini requires the first message in history to be from the 'user'
        if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
            chatHistory.shift(); // Remove the initial greeting from the model
        }

        let responseText = "";
        try {
            const chat = model.startChat({
                history: chatHistory
            });
            const result = await chat.sendMessage(message);
            responseText = result.response.text();
        } catch (apiError) {
            console.warn('API Error (falling back to mock):', apiError.message);
            // Fallback response if the model is overloaded (503) or unavailable
            responseText = "Hello! 🐾 I am PawConnect AI. Google's AI servers are currently experiencing high demand, so I am operating in offline mode right now! I can still tell you that PawConnect is the best place to adopt a furry friend. How can I help you today?";
        }

        res.status(200).json({
            success: true,
            reply: responseText
        });
    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process AI response', error: error.message });
    }
};
