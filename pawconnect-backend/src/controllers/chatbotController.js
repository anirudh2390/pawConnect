const { GoogleGenerativeAI } = require('@google/generative-ai');
const Pet = require('../models/Pet');

/**
 * Intelligent Knowledge Base engine when Gemini API key is omitted or rate-limited.
 */
const generateKnowledgeBaseReply = async (message) => {
    const q = message.toLowerCase().trim();

    // 1. Available pets inquiries
    if (q.includes('available') || q.includes('find pet') || q.includes('adopt a dog') || q.includes('adopt a cat') || q.includes('browse') || q.includes('what pets') || q.includes('which pet') || q.includes('show me')) {
        try {
            let filter = { status: 'Approved' };
            if (q.includes('dog')) filter.type = 'Dog';
            if (q.includes('cat')) filter.type = 'Cat';

            const pets = await Pet.find(filter).limit(4).select('name type breed location.city age');
            if (pets && pets.length > 0) {
                const petList = pets.map(p => `• **${p.name}** (${p.breed} ${p.type}, ~${p.age?.number || 1} ${p.age?.unit || 'Years'}) in ${p.location?.city || 'India'}`).join('\n');
                return `Here are some wonderful pets currently waiting for a loving home on PawConnect:\n\n${petList}\n\nYou can view photos, medical history, and submit an application on our [Browse Pets](/browse) page! 🐾`;
            }
        } catch {
            // continue to default
        }
    }

    // 2. How to adopt
    if (q.includes('how to adopt') || q.includes('adoption process') || q.includes('how do i adopt') || q.includes('steps to adopt') || q.includes('application')) {
        return `Adopting a pet on PawConnect is simple and transparent! Here are the 4 steps:\n\n1. **Explore listings**: Visit the [Browse Pets](/browse) page and filter by species, breed, age, or location.\n2. **View Details**: Click on any pet to learn about their temperament, vaccination status, and medical history.\n3. **Apply**: Click **Apply for Adoption** to submit your request to the pet's owner.\n4. **Chat & Finalize**: Once you apply, an instant chat room opens with the pet owner so you can coordinate questions and meetups! 🐾`;
    }

    // 3. How to list / surrender a pet
    if (q.includes('list') || q.includes('sell') || q.includes('rehome') || q.includes('post a pet') || q.includes('create listing') || q.includes('give away')) {
        return `To list a pet for adoption:\n\n1. [Log in or register](/login) for an account.\n2. Click **Create Listing** in the top navigation.\n3. Fill in the pet's details (breed, age, health history, personality) and upload photos.\n4. Submit for review! Our admin team verifies listings to ensure pet safety before publishing. 🐶`;
    }

    // 4. Greetings
    if (q === 'hi' || q === 'hello' || q.startsWith('hi ') || q.startsWith('hello ') || q === 'hey' || q.startsWith('hey ') || q === 'help') {
        return `Hello there! 🐾 I am **PawConnect AI**, your adoption assistant.\n\nI can help you with:\n• Finding available dogs and cats for adoption\n• Explaining the adoption workflow\n• Tips on preparing your home for a new pet\n• How to list a pet for adoption\n\nWhat would you like to know today?`;
    }

    // 5. Pet Care / Feeding / Training
    if (q.includes('feed') || q.includes('food') || q.includes('diet') || q.includes('puppy') || q.includes('kitten') || q.includes('care') || q.includes('vaccin') || q.includes('vet') || q.includes('train')) {
        return `Here are some essential pet care recommendations:\n\n• **Nutrition**: Feed age-appropriate, balanced food. Always provide clean, fresh drinking water.\n• **Vaccinations**: Puppies and kittens need core vaccines (DHPP, Rabies, FVRCP) starting around 6-8 weeks.\n• **Adjustment Period**: Give newly adopted pets 3-7 days of quiet space to adjust to their new environment.\n• **Routine Vet Care**: Schedule regular check-ups and maintain flea and tick prevention.\n\nIs there a specific pet or breed you'd like advice for? 🩺`;
    }

    // 6. Admin / Verification / Safety
    if (q.includes('admin') || q.includes('safety') || q.includes('scam') || q.includes('fraud') || q.includes('verified')) {
        return `PawConnect prioritizes safety for both adopters and animals:\n• Every pet listing is reviewed by administrators before going live.\n• We feature built-in fraud risk analysis for listings.\n• All messaging occurs through authenticated platform chat to protect your privacy. 🛡️`;
    }

    // 7. General fallback
    return `I am here to help you navigate PawConnect! 🐾\n\nYou can ask me:\n• *"What pets are available?"*\n• *"How do I adopt a dog?"*\n• *"How do I list a pet for adoption?"*\n• *"What should I feed a puppy?"*\n\nFeel free to explore our [Browse Pets](/browse) page anytime!`;
};

exports.handleChatbotMessage = async (req, res, next) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // If Gemini API Key is configured and not a placeholder, try real Gemini API
        if (apiKey && apiKey !== 'dummy_key' && !apiKey.startsWith('placeholder') && apiKey.trim().length > 10) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey.trim());
                const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

                // Fetch currently approved pets to provide live context to Gemini
                let livePetsSummary = '';
                try {
                    const livePets = await Pet.find({ status: 'Approved' }).limit(5).select('name type breed location.city');
                    if (livePets && livePets.length > 0) {
                        livePetsSummary = `Currently approved pets on PawConnect: ${livePets.map(p => `${p.name} (${p.breed} ${p.type} in ${p.location?.city || 'India'})`).join(', ')}.`;
                    }
                } catch {
                    // Non-critical, continue without DB summary
                }

                const systemInstruction = `You are PawConnect AI, a friendly, empathetic, and knowledgeable assistant for the PawConnect pet adoption platform. Help users find pets to adopt, provide general advice on pet care, and guide users on how to use PawConnect (browsing pets, applying for adoption, chatting with pet owners). Keep your responses concise, helpful, and formatted clearly with markdown bullet points. ${livePetsSummary}`;

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: {
                        role: 'system',
                        parts: [{ text: systemInstruction }]
                    }
                });

                // Format chat history for Gemini API
                let chatHistory = [];
                if (history && Array.isArray(history) && history.length > 0) {
                    chatHistory = history
                        .filter(h => h && h.text)
                        .map(h => ({
                            role: h.role === 'user' ? 'user' : 'model',
                            parts: [{ text: h.text }]
                        }));
                }

                // Gemini requires the first message in history to be from 'user'
                if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
                    chatHistory.shift();
                }

                const chat = model.startChat({ history: chatHistory });
                const result = await chat.sendMessage(message);
                const reply = result.response.text();

                return res.status(200).json({
                    success: true,
                    reply
                });
            } catch (geminiError) {
                console.warn(`[Chatbot Gemini Warning] ${geminiError.message}. Using intelligent knowledge base.`);
            }
        }

        // Intelligent knowledge base fallback (always available, instant, zero errors)
        const fallbackReply = await generateKnowledgeBaseReply(message);
        return res.status(200).json({
            success: true,
            reply: fallbackReply
        });

    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(200).json({
            success: true,
            reply: "Hello! 🐾 I am PawConnect AI. You can browse all available pets on our [Browse](/browse) page or submit an adoption application anytime. How else can I help you today?"
        });
    }
};
