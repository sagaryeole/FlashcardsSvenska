document.addEventListener('DOMContentLoaded', async () => {
    let flashcards = [];
    let currentIndex = 0;
    let showAnswer = false;
    let correctGuesses = 0;
    let flashcardFrontLang = '';
    let flashcardBackLang = '';
    let flashcardCurrentLang = '';
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

    correctGuesses = Number(localStorage.getItem('correctGuesses')) || 0;
    try {
        ({ flashcards, currentIndex, correctGuesses } = await loadFlashcardsByTopicAndLanguage(topicSelect, languageDropdown, flashcards, currentIndex, correctGuesses, updateProgress, updateFlashcard));
    } catch (error) {
        console.error('Error loading flashcards:', error);
    }

    function updateFlashcard() {
        if (flashcards.length === 0) return;
        const currentFlashcard = flashcards[currentIndex];
        flashcardFront.textContent = currentFlashcard.question;
        flashcardBack.textContent = currentFlashcard.answer;
        flashcardFrontLang = currentFlashcard.question_language;
        flashcardBackLang = currentFlashcard.answer_language;
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

            flashcardCurrentLang = showAnswer ? flashcardBackLang : flashcardFrontLang;
            if (!showAnswer && getNextCardCheckbox.checked) {
                setTimeout(() => nextButton.click(), 300);
            }
            else {
                pronounceButton.click();
            }
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = Math.floor(Math.random() * flashcards.length);
        showAnswer = false;
        flashcard.classList.remove('flipped');
        setTimeout(() => updateFlashcard(), 500);
        flashcardCurrentLang = flashcardFrontLang;
        setTimeout(() => pronounceButton.click(), 500);
    });

    correctButton.addEventListener('click', () => {
        correctGuesses++;
        updateProgress();
        nextButton.click();
    });

    topicSelect.addEventListener('change', async () => {
        ({ flashcards, currentIndex, correctGuesses } = await loadFlashcardsByTopicAndLanguage(topicSelect, languageDropdown, flashcards, currentIndex, correctGuesses, updateProgress, updateFlashcard));
    });

    languageDropdown.addEventListener('change', async () => {
        ({ flashcards, currentIndex, correctGuesses } = await loadFlashcardsByTopicAndLanguage(topicSelect, languageDropdown, flashcards, currentIndex, correctGuesses, updateProgress, updateFlashcard));
    });

    pronounceButton.addEventListener('click', () => {
        if (isMuted) return;
        const textToPronounce = showAnswer ? flashcardBack.textContent : flashcardFront.textContent;
        const utterance = new SpeechSynthesisUtterance(textToPronounce);

        utterance.lang = flashcardCurrentLang === 'Swedish' ? 'sv-SE' : 'en-US';
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.lang === utterance.lang);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        else {
            utterance.lang = 'en-US';
            utterance.voice = voices.find(voice => voice.lang === utterance.lang);
        }
        speechSynthesis.speak(utterance);
    });

    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        let muteIcon = document.getElementById('muteIcon');

        if (isMuted) {
            muteIcon.classList.add("fa-volume-mute");
            muteIcon.classList.remove("fa-volume-up");
        }
        else {
            muteIcon.classList.remove("fa-volume-mute");
            muteIcon.classList.add("fa-volume-up");
        }

    });

    updateFlashcard();
});

async function loadFlashcardsByTopicAndLanguage(topicSelect, languageDropdown, flashcards, currentIndex, correctGuesses, updateProgress, updateFlashcard) {
    selectedTopic = topicSelect.value;
    selectedLanguage = languageDropdown.value;
    try {
        const response = await fetch(`/get_flashcards?topic=${selectedTopic}&language=${selectedLanguage}`);
        if (!response.ok) throw new Error('Failed to fetch flashcards');
        flashcards = await response.json();
        currentIndex = 0;
        correctGuesses = 0;

        if (flashcards.length > 0) {
            flashcardFrontLang = flashcards[0].question_language;
            flashcardBackLang = flashcards[0].answer_language;
        }

        updateProgress();
        updateFlashcard();
    } catch (error) {
        console.error('Error loading flashcards:', error);
    }
    return { flashcards, currentIndex, correctGuesses };
}