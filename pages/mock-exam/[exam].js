import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function MockExamPage() {
    const router = useRouter();
    const { exam } = router.query;
    const [messages, setMessages] = useState([]);
    const [userAnswer, setUserAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (exam) {
            startExam();
        }
    }, [exam]);

    const startExam = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/exam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exam,
                    userId: "test_user", 
                    userMessage: "Start",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to start exam: ${errorText}`);
            }

            const data = await response.json();
            setMessages([{ role: "assistant", content: data.assistantMessage }]);
        } catch (error) {
            console.error("Error starting exam:", error);
        }
        setLoading(false);
    };  

    const submitAnswer = async (e) => {
      e.preventDefault();
      if (!userAnswer.trim()) return;
      setLoading(true);
  
      try {
          const response = await fetch("/api/exam", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  exam,
                  userId: "test_user",
                  userMessage: userAnswer.trim(),
              }),
          });
  
          const data = await response.json();
  
          if (!response.ok) {
              throw new Error(data.message || "Failed to submit answer");
          }
  
          setMessages([...messages, { role: "user", content: userAnswer.trim() }, { role: "assistant", content: data.assistantMessage }]);
          setUserAnswer("");
      } catch (error) {
          console.error("Error submitting answer:", error);
          alert("Error: " + error.message);
      }
      setLoading(false);
  };  

    if (!exam) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ textAlign: "center", color: "#333" }}>{exam.toUpperCase()} Mock Exam</h1>

            {/* Styled Table for Help Commands */}
            <h3 style={{ textAlign: "center", marginTop: "20px", color: "#444" }}>Help Commands</h3>
            <table style={{
                width: "100%",
                borderCollapse: "collapse",
                margin: "20px 0",
                fontSize: "16px",
                textAlign: "left",
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                overflow: "hidden",
            }}>
                <thead style={{ backgroundColor: "#4CAF50", color: "white" }}>
                    <tr>
                        <th style={{ padding: "12px" }}>Command</th>
                        <th style={{ padding: "12px" }}>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ backgroundColor: "#f8f8f8", transition: "0.3s" }}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Help | Hint</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Reiterate the current question with extra hints to guide the student.</td>
                    </tr>
                    <tr style={{ backgroundColor: "#ffffff", transition: "0.3s" }}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Answer | ?</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Display the answer with a brief explanation, marking the question as incorrect.</td>
                    </tr>
                    <tr style={{ backgroundColor: "#f8f8f8", transition: "0.3s" }}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Mark</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Tally correct and incorrect responses to determine a pass/fail outcome.</td>
                    </tr>
                    <tr style={{ backgroundColor: "#ffffff", transition: "0.3s" }}>
                        <td style={{ padding: "12px" }}>Exit | quit</td>
                        <td style={{ padding: "12px" }}>Finalize the exam session and record the final grade.</td>
                    </tr>
                </tbody>
            </table>

            {/* Chat Interface */}
            <div>
                {messages.map((msg, index) => (
                    <div key={index} style={{
                        margin: "10px 0",
                        padding: "12px",
                        borderRadius: "5px",
                        backgroundColor: msg.role === "assistant" ? "#f0f0f0" : "#d1f7d1",
                        borderLeft: msg.role === "assistant" ? "5px solid #4CAF50" : "5px solid #2196F3",
                    }}>
                        <strong>{msg.role === "assistant" ? "" : "You:"}</strong>
                        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    </div>
                ))}
            </div>

            {/* Answer Input Field */}
            <form onSubmit={submitAnswer} style={{ marginTop: "1rem" }}>
                <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "16px",
                    }}
                    placeholder="Type your answer here..."
                />
                <button type="submit" style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "10px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "0.3s",
                }} disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </form>
        </div>
    );
}