console.log("script loaded");
const grooveTypes = [
  "uplift",
  "driving",
  "triumphant",
  "tense",
  "dark",
  "mysterious",
  "brooding",
  "warm"
];
document.querySelector("h1").textContent = "Emotion Engine";
    const emotions = [
  { id: "power", label: "Power", color: "#FF5A5F" },
  { id: "anticipation", label: "Anticipation", color: "#FF9F1C" },
  { id: "joy", label: "Joy", color: "#FFD84D" },
  { id: "trust", label: "Trust", color: "#4ADE80" },
  { id: "fear", label: "Fear", color: "#38BDF8" },
  { id: "surprise", label: "Surprise", color: "#A78BFA" },
  { id: "sadness", label: "Sadness", color: "#5B6CFF" },
  { id: "disgust", label: "Disgust", color: "#8B5CF6" }
];

let audioCtx = null;
let grooveInterval = null;
let step = 0;

let kickSample;
let snareSample;
let hatSample;

const emotionFreqs = {
  power: 130.81,        // C3
  anticipation: 164.81, // E3
  joy: 392.00,          // G4
  trust: 220.00,        // A3
  fear: 196.63,         // G3
  surprise: 329.63,     // E4
  sadness: 98.00,      // G2
  disgust: 246.94       // B3
};

const grooveProfiles = {

  uplift: {
    kickPattern: [1,0,0,0,1,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,1,1,1,1,1,1],
    bassStyle: "bounce"
  },

  driving: {
    kickPattern: [1,0,1,0,1,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,1,1,1,1,1,1],
    bassStyle: "run"
  },

  triumphant: {
    kickPattern: [1,0,0,1,1,0,0,1],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,1,1,1,1,1,1],
    bassStyle: "octave"
  },

  tense: {
    kickPattern: [1,0,0,0,0,1,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,0,1,0,1,0,1,0],
    bassStyle: "pulse"
  },

  dark: {
    kickPattern: [1,0,0,0,0,0,1,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,0,1,0,1,0,1,0],
    bassStyle: "slow"
  },

  brooding: {
    kickPattern: [1,0,0,0,1,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,0,1,0,1,0,1,0],
    bassStyle: "minor"
  },

  mysterious: {
    kickPattern: [1,0,0,0,0,1,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,0,1,1,0,1,1,0],
    bassStyle: "slide"
  },

  warm: {
    kickPattern: [1,0,0,0,1,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,0,1,1,1,0,1],
    bassStyle: "soft"
  },

  soft: {
  kickPattern: [1,0,0,0,1,0,0,0],
  snarePattern: [0,0,1,0,0,0,1,0],
  hatPattern: [1,0,0,1,0,0,1,0],
  bassStyle: "soft"
}

};

function getActiveEmotionProfile() {
  if (selectedEmotions.length === 3) {
    const key = makeTriadKey(selectedEmotions);
    return triads[key];
  }

  if (selectedEmotions.length === 2) {
  const key = makeDiadKey(selectedEmotions[0], selectedEmotions[1]);
  const diad = diads[key];
  if (!diad) return null;

  const grooveMap = {
    "joy|trust": { groove: "warm", energy: 3 },                 // Love
    "fear|surprise": { groove: "tense", energy: 4 },            // Awe / Alarm
    "power|joy": { groove: "triumphant", energy: 4 },           // Pride
    "power|anticipation": { groove: "driving", energy: 4 },     // Aggressiveness
    "anticipation|joy": { groove: "uplift", energy: 4 },        // Optimism
    "anticipation|fear": { groove: "tense", energy: 3 },        // Anxiety
    "anticipation|trust": { groove: "uplift", energy: 3 },      // Hope
    "anticipation|surprise": { groove: "mysterious", energy: 3 }, // Confusion
    "anticipation|sadness": { groove: "brooding", energy: 2 },  // Pessimism
    "anticipation|disgust": { groove: "mysterious", energy: 2 },// Cynicism
    "power|trust": { groove: "driving", energy: 4 },            // Dominance
    "power|fear": { groove: "dark", energy: 2 },                // Frozenness
    "power|surprise": { groove: "tense", energy: 4 },           // Outrage
    "power|sadness": { groove: "brooding", energy: 3 },         // Envy
    "power|disgust": { groove: "dark", energy: 3 },             // Contempt
    "fear|joy": { groove: "brooding", energy: 2 },              // Guilt
    "joy|surprise": { groove: "uplift", energy: 4 },            // Delight
    "joy|sadness": { groove: "warm", energy: 2 },               // Catharsis
    "disgust|joy": { groove: "mysterious", energy: 2 },         // Morbidness
    "fear|trust": { groove: "brooding", energy: 2 },            // Submission
    "surprise|trust": { groove: "uplift", energy: 3 },          // Curiosity
    "sadness|trust": { groove: "warm", energy: 2 },             // Sentimentality
    "disgust|trust": { groove: "mysterious", energy: 2 },       // Ambivalence
    "fear|sadness": { groove: "dark", energy: 2 },              // Despair
    "disgust|fear": { groove: "dark", energy: 2 },              // Shame
    "sadness|surprise": { groove: "brooding", energy: 2 },      // Disapproval
    "disgust|surprise": { groove: "tense", energy: 3 },         // Disbelief
    "disgust|sadness": { groove: "dark", energy: 2 }            // Remorse
  };

  return {
    ...diad,
    ...(grooveMap[key] || { groove: "driving", energy: 3 })
  };
}

  if (selectedEmotions.length === 1) {
  const primaryProfiles = {
    power: { groove: "driving", energy: 4 },
    anticipation: { groove: "uplift", energy: 3 },
    joy: { groove: "warm", energy: 3 },
    trust: { groove: "soft", energy: 2 },
    fear: { groove: "tense", energy: 3 },
    surprise: { groove: "mysterious", energy: 3 },
    sadness: { groove: "brooding", energy: 1 },
    disgust: { groove: "dark", energy: 2 }
  };

  return primaryProfiles[selectedEmotions[0]] || { groove: "driving", energy: 3 };
}

  return null;
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    loadSample("assets/samples/kick.wav").then(buffer => {
      kickSample = buffer;
      console.log("kick loaded");
    }).catch(err => console.error("kick failed", err));

    loadSample("assets/samples/snare.wav").then(buffer => {
      snareSample = buffer;
      console.log("snare loaded");
    }).catch(err => console.error("snare failed", err));

    loadSample("assets/samples/hihat.wav").then(buffer => {
      hatSample = buffer;
      console.log("hat loaded");
    }).catch(err => console.error("hat failed", err));
  }
}

function loadSample(url) {
  return fetch(url)
    .then(res => res.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data));
}

function playSample(buffer, volume = 0.5) {
  if (!buffer || !audioCtx) return;

  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  source.buffer = buffer;
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(audioCtx.destination);

  source.start();
}

const emotionColors = {
  power: "#FF5A5F",
  anticipation: "#FF9F1C",
  joy: "#FFD84D",
  trust: "#4ADE80",
  fear: "#38BDF8",
  surprise: "#A78BFA",
  sadness: "#5B6CFF",
  disgust: "#8B5CF6"
};

function getTriadColors(ids) {
  return ids.map(id => emotionColors[id]);
}

    const diads = {
  "anticipation|power": {
    name: "Aggressiveness",
    primaries: ["Power", "Anticipation"],
    description: "Anticipating threats and likely to behave violently to protect or defend.",
    colors: ["#FF5A5F", "#FF9F1C"]
  },
  "joy|power": {
    name: "Pride",
    primaries: ["Power", "Joy"],
    description: "Satisfaction and pleasure in meeting one's needs.",
    colors: ["#FF5A5F", "#FFD84D"]
  },
  "power|trust": {
    name: "Dominance",
    primaries: ["Power", "Trust"],
    description: "Influence on others via their acceptance of your gain of control, power, or status.",
    colors: ["#FF5A5F", "#4ADE80"]
  },
  "fear|power": {
    name: "Frozenness",
    primaries: ["Power", "Fear"],
    description: "Uncontrollably becoming rigid, overwhelmed, and unable to fight or flee.",
    colors: ["#FF5A5F", "#38BDF8"]
  },
  "power|surprise": {
    name: "Outrage",
    primaries: ["Power", "Surprise"],
    description: "Shocked by unfair treatment or an unexpected event, producing a desire to punish the source.",
    colors: ["#FF5A5F", "#A78BFA"]
  },
  "power|sadness": {
    name: "Envy",
    primaries: ["Power", "Sadness"],
    description: "A perceived threat, unfairness, or obstacle where others have something they should not.",
    colors: ["#FF5A5F", "#5B6CFF"]
  },
  "disgust|power": {
    name: "Contempt",
    primaries: ["Power", "Disgust"],
    description: "Feeling others are beneath you and failing to meet your standards.",
    colors: ["#FF5A5F", "#8B5CF6"]
  },

  "anticipation|joy": {
    name: "Optimism",
    primaries: ["Anticipation", "Joy"],
    description: "Expectation and action based on a positive, favorable outcome.",
    colors: ["#FF9F1C", "#FFD84D"]
  },
  "anticipation|trust": {
    name: "Hope",
    primaries: ["Anticipation", "Trust"],
    description: "Expectation with confidence and motivation toward desired goals.",
    colors: ["#FF9F1C", "#4ADE80"]
  },
  "anticipation|fear": {
    name: "Anxiety",
    primaries: ["Anticipation", "Fear"],
    description: "Expectation or prediction of future threat, unfair treatment, or dread.",
    colors: ["#FF9F1C", "#38BDF8"]
  },
  "anticipation|surprise": {
    name: "Confusion",
    primaries: ["Anticipation", "Surprise"],
    description: "Breakdown of order and uncertainty about one's place.",
    colors: ["#FF9F1C", "#A78BFA"]
  },
  "anticipation|sadness": {
    name: "Pessimism",
    primaries: ["Anticipation", "Sadness"],
    description: "Expectation and action based on a negative, unfavorable outcome.",
    colors: ["#FF9F1C", "#5B6CFF"]
  },
  "anticipation|disgust": {
    name: "Cynicism",
    primaries: ["Anticipation", "Disgust"],
    description: "General distrust of others' motivations and standards.",
    colors: ["#FF9F1C", "#8B5CF6"]
  },

  "joy|trust": {
    name: "Love",
    primaries: ["Joy", "Trust"],
    description: "Positive emotions arising from kindness, loyalty, compassion, and acceptance.",
    colors: ["#FFD84D", "#4ADE80"]
  },
  "fear|joy": {
    name: "Guilt",
    primaries: ["Joy", "Fear"],
    description: "Belief that one has compromised standards and bears responsibility.",
    colors: ["#FFD84D", "#38BDF8"]
  },
  "joy|surprise": {
    name: "Delight",
    primaries: ["Joy", "Surprise"],
    description: "Pleasure and satisfaction in an unexpected positive event.",
    colors: ["#FFD84D", "#A78BFA"]
  },
  "joy|sadness": {
    name: "Catharsis",
    primaries: ["Joy", "Sadness"],
    description: "Relief by expressing and releasing extreme emotion.",
    colors: ["#FFD84D", "#5B6CFF"]
  },
  "disgust|joy": {
    name: "Morbidness",
    primaries: ["Joy", "Disgust"],
    description: "A susceptibility to gloomy or unwholesome feelings.",
    colors: ["#FFD84D", "#8B5CF6"]
  },

  "fear|trust": {
    name: "Submission",
    primaries: ["Trust", "Fear"],
    description: "Yielding to the judgment of a recognized superior out of respect or reverence.",
    colors: ["#4ADE80", "#38BDF8"]
  },
  "surprise|trust": {
    name: "Curiosity",
    primaries: ["Trust", "Surprise"],
    description: "Desire to gather knowledge of the unfamiliar and restore coherence.",
    colors: ["#4ADE80", "#A78BFA"]
  },
  "sadness|trust": {
    name: "Sentimentality",
    primaries: ["Trust", "Sadness"],
    description: "Reliance on feelings over reason to determine the magnitude of loss.",
    colors: ["#4ADE80", "#5B6CFF"]
  },
  "disgust|trust": {
    name: "Ambivalence",
    primaries: ["Trust", "Disgust"],
    description: "Accepting something while also wanting to avoid or expel it.",
    colors: ["#4ADE80", "#8B5CF6"]
  },

  "fear|surprise": {
    name: "Awe",
    primaries: ["Fear", "Surprise"],
    description: "Reverence, dread, and wonder inspired by something powerful or sublime.",
    colors: ["#38BDF8", "#A78BFA"]
  },
  "fear|sadness": {
    name: "Despair",
    primaries: ["Fear", "Sadness"],
    description: "Moving away from perceived loss with little hope of recovery.",
    colors: ["#38BDF8", "#5B6CFF"]
  },
  "disgust|fear": {
    name: "Shame",
    primaries: ["Fear", "Disgust"],
    description: "Painful self-evaluation, withdrawal, and feelings of worthlessness.",
    colors: ["#38BDF8", "#8B5CF6"]
  },

  "sadness|surprise": {
    name: "Disapproval",
    primaries: ["Surprise", "Sadness"],
    description: "A negative opinion when something fails to meet expectations.",
    colors: ["#A78BFA", "#5B6CFF"]
  },
  "disgust|surprise": {
    name: "Disbelief",
    primaries: ["Surprise", "Disgust"],
    description: "Inability or unwillingness to believe something repulsive is the case.",
    colors: ["#A78BFA", "#8B5CF6"]
  },

  "disgust|sadness": {
    name: "Remorse",
    primaries: ["Sadness", "Disgust"],
    description: "Regret for an action or failure to act, paired with self-rejection.",
    colors: ["#5B6CFF", "#8B5CF6"]
  }
};

    const triads = {

"anticipation|joy|trust": {
  name: "Cheerful / Sanguine",
  description: "Marked by eager hopefulness and confident optimism about what lies ahead.",
  colors: ["#FF9F1C","#FFD84D","#4ADE80"],
  groove: "uplift",
  energy: 4
},

"anticipation|power|trust": {
  name: "Confident",
  description: "Clear-headed trust in one's hypothesis, prediction, or chosen course of action.",
  colors: ["#FF5A5F","#FF9F1C","#4ADE80"],
  groove: "driving",
  energy: 4
},

"joy|power|trust": {
  name: "Exultant",
  description: "Joyful pride and satisfaction following victory, success, or accomplishment.",
  colors: ["#FF5A5F","#FFD84D","#4ADE80"],
  groove: "triumphant",
  energy: 5
},

"anticipation|joy|power": {
  name: "Ambitious",
  description: "Energetic desire to achieve success, fueled by excitement about future possibilities.",
  colors: ["#FF5A5F","#FF9F1C","#FFD84D"],
  groove: "driving",
  energy: 4
},

"joy|surprise|trust": {
  name: "Fascination",
  description: "Deep interest and attraction sparked by something unexpectedly delightful.",
  colors: ["#FFD84D","#4ADE80","#A78BFA"],
  groove: "uplift",
  energy: 3
},

"power|sadness|surprise": {
  name: "Begrudge",
  description: "Resentful awareness of another's advantage, mixed with reluctant recognition of it.",
  colors: ["#FF5A5F","#5B6CFF","#A78BFA"],
  groove: "tense",
  energy: 3
},

"disgust|power|sadness": {
  name: "Sadistic",
  description: "Deriving satisfaction or pleasure from inflicting pain, humiliation, or suffering.",
  colors: ["#FF5A5F","#5B6CFF","#8B5CF6"],
  groove: "dark",
  energy: 4
},

"anticipation|power|sadness": {
  name: "Vengeful",
  description: "Determined anticipation of punishment or retaliation against a perceived wrong.",
  colors: ["#FF9F1C","#FF5A5F","#5B6CFF"],
  groove: "driving",
  energy: 4
},

"anticipation|disgust|sadness": {
  name: "Misanthropic",
  description: "A deep distrust and dislike of humankind rooted in disappointment and revulsion.",
  colors: ["#FF9F1C","#5B6CFF","#8B5CF6"],
  groove: "brooding",
  energy: 2
},

"fear|joy|trust": {
  name: "Admiration",
  description: "Recognition of another's excellence or virtue that inspires respect and warmth.",
  colors: ["#FFD84D","#4ADE80","#38BDF8"],
  groove: "uplift",
  energy: 3
},

"fear|joy|surprise": {
  name: "Fawning",
  description: "Seeking approval or protection through exaggerated friendliness or submission.",
  colors: ["#FFD84D","#38BDF8","#A78BFA"],
  groove: "tense",
  energy: 3
},

"fear|sadness|surprise": {
  name: "Jealousy / Disillusion",
  description: "Painful awareness that something once admired or desired is slipping away or false.",
  colors: ["#38BDF8","#A78BFA","#5B6CFF"],
  groove: "brooding",
  energy: 2
},

"disgust|fear|surprise": {
  name: "Offended",
  description: "A shocked sense of insult or violation accompanied by moral revulsion.",
  colors: ["#38BDF8","#A78BFA","#8B5CF6"],
  groove: "tense",
  energy: 3
},

"fear|surprise|trust": {
  name: "Cowardice",
  description: "Reluctance to act or resist due to fear, even when trust or duty calls for courage.",
  colors: ["#38BDF8","#A78BFA","#4ADE80"],
  groove: "mysterious",
  energy: 2
},

"disgust|fear|sadness": {
  name: "Disgrace",
  description: "Loss of dignity or reputation following a shameful or dishonorable act.",
  colors: ["#38BDF8","#5B6CFF","#8B5CF6"],
  groove: "dark",
  energy: 2
},

/* -------- NEW TRIADS -------- */

"anticipation|fear|power": {
  name: "Intimidation",
  description: "The projection of threat or force that pressures others into submission.",
  groove: "tense",
  energy: 4
},

"anticipation|power|surprise": {
  name: "Dominance",
  description: "Assertive control that suddenly shifts the balance of power.",
  groove: "driving",
  energy: 5
},

"anticipation|disgust|power": {
  name: "Ruthlessness",
  description: "Relentless pursuit of goals without regard for compassion or moral restraint.",
  groove: "dark",
  energy: 4
},

"fear|joy|power": {
  name: "Thrill",
  description: "Excitement that arises from confronting danger or risk with confidence.",
  groove: "uplift",
  energy: 5
},

"joy|power|surprise": {
  name: "Triumph",
  description: "Exultant recognition of victory or overwhelming success.",
  groove: "triumphant",
  energy: 5
},

"joy|power|sadness": {
  name: "Schadenfreude",
  description: "Pleasure felt at another person's misfortune or failure.",
  groove: "dark",
  energy: 3
},

"disgust|joy|power": {
  name: "Arrogance",
  description: "Inflated self-confidence mixed with contempt toward others.",
  groove: "driving",
  energy: 4
},

"fear|power|trust": {
  name: "Compulsive Compliance",
  description: "Submission driven by authority or threat rather than genuine agreement.",
  groove: "tense",
  energy: 3
},

"power|surprise|trust": {
  name: "Commanding",
  description: "Authority expressed with sudden clarity that compels attention and obedience.",
  groove: "driving",
  energy: 4
},

"power|sadness|trust": {
  name: "Wistful Tyranny",
  description: "Power exercised with reluctant awareness of its burdens or consequences.",
  groove: "brooding",
  energy: 3
},

"disgust|power|trust": {
  name: "Condescension",
  description: "A patronizing attitude toward others perceived as inferior.",
  groove: "tense",
  energy: 3
},

"fear|power|surprise": {
  name: "Shock",
  description: "Sudden overwhelming fear triggered by a powerful and unexpected event.",
  groove: "tense",
  energy: 4
},

"fear|power|sadness": {
  name: "Traumatic Paralysis",
  description: "Emotional and psychological shutdown caused by overwhelming fear and loss.",
  groove: "dark",
  energy: 2
},

"disgust|fear|power": {
  name: "Loathing",
  description: "Deep hatred or revulsion directed toward someone perceived as threatening or corrupt.",
  groove: "dark",
  energy: 3
},

"disgust|power|surprise": {
  name: "Righteous Indignation",
  description: "Anger fueled by moral outrage at a perceived injustice.",
  groove: "driving",
  energy: 4
},

"anticipation|fear|joy": {
  name: "Nervous Excitement",
  description: "Anxious anticipation mixed with eagerness about what might happen next.",
  groove: "uplift",
  energy: 4
},

"anticipation|joy|surprise": {
  name: "Enchantment",
  description: "Delighted wonder sparked by something unexpectedly beautiful or magical.",
  groove: "uplift",
  energy: 3
},

"anticipation|joy|sadness": {
  name: "Grim Determination",
  description: "Hopeful resolve maintained despite the awareness of hardship or loss.",
  groove: "driving",
  energy: 3
},

"anticipation|disgust|joy": {
  name: "Sardonicism",
  description: "Mocking amusement rooted in cynical awareness of life's absurdities.",
  groove: "mysterious",
  energy: 3
},

"anticipation|fear|trust": {
  name: "Anxious Attachment",
  description: "Clinging reliance on others mixed with persistent fear of abandonment.",
  groove: "tense",
  energy: 3
},

"anticipation|surprise|trust": {
  name: "Active Wonder",
  description: "Curiosity and openness toward unexpected discoveries.",
  groove: "uplift",
  energy: 3
},

"anticipation|sadness|trust": {
  name: "Bittersweet Nostalgia",
  description: "Fond remembrance colored by the melancholy awareness that the past cannot return.",
  groove: "brooding",
  energy: 2
},

"anticipation|disgust|trust": {
  name: "Skeptical Idealism",
  description: "Hope for improvement tempered by distrust of flawed systems or people.",
  groove: "mysterious",
  energy: 2
},

"anticipation|fear|surprise": {
  name: "Sublime Dread",
  description: "Awe and terror combined in the face of something vast or overwhelming.",
  groove: "tense",
  energy: 3
},

"anticipation|fear|sadness": {
  name: "Neuroticism",
  description: "Persistent worry and emotional instability rooted in fear of negative outcomes.",
  groove: "tense",
  energy: 2
},

"anticipation|disgust|fear": {
  name: "Paranoia",
  description: "Distrustful expectation that others intend harm or betrayal.",
  groove: "dark",
  energy: 3
},

"anticipation|sadness|surprise": {
  name: "Disillusionment",
  description: "The painful realization that something once believed good is deeply flawed.",
  groove: "brooding",
  energy: 2
},

"anticipation|disgust|surprise": {
  name: "Consternation",
  description: "A sudden mix of confusion, concern, and displeasure.",
  groove: "tense",
  energy: 3
},

"disgust|joy|trust": {
  name: "Sanctimony",
  description: "Self-righteous moral superiority disguised as virtue.",
  groove: "mysterious",
  energy: 2
},

"fear|joy|sadness": {
  name: "Reckoning",
  description: "The emotional confrontation with truths that bring both relief and sorrow.",
  groove: "brooding",
  energy: 2
},

"disgust|fear|joy": {
  name: "Self-Loathing",
  description: "Harsh self-directed disgust accompanied by painful self-awareness.",
  groove: "dark",
  energy: 2
},

"joy|sadness|surprise": {
  name: "Resigned Contentment",
  description: "Acceptance of life's contradictions with a quiet sense of peace.",
  groove: "warm",
  energy: 2
},

"disgust|joy|surprise": {
  name: "Morbid Fascination",
  description: "Compelled interest in something disturbing or grotesque.",
  groove: "mysterious",
  energy: 3
},

"disgust|joy|sadness": {
  name: "Gothic Sublimity",
  description: "Beauty perceived within darkness, melancholy, or decay.",
  groove: "dark",
  energy: 2
},

"fear|sadness|trust": {
  name: "Mortification",
  description: "Deep humiliation caused by exposure of one's flaws or mistakes.",
  groove: "brooding",
  energy: 2
},

"disgust|fear|trust": {
  name: "Internalized Oppression",
  description: "Accepting negative judgments about oneself imposed by others.",
  groove: "dark",
  energy: 2
},

"sadness|surprise|trust": {
  name: "Wistfulness",
  description: "Gentle longing for something lost or unattainable.",
  groove: "brooding",
  energy: 2
},

"disgust|surprise|trust": {
  name: "Betrayal",
  description: "Shock and revulsion when someone trusted proves false.",
  groove: "tense",
  energy: 3
},

"disgust|sadness|trust": {
  name: "Shame",
  description: "Painful self-awareness of wrongdoing or personal failure.",
  groove: "dark",
  energy: 2
},

"disgust|sadness|surprise": {
  name: "Horror",
  description: "Intense fear and revulsion in response to something shocking or grotesque.",
  groove: "dark",
  energy: 4
},

"joy|sadness|trust": {
  name: "Poignancy",
  description: "A tender, bittersweet emotional depth arising from love touched by loss or longing.",
  colors: ["#FFD84D", "#5B6CFF", "#4ADE80"],
  groove: "warm",
  energy: 2
}

};
    let selectedEmotions = [];

    const buttonsContainer = document.getElementById("emotion-buttons");
    const statusEl = document.getElementById("status");
    const resultEl = document.getElementById("result");
    const resetButton = document.getElementById("reset-button");

    function makeDiadKey(emotionIdA, emotionIdB) {
      return [emotionIdA, emotionIdB].sort().join("|");
    }

    function makeTriadKey(...ids) {
  return ids.flat().sort().join("|");
}

    function renderEmotionButtons() {
        buttonsContainer.innerHTML = "";

    emotions.forEach((emotion) => {
        const button = document.createElement("button");
        button.textContent = emotion.label;
        button.dataset.emotionId = emotion.id;
        button.dataset.color = emotion.color;
        button.classList.add("emotion-btn");
        button.addEventListener("click", () => handleEmotionClick(emotion.id));
        buttonsContainer.appendChild(button);
  });
}

 function handleEmotionClick(emotionId) {
    initAudio();
  const selectedButton = document.querySelector(`[data-emotion-id="${emotionId}"]`);

  // Toggle OFF if already selected
  if (selectedEmotions.includes(emotionId)) {
    selectedEmotions = selectedEmotions.filter(id => id !== emotionId);

    if (selectedButton) {
      selectedButton.classList.remove("selected");
      selectedButton.style.background = "";
      selectedButton.style.color = "";
    }

    updateStatus();
    updateButtonStates();
    startGroove();
    if (selectedEmotions.length === 2) {
      showDiadResult();
    } else if (selectedEmotions.length === 1 || selectedEmotions.length === 0) {
      resetResult();
    }

    return;
  }

  // prevent more than 3 emotions
  if (selectedEmotions.length === 3) {
    const removed = selectedEmotions.shift();
    const removedButton = document.querySelector(`[data-emotion-id="${removed}"]`);
    if (removedButton) {
      removedButton.classList.remove("selected");
      removedButton.style.background = "";
      removedButton.style.color = "";
    }
  }

  selectedEmotions.push(emotionId);

  if (selectedButton) {
    selectedButton.classList.add("selected");
    selectedButton.style.background = selectedButton.dataset.color;
    selectedButton.style.color = "#111";
  }

  updateStatus();
  updateButtonStates();
  startGroove();

  if (selectedEmotions.length === 2) {
    showDiadResult();
  } else if (selectedEmotions.length === 3) {
    showTriadResult();
  }
}

function startGroove() {
  if (grooveInterval) clearTimeout(grooveInterval);

  if (selectedEmotions.length === 0) return;

  step = 0;

  function tick() {

    const profile = getActiveEmotionProfile();
    if (!profile) return;

    const groove = grooveProfiles[profile.groove];

    const stepIndex = step % 8;

    if (groove.kickPattern[stepIndex]) playKick(step);
    if (groove.snarePattern[stepIndex]) playSnare(step);
    if (groove.hatPattern[stepIndex]) playHat(step);

    const energy = profile.energy || 3;

    if (energy >= 5) {
    playHat();
    }

    // MUSIC
    playBass(step);

    if (selectedEmotions.length >= 2) {
      playChord(step);
    }

    const swing = step % 2 ? 1.6 : 0.75;
    const humanize = (Math.random() - 0.5) * 18;

    const baseDelay = 120;
    const delay = (baseDelay * swing) + humanize;

    step = (step + 1) % 8;
    grooveInterval = setTimeout(tick, delay);
  }

  tick();
}

function playKick(step) {
  const accentMap = {
    0: 0.75,
    4: 0.58,
    2: 0.32,
    6: 0.26
  };

  const volume = accentMap[step];
  if (!volume) return;

  playSample(kickSample, volume);
}

function playBass(step) {
  if (selectedEmotions.length === 0) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = grooveProfiles[profile.groove];
  const bassStyle = groove.bassStyle || "bounce";
  const energy = profile.energy || 3;

// probability the note actually plays
const playChance = {
  slow: 0.95,
  pulse: 0.85,
  bounce: 0.80,
  run: 0.90,
  octave: 0.90,
  slide: 0.85,
  minor: 0.80,
  soft: 0.75
}[bassStyle] || 0.80;

// random skip for groove space
if (Math.random() > playChance) return;

  const freqs = selectedEmotions
    .map(id => (emotionFreqs[id] || 261.63) / 2)
    .sort((a, b) => a - b);

  let bassPattern = {};
  let ghostSteps = [1, 6];

  // 1 primary
  if (freqs.length === 1) {
    const root = freqs[0];

    if (bassStyle === "octave") {
      bassPattern = {
        0: root,
        3: root * 2,
        5: root,
        7: root * 2
      };
    } else if (bassStyle === "slow") {
      bassPattern = {
        0: root,
        4: root
      };
      ghostSteps = [];
    } else if (bassStyle === "pulse") {
      bassPattern = {
        0: root,
        2: root,
        5: root,
        7: root
      };
    } else if (bassStyle === "slide") {
      bassPattern = {
        0: root,
        3: root * 1.05946,
        5: root * 1.12246,
        7: root
      };
    } else if (bassStyle === "minor") {
      bassPattern = {
        0: root,
        3: root * 1.18921,
        5: root,
        7: root * 1.33484
      };
    } else if (bassStyle === "soft") {
      bassPattern = {
        0: root,
        5: root,
        7: root * 1.12246
      };
    } else if (bassStyle === "run") {
      bassPattern = {
        0: root,
        2: root * 1.12246,
        3: root * 1.25992,
        5: root,
        7: root * 1.33484
      };
    } else {
      // bounce
      bassPattern = {
        0: root,
        3: root * 1.12246,
        5: root,
        7: root * 1.25992
      };
    }
  }

  // 2 emotions
  else if (freqs.length === 2) {
    const [root, partner] = freqs;

    if (bassStyle === "octave") {
      bassPattern = {
        0: root,
        3: partner,
        5: root * 2,
        7: partner
      };
    } else if (bassStyle === "slow") {
      bassPattern = {
        0: root,
        4: partner
      };
      ghostSteps = [];
    } else if (bassStyle === "pulse") {
      bassPattern = {
        0: root,
        2: partner,
        5: root,
        7: partner
      };
    } else if (bassStyle === "slide") {
      bassPattern = {
        0: root,
        3: root * 1.05946,
        5: partner,
        7: partner * 1.05946
      };
    } else if (bassStyle === "minor") {
      bassPattern = {
        0: root,
        3: partner,
        5: root,
        7: root * 1.18921
      };
    } else if (bassStyle === "soft") {
      bassPattern = {
        0: root,
        5: partner,
        7: root
      };
    } else if (bassStyle === "run") {
      bassPattern = {
        0: root,
        2: partner,
        3: root,
        5: partner,
        7: root * 1.25992
      };
    } else {
      // bounce
      bassPattern = {
        0: root,
        3: partner,
        5: root,
        7: partner
      };
    }
  }

  // 3 emotions
  else if (freqs.length === 3) {
    const [root, third, fifth] = freqs;

    if (bassStyle === "octave") {
      bassPattern = {
        0: root,
        3: third,
        5: root * 2,
        7: fifth
      };
    } else if (bassStyle === "slow") {
      bassPattern = {
        0: root,
        4: fifth
      };
      ghostSteps = [];
    } else if (bassStyle === "pulse") {
      bassPattern = {
        0: root,
        2: third,
        5: root,
        7: fifth
      };
    } else if (bassStyle === "slide") {
      bassPattern = {
        0: root,
        3: third * 1.05946,
        5: fifth,
        7: root
      };
    } else if (bassStyle === "minor") {
      bassPattern = {
        0: root,
        3: third,
        5: root,
        7: fifth * 0.94387
      };
    } else if (bassStyle === "soft") {
      bassPattern = {
        0: root,
        5: third,
        7: fifth
      };
    } else if (bassStyle === "run") {
      bassPattern = {
        0: root,
        2: third,
        3: fifth,
        5: root,
        7: fifth
      };
    } else {
      // bounce
      bassPattern = {
        0: root,
        3: third,
        5: root,
        7: fifth
      };
    }
  }

  const isGhost = ghostSteps.includes(step);
  const allowGhost = (profile.energy || 3) >= 3;
  if (isGhost && !allowGhost) return;
  const ghostFreq = freqs[0] * 1.05946; // subtle tension note
  const freq = bassPattern[step] || (isGhost ? ghostFreq : null);
  if (!freq) return;

  const osc = audioCtx.createOscillator();
  const subOsc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = freq;

  subOsc.type = "sine";
  subOsc.frequency.value = freq / 2;

  filter.type = "lowpass";
  filter.frequency.value = isGhost ? 110 : 180;
  filter.Q.value = 1.6;

  const holdTime = {
  slow: 0.55,
  pulse: 0.30,
  bounce: 0.28,
  run: 0.22,
  octave: 0.32,
  slide: 0.30,
  minor: 0.36,
  soft: 0.40
}[bassStyle] || 0.30;

const duration = isGhost ? 0.08 : holdTime;

gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
gain.gain.linearRampToValueAtTime(isGhost ? 0.06 : 0.42, audioCtx.currentTime + 0.01);
gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

osc.connect(filter);
subOsc.connect(filter);
filter.connect(gain);
gain.connect(audioCtx.destination);

osc.start();
subOsc.start();

osc.stop(audioCtx.currentTime + duration);
subOsc.stop(audioCtx.currentTime + duration);
}

function playChord(step) {
  if (selectedEmotions.length < 2) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = grooveProfiles[profile.groove];
  const isTriad = selectedEmotions.length === 3;

  const chordStepsByGroove = {
    uplift: [2, 6],
    driving: [2, 6],
    triumphant: [2, 6],
    tense: [3, 6],
    dark: [2],
    brooding: [2],
    mysterious: [3],
    warm: [2, 6]
  };

  const activeSteps = chordStepsByGroove[profile.groove] || [2, 6];
  if (!activeSteps.includes(step)) return;

  const freqs = selectedEmotions
    .map(id => emotionFreqs[id])
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (freqs.length < 2) return;

  const chordPlayChance = {
    uplift: 0.90,
    driving: 0.85,
    triumphant: 0.95,
    tense: 0.70,
    dark: 0.65,
    brooding: 0.60,
    mysterious: 0.55,
    warm: 0.80
  }[profile.groove] || 0.80;

  if (Math.random() > chordPlayChance) return;

  const sustainByGroove = {
    uplift: isTriad ? 0.34 : 0.20,
    driving: isTriad ? 0.26 : 0.18,
    triumphant: isTriad ? 0.46 : 0.24,
    tense: isTriad ? 0.18 : 0.14,
    dark: isTriad ? 0.55 : 0.26,
    brooding: isTriad ? 0.65 : 0.32,
    mysterious: isTriad ? 0.42 : 0.20,
    warm: isTriad ? 0.72 : 0.36
  }[profile.groove] || (isTriad ? 0.42 : 0.22);

  const volumeByGroove = {
    uplift: isTriad ? 0.22 : 0.12,
    driving: isTriad ? 0.20 : 0.11,
    triumphant: isTriad ? 0.28 : 0.15,
    tense: isTriad ? 0.14 : 0.09,
    dark: isTriad ? 0.18 : 0.10,
    brooding: isTriad ? 0.17 : 0.09,
    mysterious: isTriad ? 0.16 : 0.09,
    warm: isTriad ? 0.20 : 0.11
  }[profile.groove] || (isTriad ? 0.24 : 0.14);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volumeByGroove, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + sustainByGroove);
  gain.connect(audioCtx.destination);

  // dyads = lower stab
  if (!isTriad) {
    freqs.forEach(freq => {
      const osc = audioCtx.createOscillator();
      osc.type = profile.groove === "tense" ? "square" : "triangle";
      osc.frequency.value = freq / 2;
      osc.connect(gain);
      osc.start();
      osc.stop(audioCtx.currentTime + sustainByGroove);
    });
    return;
  }

  // triads = fuller chord with top voice
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();

    if (profile.groove === "dark" || profile.groove === "brooding") {
      osc.type = i === 2 ? "triangle" : "sawtooth";
    } else if (profile.groove === "triumphant" || profile.groove === "uplift") {
      osc.type = i === 2 ? "sine" : "triangle";
    } else if (profile.groove === "tense") {
      osc.type = "square";
    } else {
      osc.type = i === 2 ? "sine" : "triangle";
    }

    osc.frequency.value = i === 2 ? freq : freq / 2;
    osc.connect(gain);
    osc.start();
    osc.stop(audioCtx.currentTime + sustainByGroove);
  });
}

function playKick(step) {
  if (step !== 0 && step !== 4) return;
  playSample(kickSample, 0.45);
}

function playSnare(step) {
  const accentMap = {
    2: 0.42,
    6: 0.50,
    3: 0.16,
    5: 0.12
  };

  const volume = accentMap[step];
  if (!volume) return;

  playSample(snareSample, volume);
}

function playHat(step) {
  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = grooveProfiles[profile.groove];
  const stepIndex = step % 8;

  if (!groove.hatPattern[stepIndex]) return;

  const accentMap = {
    1: 0.16,
    3: 0.09,
    5: 0.12,
    7: 0.20
  };

  const volume = accentMap[stepIndex] || 0.08;
  playSample(hatSample, volume);
}

  updateStatus();

  if (selectedEmotions.length === 2) {
    showDiadResult();
  }



    function updateStatus() {
      if (selectedEmotions.length === 0) {
        statusEl.textContent = "Select 2 primary emotions";
      } else if (selectedEmotions.length === 1) {
        const firstLabel = getEmotionLabel(selectedEmotions[0]);
        statusEl.textContent = `Selected: ${firstLabel}. Choose 1 more emotion.`;
      } else {
        const labels = selectedEmotions.map(getEmotionLabel).join(" + ");
        statusEl.textContent = `Selected: ${labels}`;
      }
    }

    function showDiadResult() {
      const [a, b] = selectedEmotions;
      const key = makeDiadKey(a, b);
      const diad = diads[key];

      if (!diad) {
        resultEl.innerHTML = `
          <div class="diad-name">Unknown</div>
          <div class="diad-meta">${getEmotionLabel(a)} + ${getEmotionLabel(b)}</div>
          <div class="diad-description">No diad mapping exists yet for this combination.</div>
        `;
        document.body.style.background = "#111";
        return;
      }

      resultEl.innerHTML = `
        <div class="diad-name">${diad.name}</div>
        <div class="diad-meta">${diad.primaries.join(" + ")}</div>
        <div class="diad-description">${diad.description}</div>
      `;

      if (diad.colors) {
       resultEl.style.background = `linear-gradient(135deg, ${diad.colors[0]}, ${diad.colors[1]})`;
      }
    }

    function showTriadResult() {
  const key = makeTriadKey(selectedEmotions);
  const triad = triads[key];

  if (!triad) {
    resultEl.innerHTML = `
      <div class="diad-name">Unknown Triad</div>
      <div class="diad-meta">${selectedEmotions.map(getEmotionLabel).join(" + ")}</div>
      <div class="diad-description">No triad mapping exists yet for this combination.</div>
    `;
    return;
  }

  const ids = key.split("|");
  const colors = getTriadColors(ids);

  resultEl.innerHTML = `
    <div class="diad-name">${triad.name}</div>
    <div class="diad-meta">${ids.map(getEmotionLabel).join(" + ")}</div>
    <div class="diad-description">${triad.description || ""}</div>
  `;

  resultEl.style.background =
    `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
}

function resetResult() {
  resultEl.innerHTML = `
    <div class="diad-name">—</div>
    <div class="diad-meta">No diad selected yet</div>
    <div class="diad-description"></div>
  `;
  resultEl.style.background = "rgba(255,255,255,0.06)";
}

function updateButtonStates() {
  document.querySelectorAll(".emotion-btn").forEach(btn => {
    btn.classList.remove("dimmed");
  });
}

function resetApp() {
  selectedEmotions = [];
  updateStatus();
  if (grooveInterval) clearTimeout(grooveInterval);

  resetResult();

  resultEl.style.background = "rgba(255,255,255,0.06)";

  document.querySelectorAll(".emotion-btn").forEach(btn => {
    btn.classList.remove("selected");
    btn.style.background = "";
    btn.style.color = "";
  });
  updateButtonStates();
}

function getEmotionLabel(emotionId) {
      const emotion = emotions.find((e) => e.id === emotionId);
      return emotion ? emotion.label : emotionId;
    }

resetButton.addEventListener("click", resetApp);
renderEmotionButtons();
    updateStatus();
