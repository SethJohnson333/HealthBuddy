const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Simulated database for storing patient data
let patientDataStore = {};

// Initialize the OpenAI API client with the API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const drugInteractionDatabase = {
    "Metformin": {
        "Prednisone": { severity: "SEVERE", message: "Prednisone can increase blood sugar levels, which can worsen diabetes control when taken with Metformin." },
        "Ibuprofen": { severity: "MILD", message: "Taking Ibuprofen with Metformin may increase the risk of kidney problems." }
    },
    "Lisinopril": {
        "Ibuprofen": { severity: "MILD", message: "Ibuprofen may reduce the effectiveness of Lisinopril and increase the risk of kidney damage." },
        "Spironolactone": { severity: "SEVERE", message: "Using Lisinopril with Spironolactone can increase the risk of high potassium levels, leading to heart problems." }
    },
};

// Utility function to calculate the follow-up date with randomization (always in the future) and a random time
const calculateFollowUpDate = (minDays, maxDays) => {
    const today = new Date(2024, 9, 12);

    const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;

    const followUpDate = new Date(today);
    followUpDate.setDate(today.getDate() + randomDays);

    const randomHour = Math.floor(Math.random() * (17 - 9 + 1)) + 9;
    const randomMinute = Math.floor(Math.random() * 60);
    followUpDate.setHours(randomHour, randomMinute);

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
    return followUpDate.toLocaleString(undefined, options);
};

// Utility function to extract known medications from a given transcript
const extractMedications = (transcript) => {
    const knownMedications = ['Lisinopril', 'Ibuprofen', 'Metformin', 'Prednisone', 'Simvastatin', 'Warfarin', 'Insulin', 'Aspirin'];
    return knownMedications.filter(med => transcript.includes(med));
};

const analyzeSeverity = (simplifiedDiagnosis) => {
    const severeKeywords = ['life-threatening', 'critical', 'emergency', 'urgent'];
    const mildKeywords = ['manageable', 'mild', 'low risk', 'treatable'];

    let severityScore = 5; 

    severeKeywords.forEach(keyword => {
        if (simplifiedDiagnosis.includes(keyword)) {
            severityScore = Math.max(severityScore, 8);
        }
    });

    mildKeywords.forEach(keyword => {
        if (simplifiedDiagnosis.includes(keyword)) {
            severityScore = Math.min(severityScore, 3);
        }
    });

    return severityScore;
};

// Add the missing detectContradictions function
const detectContradictions = (currentMedications, patientMedications) => {
    const contradictions = [];

    currentMedications.forEach(currentMed => {
        patientMedications.forEach(patientMed => {
            if (drugInteractionDatabase[patientMed] && drugInteractionDatabase[patientMed][currentMed]) {
                const interaction = drugInteractionDatabase[patientMed][currentMed];
                contradictions.push({ severity: interaction.severity, message: interaction.message });
            }
        });
    });

    return contradictions;
};

// Function to call OpenAI API for testing
const callOpenAIAPI = async (transcript, task = "simplify", patientId = null, currentMedications = []) => {
    let messages;

    if (task === "simplify") {
        messages = [
            { role: "system", content: "You are a medical assistant who helps explain complex medical terms to patients in a simple and understandable way." },
            { role: "user", content: `Please simplify the following medical diagnosis for a patient: '${transcript}'` }
        ];
    } else if (task === "describe") {
        messages = [
            { role: "system", content: "You are a medical expert who translates patient symptoms into a formal description suitable for doctors." },
            { role: "user", content: `The patient described the following symptoms: '${transcript}'. Please rewrite this description in a formal, clinical way suitable for sending to a doctor.` }
        ];

        if (patientId) {
            patientDataStore[patientId] = { ...patientDataStore[patientId], symptoms: transcript };
        }
    } else if (task === "diagnose") {
        const patientData = patientDataStore[patientId] || {};
        const previousMedications = patientData.medications || [];

        const contradictions = detectContradictions(currentMedications, previousMedications);
        let contradictionMessages = '';
        if (contradictions.length > 0) {
            contradictionMessages = contradictions.map(c => `**${c.severity} Alert:** ${c.message}`).join('\n');
        }

        messages = [
            { role: "system", content: "You are a doctor providing a medical diagnosis in simple language based on the patient's current symptoms and their previous history." },
            { role: "user", content: `The patient's previous symptoms were: '${patientData.symptoms || 'unknown'}'. The current symptoms are: '${transcript}'. Please provide a detailed diagnosis with sections for: Summarized diagnosis, Treatment steps, and Prescribed medications with only the drug name and dosage.` }
        ];

        if (contradictionMessages) {
            console.log(`**Contradiction Alerts:**\n${contradictionMessages}`);
        }

        patientDataStore[patientId] = { ...patientDataStore[patientId], medications: [...previousMedications, ...currentMedications] };
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        const resultText = response.choices[0].message.content.trim();

        if (task === "simplify") {
            const severity = analyzeSeverity(resultText);
            console.log(`\n\nSeverity Level (1-10): ${severity}`);
            console.log(`Description: illness is ${severity <= 5 ? 'mild' : 'severe'}`);

            if (severity > 5) {
                const followUpDate = calculateFollowUpDate(7, 10);
                console.log(`\nAppointment Schedule: ${followUpDate}`);
            }
        }

        return resultText;
    } catch (error) {
        console.error("Error calling OpenAI API:", error.response ? error.response.data : error.message);
        return null;
    }
};

// Function to simulate patient flow with sections
const patientFlow = async (transcript, patientId) => {
    const currentMedications = extractMedications(transcript);

    const sophisticatedDescription = await callOpenAIAPI(transcript, "describe", patientId);
    console.log(`\nSophisticated description for doctor: ${sophisticatedDescription}`);

    const diagnosis = await callOpenAIAPI(transcript, "diagnose", patientId, currentMedications);
    console.log(`\nDoctor's diagnosis:\n${diagnosis}`);

    await callOpenAIAPI(diagnosis, "simplify", patientId, currentMedications);
};

// Capture input from command line
const transcript = process.argv[2] || "No input provided!";
const patientId = process.argv[3] || "123";
console.log("\nInput Transcript:", transcript);

patientFlow(transcript, patientId)
    .catch(error => {
        console.error("Error: ", error);
    });
