  // Global variables
  let symptoms = {};
  let selectedSymptoms = new Set();
  let isTyping = false;

  // Initialize the chat
  function initChat() {
      addBotMessage("Hi! I'm your AI health assistant. Select symptoms from the list to get a diagnosis.");
  }

  // Add a message to the chat
  function addMessage(text, isUser = false, isTyping = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

      if (isTyping) {
          messageDiv.innerHTML = `<span class="typing-animation">${text}</span>`;
      } else {
          messageDiv.textContent = text;
      }

      document.getElementById('chatMessages').appendChild(messageDiv);
      messageDiv.scrollIntoView({ behavior: 'smooth' });
      return messageDiv;
  }

  function addBotMessage(text, isTyping = false) {
      return addMessage(text, false, isTyping);
  }

  function addUserMessage(text) {
      return addMessage(text, true);
  }

  function addDiseaseCard(disease, probability, matchingSymptoms, missingSymptoms, description) {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'disease-card bg-white rounded-lg shadow-lg p-4 mb-4';
      cardDiv.innerHTML = `
          <div class="flex items-center justify-between mb-4">
              <div>
                  <h3 class="text-xl font-semibold">${disease}</h3>
                  <p class="text-gray-600">Match Confidence: ${(probability * 100).toFixed(1)}%</p>
              </div>
              <div class="flex gap-2">
                  <button onclick="showDescription('${disease}', '${description.replace(/'/g, "\\'")}')" 
                          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                      <i class="fas fa-info-circle mr-2"></i>Description
                  </button>
                  <button onclick="showPrecautions('${disease}')"
                          class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                      <i class="fas fa-shield-alt mr-2"></i>Precautions
                  </button>
              </div>
          </div>
          <div class="mt-4">
              <div class="mb-4">
                  <h4 class="font-semibold text-green-600 mb-2">Matching Symptoms:</h4>
                  <div class="flex flex-wrap gap-2">
                      ${matchingSymptoms.map(symptom => `
                          <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              ${symptom}
                          </span>
                      `).join('')}
                  </div>
              </div>
              ${missingSymptoms.length > 0 ? `
                  <div>
                      <h4 class="font-semibold text-yellow-600 mb-2">Additional Symptoms to Check:</h4>
                      <div class="flex flex-wrap gap-2">
                          ${missingSymptoms.map(symptom => `
                              <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                  ${symptom}
                              </span>
                          `).join('')}
                      </div>
                  </div>
              ` : ''}
          </div>
      `;
      document.getElementById('chatMessages').appendChild(cardDiv);
      cardDiv.scrollIntoView({ behavior: 'smooth' });
  }

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
          // Display symptom without underscores
          const displaySymptom = symptom.replace(/_/g, ' ');
          div.innerHTML = `
              <label class="flex items-center cursor-pointer">
                  <input type="checkbox" class="mr-2" value="${symptom}">
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
          // Display symptom without underscores in the tag
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

  // Search symptoms
  document.getElementById('symptomSearch').addEventListener('input', (e) => {
      const searchText = e.target.value.toLowerCase();
      const checkboxes = document.querySelectorAll('.symptom-checkbox');

      checkboxes.forEach(div => {
          const symptom = div.querySelector('label').textContent.toLowerCase();
          div.style.display = symptom.includes(searchText) ? 'block' : 'none';
      });
  });

  // Send symptoms for prediction
  async function sendSymptoms() {
      if (selectedSymptoms.size === 0) {
          addBotMessage('Please select at least one symptom.');
          return;
      }

      // Show selected symptoms
      addUserMessage(`Symptoms: ${Array.from(selectedSymptoms).join(', ')}`);

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
                  symptoms: Array.from(selectedSymptoms)
              })
          });

          const data = await response.json();

          // Add a 2 second delay to make it feel more natural
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Remove typing indicator
          typingIndicator.remove();

          if (data.error) {
              addBotMessage(`Error: ${data.error}`);
              return;
          }

          // Show disease card with matching and missing symptoms
          addDiseaseCard(
              data.disease,
              data.probability,
              data.matching_symptoms,
              data.missing_symptoms,
              data.description
          );

      } catch (error) {
          console.error('Error:', error);
          typingIndicator.remove();
          addBotMessage('Sorry, there was an error processing your request. Please try again.');
      }
  }

  // Placeholder functions for description and precautions
  async function showPrecautions(disease) {
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

      // Add a 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove typing indicator
      typingIndicator.remove();

      addBotMessage(`Precautions for ${disease}: [Precautions will be added when dataset is available]`);
  }

  // Update the showDescription function to include typing indicator
  async function showDescription(disease, description) {
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

      // Add a 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove typing indicator
      typingIndicator.remove();

      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot-message';
      messageDiv.innerHTML = `
          <div class="p-4 rounded-lg">
              <h4 class="font-semibold text-blue-600 mb-2">${disease}</h4>
              <p class="text-gray-700">${description}</p>
          </div>
      `;
      document.getElementById('chatMessages').appendChild(messageDiv);
      messageDiv.scrollIntoView({ behavior: 'smooth' });
  }

  // Event listeners
  document.getElementById('sendButton').addEventListener('click', sendSymptoms);

  // Add function to remove symptoms
  function removeSymptom(symptom) {
      selectedSymptoms.delete(symptom);
      const checkbox = document.querySelector(`input[value="${symptom}"]`);
      if (checkbox) {
          checkbox.checked = false;
          checkbox.parentElement.parentElement.classList.remove('selected');
      }
      updateChatInput();
  }

  // Add theme toggle functionality
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