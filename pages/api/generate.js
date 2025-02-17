import fs from 'fs';
import path from 'path';
export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const { exam } = req.body;
    if (!exam) {
        return res.status(400).json({ message: 'Exam name is required' });
    }
    
    const sanitizedExam = exam.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const filePath = path.join(process.cwd(), 'pages', 'mock-exam', `${sanitizedExam}.js`);
    
    if (fs.existsSync(filePath)) {
        return res.status(200).json({ message: 'File already exists' });
    }
    
    const content = `
import Head from 'next/head';
import ExamPage from "../../ExamPage"

export default function ${sanitizedExam.toUpperCase()}() {
    return (
        <>
            <Head>
                <title>${exam.toUpperCase()} Mock Exam</title>
                <meta name="description" content="Prepare for the ${exam.toUpperCase()} exam with our practice tests." />
                <meta name="keywords" content="${exam}, mock exam, certification, practice test" />
            </Head>
            <ExamPage examName="${exam}" />
        </>
    );
}
`;
    
    fs.writeFileSync(filePath, content, 'utf8');
    return res.status(201).json({ message: 'File created successfully', filePath });
}
