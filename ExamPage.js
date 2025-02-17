import { useEffect, useState } from 'react';

export default function ExamPage({ examName }) {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQuestion() {
            try {
                const response = await fetch(`/api/questions?exam=${examName}`);
                const data = await response.json();
                setQuestion(data.question);  // Store only one question at a time
            } catch (error) {
                console.error("Error fetching question:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchQuestion();
    }, [examName]);

    if (loading) return <p>Loading question...</p>;
    if (!question) return <p>No questions available. Please try again.</p>;

    return (
        <div>
            <h1>{examName.toUpperCase()} Mock Exam</h1>
            <h3>Help Commands</h3>
                <p>Output all the following commands at the start of the session so the user is aware:</p>
                <ul>
                <li><span class="command">Help | Hint</span> - <span class="description">Give the question again but provide additional subtext that will assist the student to answer</span></li>
                <li><span class="command">Answer | ?</span> - <span class="description">Give answer and succinct explanation. Mark question as wrong.</span></li>
                <li><span class="command">Mark</span> - <span class="description">Add up all the right and wrong answers and give a pass or fail mark.</span></li>
                <li><span class="command">Exit | quit</span> - <span class="description">Mark the exam and end.</span></li>
                </ul>
            <p>{question}</p>
        </div>
    );
}