const { ipcRenderer } = require('electron');

document.getElementById('minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});
document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

document.getElementById('prenom').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const prenom = this.value.trim();
        if (prenom !== '') {
            localStorage.setItem('prenom', prenom);
            showSigneAstroPage();
        }
    }
});

function showSigneAstroPage() {
    const prenom = localStorage.getItem('prenom');
    document.getElementById('app').innerHTML = `
        <p class="instruction" style="margin-bottom: -4%;">Hi pretty ${prenom} !</p>
        <p class="instruction">Now, what's your birth date?</p>
        <form id="date-form">
            <input type="date" id="date-naissance" class="input-rounded" required>
            <button type="submit" class="submit-btn">♥</button>
        </form>
    `;

    document.getElementById('date-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const dateNaissance = document.getElementById('date-naissance').value;
        localStorage.setItem('dateNaissance', dateNaissance);
        showCardsPage();
    });
}

function showCardsPage() {
    fetch("../../src/data/cards.json")
        .then(response => response.json())
        .then(tarotCards => {
            const app = document.getElementById('app');
            const shuffledCardIds = Object.keys(tarotCards).sort(() => Math.random() - 0.5);
            const cardPositions = {};

            shuffledCardIds.forEach((cardId, index) => {
                cardPositions[index] = cardId;
            });

            app.innerHTML = `
                <div class="cards-container">
                    <div class="cards-row first-row">
                        ${[0,1,2,3].map(position => `
                            <div class="card" data-position="${position}">
                                <div class="card-inner">
                                    <div class="card-back">
                                        <img src="../../src/assets/images/back.png" alt="Card Back">
                                    </div>
                                    <div class="card-front"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cards-row second-row">
                        ${[4,5,6,7].map(position => `
                            <div class="card" data-position="${position}">
                                <div class="card-inner">
                                    <div class="card-back">
                                        <img src="../../src/assets/images/back.png" alt="Card Back">
                                    </div>
                                    <div class="card-front"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cards-row last-row">
                        ${[8,9,10].map(position => `
                            <div class="card" data-position="${position}">
                                <div class="card-inner">
                                    <div class="card-back">
                                        <img src="../../src/assets/images/back.png" alt="Card Back">
                                    </div>
                                    <div class="card-front"></div>
                                </div>
                            </div>
                        `).join('')}
                        <div class="counter-container">
                            <div id="cards-counter" class="cards-counter">0/4</div>
                            <button id="next-button" class="next-btn" style="display: none;">Next</button>
                        </div>
                    </div>
                </div>
            `;

            const cards = document.querySelectorAll('.card');
            const selectedCards = [];
            const counterElement = document.getElementById('cards-counter');
            const nextButton = document.getElementById('next-button');

            function updateCounter() {
                const count = selectedCards.length;
                counterElement.textContent = `${count}/4`;
                if (count === 4) {
                    counterElement.style.display = 'none';
                    nextButton.style.display = 'block';
                } else {
                    counterElement.style.display = 'block';
                    nextButton.style.display = 'none';
                }
            }

            cards.forEach((card) => {
                card.addEventListener('click', () => {
                    const position = card.getAttribute('data-position');
                    const cardId = cardPositions[position];
                    if (card.classList.contains('selected')) {
                        card.classList.remove('selected', 'flipped');
                        const index = selectedCards.indexOf(cardId);
                        if (index > -1) selectedCards.splice(index, 1);
                    } else if (selectedCards.length < 4) {
                        card.classList.add('selected', 'flipped');
                        const cardFront = card.querySelector('.card-front');
                        const cardData = tarotCards[cardId];
                        cardFront.innerHTML = `<img src="../../src/assets/images/${cardData.image}" alt="${cardData.name}">`;
                        selectedCards.push(cardId);
                    }
                    updateCounter();
                });
            });

            nextButton.addEventListener('click', () => {
                localStorage.setItem('selectedCards', JSON.stringify(selectedCards));
                showLoadingPage();
            });

            updateCounter();
        })
        .catch(error => {
            console.error('Error loading cards:', error);
            document.getElementById('app').innerHTML = '<p>Error loading cards</p>';
        });
}

function showLoadingPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="loading-container">
            <p class="loading-text">Reading your future</p>
            <p class="loading-dots" id="loading-dots">...</p>
            <p class="interesting-text" id="interesting-text" style="display: none;">Interesting 🤭</p>
        </div>
    `;

    let dotsCount = 0;
    const dotsElement = document.getElementById('loading-dots');
    const interestingElement = document.getElementById('interesting-text');

    const dotsInterval = setInterval(() => {
        dotsCount = (dotsCount + 1) % 4;
        dotsElement.textContent = '.'.repeat(dotsCount);
    }, 500);

    setTimeout(() => {
        clearInterval(dotsInterval);
        document.querySelector('.loading-text').style.display = 'none';
        dotsElement.style.display = 'none';
        interestingElement.style.display = 'block';
        setTimeout(() => showResultsPage(), 2000);
    }, 3000);
}

function showResultsPage() {
    calculateFinalResults();
}

function calculateFinalResults() {
    const selectedCards = JSON.parse(localStorage.getItem('selectedCards'));
    const dateNaissance = localStorage.getItem('dateNaissance');

    Promise.all([
        fetch("../../src/data/cards.json").then(r => r.json()),
        fetch("../../src/data/zodiac.json").then(r => r.json()),
        fetch("../../src/data/interpretations.json").then(r => r.json())
    ])
    .then(([tarotCards, zodiacData, interpretations]) => {
        const zodiacSign = calculateZodiacSign(dateNaissance);
        const cardScores = calculateCardScores(selectedCards, tarotCards);
        const zodiacScores = zodiacData[zodiacSign].scores;

        const finalScores = {
            love: cardScores.love + zodiacScores.love,
            career: cardScores.career + zodiacScores.career,
            life: cardScores.life + zodiacScores.life
        };

        const reading = generateReading(finalScores, interpretations, zodiacSign, zodiacData);
        displayResults(reading, zodiacSign, selectedCards, tarotCards);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('app').innerHTML = '<p>Error calculating reading</p>';
    });
}

function calculateCardScores(selectedCards, tarotCards) {
    const scores = { love: 0, career: 0, life: 0 };
    selectedCards.forEach(cardId => {
        const card = tarotCards[cardId];
        scores.love += card.scores.love;
        scores.career += card.scores.career;
        scores.life += card.scores.life;
    });
    return scores;
}

function calculateZodiacSign(birthDate) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const zodiacRanges = [
        { sign: "aries", ranges: [[3, 21], [4, 19]] },
        { sign: "taurus", ranges: [[4, 20], [5, 20]] },
        { sign: "gemini", ranges: [[5, 21], [6, 20]] },
        { sign: "cancer", ranges: [[6, 21], [7, 22]] },
        { sign: "leo", ranges: [[7, 23], [8, 22]] },
        { sign: "virgo", ranges: [[8, 23], [9, 22]] },
        { sign: "libra", ranges: [[9, 23], [10, 22]] },
        { sign: "scorpio", ranges: [[10, 23], [11, 21]] },
        { sign: "sagittarius", ranges: [[11, 22], [12, 21]] },
        { sign: "capricorn", ranges: [[12, 22], [1, 19]] },
        { sign: "aquarius", ranges: [[1, 20], [2, 18]] },
        { sign: "pisces", ranges: [[2, 19], [3, 20]] }
    ];

    for (const zodiac of zodiacRanges) {
        const [[startMonth, startDay], [endMonth, endDay]] = zodiac.ranges;
        const isInRange = (month === startMonth && day >= startDay) || (month === endMonth && day <= endDay);
        if (isInRange) return zodiac.sign;
    }
    return "aries";
}

function generateReading(finalScores, interpretations, zodiacSign, zodiacData) {
    const prenom = localStorage.getItem('prenom');

    return {
        zodiac: zodiacSign,
        zodiacTraits: zodiacData[zodiacSign].traits,
        love: getInterpretation(finalScores.love, interpretations.love, prenom),
        career: getInterpretation(finalScores.career, interpretations.career, prenom),
        life: getInterpretation(finalScores.life, interpretations.life, prenom),
        scores: finalScores
    };
}
function getInterpretation(score, category, prenom) {
    for (const [level, data] of Object.entries(category)) {
        const meetsMin = data.min_score === undefined || score >= data.min_score;
        const meetsMax = data.max_score === undefined || score <= data.max_score;
        if (meetsMin && meetsMax) {
            const randomIndex = Math.floor(Math.random() * data.messages.length);
            let message = data.messages[randomIndex];
            message = message.replace('[your name here]', prenom);

            return {
                message: message,
                level: level,
                score: score
            };
        }
    }
    return {
        message: "The cards are being mysterious about this one.",
        level: "mysterious",
        score: score
    };
}

function displayResults(reading, zodiacSign, selectedCards, tarotCards) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="results-container">
            <p class="instruction">Your tarot reading is ready!</p>
            <p class="zodiac-info">Based on your ${zodiacSign} energy</p>
            <div class="reading-section">
                <h3>Love</h3>
                <p>${reading.love.message}</p>
            </div>
            <div class="reading-section">
                <h3>Career</h3>
                <p>${reading.career.message}</p>
            </div>
            <div class="reading-section">
                <h3>Life</h3>
                <p>${reading.life.message}</p>
            </div>
            <button class="submit-btn" onclick="showCardsPage()">Read Again</button>
        </div>
    `;
}