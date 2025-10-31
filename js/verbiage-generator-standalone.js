// Standalone Verbiage Generator - Self-Contained
// Transforms casual recognition into professional, caring manager language

// Amazon's 16 Leadership Principles with keyword mapping
const LP_MAP = {
    'Customer Obsession': ['customer', 'service', 'quality', 'experience', 'satisfaction', 'delivery'],
    'Ownership': ['responsibility', 'accountability', 'initiative', 'commitment', 'dedication', 'ownership'],
    'Invent and Simplify': ['innovation', 'creative', 'solution', 'improve', 'simplify', 'efficient'],
    'Are Right, A Lot': ['judgment', 'decision', 'insight', 'analysis', 'accurate', 'correct'],
    'Learn and Be Curious': ['learning', 'growth', 'curious', 'knowledge', 'development', 'improve'],
    'Hire and Develop the Best': ['mentor', 'coach', 'develop', 'teach', 'train', 'guide', 'support'],
    'Insist on the Highest Standards': ['excellence', 'quality', 'standard', 'best', 'outstanding', 'exceptional'],
    'Think Big': ['vision', 'ambitious', 'goal', 'future', 'strategic', 'innovative'],
    'Bias for Action': ['quick', 'fast', 'proactive', 'decisive', 'action', 'speed', 'responsive'],
    'Frugality': ['efficient', 'resourceful', 'optimize', 'cost-effective', 'smart', 'practical'],
    'Earn Trust': ['trust', 'honest', 'transparent', 'reliable', 'integrity', 'respect', 'candid'],
    'Dive Deep': ['detail', 'thorough', 'investigate', 'analyze', 'deep', 'comprehensive'],
    'Have Backbone; Disagree and Commit': ['courage', 'challenge', 'conviction', 'stand', 'commit', 'determined'],
    'Deliver Results': ['results', 'achieve', 'accomplish', 'deliver', 'success', 'performance', 'goal'],
    'Strive to be Earth\'s Best Employer': ['team', 'culture', 'support', 'care', 'environment', 'wellbeing', 'safety'],
    'Success and Scale Bring Broad Responsibility': ['impact', 'community', 'responsibility', 'contribute', 'positive', 'difference']
};

const OPENINGS = [
    "I want to take a moment to recognize",
    "I'm incredibly proud to share",
    "It brings me great joy to acknowledge",
    "I'm truly grateful for",
    "I want to personally thank",
    "It's my pleasure to celebrate"
];

const TRANSITIONS = [
    "Their dedication to",
    "Their commitment to",
    "Their exceptional work in",
    "Their outstanding contribution to"
];

const CLOSINGS = [
    "Thank you for making such a positive impact!",
    "Your contributions truly make a difference!",
    "We're lucky to have you on our team!",
    "Keep up the amazing work!"
];

// Inject modal HTML
(function() {
    if (document.getElementById('verbiageGeneratorModal')) return;
    
    const modalHTML = `
<div id="verbiageGeneratorModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 99999; overflow-y: auto;">
    <div style="position: relative; max-width: 900px; margin: 30px auto; background: linear-gradient(135deg, #232F3E 0%, #37475A 100%); color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 50px rgba(255,215,0,0.5); border: 3px solid #FFD700;">
        
        <div style="margin-bottom: 30px; border-bottom: 3px solid #FFD700; padding-bottom: 20px;">
            <h2 style="color: #FFD700; margin: 0; font-size: 36px;">✨ Professional Shout Out Generator</h2>
            <p style="color: #FF9900; margin: 5px 0 0 0; font-size: 14px;">Transform your thoughts into professional, caring manager language with Amazon Leadership Principles</p>
        </div>
        
        <div style="background: rgba(255,215,0,0.1); padding: 30px; border-radius: 15px; border-left: 5px solid #FFD700; margin-bottom: 30px;">
            <h3 style="color: #FFD700; margin: 0 0 15px 0; font-size: 20px;">✍️ Write Your Recognition</h3>
            <p style="color: white; margin-bottom: 20px; font-size: 14px;">Enter your raw thoughts about someone's achievement. We'll make it sound professional and caring!</p>
            
            <textarea id="verbiageInput" placeholder="Example: John did a great job helping the new person learn the ropes today. He was patient and really took time to explain everything..." style="width: 100%; min-height: 150px; padding: 20px; border: 2px solid #FFD700; border-radius: 10px; background: white; color: #232F3E; font-size: 16px; font-family: inherit; resize: vertical;"></textarea>
            
            <div style="display: flex; gap: 15px; margin-top: 20px;">
                <button onclick="generateProfessionalShoutOut()" style="flex: 1; background: linear-gradient(135deg, #FF9900 0%, #FF6B00 100%); color: white; border: none; padding: 18px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255,153,0,0.4); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    ✨ Generate Professional Shout Out
                </button>
                <button onclick="clearVerbiageGenerator()" style="background: #37475A; color: white; border: 2px solid #FFD700; padding: 18px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#232F3E'" onmouseout="this.style.background='#37475A'">
                    🗑️ Clear
                </button>
            </div>
        </div>
        
        <div id="verbiageOutput" style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 15px; min-height: 200px;">
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
                <h3 style="color: #FFD700; margin-bottom: 10px;">Ready to Generate</h3>
                <p style="color: #666;">Enter your recognition text above and click Generate</p>
            </div>
        </div>
        
        <div id="verbiageActions" style="display: none; margin-top: 20px; gap: 15px; justify-content: center;">
            <button onclick="copyVerbiageToClipboard()" style="background: #FF9900; color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255,153,0,0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                📋 Copy to Clipboard
            </button>
            <button onclick="regenerateVerbiage()" style="background: #067D62; color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(6,125,98,0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🔄 Regenerate
            </button>
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 2px solid rgba(255,215,0,0.3);">
            <button onclick="closeVerbiageGenerator()" style="background: #D13212; color: white; border: none; padding: 15px 50px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(209,50,18,0.4); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(209,50,18,0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(209,50,18,0.4)'">
                ✖️ Close
            </button>
        </div>
        
    </div>
</div>
`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Verbiage Generator loaded');
})();

// Open Modal
function openVerbiageGenerator() {
    document.getElementById('verbiageGeneratorModal').style.display = 'block';
}

// Close Modal
function closeVerbiageGenerator() {
    document.getElementById('verbiageGeneratorModal').style.display = 'none';
}

// Identify Leadership Principle
function identifyPrinciple(text) {
    const lowerText = text.toLowerCase();
    const scores = {};
    
    for (const [principle, keywords] of Object.entries(LP_MAP)) {
        let score = 0;
        keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) score++;
        });
        scores[principle] = score;
    }
    
    let maxScore = 0;
    let selectedPrinciple = 'Deliver Results';
    
    for (const [principle, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            selectedPrinciple = principle;
        }
    }
    
    if (maxScore === 0) {
        const principles = Object.keys(LP_MAP);
        selectedPrinciple = principles[Math.floor(Math.random() * principles.length)];
    }
    
    return selectedPrinciple;
}

// Extract Name
function extractName(text) {
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i].replace(/[^a-zA-Z]/g, '');
        if (word.length > 2 && word[0] === word[0].toUpperCase()) {
            if (i + 1 < words.length) {
                const nextWord = words[i + 1].replace(/[^a-zA-Z]/g, '');
                if (nextWord.length > 1 && nextWord[0] === nextWord[0].toUpperCase()) {
                    return `${word} ${nextWord}`;
                }
            }
            return word;
        }
    }
    
    return null;
}

// Generate Professional Shout Out
function generateProfessionalShoutOut() {
    const inputText = document.getElementById('verbiageInput').value.trim();
    
    if (!inputText) {
        console.warn('Please enter some text to generate a shout out');
        return;
    }
    
    const name = extractName(inputText);
    const principle = identifyPrinciple(inputText);
    
    const opening = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
    const transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
    const closing = CLOSINGS[Math.floor(Math.random() * CLOSINGS.length)];
    
    let cleanedInput = inputText;
    if (name) {
        cleanedInput = cleanedInput.replace(new RegExp(name, 'gi'), '').trim();
    }
    
    if (cleanedInput && !cleanedInput.endsWith('.') && !cleanedInput.endsWith('!')) {
        cleanedInput += '.';
    }
    
    let shoutOut = '';
    if (name) {
        shoutOut = `${opening} <strong>${name}</strong>. ${transition} <strong>${principle}</strong> has been truly exceptional. ${cleanedInput} ${closing}`;
    } else {
        shoutOut = `${opening} this outstanding contribution. ${transition} <strong>${principle}</strong> has been remarkable. ${cleanedInput} ${closing}`;
    }
    
    document.getElementById('verbiageOutput').innerHTML = `
        <div style="background: rgba(255,215,0,0.1); padding: 25px; border-radius: 15px; border-left: 5px solid #FFD700;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #FFD700; margin: 0; font-size: 18px;">✨ Generated Shout Out</h4>
                <span style="background: #FF9900; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                    ${principle}
                </span>
            </div>
            <p style="color: white; font-size: 16px; line-height: 1.8; margin: 0;">
                ${shoutOut}
            </p>
        </div>
    `;
    
    document.getElementById('verbiageActions').style.display = 'flex';
}

// Copy to Clipboard
function copyVerbiageToClipboard() {
    const outputDiv = document.getElementById('verbiageOutput');
    const text = outputDiv.querySelector('p').textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.style.background = '#067D62';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#FF9900';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy to clipboard');
    });
}

// Regenerate
function regenerateVerbiage() {
    generateProfessionalShoutOut();
}

// Clear
function clearVerbiageGenerator() {
    document.getElementById('verbiageInput').value = '';
    document.getElementById('verbiageOutput').innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #999;">
            <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
            <h3 style="color: #FFD700; margin-bottom: 10px;">Ready to Generate</h3>
            <p style="color: #666;">Enter your recognition text above and click Generate</p>
        </div>
    `;
    document.getElementById('verbiageActions').style.display = 'none';
}
