const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Simulated database for storing patient data
let patientDataStore = {};  

// Initialize the OpenAI API client with the API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Utility function to calculate the follow-up date with randomization (always in the future)
const calculateFollowUpDate = (minDays, maxDays) => {
    const today = new Date(2024, 9, 12); // Month is 0-based, so 9 is October

    const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;

    // Calculate the future date by adding the random number of days to today's date
    const followUpDate = new Date(today);
    followUpDate.setDate(today.getDate() + randomDays);

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return followUpDate.toLocaleDateString(undefined, options);  // Return the exact follow-up date
};

// Function to call OpenAI API for testing
const callOpenAIAPI = async (transcript, task = "simplify", patientId = null) => {
    let messages;

    if (task === "simplify") {
        messages = [
            { role: "system", content: "You are a medical assistant who helps explain complex medical terms to patients in a simple and understandable way." },
            { role: "user", content: `Please simplify the following medical diagnosis for a patient: '${transcript}'` }
        ];
    } else if (task === "describe") {
        // Handle describe task correctly
        messages = [
            { role: "system", content: "You are a medical expert who translates patient symptoms into a formal description suitable for doctors." },
            { role: "user", content: `The patient described the following symptoms: '${transcript}'. Please rewrite this description in a formal, clinical way suitable for sending to a doctor.` }
        ];

        // Store patient symptoms in patientDataStore
        if (patientId) {
            patientDataStore[patientId] = transcript;
            console.log(`Stored symptoms for patient ${patientId}: ${transcript}`);
        }
    } else if (task === "diagnose") {
        const previousSymptoms = patientDataStore[patientId];
        if (!previousSymptoms) {
            console.log("No previous symptoms found for this patient. Diagnosing based on current symptoms only.");
            messages = [
                { role: "system", content: "You are a doctor providing a medical diagnosis in simple language." },
                { role: "user", content: `The patient described the following symptoms: '${transcript}'. Please provide a detailed diagnosis with sections for: Summarized diagnosis (explain in simple language for a non-medical person), Treatment steps (concise and direct), Appointment schedule (with exact dates), and Prescribed medications with only the drug name and dosage.` }
            ];
        } else {
            // Calculate the follow-up date
            const followUpDate = calculateFollowUpDate(7, 10);  // Random date between 7 and 10 days

            // Doctor provides a detailed diagnosis, more explanatory for non-medical patients
            messages = [
                { role: "system", content: "You are a doctor providing a medical diagnosis in simple language based on the patient's current symptoms and their previous history." },
                { role: "user", content: `The patient's previous symptoms were: '${previousSymptoms}'. The current symptoms are: '${transcript}'. Please provide a detailed diagnosis with sections for: Summarized diagnosis (explain in simple language for a non-medical person), Treatment steps (concise and direct), Appointment schedule (with the exact date '${followUpDate}'), and Prescribed medications with only the drug name and dosage.` }
            ];
        }
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",  // Switch to GPT-4 if available
            messages: messages,
            max_tokens: 500,  // Increased token limit for longer responses
            temperature: 0.7,  // Control creativity (lower for deterministic response)
        });

        const resultText = response.choices[0].message.content.trim();
        return resultText;
    } catch (error) {
        console.error("Error calling OpenAI API:", error.response ? error.response.data : error.message);
        return null;
    }
};

// Function to simulate patient flow with sections
const patientFlow = async (transcript, patientId) => {
    // Step 1: Patient describes symptoms (store)
    const sophisticatedDescription = await callOpenAIAPI(transcript, "describe", patientId);
    console.log(`\nSophisticated description for doctor: ${sophisticatedDescription}`);

    // Step 2: Doctor reviews symptoms and provides a detailed diagnosis with sections (no separate simplification step)
    const diagnosis = await callOpenAIAPI(transcript, "diagnose", patientId);
    console.log(`\nDoctor's diagnosis: ${diagnosis}`);
};

// Capture input from command line
const transcript = process.argv[2] || "No input provided!";
const patientId = process.argv[3] || "123";  // Simulate a patient ID
console.log("\nInput Transcript:", transcript);

// Run the patient flow with sectioning and simplification merged
patientFlow(transcript, patientId)
    .catch(error => {
        console.error("Error: ", error);
    });
