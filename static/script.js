document.addEventListener('DOMContentLoaded', async () => {
    let flashcards = [];
    let currentIndex = 0;
    let showAnswer = false;
    let correctGuesses = 0;
    let isMuted = false;

    const flashcard = document.getElementById('flashcard');
    const languageDropdown = document.getElementById('language-dropdown');
    const flashcardFront = document.getElementById('flashcard-front');
    const flashcardBack = document.getElementById('flashcard-back');
    const nextButton = document.getElementById('next-button');
    const correctButton = document.getElementById('correct-button');
    const progressText = document.getElementById('progress');
    const topicSelect = document.getElementById('topic');
    const getNextCardCheckbox = document.getElementById('get-next-card');
    const pronounceButton = document.getElementById('pronounce-button');
    const muteButton = document.getElementById('mute-sound');

    async function loadFlashcards() {
        const selectedTopic = topicSelect.value;
        const selectedLanguage = languageDropdown.value;
        try {
            const response = await fetch(`/get_flashcards?topic=${selectedTopic}&language=${selectedLanguage}`);
            if (!response.ok) throw new Error('Failed to fetch flashcards');
            flashcards = await response.json();
            currentIndex = 0;
            correctGuesses = 0;
            updateProgress();
            updateFlashcard();
        } catch (error) {
            console.error('Error loading flashcards:', error);
        }
    }

    function updateFlashcard() {
        if (flashcards.length === 0) return;
        const currentFlashcard = flashcards[currentIndex];
        const selectedLanguage = languageDropdown.value;
        if (selectedLanguage === currentFlashcard.question_language) {
            flashcardFront.textContent = currentFlashcard.question;
            flashcardBack.textContent = currentFlashcard.answer;
        } else {
            flashcardFront.textContent = currentFlashcard.answer;
            flashcardBack.textContent = currentFlashcard.question;
        }
        correctButton.disabled = !showAnswer;
    }

    function updateProgress() {
        progressText.textContent = `Progress: ${correctGuesses}/${flashcards.length} correct`;
        localStorage.setItem('correctGuesses', correctGuesses);
    }

    flashcard.addEventListener('click', (event) => {
        const clickedElement = event.currentTarget;
        if (clickedElement.id === 'flashcard') {
            showAnswer = !showAnswer;
            flashcard.classList.toggle('flipped');
            updateFlashcard();
            if (!showAnswer && getNextCardCheckbox.checked) {
                setTimeout(() => nextButton.click(), 300);
            } else if (!isMuted) {
                pronounceButton.click();
            }
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = Math.floor(Math.random() * flashcards.length);
        showAnswer = false;
        flashcard.classList.remove('flipped');
        setTimeout(() => updateFlashcard(), 500);
        if (!isMuted) {
            setTimeout(() => pronounceButton.click(), 500);
        }
    });

    correctButton.addEventListener('click', () => {
        correctGuesses++;
        updateProgress();
        nextButton.click();
    });

    topicSelect.addEventListener('change', loadFlashcards);
    languageDropdown.addEventListener('change', loadFlashcards);

    pronounceButton.addEventListener('click', () => {
        if (isMuted) return;
        const textToPronounce = showAnswer ? flashcardBack.textContent : flashcardFront.textContent;
        const utterance = new SpeechSynthesisUtterance(textToPronounce);
        utterance.lang = languageDropdown.value === 'Swedish' ? 'sv-SE' : 'en-US';
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.lang === utterance.lang);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        speechSynthesis.speak(utterance);
    });

    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.innerHTML = isMuted ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    });

    loadFlashcards();
    updateFlashcard();
});