document.addEventListener('DOMContentLoaded', () => {
    const addPartButton = document.getElementById('add-part');
    const createScoreButton = document.getElementById('create-score');
    const scoreContainer = document.getElementById('score-container');
    const partSelector = document.getElementById('part-selector');

    addPartButton.addEventListener('click', addPart);
    createScoreButton.addEventListener('click', createScore);

    function addPart() {
        const selectedPart = partSelector.value;
        if (selectedPart) {
            const part = document.createElement('div');
            part.className = 'part';
            part.contentEditable = true;
            part.innerText = selectedPart;
            scoreContainer.appendChild(part);
        } else {
            alert('Please select a part to add.');
        }
    }

    function createScore() {
        const parts = Array.from(document.querySelectorAll('.part')).map(part => part.innerText);
        localStorage.setItem('parts', JSON.stringify(parts));
        window.location.href = 'Score.html';
    }
});
