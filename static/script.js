document.addEventListener('DOMContentLoaded', async () => {
    let flashcards = [];
    let currentIndex = 0;
    let showAnswer = false;
    let correctGuesses = 0;

    const flashcard = document.getElementById('flashcard');
    const flashcardFront = document.getElementById('flashcard-front');
    const flashcardBack = document.getElementById('flashcard-back');
    const nextButton = document.getElementById('next-button');
    const correctButton = document.getElementById('correct-button');
    const progressText = document.getElementById('progress');   
    const loadButton = document.getElementById('load-flashcards');
    const topicSelect = document.getElementById('topic');

    loadButton.addEventListener('click', () => {
        const selectedTopic = topicSelect.value;
        fetch(`/get_flashcards?topic=${selectedTopic}`)
            .then(response => response.json())
            .then(data => {
                flashcards = data;
                currentIndex = 0;
                correctGuesses = 0;
                updateProgress();
                updateFlashcard();
            })
            .catch(error => console.error('Error loading flashcards:', error));
    });

    correctGuesses = Number(localStorage.getItem('correctGuesses')) || 0;
    try {
        const response = await fetch('/get_flashcards');
        if (!response.ok) throw new Error('Failed to fetch flashcards');
        flashcards = await response.json();
        // console.log('Loaded flashcards:', flashcards);
        updateProgress();
        updateFlashcard();
    } catch (error) {
        console.error('Error loading flashcards:', error);
    }

    function updateFlashcard() {
        if (flashcards.length === 0) return;
        const currentFlashcard = flashcards[currentIndex];
        flashcardFront.textContent = currentFlashcard.question;
        flashcardBack.textContent = currentFlashcard.answer;
        correctButton.disabled = !showAnswer;
    }

    function updateProgress() {
        progressText.textContent = `Progress: ${correctGuesses}/${flashcards.length} correct`;
        localStorage.setItem('correctGuesses', correctGuesses);
    }

    flashcard.addEventListener('click', () => {
        showAnswer = !showAnswer;
        flashcard.classList.toggle('flipped');
        updateFlashcard();
    });

    nextButton.addEventListener('click', () => {
        currentIndex = Math.floor(Math.random() * flashcards.length);
        showAnswer = false; 
        flashcard.classList.remove('flipped');
        setTimeout(() => updateFlashcard(), 500);
    });

    correctButton.addEventListener('click', () => {
        correctGuesses++;
        updateProgress();
        nextButton.click();
    });

    updateFlashcard();
});