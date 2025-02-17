import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Store user sessions in memory
const sessions = {};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { exam, userId, userMessage } = req.body;

    if (!exam || !userId || !userMessage) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    if (!process.env.SECRET_PROMPT) {
        return res.status(500).json({ message: "Missing SECRET_PROMPT in .env file" });
    }

    // Initialize session if not exists
    if (!sessions[userId]) {
        sessions[userId] = {
            messages: [],
            correct: 0,
            wrong: 0,
            lastQuestion: null,
            questionCount: 1,
            hasStarted: false,
        };
    }

    let session = sessions[userId];

    // **Exam Starts Automatically Using SECRET_PROMPT**
    if (!session.hasStarted) {
        session.hasStarted = true;

        const examPrompt = process.env.SECRET_PROMPT.replace(/{exam}/g, exam);
        const welcomeMessage = `<p><strong>Welcome to the ${exam.toUpperCase()} Practice Exam.</strong></p>`;

        try {
            const firstQuestionResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: `${examPrompt}\nGenerate the first question. Do not include redundant headers or introductions.` }],
                max_tokens: 300,
            });

            let firstQuestion = cleanAIResponse(firstQuestionResponse.choices[0].message.content);
            session.lastQuestion = firstQuestion;
            session.questionCount++;

            return res.status(200).json({
                assistantMessage: `${welcomeMessage}${firstQuestion}`,
            });
        } catch (error) {
            console.error("OpenAI Error (First Question):", error);
            return res.status(500).json({ message: "Error generating the first question." });
        }
    }

    // **Handle "Help" or "Hint" using SECRET_PROMPT**
    if (userMessage.toLowerCase() === "help" || userMessage.toLowerCase() === "hint") {
        if (!session.lastQuestion) {
            return res.status(200).json({ assistantMessage: "No active question to provide a hint for." });
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: `Using the following exam context:\n\n${process.env.SECRET_PROMPT}\nProvide a single helpful hint for this question: "${session.lastQuestion}". Keep it concise and relevant.` }
                ],
                max_tokens: 50,
            });

            const hintMessage = cleanAIResponse(response.choices[0].message.content);

            return res.status(200).json({
                assistantMessage: `<p><strong>Here’s a hint:</strong> ${hintMessage}</p>`,
            });
        } catch (error) {
            console.error("OpenAI Error (Hint):", error);
            return res.status(500).json({ message: "Error generating hint." });
        }
    }

    // **Handle "Answer" or "?" using SECRET_PROMPT**
    if (userMessage.toLowerCase() === "answer" || userMessage === "?") {
        if (!session.lastQuestion) {
            return res.status(200).json({ assistantMessage: "No active question to provide an answer for." });
        }

        session.wrong++; // Mark question as wrong when user requests an answer

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: `Using the following exam context:\n\n${process.env.SECRET_PROMPT}\nProvide the correct answer and a short explanation for this question: "${session.lastQuestion}". The explanation should be concise.` }
                ],
                max_tokens: 100,
            });

            const answerMessage = cleanAIResponse(response.choices[0].message.content);

            return res.status(200).json({
                assistantMessage: `<p><strong>Answer:</strong> ${answerMessage}</p>`,
            });
        } catch (error) {
            console.error("OpenAI Error (Answer):", error);
            return res.status(500).json({ message: "Error generating answer." });
        }
    }

    // **Check if User Answered the Last Question**
    if (session.lastQuestion) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: `Using the following exam context:\n\n${process.env.SECRET_PROMPT}\nEvaluate whether the following user response is correct or incorrect. Provide a short and clear statement in valid HTML, using <strong>bold formatting</strong> for the correct answer:\n\nQuestion: "${session.lastQuestion}"\nUser Answer: "${userMessage}"` }
                ],
                max_tokens: 200,
            });

            let evaluationMessage = cleanAIResponse(response.choices[0].message.content);

            const isCorrect = evaluationMessage.toLowerCase().includes("correct");
            if (isCorrect) session.correct++;
            else session.wrong++;

            // **Generate Next Question Automatically**
            const nextQuestionResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: `${process.env.SECRET_PROMPT}\nGenerate question ${session.questionCount} for the ${exam} exam. Only output the question in valid HTML format.` }],
                max_tokens: 300,
            });

            let nextQuestion = cleanAIResponse(nextQuestionResponse.choices[0].message.content);
            session.lastQuestion = nextQuestion;
            session.questionCount++;

            return res.status(200).json({
                assistantMessage: `<p>${evaluationMessage}</p><p>${nextQuestion}</p>`,
            });
        } catch (error) {
            console.error("OpenAI Error (Evaluation/Next Question):", error);
            return res.status(500).json({ message: "Error processing answer and generating next question." });
        }
    }
}

// **Helper Function to Clean AI Responses**
function cleanAIResponse(response) {
    return response
        .replace(/```html/g, "")  // Remove unintended HTML code blocks
        .replace(/```/g, "")  // Remove leftover markdown artifacts
        .trim();
}