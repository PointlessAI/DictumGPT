// pages/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [exam, setExam] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (exam.trim()) {
      // Navigate to /mock-exam/<exam>
      router.push(`/mock-exam/${encodeURIComponent(exam.trim().toLowerCase())}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Enter Your Mock Exam</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="e.g. cissp"
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}>
          Start
        </button>
      </form>
    </div>
  );
}