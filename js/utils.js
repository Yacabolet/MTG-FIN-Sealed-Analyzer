// Utility functions for card analysis and data processing

/**
 * Check if a card is a creature or generates creatures
 */
function isCreatureOrGeneratesCreatures(card) {
    // Check if it's a creature by type
    if (card.type && card.type.toLowerCase().includes('creature')) {
        return true;
    }
    
    // Check if it's in the creature generators list
    return CREATURE_GENERATORS.includes(card.name);
}

/**
 * Count creatures that can fit in a specific archetype
 */
function countCreaturesInArchetype(cards, archetype) {
    return cards.filter(card => {
        return canFitInColorPair(card.cmc, archetype) && isCreatureOrGeneratesCreatures(card);
    }).length;
}

/**
 * Find a card in the rankings data by name
 */
function findCardInRankings(cardName) {
    // Try exact match first
    let found = rankingsData.find(card => 
        card.name.toLowerCase() === cardName.toLowerCase()
    );
    
    // If not found, try partial match
    if (!found) {
        found = rankingsData.find(card => 
            card.name.toLowerCase().includes(cardName.toLowerCase()) ||
            cardName.toLowerCase().includes(card.name.toLowerCase())
        );
    }
    
    return found;
}

/**
 * Check if a card can fit in a specific color pair
 */
function canFitInColorPair(cmc, colorPair) {
    if (!cmc || cmc === '') return true; // Colorless fits anywhere
    
    const cmcStr = cmc.toString();
    const colors = colorPair.split('');
    
    // Extract colors from CMC (ignore numbers and X)
    const cardColors = cmcStr.replace(/[\d+X]/g, '').split('').filter(c => c !== '');
    
    // Check if all card colors are in the pair (or card is colorless)
    return cardColors.length === 0 || cardColors.every(color => colors.includes(color));
}

/**
 * Get archetype indicator for a card in a specific archetype
 */
function getArchetypeIndicator(card, archetype) {
    const bestIn = card.bestIn ? card.bestIn.toString().toLowerCase() : '';
    const goodIn = card.goodIn ? card.goodIn.toString().toLowerCase() : '';
    const poorIn = card.poorIn ? card.poorIn.toString().toLowerCase() : '';
    
    const archetypeLower = archetype.toLowerCase();
    
    // Check if card is specifically best in this archetype
    if (bestIn === 'all' || bestIn.includes(archetypeLower)) {
        return '[++]';
    }
    
    // Check if card is poor in this archetype
    if (poorIn.includes(archetypeLower)) {
        return '[-]';
    }
    
    // Check if card is good in this archetype
    if (goodIn === 'all' || goodIn.includes(archetypeLower)) {
        return '[+]';
    }
    
    return ''; // No special indicator
}

/**
 * Get adjusted grade for a card in a specific archetype
 */
function getAdjustedGrade(card, archetype) {
    const indicator = getArchetypeIndicator(card, archetype);
    const currentGradeIndex = gradeOrder.indexOf(card.grade);
    
    if (indicator === '[++]') {
        // Best in: +2 ranks, capped at A+
        const newIndex = Math.min(currentGradeIndex + 2, gradeOrder.length - 1);
        return gradeOrder[newIndex];
    } else if (indicator === '[+]') {
        // Good in: +1 rank
        const newIndex = Math.min(currentGradeIndex + 1, gradeOrder.length - 1);
        return gradeOrder[newIndex];
    } else if (indicator === '[-]') {
        // Poor in: -1 rank
        const newIndex = Math.max(currentGradeIndex - 1, 0);
        return gradeOrder[newIndex];
    }
    
    return card.grade; // No adjustment
}

/**
 * Check if a card is a land
 */
function isLand(card) {
    const cmc = card.cmc ? card.cmc.toString() : '';
    const type = card.type ? card.type.toString().toLowerCase() : '';
    return (cmc === '' || cmc === 'undefined') && type.includes('land');
}

/**
 * Check if a card is a splash candidate for an archetype
 */
function isSplashCandidate(card, archetype) {
    const gradeIndex = gradeOrder.indexOf(card.adjustedGrade || card.grade);
    if (gradeIndex < 7) return false; // Must be B- or above (using adjusted grade)

    const cmcStr = card.cmc ? card.cmc.toString() : '';
    if (!cmcStr || cmcStr === '') return false;

    // Extract colors (ignore numbers and X)
    const cardColors = cmcStr.replace(/[\d+X]/g, '').split('').filter(c => c !== '');
    const archetypeColors = archetype.split('');

    // Must contain at least one color from archetype
    const hasArchetypeColor = cardColors.some(color => archetypeColors.includes(color));
    // Must contain at least one color not in archetype
    const hasExtraColor = cardColors.some(color => !archetypeColors.includes(color));

    if (hasArchetypeColor && hasExtraColor) {
        // Calculate extra colors for splash analysis
        const extraColors = cardColors.filter(color => !archetypeColors.includes(color));
        card.extraColors = [...new Set(extraColors)]; // Remove duplicates
        card.splashDifficulty = card.extraColors.length >= 2 ? 'dangerous' : 'manageable';
        return true;
    }

    return false;
}

/**
 * Detect synergies for a specific card in the deck
 */
function detectSynergies(deckCards, cardName) {
    const synergies = [];
    const synergy = CARD_SYNERGIES[cardName];
    
    if (!synergy) return synergies;
    
    if (synergy.type === "specific" || synergy.type === "mutual") {
        // Check for specific card synergies
        const hasPartner = synergy.synergiesWith.some(partnerName => 
            deckCards.some(card => card.name === partnerName)
        );
        if (hasPartner) {
            synergies.push({
                type: "synergy",
                note: synergy.note,
                symbol: "⚡"
            });
        }
    } else if (synergy.requiresTheme) {
        // Check theme requirements
        const themeCount = countThemeCards(deckCards, synergy.requiresTheme);
        const threshold = synergy.threshold || 3; // Default threshold
        
        if (themeCount >= threshold) {
            synergies.push({
                type: "enabled",
                note: `${synergy.note} (${themeCount} ${synergy.requiresTheme} cards)`,
                symbol: "⭐"
            });
        } else if (themeCount > 0) {
            synergies.push({
                type: "partial",
                note: `${synergy.note} (Need ${threshold - themeCount} more ${synergy.requiresTheme})`,
                symbol: "⚠️"
            });
        }
    }
    
    return synergies;
}

/**
 * Count cards that match a specific theme in the deck
 */
function countThemeCards(deckCards, theme) {
    switch (theme) {
        case "equipment":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("equipment")
            ).length;
        case "humans":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("human")
            ).length;
        case "towns":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("town")
            ).length;
        case "artifacts":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("artifact")
            ).length;
        case "vehicles":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("vehicle")
            ).length;
        case "birds":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("bird")
            ).length;
        case "spells":
            return deckCards.filter(card => 
                card.type && (card.type.toLowerCase().includes("instant") || 
                             card.type.toLowerCase().includes("sorcery"))
            ).length;
        case "enchantments":
            return deckCards.filter(card => 
                card.type && card.type.toLowerCase().includes("enchantment")
            ).length;
        case "sacrifice":
            // This is harder to detect automatically, but we can look for cards that create tokens/material
            return deckCards.filter(card => 
                (card.type && card.type.toLowerCase().includes("artifact")) ||
                (card.thoughts && card.thoughts.toLowerCase().includes("material"))
            ).length;
        case "high-cmc":
            return deckCards.filter(card => {
                const cmcStr = card.cmc ? card.cmc.toString() : '';
                const cmc = parseInt(cmcStr.replace(/[^0-9]/g, '')) || 0;
                return cmc >= 5;
            }).length;
        default:
            return 0;
    }
}

/**
 * Count removal spells in a card list
 */
function countRemovalSpells(cardList) {
    return cardList.filter(card => REMOVAL_SPELLS.includes(card.name)).length;
}

/**
 * Count equipment cards in a card list
 */
function countEquipment(cardList) {
    return cardList.filter(card => 
        card.type && card.type.toLowerCase().includes('equipment')
    ).length;
}

/**
 * Count big spells for UR archetype
 */
function countBigSpells(cardList) {
    return cardList.filter(card => {
        // Check if it's in the predefined list
        if (BIG_SPELLS.includes(card.name)) return true;
        
        // Check if it's a non-creature spell with CMC 4+
        if (card.type && card.type.toLowerCase().includes('creature')) return false;
        
        const cmcStr = card.cmc ? card.cmc.toString() : '';
        if (!cmcStr || cmcStr === '') return false;
        
        // If it has X, it can be cast for 4+
        if (cmcStr.includes('X')) return true;
        
        // Calculate total CMC (letters count as 1 each, numbers add up)
        const numbers = cmcStr.match(/\d+/g);
        const letters = cmcStr.replace(/[\d+X]/g, '').split('').filter(c => c !== '');
        
        const numberSum = numbers ? numbers.reduce((sum, num) => sum + parseInt(num), 0) : 0;
        const letterCount = letters.length;
        const totalCMC = numberSum + letterCount;
        
        return totalCMC >= 4;
    }).length;
}

/**
 * Count go wide creatures for GW archetype
 */
function countGoWideCreatures(cardList) {
    return cardList.filter(card => GO_WIDE_CREATURES.includes(card.name)).length;
}

/**
 * Count artifacts for WU archetype (including Retrieve the Esper)
 */
function countArtifacts(cardList) {
    return cardList.filter(card => 
        (card.type && card.type.toLowerCase().includes('artifact')) ||
        card.name === 'Retrieve the Esper'
    ).length;
}

/**
 * Count town lands for GU archetype, separating fitting vs non-fitting
 */
function countTownLands(cardList, archetype = null) {
    const townLands = cardList.filter(card => TOWN_LANDS.includes(card.name));
    
    if (!archetype) {
        return townLands.length;
    }
    
    const fitting = townLands.filter(card => canFitInColorPair(card.cmc, archetype)).length;
    const nonFitting = townLands.length - fitting;
    
    return { fitting, nonFitting, total: townLands.length };
}