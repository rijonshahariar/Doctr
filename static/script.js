let symptoms = {};
let selectedSymptoms = new Set();
let isTyping = false;

// Response styles for varied conversational tones
const responseStyles = [
    {
        type: "neutral",
        template: (disease, probability, description) =>
            `Based on the symptoms you’ve shared, the most likely condition is <strong>${disease}</strong> (${(probability * 100).toFixed(1)}% confidence). <br> ${description}<br>Please note, this is not a medical diagnosis — I recommend speaking with a qualified healthcare provider for confirmation.`
    },
    {
        type: "conversational",
        template: (disease, probability, description) =>
            `Hmm, from what you’ve told me, it might be related to <strong>${disease}</strong> (${(probability * 100).toFixed(1)}% confidence). <br> ${description}<br>I’m not a doctor, but I can help you learn more about this condition if you’d like!`
    },
    {
        type: "action",
        template: (disease, probability, description) =>
            `My analysis shows the symptoms could match:<br><strong>${disease}</strong> (${(probability * 100).toFixed(1)}% confidence)<br><br> ${description}<br>I suggest monitoring your symptoms and consulting a healthcare professional as soon as possible for an accurate diagnosis.`
    },
    {
        type: "probabilities",
        template: (disease, probability, description) =>
            `Possible match based on your symptoms:<br><strong>${disease}</strong> (${(probability * 100).toFixed(1)}% confidence)<br><br> ${description}<br>This is an estimate only; a medical examination is needed for certainty.`
    },
    {
        type: "followup",
        template: (disease, probability, description, missingSymptoms) =>
            `Your symptoms could be linked to <strong>${disease}</strong> (${(probability * 100).toFixed(1)}% confidence). <br> ${description}<br>Do you also experience any of these: ${missingSymptoms.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')}? This will help me refine the prediction.`
    },
    {
        type: "safety",
        template: (disease, probability, description) =>
            `I’ve found a possible match for your symptoms: <strong>${disease}</strong> (${(probability * 100).toFixed(1)}% confidence). <br> ${description}<br>This information is for educational purposes only — please seek medical advice before starting or changing any treatment.`
    }
];

// Initialize the chat
function initChat() {
    addBotMessage("Hi! I'm your AI health assistant. Select symptoms from the sidebar or type them in the input box to get a diagnosis.");
}

// Typewriter effect for bot messages
async function typeMessage(text, messageDiv) {
    isTyping = true;
    messageDiv.innerHTML = '<span class="typing-animation"></span>';
    const typingSpan = messageDiv.querySelector('.typing-animation');
    typingSpan.style.whiteSpace = 'pre-wrap';
    typingSpan.style.color = '#edededff';
    typingSpan.style.fontFamily = 'Arial, sans-serif';

    for (let i = 0; i < text.length; i++) {
        typingSpan.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        await new Promise(resolve => setTimeout(resolve, 30));
    }
    typingSpan.innerHTML = text;
    isTyping = false;
}

// Add a message to the chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '5px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.maxWidth = '80%';
    messageDiv.style.lineHeight = '1.5';
    if (isUser) {
        messageDiv.style.backgroundColor = '#F6B17A';
        messageDiv.style.color = '#2D3250';
        messageDiv.style.marginLeft = 'auto';
        messageDiv.textContent = text;
    } else {
        messageDiv.style.backgroundColor = '#424769';
        messageDiv.style.color = '#F6B17A';
    }
    document.getElementById('chatMessages').appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
    return messageDiv;
}

function addBotMessage(text, typewriter = true) {
    const messageDiv = addMessage(text, false);
    if (typewriter) {
        typeMessage(text, messageDiv);
    }
    return messageDiv;
}

function addUserMessage(text) {
    return addMessage(text, true);
}

// function addDiseaseCard(disease, probability, matchingSymptoms, missingSymptoms, description) {
//     const cardDiv = document.createElement('div');
//     cardDiv.className = 'disease-card message bot-message';
//     cardDiv.style.backgroundColor = '#424769';
//     cardDiv.style.color = '#F6B17A';
//     cardDiv.style.padding = '15px';
//     cardDiv.style.borderRadius = '8px';
//     cardDiv.style.margin = '5px';
//     cardDiv.style.maxWidth = '80%';
//     cardDiv.innerHTML = `
//         <div class="flex items-center justify-between">
//             <div>
//                 <h3 class="text-xl font-semibold">${disease}</h3>
//                 <p class="text-gray-300">Match Confidence: ${(probability * 100).toFixed(1)}%</p>
//             </div>
//             <div class="flex gap-2">
//                 <button onclick="showDescription('${disease}', '${description.replace(/'/g, "\\'")}')" 
//                         class="bg-[#F6B17A] text-[#2D3250] px-4 py-2 rounded-lg hover:bg-[#bf8f67] transition-colors">
//                     <i class="fas fa-info-circle mr-2"></i>Details
//                 </button>
//                 <button onclick="showPrecautions('${disease}')"
//                         class="bg-[#F6B17A] text-[#2D3250] px-4 py-2 rounded-lg hover:bg-[#bf8f67] transition-colors">
//                     <i class="fas fa-shield-alt mr-2"></i>Precautions
//                 </button>
//             </div>
//         </div>
//         <div class="mt-4">
//             <div class="mb-4">
//                 <h4 class="font-semibold text-green-400 mb-2">Matching Symptoms:</h4>
//                 <div class="flex flex-wrap gap-2">
//                     ${matchingSymptoms.map(symptom => `
//                         <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
//                             ${symptom.replace(/_/g, ' ')}
//                         </span>
//                     `).join('')}
//                 </div>
//             </div>
//             ${missingSymptoms.length > 0 ? `
//                 <div>
//                     <h4 class="font-semibold text-yellow-400 mb-2">Additional Symptoms to Check:</h4>
//                     <div class="flex flex-wrap gap-2">
//                         ${missingSymptoms.map(symptom => `
//                             <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
//                                 ${symptom.replace(/_/g, ' ')}
//                             </span>
//                         `).join('')}
//                     </div>
//                 </div>
//             ` : ''}
//         </div>
//     `;
//     document.getElementById('chatMessages').appendChild(cardDiv);
//     cardDiv.scrollIntoView({ behavior: 'smooth' });
// }

// Load symptoms from the server
async function loadSymptoms() {
    try {
        const response = await fetch('/symptoms');
        symptoms = await response.json();
        populateSymptomList();
    } catch (error) {
        console.error('Error loading symptoms:', error);
        addBotMessage('Error loading symptoms. Please refresh the page.');
    }
}

// Populate the symptom list
function populateSymptomList() {
    const container = document.getElementById('symptomList');
    container.innerHTML = '';

    Object.keys(symptoms).forEach(symptom => {
        const div = document.createElement('div');
        div.className = 'symptom-checkbox';
        const displaySymptom = symptom.replace(/_/g, ' ');
        div.innerHTML = `
            <label class="flex items-center cursor-pointer">
                <input type="checkbox" class="mr-2 accent-[#2D3250]" value="${symptom}">
                <div class="font-medium">${displaySymptom}</div>
            </label>
        `;

        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedSymptoms.add(symptom);
                div.classList.add('selected');
                updateChatInput();
            } else {
                selectedSymptoms.delete(symptom);
                div.classList.remove('selected');
                updateChatInput();
            }
        });

        container.appendChild(div);
    });
}

function updateChatInput() {
    const container = document.getElementById('symptomInputContainer');
    container.innerHTML = '';

    selectedSymptoms.forEach(symptom => {
        const tag = document.createElement('div');
        tag.className = 'selected-symptom-tag';
        const displaySymptom = symptom.replace(/_/g, ' ');
        tag.innerHTML = `
            ${displaySymptom}
            <span class="remove-symptom" onclick="removeSymptom('${symptom}')">
                <i class="fas fa-times"></i>
            </span>
        `;
        container.appendChild(tag);
    });
}

// Parse text input for symptoms
function parseSymptomsFromText(text) {
    const words = text.toLowerCase().split(/[\s,.;!?]+/).filter(word => word);
    const validSymptoms = Object.keys(symptoms);
    const foundSymptoms = [];

    validSymptoms.forEach(symptom => {
        const symptomWords = symptom.toLowerCase().replace(/_/g, ' ').split(' ');
        const symptomPhrase = symptom.toLowerCase().replace(/_/g, ' ');
        
        if (text.toLowerCase().includes(symptomPhrase) || 
            symptomWords.some(word => words.includes(word))) {
            foundSymptoms.push(symptom);
        }
    });

    return [...new Set(foundSymptoms)];
}

// Handle user input (text or sidebar)
async function handleUserInput() {
    if (isTyping) return;

    const textInput = document.getElementById('chatInput')?.value.trim();
    const parsedSymptoms = parseSymptomsFromText(textInput || '');
    const allSymptoms = new Set([...selectedSymptoms, ...parsedSymptoms]);

    // Handle greetings and unknown inputs
    const lowercaseInput = textInput?.toLowerCase() || '';
    if (['hi', 'hello', 'thanks', 'great'].includes(lowercaseInput)) {
        addUserMessage(textInput);
        addBotMessage(`Hi! How can I help you today?`);
        document.getElementById('chatInput').value = '';
        return;
    } else if (textInput && allSymptoms.size === 0 && !selectedSymptoms.size) {
        addUserMessage(textInput);
        addBotMessage(`Hi! How can I help you today?`);
        document.getElementById('chatInput').value = '';
        return;
    }

    if (allSymptoms.size === 0) {
        addBotMessage('Please select or type at least one symptom.');
        return;
    }

    // Show user message: exact text for text input, symptom list for sidebar-only
    if (textInput) {
        addUserMessage(textInput);
    } else if (selectedSymptoms.size > 0) {
        addUserMessage(`I am having ${Array.from(selectedSymptoms).map(s => s.replace(/_/g, ' ')).join(', ')}`);
    }

    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    document.getElementById('chatMessages').appendChild(typingIndicator);
    typingIndicator.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symptoms: Array.from(allSymptoms)
            })
        });

        const data = await response.json();
        await new Promise(resolve => setTimeout(resolve, 2000));
        typingIndicator.remove();

        if (data.error) {
            addBotMessage(`Error: ${data.error}`);
            return;
        }

        // Select random response style
        const style = responseStyles[Math.floor(Math.random() * responseStyles.length)];
        const message = allSymptoms.size === 1 && style.type !== 'followup' ?
            responseStyles.find(s => s.type === 'followup').template(
                data.disease,
                data.probability,
                data.description,
                data.missing_symptoms
            ) :
            style.template(data.disease, data.probability, data.description, data.missing_symptoms);

        // Show bot message and disease card
        addBotMessage(message);
        // addDiseaseCard(
        //     data.disease,
        //     data.probability,
        //     data.matching_symptoms,
        //     data.missing_symptoms,
        //     data.description
        // );

        // Clear text input and update selected symptoms
        document.getElementById('chatInput').value = '';
        allSymptoms.forEach(symptom => selectedSymptoms.add(symptom));
        updateChatInput();

    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        addBotMessage('Sorry, there was an error processing your request. Please try again.');
    }
}

// Search symptoms
document.getElementById('symptomSearch').addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();
    const checkboxes = document.querySelectorAll('.symptom-checkbox');

    checkboxes.forEach(div => {
        const symptom = div.querySelector('label').textContent.toLowerCase();
        div.style.display = symptom.includes(searchText) ? 'block' : 'none';
    });
});

// Remove symptom
function removeSymptom(symptom) {
    selectedSymptoms.delete(symptom);
    const checkbox = document.querySelector(`input[value="${symptom}"]`);
    if (checkbox) {
        checkbox.checked = false;
        checkbox.parentElement.parentElement.classList.remove('selected');
    }
    updateChatInput();
}

// Show description with typewriter effect
async function showDescription(disease, description) {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    document.getElementById('chatMessages').appendChild(typingIndicator);
    typingIndicator.scrollIntoView({ behavior: 'smooth' });

    await new Promise(resolve => setTimeout(resolve, 2000));
    typingIndicator.remove();

    const message = `Details for <strong>${disease}</strong>:<br>${description}`;
    addBotMessage(message);
}

// Show precautions (placeholder)
async function showPrecautions(disease) {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    document.getElementById('chatMessages').appendChild(typingIndicator);
    typingIndicator.scrollIntoView({ behavior: 'smooth' });

    await new Promise(resolve => setTimeout(resolve, 2000));
    typingIndicator.remove();

    addBotMessage(`Precautions for ${disease}: [Precautions will be added when dataset is available]`);
}

// Event listeners
document.getElementById('sendButton').addEventListener('click', handleUserInput);
document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

function toggleTheme() {
    document.documentElement.classList.toggle('light-mode');
    if (document.documentElement.classList.contains('light-mode')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

themeToggle.addEventListener('click', toggleTheme);

// Initialize the application
window.addEventListener('load', () => {
    initChat();
    loadSymptoms();
});