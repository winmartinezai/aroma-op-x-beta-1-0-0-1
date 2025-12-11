
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ColumnMapping {
    property: number;
    unitSize: number;
    service: number;
    date: number;
    extras: number;
    notes: number;
    user: number;
    complete: number;
}

export const identifyColumnsWithAI = async (headers: string[], sampleRow: any[]): Promise<ColumnMapping | null> => {
    if (!API_KEY) {
        console.warn("Gemini API Key missing");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
    You are a data mapping assistant for a property service company.
    We have an Excel file with unknown headers. I need you to map the columns to our internal schema.

    Our Schema:
    - property: The name of the apartment complex (e.g., "Altis", "Colina", "The Galvin")
    - unitSize: The unit number and/or size (e.g., "101", "2x2", "101/2x2", "Unit 101")
    - service: The type of work (e.g., "Paint", "Clean", "Touch Up", "Full Paint")
    - date: The date of the job
    - extras: Extra items (e.g., "Trash", "Kilz", "Door")
    - notes: General notes
    - user: The employee/tech name
    - complete: Status indicating if job is done (e.g., "Yes", "Done", "Complete")

    Here are the headers from the file:
    ${JSON.stringify(headers)}

    Here is a sample row of data:
    ${JSON.stringify(sampleRow)}

    Return ONLY a JSON object mapping the keys (property, unitSize, service, date, extras, notes, user, complete) to the ZERO-BASED index of the column in the headers array.
    If a column is not found, use -1.
    
    Example Output:
    { "property": 0, "unitSize": 1, "service": 2, "date": 3, "extras": -1, "notes": 4, "user": 5, "complete": -1 }
    `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const mapping = JSON.parse(jsonStr) as ColumnMapping;
        return mapping;

    } catch (error) {
        console.error("AI Mapping Error:", error);
        return null;
    }
};
