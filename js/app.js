// Main application logic and UI handling

// Global state
let rankingsData = [];
let isDataLoaded = false;

// Initialize the application when page loads
window.addEventListener('load', loadEmbeddedData);

/**
 * Load the embedded rankings data
 */
function loadEmbeddedData() {
    try {
        rankingsData = EMBEDDED_RANKINGS_DATA;
        isDataLoaded = true;
        console.log(`Loaded ${rankingsData.length} cards from embedded rankings data`);
    } catch (error) {
        console.error('Error loading embedded rankings data:', error);
        isDataLoaded = false;
    }
}

/**
 * Main function to analyze the deck
 */
function analyzeDeck() {
    if (!isDataLoaded) {
        alert('Rankings data is still loading. Please wait a moment and try again.');
        return;
    }

    const deckListText = document.getElementById('deckList').value;
    const lines = deckListText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Please enter a deck list!');
        return;
    }

    const deckCards = [];
    const notFoundCards = [];

    // Parse deck list and find card data
    lines.forEach(line => {
        const match = line.match(/^(\d+)\s+(.+)$/);
        if (match) {
            const quantity = parseInt(match[1]);
            const cardName = match[2].trim();
            const cardData = findCardInRankings(cardName);
            if (cardData) {
                // Add multiple copies based on quantity
                for (let i = 0; i < quantity; i++) {
                    deckCards.push({...cardData}); // Create a copy of the card data
                }
            } else {
                notFoundCards.push(`${quantity} ${cardName}`);
            }
        }
    });

    displayResults(deckCards, notFoundCards);
}

/**
 * Display the analysis results
 */
function displayResults(deckCards, notFoundCards) {
    const mainCards = [];
    const fillerCards = [];

    // Separate cards by grade
    deckCards.forEach(card => {
        const gradeIndex = gradeOrder.indexOf(card.grade);
        if (gradeIndex >= 5) { // C and above (C- is index 4, C is index 5)
            mainCards.push(card);
        } else { // C- and below
            fillerCards.push(card);
        }
    });

    // Sort by grade (best first)
    mainCards.sort((a, b) => gradeOrder.indexOf(b.grade) - gradeOrder.indexOf(a.grade));
    fillerCards.sort((a, b) => gradeOrder.indexOf(b.grade) - gradeOrder.indexOf(a.grade));

    // Display main cards
    const mainList = document.getElementById('mainCardList');
    mainList.innerHTML = '';
    mainCards.forEach(card => {
        const li = document.createElement('li');
        const isCreature = isCreatureOrGeneratesCreatures(card);
        li.className = `card-item grade-${card.grade[0]}${isCreature ? ' creature-card' : ''}`;
        const cardName = isCreature ? `<u>${card.name}</u>` : card.name;
        li.innerHTML = `<strong>${cardName}</strong> [${card.grade}]`;
        mainList.appendChild(li);
    });

    // Display filler cards
    const fillerList = document.getElementById('fillerCardList');
    fillerList.innerHTML = '';
    fillerCards.forEach(card => {
        const li = document.createElement('li');
        const isCreature = isCreatureOrGeneratesCreatures(card);
        li.className = `card-item grade-${card.grade[0]}${isCreature ? ' creature-card' : ''}`;
        const cardName = isCreature ? `<u>${card.name}</u>` : card.name;
        li.innerHTML = `<strong>${cardName}</strong> [${card.grade}]`;
        fillerList.appendChild(li);
    });

    // Analyze color combinations
    analyzeColorCombinations(deckCards);
    
    // Analyze archetype highlights
    analyzeArchetypeHighlights(deckCards);

    // Show not found cards if any
    if (notFoundCards.length > 0) {
        const error = document.createElement('div');
        error.className = 'error';
        error.innerHTML = `<strong>Cards not found in rankings:</strong> ${notFoundCards.join(', ')}`;
        document.getElementById('results').appendChild(error);
    }

    document.getElementById('results').style.display = 'block';
}

/**
 * Analyze color combinations and suggest best pairs
 */
function analyzeColorCombinations(deckCards) {
    const colorPairs = ['WU', 'WB', 'WR', 'WG', 'UB', 'UR', 'UG', 'BR', 'BG', 'RG'];
    const pairScores = {};

    colorPairs.forEach(pair => {
        let score = 0;
        deckCards.forEach(card => {
            // Calculate adjusted grade for this specific archetype
            const adjustedGrade = getAdjustedGrade(card, pair);
            const gradeIndex = gradeOrder.indexOf(adjustedGrade);
            const gradeWeight = gradeIndex + 1; // F=1, D-=2, ... A+=13
            
            if (canFitInColorPair(card.cmc, pair)) {
                score += gradeWeight;
            }
        });
        pairScores[pair] = score;
    });

    // Sort pairs by score
    const sortedPairs = Object.entries(pairScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2); // Top 2 pairs

    const suggestionsDiv = document.getElementById('colorSuggestions');
    suggestionsDiv.innerHTML = `
        <p><strong>Recommended color combinations based on your deck's archetype-adjusted grades:</strong></p>
        ${sortedPairs.map(([pair, score]) => 
            `<span class="color-suggestion">${pair} (Score: ${score})</span>`
        ).join('')}
    `;
}

/**
 * Analyze archetype highlights and display breakdowns
 */
function analyzeArchetypeHighlights(deckCards) {
    const colorPairs = ['WU', 'WB', 'WR', 'WG', 'UB', 'UR', 'UG', 'BR', 'BG', 'RG'];
    const archetypeAnalysis = {};
    const lands = [];

    // Separate lands first
    deckCards.forEach(card => {
        if (isLand(card)) {
            lands.push(card);
        }
    });

    // Analyze each color pair
    colorPairs.forEach(pair => {
        const fittingCards = [];
        const splashCards = [];

        deckCards.forEach(card => {
            if (isLand(card)) return; // Skip lands

            if (canFitInColorPair(card.cmc, pair)) {
                // Calculate adjusted grade based on archetype fit
                const adjustedCard = {
                    ...card,
                    adjustedGrade: getAdjustedGrade(card, pair),
                    archetypeIndicator: getArchetypeIndicator(card, pair)
                };
                fittingCards.push(adjustedCard);
            } else if (isSplashCandidate(card, pair)) {
                // Apply archetype adjustments to splash cards too
                const adjustedCard = {
                    ...card,
                    adjustedGrade: getAdjustedGrade(card, pair),
                    archetypeIndicator: getArchetypeIndicator(card, pair),
                    extraColors: card.extraColors,
                    splashDifficulty: card.splashDifficulty
                };
                splashCards.push(adjustedCard);
            }
        });

        // Sort cards by adjusted grade (best first)
        fittingCards.sort((a, b) => gradeOrder.indexOf(b.adjustedGrade) - gradeOrder.indexOf(a.adjustedGrade));
        splashCards.sort((a, b) => gradeOrder.indexOf(b.adjustedGrade) - gradeOrder.indexOf(a.adjustedGrade));

        // Calculate archetype score based on top 23 cards using adjusted grades
        const top23 = fittingCards.slice(0, 23);
        let archetypeScore = top23.reduce((score, card) => {
            return score + (gradeOrder.indexOf(card.adjustedGrade) + 1);
        }, 0);

        // Apply creature density penalty
        const creatureCount = countCreaturesInArchetype(deckCards, pair);
        const creaturePenalty = Math.max(0, (13 - creatureCount) * 10);
        archetypeScore = Math.max(0, archetypeScore - creaturePenalty);

        archetypeAnalysis[pair] = {
            score: archetypeScore,
            fittingCards: fittingCards,
            splashCards: splashCards,
            creatureCount: creatureCount,
            creaturePenalty: creaturePenalty
        };
    });

    // Find top 2 archetypes
    const sortedArchetypes = Object.entries(archetypeAnalysis)
        .sort(([,a], [,b]) => b.score - a.score)
        .slice(0, 2);

    // Display first archetype
    if (sortedArchetypes[0]) {
        const [archetype1, analysis1] = sortedArchetypes[0];
        displayArchetypeBreakdown(1, archetype1, analysis1, deckCards);
    } else {
        clearArchetypeDisplay(1);
    }

    // Display second archetype
    if (sortedArchetypes[1]) {
        const [archetype2, analysis2] = sortedArchetypes[1];
        displayArchetypeBreakdown(2, archetype2, analysis2, deckCards);
    } else {
        clearArchetypeDisplay(2);
    }

    // Display lands
    displayLands(lands, deckCards);
}

/**
 * Display detailed breakdown for a specific archetype
 */
function displayArchetypeBreakdown(num, archetype, analysis, deckCards) {
    const { fittingCards, splashCards, creatureCount, creaturePenalty } = analysis;
    
    // Separate cards by tier using ADJUSTED grades
    const premium = fittingCards.filter(card => gradeOrder.indexOf(card.adjustedGrade) >= 6); // C+ and above
    const playable = fittingCards.filter(card => {
        const gradeIdx = gradeOrder.indexOf(card.adjustedGrade);
        return gradeIdx >= 4 && gradeIdx < 6; // C- to C
    });
    const filler = fittingCards.filter(card => gradeOrder.indexOf(card.adjustedGrade) < 4); // D+ and below

    // Build title with creature count info
    let titleText = `⭐ ${num === 1 ? 'Best' : 'Second Best'} Archetype: ${archetype} (${fittingCards.length} cards)`;
    titleText += `<br><small style="font-size: 12px; color: ${creatureCount >= 13 ? '#4ade80' : '#f87171'};">`;
    titleText += `Creatures/Threats: ${creatureCount}/13`;
    if (creaturePenalty > 0) {
        titleText += ` (Penalty: -${creaturePenalty} points)`;
    }
    titleText += `</small>`;
    
    document.getElementById(`archetype${num}Title`).innerHTML = titleText;

    // Display premium cards
    document.getElementById(`archetype${num}Premium`).innerHTML = 
        premium.length > 0 ? premium.map(card => createCardElement(card, 'normal', deckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No premium cards</p>';

    // Display playable cards
    document.getElementById(`archetype${num}Playable`).innerHTML = 
        playable.length > 0 ? playable.map(card => createCardElement(card, 'normal', deckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No playable cards</p>';

    // Display filler cards
    document.getElementById(`archetype${num}Filler`).innerHTML = 
        filler.length > 0 ? filler.map(card => createCardElement(card, 'normal', deckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No filler cards</p>';

    // Display splash considerations
    document.getElementById(`archetype${num}Splash`).innerHTML = 
        splashCards.length > 0 ? splashCards.map(card => createCardElement(card, 'splash', deckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No splash options</p>';
}

/**
 * Clear archetype display when no data is available
 */
function clearArchetypeDisplay(num) {
    document.getElementById(`archetype${num}Title`).innerHTML = `⭐ Best Archetype #${num}`;
    ['Premium', 'Playable', 'Filler', 'Splash'].forEach(tier => {
        document.getElementById(`archetype${num}${tier}`).innerHTML = 
            '<p style="text-align: center; color: #888; font-style: italic;">No archetype found</p>';
    });
}

/**
 * Display lands section
 */
function displayLands(lands, deckCards) {
    const landsSection = document.getElementById('landsSection');
    if (lands.length > 0) {
        lands.sort((a, b) => gradeOrder.indexOf(b.grade) - gradeOrder.indexOf(a.grade));
        landsSection.innerHTML = lands.map(card => createCardElement(card, 'normal', deckCards)).join('');
    } else {
        landsSection.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">No lands found</p>';
    }
}

/**
 * Create a card element for display
 */
function createCardElement(card, type = 'normal', deckCards = []) {
    // Use adjusted grade if available, otherwise use original grade
    const displayGrade = card.adjustedGrade || card.grade;
    const gradeClass = `grade-${displayGrade[0]}`;
    let extraClass = type === 'splash' ? ' splash-card' : '';
    const indicator = card.archetypeIndicator || '';
    
    // Check if this is a creature or generates creatures
    const isCreature = isCreatureOrGeneratesCreatures(card);
    const creatureClass = isCreature ? ' creature-card' : '';
    
    // Detect synergies
    const synergies = detectSynergies(deckCards, card.name);
    const synergySymbols = synergies.map(s => s.symbol).join('');
    
    const cardName = isCreature ? `<u>${card.name}</u>` : card.name;
    let cardDisplay = `<strong>${cardName}${indicator}${synergySymbols}</strong><br>[${card.grade}${card.adjustedGrade && card.adjustedGrade !== card.grade ? ` → ${card.adjustedGrade}` : ''}]`;
    
    // Add splash information for splash cards
    if (type === 'splash' && card.extraColors) {
        const extraColorsText = card.extraColors.join('');
        const difficultyWarning = card.splashDifficulty === 'dangerous' ? ' ⚠️' : '';
        cardDisplay += `<br><small>+${extraColorsText}${difficultyWarning}</small>`;
        
        if (card.splashDifficulty === 'dangerous') {
            extraClass += ' dangerous-splash';
        }
    }
    
    // Add synergy tooltips
    if (synergies.length > 0) {
        const tooltipText = synergies.map(s => s.note).join(' | ');
        cardDisplay = `<div title="${tooltipText}">${cardDisplay}</div>`;
    }
    
    return `<div class="card-item ${gradeClass}${extraClass}${creatureClass}">
        ${cardDisplay}
    </div>`;
}