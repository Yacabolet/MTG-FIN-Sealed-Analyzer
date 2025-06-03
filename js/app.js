// Main application logic and UI handling

// Global state
let rankingsData = [];
let isDataLoaded = false;
let currentDeckCards = [];
let currentNotFoundCards = [];
let currentArchetypeAnalysis = {};
let currentSelectedArchetype = null;
let isMobile = false;

// Initialize the application when page loads
window.addEventListener('load', function() {
    loadEmbeddedData();
    detectMobileAndApplyStyles();
});

/**
 * Detect if user is on mobile and apply mobile-friendly styles
 */
function detectMobileAndApplyStyles() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    
    isMobile = isMobileDevice || isSmallScreen;
    
    if (isMobile) {
        document.body.classList.add('mobile-detected');
        console.log('Mobile device detected - applying mobile optimizations');
    }
    
    // Listen for window resize to adjust mobile detection
    window.addEventListener('resize', function() {
        const wasSmallScreen = window.innerWidth <= 768;
        if (wasSmallScreen !== isSmallScreen) {
            if (wasSmallScreen) {
                document.body.classList.add('mobile-detected');
            } else if (!isMobileDevice) {
                document.body.classList.remove('mobile-detected');
            }
        }
    });
}

/**
 * Paste content from clipboard into the textarea
 */
async function pasteFromClipboard() {
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            const textarea = document.getElementById('deckList');
            textarea.value = text;
            textarea.focus();
        } else {
            // Fallback for browsers that don't support clipboard API
            alert('Clipboard access not supported. Please paste manually using Ctrl+V (or Cmd+V on Mac)');
        }
    } catch (error) {
        console.error('Failed to read clipboard:', error);
        alert('Failed to access clipboard. Please paste manually using Ctrl+V (or Cmd+V on Mac)');
    }
}

/**
 * Copy the top 23 cards of the selected archetype to clipboard
 */
async function copyArchetypeDeck() {
    if (!currentSelectedArchetype || !currentArchetypeAnalysis[currentSelectedArchetype]) {
        alert('No archetype selected');
        return;
    }
    
    const analysis = currentArchetypeAnalysis[currentSelectedArchetype];
    const allCards = [...analysis.fittingCards];
    
    // Get top 23 cards sorted by adjusted grade
    const top23Cards = allCards.slice(0, 23);
    
    // Count duplicates and create formatted list
    const cardCounts = {};
    top23Cards.forEach(card => {
        if (cardCounts[card.name]) {
            cardCounts[card.name]++;
        } else {
            cardCounts[card.name] = 1;
        }
    });
    
    // Format as "number cardname"
    const formattedList = Object.entries(cardCounts)
        .map(([cardName, count]) => `${count} ${cardName}`)
        .join('\n');
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(formattedList);
            showCopySuccessMessage();
        } else {
            // Fallback for browsers that don't support clipboard API
            copyToClipboardFallback(formattedList);
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        copyToClipboardFallback(formattedList);
    }
}

/**
 * Fallback method for copying text to clipboard
 */
function copyToClipboardFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccessMessage();
    } catch (error) {
        console.error('Fallback copy failed:', error);
        alert('Failed to copy to clipboard. Please copy manually.');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Show success message when copying to clipboard
 */
function showCopySuccessMessage() {
    const messageElement = document.getElementById('copySuccessMessage');
    messageElement.style.display = 'block';
    messageElement.classList.add('show');
    
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 300);
    }, 2000);
}

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
        alert('Please enter a sealed card pool list!');
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

    // Store results globally
    currentDeckCards = deckCards;
    currentNotFoundCards = notFoundCards;
    
    // Perform all analysis
    performFullAnalysis();
    
    // Hide input section and show main menu
    document.getElementById('inputSection').style.display = 'none';
    showMainMenu();
}

/**
 * Perform full analysis of the deck and store results
 */
function performFullAnalysis() {
    // Analyze archetypes
    analyzeAllArchetypes(currentDeckCards);
}

/**
 * Navigation Functions
 */
function showMainMenu() {
    hideAllViews();
    document.getElementById('mainMenu').style.display = 'block';
}

function showCardRankings() {
    hideAllViews();
    displayCardRankings();
    // Clear any previous error messages
    document.getElementById('errorMessages').innerHTML = '';
    document.getElementById('cardRankingsView').style.display = 'block';
}

function showArchetypeAnalysis() {
    hideAllViews();
    displayArchetypeSelection();
    // Clear selected archetype when returning to selection
    currentSelectedArchetype = null;
    // Clear any previous error messages
    document.getElementById('errorMessages').innerHTML = '';
    document.getElementById('archetypeAnalysisView').style.display = 'block';
}

function showLandsAndMisc() {
    hideAllViews();
    displayLandsAndMisc();
    document.getElementById('landsAndMiscView').style.display = 'block';
}

function restartAnalysis() {
    // Clear all data
    currentDeckCards = [];
    currentNotFoundCards = [];
    currentArchetypeAnalysis = {};
    currentSelectedArchetype = null;
    
    // Clear input
    document.getElementById('deckList').value = '';
    
    // Clear error messages
    document.getElementById('errorMessages').innerHTML = '';
    
    // Hide all views and show input section
    hideAllViews();
    document.getElementById('inputSection').style.display = 'block';
}

function hideAllViews() {
    const views = ['mainMenu', 'cardRankingsView', 'archetypeAnalysisView', 'landsAndMiscView'];
    views.forEach(viewId => {
        document.getElementById(viewId).style.display = 'none';
    });
}

/**
 * Display card rankings
 */
function displayCardRankings() {
    const mainCards = [];
    const fillerCards = [];

    // Separate cards by grade
    currentDeckCards.forEach(card => {
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
}

/**
 * Analyze all archetypes and store results
 */
function analyzeAllArchetypes(deckCards) {
    const colorPairs = ['WU', 'WB', 'WR', 'WG', 'UB', 'UR', 'UG', 'BR', 'BG', 'RG'];
    currentArchetypeAnalysis = {};

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

        // Calculate archetype-specific stats
        const remainingCards = fittingCards.slice(23);
        const archetypeStats = {
            removal: {
                top23: countRemovalSpells(top23),
                remaining: countRemovalSpells(remainingCards)
            }
        };

        // Add archetype-specific trackers
        if (pair === 'WR') {
            archetypeStats.equipment = {
                top23: countEquipment(top23),
                remaining: countEquipment(remainingCards)
            };
        } else if (pair === 'UR') {
            archetypeStats.bigSpells = {
                top23: countBigSpells(top23),
                remaining: countBigSpells(remainingCards)
            };
        } else if (pair === 'WG') {
            archetypeStats.goWide = {
                top23: countGoWideCreatures(top23),
                remaining: countGoWideCreatures(remainingCards)
            };
        } else if (pair === 'WU') {
            archetypeStats.artifacts = {
                top23: countArtifacts(top23),
                remaining: countArtifacts(remainingCards)
            };
        } else if (pair === 'UG') {
            const townStats = countTownLands(deckCards, pair);
            archetypeStats.townLands = {
                fitting: townStats.fitting,
                nonFitting: townStats.nonFitting,
                total: townStats.total
            };
        }

        currentArchetypeAnalysis[pair] = {
            score: archetypeScore,
            fittingCards: fittingCards,
            splashCards: splashCards,
            creatureCount: creatureCount,
            creaturePenalty: creaturePenalty,
            stats: archetypeStats
        };
    });
}

/**
 * Display archetype selection buttons
 */
function displayArchetypeSelection() {
    const buttonsContainer = document.getElementById('archetypeButtons');
    buttonsContainer.innerHTML = '';

    // Sort archetypes by score
    const sortedArchetypes = Object.entries(currentArchetypeAnalysis)
        .sort(([,a], [,b]) => b.score - a.score);

    sortedArchetypes.forEach(([archetype, analysis], index) => {
        const { fittingCards } = analysis;
        
        // Calculate creature breakdown for top 23 vs remaining cards
        const top23Cards = fittingCards.slice(0, 23);
        const remainingCards = fittingCards.slice(23);
        
        const creaturesInTop23 = top23Cards.filter(card => isCreatureOrGeneratesCreatures(card)).length;
        const creaturesInRemaining = remainingCards.filter(card => isCreatureOrGeneratesCreatures(card)).length;
        
        const button = document.createElement('button');
        button.className = 'archetype-button';
        
        let threatDisplay = `Threats: ${creaturesInTop23}`;
        if (creaturesInRemaining > 0) {
            threatDisplay += ` (${creaturesInRemaining})`;
        }
        
        button.innerHTML = `
            <strong>${archetype}</strong><br>
            <small>Score: ${analysis.score} | ${threatDisplay}</small>
        `;
        button.onclick = () => selectArchetype(archetype, button);
        buttonsContainer.appendChild(button);
    });

    // Hide archetype details initially
    document.getElementById('archetypeDetails').style.display = 'none';
}

/**
 * Select and display a specific archetype
 */
function selectArchetype(archetype, buttonElement) {
    // Store the currently selected archetype
    currentSelectedArchetype = archetype;
    
    // Update button selection
    document.querySelectorAll('.archetype-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    buttonElement.classList.add('selected');

    // Display archetype details
    const analysis = currentArchetypeAnalysis[archetype];
    displayArchetypeDetails(archetype, analysis);
    document.getElementById('archetypeDetails').style.display = 'block';
}

/**
 * Display detailed breakdown for a specific archetype
 */
function displayArchetypeDetails(archetype, analysis) {
    const { fittingCards, splashCards, creatureCount, creaturePenalty, stats } = analysis;
    
    // Calculate creature breakdown for top 23 vs remaining cards
    const top23Cards = fittingCards.slice(0, 23);
    const remainingCards = fittingCards.slice(23);
    
    const creaturesInTop23 = top23Cards.filter(card => isCreatureOrGeneratesCreatures(card)).length;
    const creaturesInRemaining = remainingCards.filter(card => isCreatureOrGeneratesCreatures(card)).length;
    
    // Separate cards by tier using ADJUSTED grades
    const premium = fittingCards.filter(card => gradeOrder.indexOf(card.adjustedGrade) >= 6); // C+ and above
    const playable = fittingCards.filter(card => {
        const gradeIdx = gradeOrder.indexOf(card.adjustedGrade);
        return gradeIdx >= 4 && gradeIdx < 6; // C- to C
    });
    const filler = fittingCards.filter(card => gradeOrder.indexOf(card.adjustedGrade) < 4); // D+ and below

    // Build title with stats
    let titleText = `${archetype} Archetype Details (${fittingCards.length} cards)`;
    titleText += `<br><small style="font-size: 12px; color: ${creaturesInTop23 >= 13 ? '#4ade80' : '#f87171'};">`;
    titleText += `Threats: ${creaturesInTop23}`;
    if (creaturesInRemaining > 0) {
        titleText += ` (${creaturesInRemaining})`;
    }
    
    // Add removal stats
    if (stats.removal) {
        titleText += ` | Removal: ${stats.removal.top23}`;
        if (stats.removal.remaining > 0) {
            titleText += ` (${stats.removal.remaining})`;
        }
    }
    
    // Add archetype-specific stats
    if (stats.equipment) {
        titleText += ` | Equipment: ${stats.equipment.top23}`;
        if (stats.equipment.remaining > 0) {
            titleText += ` (${stats.equipment.remaining})`;
        }
    } else if (stats.bigSpells) {
        titleText += ` | Big Spells: ${stats.bigSpells.top23}`;
        if (stats.bigSpells.remaining > 0) {
            titleText += ` (${stats.bigSpells.remaining})`;
        }
    } else if (stats.goWide) {
        titleText += ` | Go Wide: ${stats.goWide.top23}`;
        if (stats.goWide.remaining > 0) {
            titleText += ` (${stats.goWide.remaining})`;
        }
    } else if (stats.artifacts) {
        titleText += ` | Artifacts: ${stats.artifacts.top23}`;
        if (stats.artifacts.remaining > 0) {
            titleText += ` (${stats.artifacts.remaining})`;
        }
    } else if (stats.townLands) {
        titleText += ` | Town Lands: ${stats.townLands.fitting}`;
        if (stats.townLands.nonFitting > 0) {
            titleText += ` (${stats.townLands.nonFitting})`;
        }
    }
    
    if (creaturePenalty > 0) {
        titleText += ` | Penalty: -${creaturePenalty} points`;
    }
    titleText += `</small>`;
    
    document.getElementById('selectedArchetypeTitle').innerHTML = titleText;

    // Display premium cards
    document.getElementById('selectedArchetypePremium').innerHTML = 
        premium.length > 0 ? premium.map(card => createCardElement(card, 'normal', currentDeckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No premium cards</p>';

    // Display playable cards
    document.getElementById('selectedArchetypePlayable').innerHTML = 
        playable.length > 0 ? playable.map(card => createCardElement(card, 'normal', currentDeckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No playable cards</p>';

    // Display filler cards
    document.getElementById('selectedArchetypeFiller').innerHTML = 
        filler.length > 0 ? filler.map(card => createCardElement(card, 'normal', currentDeckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No filler cards</p>';

    // Display splash considerations
    document.getElementById('selectedArchetypeSplash').innerHTML = 
        splashCards.length > 0 ? splashCards.map(card => createCardElement(card, 'splash', currentDeckCards)).join('') : 
        '<p style="text-align: center; color: #888; font-style: italic;">No splash options</p>';
}

/**
 * Display lands and miscellaneous cards
 */
function displayLandsAndMisc() {
    const lands = [];
    currentDeckCards.forEach(card => {
        if (isLand(card)) {
            lands.push(card);
        }
    });

    // Display lands
    const landsSection = document.getElementById('landsSection');
    if (lands.length > 0) {
        lands.sort((a, b) => gradeOrder.indexOf(b.grade) - gradeOrder.indexOf(a.grade));
        landsSection.innerHTML = lands.map(card => createCardElement(card, 'normal', currentDeckCards)).join('');
    } else {
        landsSection.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">No lands found</p>';
    }

    // Display unidentified cards
    const unidentifiedSection = document.getElementById('unidentifiedSection');
    if (currentNotFoundCards.length > 0) {
        unidentifiedSection.innerHTML = currentNotFoundCards.map(cardName => 
            `<div class="card-item" style="border-left-color: #888888;"><strong>${cardName}</strong></div>`
        ).join('');
    } else {
        unidentifiedSection.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">No unidentified cards</p>';
    }
    
    // Clear any previous error messages since unidentified cards are now handled in the proper section
    document.getElementById('errorMessages').innerHTML = '';
}

/**
 * Toggle collapsible sections
 */
function toggleCollapsible(sectionId) {
    const content = document.getElementById(sectionId + 'Content');
    const icon = document.getElementById(sectionId + 'Icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.textContent = '▼';
        icon.classList.remove('collapsed');
    } else {
        content.classList.add('hidden');
        icon.textContent = '▶';
        icon.classList.add('collapsed');
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