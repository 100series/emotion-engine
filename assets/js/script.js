console.log("script loaded");

document.getElementById("status").textContent = "Status: Playing";
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

// ======================
// ENGINE STATE
// ======================

let audioCtx = null;
let grooveInterval = null;
let step = 0;
let phraseStep = 0;
let barCount = 0;
let bassJustPlayed = false;
let isDownbeat = false;
let harmonyHold = null;
let harmonyHoldBar = -1;

let kickSample;
let snareSample;
let hatSample;
let shakerSample;
let openHatSample;
let selectedEmotions = [];
let stepEmitter = null;
let lastKickHit = false;
let lastSnareHit = false;
let bassMotif = null;
let bassMotifBar = -1;
let isDropoutStep = false;
let isBusyDrumMoment = false;

// ======================
// MAPPING / DATA
// ======================

function setStepEmitter(fn) {
  stepEmitter = fn;
}

const grooveProfiles = {

  uplift: {
    kickPattern: [1,0,0,0,1,0,0,0],
    kickVariants: [
      [1,0,0,0,1,0,0,0], // base
      [1,0,0,0,1,0,1,0], // late lift
      [1,0,0,1,1,0,0,0]  // mid push
    ],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,1,1,1,1,1,1],
    bassStyle: "bounce",

    dna: {
      kick: {
        base: [1,0,0,0,1,0,0,0],
        variants: [
          [1,0,0,0,1,0,1,0],
          [1,0,0,1,1,0,0,0]
        ]
      },

      phraseMutation: {
        twoBar: ["lateLift", "hatLift"],
        fourBar: ["densityUp", "openAir"],
        sixteenBar: ["stripBack"]
      },

      energyCurve: {
        build: [0.95, 1.0, 1.05, 1.1],
        peak: [1.12, 1.16],
        release: [0.9, 0.95]
      }
    }
  },

  driving: {
    kickPattern: [1,0,1,0,1,0,0,0],
    kickVariants: [
      [1,0,1,0,1,0,0,0],
      [1,0,0,1,1,0,0,0],
      [1,0,1,0,0,1,0,0]
    ],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,1,1,1,1,1,1],
    bassStyle: "run",

    dna: {
      kick: {
        base: [1,0,1,0,1,0,0,0],
        variants: [
          [1,0,0,1,1,0,0,0],
          [1,0,1,0,0,1,0,0]
        ]
      },

      phraseMutation: {
        twoBar: ["ghostShift", "lateKick"],
        fourBar: ["densityUp", "syncopate"],
        sixteenBar: ["stripBack"]
      },

      energyCurve: {
        build: [0.9, 1.0, 1.1, 1.15],
        peak: [1.2, 1.25],
        release: [0.85, 0.9]
      }
    }
  },

  triumphant: {
    kickPattern: [1,0,0,1,1,0,0,1],
    kickVariants: [
      [1,0,0,1,1,0,0,1], // base
      [1,0,0,1,0,1,0,1], // rolling push
      [1,0,0,0,1,0,1,1]  // late drive
  ],
    snarePattern: [0,0,1,0,0,0,1,0],
    hatPattern: [1,1,1,1,1,1,1,1],
    bassStyle: "octave",

    dna: {
      kick: {
        base: [1,0,0,1,1,0,0,1],
        variants: [
          [1,0,0,1,0,1,0,1],
          [1,0,0,0,1,0,1,1]
        ]
      },

      phraseMutation: {
        twoBar: ["pushForward", "accentShift"],
        fourBar: ["densityUp", "peakDrive"],
        sixteenBar: ["resolve"]
      },

      energyCurve: {
        build: [1.0, 1.05, 1.1, 1.15],
        peak: [1.2, 1.25],
        release: [0.95, 1.0]
      }
    }
  },

  tense: {
    kickPattern: [1,0,0,0,0,1,0,0],
    kickVariants: [
      [1,0,0,0,0,1,0,0], // base
      [1,0,0,1,0,1,0,0], // uneasy push
      [1,0,0,0,0,1,1,0]  // tightening late hit
  ],
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
    kickVariants: [
      [1,0,0,0,1,0,0,0], // base
      [1,0,0,0,1,0,1,0], // gentle late lift
      [1,0,0,1,1,0,0,0]  // soft mid push
  ],
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

const emotionFreqs = {
  power: 130.81,        // C3  (red)
  anticipation: 146.83, // D3  (orange)
  joy: 329.63,          // E4  (yellow)
  trust: 174.61,        // F3  (green)
  fear: 196.00,         // G3  (cyan)
  surprise: 440.00,     // A4  (blue)
  sadness: 123.47,      // B2  (indigo)
  disgust: 261.63       // C4  (violet returning to C)
};

const dyads = {
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
  energy: 1
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
  energy: 1
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
  energy: 1
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
  energy: 1
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
  energy: 1
},

"disgust|sadness|surprise": {
  name: "Horror",
  description: "Intense fear and revulsion in response to something shocking or grotesque.",
  groove: "dark",
  energy: 2
},

"joy|sadness|trust": {
  name: "Poignancy",
  description: "A tender, bittersweet emotional depth arising from love touched by loss or longing.",
  colors: ["#FFD84D", "#5B6CFF", "#4ADE80"],
  groove: "warm",
  energy: 2
}

};

function makeDyadKey(emotionIdA, emotionIdB) {
      return [emotionIdA, emotionIdB].sort().join("|");
    }

    function makeTriadKey(...ids) {
  return ids.flat().sort().join("|");
}

function getActiveEmotionProfile() {
  if (selectedEmotions.length === 3) {
    const key = makeTriadKey(selectedEmotions);
    return triads[key];
  }

  if (selectedEmotions.length === 2) {
  const key = makeDyadKey(selectedEmotions[0], selectedEmotions[1]);
  const dyad = dyads[key];
  if (!dyad) return null;

  const grooveMap = {
  "joy|trust": { groove: "warm", energy: 3 },
  "fear|surprise": { groove: "tense", energy: 4 },
  "joy|power": { groove: "triumphant", energy: 4 },
  "anticipation|power": { groove: "driving", energy: 4 },
  "anticipation|joy": { groove: "uplift", energy: 4 },
  "anticipation|fear": { groove: "tense", energy: 3 },
  "anticipation|trust": { groove: "uplift", energy: 3 },
  "anticipation|surprise": { groove: "mysterious", energy: 3 },
  "anticipation|sadness": { groove: "brooding", energy: 2 },
  "anticipation|disgust": { groove: "mysterious", energy: 2 },
  "power|trust": { groove: "driving", energy: 4 },
  "fear|power": { groove: "dark", energy: 2 },
  "power|surprise": { groove: "tense", energy: 4 },
  "power|sadness": { groove: "brooding", energy: 3 },
  "disgust|power": { groove: "dark", energy: 3 },
  "fear|joy": { groove: "brooding", energy: 2 },
  "joy|surprise": { groove: "uplift", energy: 4 },
  "joy|sadness": { groove: "warm", energy: 2 },
  "disgust|joy": { groove: "mysterious", energy: 2 },
  "fear|trust": { groove: "brooding", energy: 2 },
  "surprise|trust": { groove: "uplift", energy: 3 },
  "sadness|trust": { groove: "warm", energy: 2 },
  "disgust|trust": { groove: "mysterious", energy: 2 },
  "fear|sadness": { groove: "dark", energy: 2 },
  "disgust|fear": { groove: "dark", energy: 2 },
  "sadness|surprise": { groove: "brooding", energy: 2 },
  "disgust|surprise": { groove: "tense", energy: 3 },
  "disgust|sadness": { groove: "dark", energy: 2 }
};

  return {
    ...dyad,
    ...(grooveMap[key] || { groove: "driving", energy: 3 })
  };
}

  if (selectedEmotions.length === 1) {
  const primaryProfiles = {
    power: { groove: "driving", energy: 4 },
    anticipation: { groove: "uplift", energy: 3 },
    joy: { groove: "warm", energy: 3 },
    trust: { groove: "soft", energy: 2 },
    fear: { groove: "tense", energy: 2 },
    surprise: { groove: "mysterious", energy: 3 },
    sadness: { groove: "brooding", energy: 1 },
    disgust: { groove: "dark", energy: 1 }
  };

  return primaryProfiles[selectedEmotions[0]] || { groove: "driving", energy: 3 };
}

  return null;
}

// ======================
// AUDIO PRIMITIVES
// ======================

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

    loadSample("assets/samples/shaker.wav").then(buffer => {
     shakerSample = buffer;
     console.log("shaker loaded");
    }).catch(err => console.error("shaker failed", err));

    loadSample("assets/samples/openhat.wav").then(buffer => {
     openHatSample = buffer;
     console.log("open hat loaded");
    }).catch(err => console.error("open hat failed", err));
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
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

function glideOscillator(osc, startFreq, endFreq, duration) {
  osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
}

// ======================
// SEQUENCER
// ======================

function getEvolutionState() {
  return {
    bar: barCount % 16,
    isBar4: barCount % 4 === 3,
    isBar8: barCount % 8 === 7,
    isBar16: barCount % 16 === 15
  };
}

function startGroove() {
  if (grooveInterval) clearTimeout(grooveInterval);

  if (selectedEmotions.length === 0) return;

  step = 0;
  phraseStep = 0;
  barCount = 0;

  harmonyHold = null;
  harmonyHoldBar = -1;

  tick();
}

function tick() {
  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = grooveProfiles[profile.groove];
  const kickPattern =
    groove.dna?.kick?.variants?.length
      ? [groove.dna.kick.base, ...groove.dna.kick.variants][barCount % (groove.dna.kick.variants.length + 1)]
      : groove.kickVariants?.[barCount % groove.kickVariants.length] || groove.kickPattern;
  
  const stepIndex = phraseStep % 8;
  isDownbeat = stepIndex === 0;
  const isPreDownbeat = stepIndex === 7;

  const thinChanceByGroove = {
    driving: 0.7,
    uplift: 0.65,
    triumphant: 0.6
  };

  const shouldThinForOne =
    isPreDownbeat &&
    Math.random() < (thinChanceByGroove[profile.groove] || 0.5);

  const isSecondBar = phraseStep >= 8;
  const isTwoBarTurn = phraseStep === 0 || phraseStep === 8;
  const evo = getEvolutionState();
  const tickTime = audioCtx.currentTime + 0.02;
  isDropoutStep = evo.isBar4 && stepIndex === 0 && Math.random() < 0.35;

  // DRUMS
  if (!isDropoutStep) {
    if (kickPattern[stepIndex] && !shouldThinForOne) playKick(stepIndex);
    if (groove.snarePattern[stepIndex] && !shouldThinForOne) playSnare(stepIndex);
    if (groove.hatPattern[stepIndex]) playHat(stepIndex);

    if (!shouldThinForOne) playShaker(stepIndex);
    playOpenHat(stepIndex);
  }

  const isBusyDrumStep =
    !!kickPattern[stepIndex] ||
    !!groove.snarePattern[stepIndex] ||
    !!groove.hatPattern[stepIndex];

  isBusyDrumMoment = isBusyDrumStep;

  playSpaceTone(stepIndex);

  // 2-bar variation
  if (isSecondBar) {
    if (profile.groove === "driving" || profile.groove === "triumphant") {
      if (stepIndex === 7 && Math.random() < 0.7) playKick(7);
    }

    if (profile.groove === "warm" || profile.groove === "brooding") {
      if (stepIndex === 5 && Math.random() < 0.5) playHat(5);
    }

    if (profile.groove === "mysterious" || profile.groove === "tense") {
      if (stepIndex === 3 && Math.random() < 0.45) playSnare(3);
    }
  }

  if (isTwoBarTurn && Math.random() < 0.45) {
    if (profile.groove === "driving" || profile.groove === "uplift" || profile.groove === "triumphant") {
      playHat(7);
    }

    if (profile.groove === "warm" || profile.groove === "soft") {
      playOpenHat(7);
    }

    if (profile.groove === "tense" || profile.groove === "mysterious") {
      playSnare(7);
    }
  }

  // 4-bar variation
  if (evo.isBar4) {
    if ((profile.groove === "uplift" || profile.groove === "warm") && stepIndex === 7 && Math.random() < 0.5) {
      playOpenHat(7);
    }

    if ((profile.groove === "dark" || profile.groove === "brooding") && stepIndex === 0 && Math.random() < 0.4) {
      playSpaceTone(0);
    }
  }

  // 8-bar variation
  if (evo.isBar8) {
    if ((profile.groove === "triumphant" || profile.groove === "driving") && stepIndex === 6 && Math.random() < 0.6) {
      playKick(6);
    }

    if ((profile.groove === "mysterious" || profile.groove === "tense") && stepIndex === 7 && Math.random() < 0.5) {
      playOpenHat(7);
    }
  }

  // 16-bar turnaround
  if (evo.isBar16) {
    if (stepIndex === 7 && Math.random() < 0.75) {
      playSnare(7);
    }
  }

  // micro fill (end of bar)
  if (stepIndex === 7 && Math.random() < 0.4) {
    if (profile.groove === "driving" || profile.groove === "uplift") {
      playSnare(5);
      playSnare(7);
    }

    if (profile.groove === "tense" || profile.groove === "mysterious") {
      playHat(6);
      playSnare(7);
  }
}

  // MUSIC
  if (!isDropoutStep) {
    playBass(stepIndex, tickTime);

    if (selectedEmotions.length >= 2 && !(isPreDownbeat && Math.random() < 0.6)) {
      playChord(stepIndex, tickTime);
    }
  }

  const swing = stepIndex % 2 ? 1.6 : 0.75;
  const humanize = (Math.random() - 0.5) * 12;

  const sixteenthFeelByGroove = {
    driving: 4,
    uplift: 3,
    triumphant: 4,
    warm: 2,
    tense: 3,
    mysterious: 2,
    brooding: 1,
    dark: 1,
    soft: 2
  };

  const sixteenthFeel = sixteenthFeelByGroove[profile.groove] || 2;
  const microPocket = stepIndex % 2 ? sixteenthFeel : -sixteenthFeel * 0.35;

  const baseDelay = 120;
  const delay = (baseDelay * swing) + humanize + microPocket;

  phraseStep = (phraseStep + 1) % 16;

  if (phraseStep === 0) {
    barCount++;
  }
  // emit step BEFORE scheduling next tick
if (typeof stepEmitter === "function") {
  stepEmitter({
    step: stepIndex,
    profile: groove,
    phraseStep,
    barCount
  });
}

grooveInterval = setTimeout(tick, delay);

}

// ======================
// VOICES
// ======================

function playKick(step) {
  const accentMap = {
    0: 0.75,
    4: 0.58,
    2: 0.32,
    6: 0.26,
    7: 0.18
  };

  let volume = accentMap[step];
  if (!volume) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  if (
    (profile.groove === "driving" || profile.groove === "uplift" || profile.groove === "triumphant") &&
    (step === 2 || step === 6 || step === 7)
  ) {
    if (Math.random() < 0.75) {
      volume *= 0.82;
    }
  }

  let finalVolume = volume;

  if (isDownbeat) {
  finalVolume *= 1.25;
  }

  playSample(kickSample, finalVolume);
}

function playSnare(step) {
  const accentMap = {
    2: 0.46,  // stronger anchor
    6: 0.54,  // strongest anchor
    3: 0.14,
    5: 0.10,
    7: 0.18
  };

  let volume = accentMap[step];
  if (!volume) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  if (step === 3 || step === 5) {
    const ghostChanceByGroove = {
      driving: 0.8,
      uplift: 0.75,
      triumphant: 0.7,
      warm: 0.55,
      tense: 0.45,
      mysterious: 0.35,
      brooding: 0.3,
      dark: 0.2,
      soft: 0.4
    };

    const ghostChance = ghostChanceByGroove[profile.groove] || 0.5;

    if (Math.random() < ghostChance) {
      // true ghost note
      volume *= step === 3 ? 0.6 : 0.7;
    } else {
      // still softer than anchors, but present
      volume *= 0.85;
    }
  }

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

  let volume = accentMap[stepIndex] || 0.08;

  // slight groove-based variation
  if (profile.groove === "uplift" || profile.groove === "driving" || profile.groove === "triumphant") {
    if (stepIndex % 2 === 1 && Math.random() < 0.6) {
      volume *= 1.15;
    }
  }

  // occasional drop for space
  const hatDropoutByGroove = {
    driving: 0.02,
    uplift: 0.03,
    triumphant: 0.02,
    warm: 0.06,
    tense: 0.08,
    mysterious: 0.1,
    brooding: 0.12,
    dark: 0.14,
    soft: 0.09
  };

  if (Math.random() < (hatDropoutByGroove[profile.groove] || 0.05)) return;

  if (lastKickHit) {
  volume *= 0.82;
  }

  playSample(hatSample, volume);
}

function playOpenHat(step) {
  if (!openHatSample) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = profile.groove;
  const energy = profile.energy || 3;

  // only higher energy grooves get open hats
  if (energy < 4) return;

  // strategic placement (not constant)
  const openSteps = {
    uplift: [3, 7],
    driving: [3],
    triumphant: [3, 7],
    warm: [7]
  };

  const steps = openSteps[groove] || [];

  if (!steps.includes(step)) return;

  // slight randomness so it's not repetitive
  const isPhraseTurn = step === 7 && (barCount % 2 === 1);
  const isBigTurn = step === 7 && (barCount % 4 === 3);
  const isSnareAnswer = lastSnareHit && step === 3;

  const openHatByGroove = {
    driving: isBigTurn,
    uplift: isPhraseTurn || isSnareAnswer,
    triumphant: isBigTurn || isSnareAnswer,
    warm: isBigTurn,
    tense: false,
    mysterious: isBigTurn,
    brooding: false,
    dark: false,
    soft: false
  };

  if (!openHatByGroove[profile.groove]) return;

  playSample(openHatSample, 0.35);
}

function playShaker(step) {
  if (!shakerSample) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = grooveProfiles[profile.groove];
  const stepIndex = step % 8;

  // only certain grooves get shaker
  if (!["uplift", "triumphant", "driving", "warm"].includes(profile.groove)) return;

  // groove-based pattern (like hats, but lighter)
  const shakerPattern = groove.hatPattern;

  if (!shakerPattern[stepIndex]) return;

  const accentMap = {
    0: 0.10,
    1: 0.18,
    2: 0.08,
    3: 0.22,
    4: 0.10,
    5: 0.16,
    6: 0.08,
    7: 0.20
  };

  const volume = (accentMap[stepIndex] || 0.10) * 0.8;
  if (Math.random() > 0.95) return;

  playSample(shakerSample, volume);
}

function playBass(step, tickTime) {
  bassJustPlayed = false;
  if (selectedEmotions.length === 0) return;

  const profile = getActiveEmotionProfile();
  if (!profile) return;

  const groove = grooveProfiles[profile.groove];
  const bassStyle = groove.bassStyle || "bounce";
  const energy = profile.energy || 3;

  const currentMotifBar = Math.floor(barCount / 2);

  if (!bassMotif || bassMotifBar !== currentMotifBar) {
    const motifChoicesByStyle = {
      bounce: ["rootHop", "partnerAnswer"],
      run: ["walkUp", "stagger"],
      octave: ["octavePunch", "rootHop"],
      pulse: ["pulseGate", "rootHold"],
      slow: ["rootHold"],
      slide: ["slideLead", "partnerAnswer"],
      minor: ["darkFall", "rootHold"],
      soft: ["softStep", "rootHold"]
    };

  const choices = motifChoicesByStyle[bassStyle] || ["rootHop"];
  bassMotif = choices[Math.floor(Math.random() * choices.length)];
  bassMotifBar = currentMotifBar;
  }

// probability the note actually plays
const playChance = {
  slow: 0.75,
  pulse: 0.68,
  bounce: 0.64,
  run: 0.74,
  octave: 0.78,
  slide: 0.72,
  minor: 0.65,
  soft: 0.60
}[bassStyle] || 0.68;

// random skip for groove space
if (Math.random() > playChance) return;

  const freqs = selectedEmotions
    .map(id => (emotionFreqs[id] || 261.63) / 2)
    .sort((a, b) => a - b);

  const approachMap = {
    7: freqs[0] * 0.94387, // semitone below root → leads into step 0
    3: freqs[0] * 1.05946  // semitone above root → leads into step 4
  };

  let bassPattern = {};
  const motif = bassMotif;
  const isCallHalf = step <= 3;
  const isResponseHalf = step >= 4;
  const ghostMap = {
    driving: [1, 6],
    uplift: [1],
    triumphant: [6],
    tense: [1, 3, 6],
    brooding: [1],
    dark: [],
    warm: [6],
    mysterious: [3]
  };

  const restMap = {
  driving: [1],
  uplift: [1],
  triumphant: [6],
  tense: [1, 3],
  brooding: [3],
  dark: [1, 3, 6],
  warm: [1],
  mysterious: [3],
  soft: [1]
  };

  let ghostSteps = ghostMap[profile.groove] || [1, 6];

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
        if (motif === "partnerAnswer") {
          bassPattern = {
            0: root,
            3: root * 1.12246,
            5: root * 1.25992,
            7: root
          };
        } else if (motif === "rootHop") {
          bassPattern = {
            0: root,
            3: root,
            5: root * 1.12246,
            7: root * 1.25992
          };
        } else {
          bassPattern = {
            0: root,
            3: root * 1.12246,
            5: root,
            7: root * 1.25992
        };
      }
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
        if (motif === "partnerAnswer") {
          bassPattern = {
            0: root,
            3: partner,
            5: partner,
            7: root
          };
        } else if (motif === "rootHop") {
          bassPattern = {
            0: root,
            3: root,
            5: partner,
            7: root
          };
        } else {
          bassPattern = {
            0: root,
            3: partner,
            5: root,
            7: partner
          };
        }
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
        if (motif === "partnerAnswer") {
          bassPattern = {
            0: root,
            3: third,
            5: fifth,
            7: root
        };
        } else if (motif === "rootHop") {
          bassPattern = {
            0: root,
            3: root,
            5: third,
            7: fifth
        };
        } else {
          bassPattern = {
            0: root,
            3: third,
            5: root,
            7: fifth
        };
      }
    }
  }

  if (Math.random() < 0.85) {
    bassPattern[0] = freqs[0];
  }

  const isGhost = ghostSteps.includes(step);
  const popSteps = {
    driving: [0, 3],
    uplift: [0, 5],
    triumphant: [0, 3, 7],
    warm: [0],
    tense: [0, 2],
    mysterious: [0],
    brooding: [0],
    dark: [0],
    soft: [0]
  };

  const isPop = popSteps[profile.groove]?.includes(step);
  const allowGhost = (profile.energy || 3) >= 3;
  if (isGhost && !allowGhost) return;
  const restSteps = restMap[profile.groove] || [];
  const isRest = restSteps.includes(step);

  const restChanceByGroove = {
    driving: 0.68,
    uplift: 0.66,
    triumphant: 0.64
  };

  const restChance = restChanceByGroove[profile.groove] || 0.6;

  if (isRest && Math.random() < restChance) {
  bassJustPlayed = false;
  return;
  }

  const ghostFreq = freqs[0] * 1.05946; // subtle tension note
  const anticipationChanceByGroove = {
    driving: 0.72,
    uplift: 0.68,
    triumphant: 0.62,
    warm: 0.5,
    tense: 0.58,
    mysterious: 0.45,
    brooding: 0.35,
    dark: 0.28,
    soft: 0.4
  };

  const anticipationChance = anticipationChanceByGroove[profile.groove] || 0.5;

  const responseChanceByGroove = {
    driving: 0.72,
    uplift: 0.68,
    triumphant: 0.7,
    warm: 0.58,
    tense: 0.52,
    mysterious: 0.48,
    brooding: 0.44,
    dark: 0.4,
    soft: 0.5
  };

  const responseChance = responseChanceByGroove[profile.groove] || 0.55;
  const shouldPlayResponse = !isResponseHalf || Math.random() < responseChance;

  const freq =
    shouldPlayResponse
      ? (
          bassPattern[step] ||
          (approachMap[step] && Math.random() < anticipationChance ? approachMap[step] : null) ||
          (isGhost ? ghostFreq : null)
        )
      : null;

  if (!freq) return;

  const osc = audioCtx.createOscillator();
  const subOsc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc.type = "sawtooth";
  const approachSteps = [3, 7];

  const shouldSlide =
    bassStyle === "slide" &&
    approachSteps.includes(step) &&
    !isGhost &&
    Math.random() < 0.45;
  const shouldOctaveJump =
  (bassStyle === "octave" || profile.groove === "triumphant") &&
  !isGhost &&
  (step === 3 || step === 7);

  if (shouldSlide) {
  glideOscillator(osc, freq * 0.85, freq, 0.10);
  } else if (shouldOctaveJump) {
  osc.frequency.value = freq * 2;
  } else {
  osc.frequency.value = freq;
  }

  subOsc.type = "sine";
  if (shouldSlide) {
  glideOscillator(subOsc, (freq / 2) * 0.85, freq / 2, 0.08);
  } else if (shouldOctaveJump) {
  subOsc.frequency.value = freq;
  } else {
  subOsc.frequency.value = freq / 2;
  }

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

const shortSteps = [1, 3, 6];
const isShort = shortSteps.includes(step) && Math.random() < 0.6;

const duration = isGhost
  ? 0.08
  : isShort
    ? holdTime * 0.6
    : holdTime;

gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
const velocitySwing = (step % 2 === 0) ? 1.0 : 0.85;
let mainBassVolume = (shouldOctaveJump ? 0.50 : 0.42) * velocitySwing;

if (isDownbeat) {
  mainBassVolume *= 1.15;
}

if (isPop) {
  mainBassVolume *= 1.25;
}
const targetVolume = isGhost ? 0.045 : mainBassVolume;

gain.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + 0.01);
gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

osc.connect(filter);
subOsc.connect(filter);
filter.connect(gain);
gain.connect(audioCtx.destination);

let bassPush = 0;

if (profile.groove === "uplift" || profile.groove === "warm") {
  bassPush = -0.01;
}

osc.start(tickTime + bassPush);
subOsc.start(tickTime + bassPush);

osc.stop(tickTime + bassPush + duration);
subOsc.stop(tickTime + bassPush + duration);
}

function playChord(step, tickTime) {
  // avoid stepping on bass
  const profile = getActiveEmotionProfile();
  if (!profile) return;

const responseChanceByGroove = {
  uplift: bassJustPlayed ? 0.28 : 0.68,
  driving: bassJustPlayed ? 0.22 : 0.58,
  triumphant: bassJustPlayed ? 0.26 : 0.72,
  tense: bassJustPlayed ? 0.22 : 0.50,
  dark: bassJustPlayed ? 0.18 : 0.35,
  brooding: bassJustPlayed ? 0.20 : 0.30,
  mysterious: bassJustPlayed ? 0.25 : 0.28,
  warm: bassJustPlayed ? 0.45 : 0.55,
  soft: bassJustPlayed ? 0.40 : 0.45
};

  const chordChance = responseChanceByGroove[profile.groove] || 0.5;
  const drumAwareChordChance = isBusyDrumMoment ? chordChance * 0.7 : chordChance;

  if (Math.random() > drumAwareChordChance) return;
  if (selectedEmotions.length < 2) return;

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
    warm: [2, 6],
    soft: [2, 6]
  };

  const activeSteps = chordStepsByGroove[profile.groove] || [2, 6];
  if (!activeSteps.includes(step)) return;

  const isBassResponseHalf = step >= 4;

  if (
    isBassResponseHalf &&
    (profile.groove === "driving" || profile.groove === "uplift" || profile.groove === "triumphant") &&
    Math.random() < 0.25
  ) {
    return;
  }

  const currentHarmonyBar = Math.floor(barCount / 4);

  if (!harmonyHold || harmonyHoldBar !== currentHarmonyBar) {
    harmonyHold = selectedEmotions
      .map(id => emotionFreqs[id])
      .filter(Boolean)
      .sort((a, b) => a - b);

    harmonyHoldBar = currentHarmonyBar;
  }

  const freqs = harmonyHold;
  if (!freqs || freqs.length < 2) return;

  if (freqs.length < 2) return;

  const chordPlayChance = {
    uplift: 0.75,
    driving: 0.65,
    triumphant: 0.80,
    tense: 0.50,
    dark: 0.35,
    brooding: 0.30,
    mysterious: 0.28,
    warm: 0.55,
    soft: 0.45
  }[profile.groove] || 0.50;

  if (Math.random() > chordPlayChance) return;

  const sustainByGroove = {
    uplift: isTriad ? 0.24 : 0.18,
    driving: isTriad ? 0.20 : 0.16,
    triumphant: isTriad ? 0.28 : 0.20,
    tense: isTriad ? 0.18 : 0.14,
    dark: isTriad ? 0.55 : 0.26,
    brooding: isTriad ? 0.65 : 0.32,
    mysterious: isTriad ? 0.42 : 0.20,
    warm: isTriad ? 0.78 : 0.40,
    soft: isTriad ? 0.72 : 0.36
  }[profile.groove] || (isTriad ? 0.42 : 0.22);

  const volumeByGroove = {
    uplift: isTriad ? 0.22 : 0.12,
    driving: isTriad ? 0.20 : 0.11,
    triumphant: isTriad ? 0.28 : 0.15,
    tense: isTriad ? 0.14 : 0.09,
    dark: isTriad ? 0.18 : 0.10,
    brooding: isTriad ? 0.17 : 0.09,
    mysterious: isTriad ? 0.16 : 0.09,
    warm: isTriad ? 0.20 : 0.11,
    soft: isTriad ? 0.18 : 0.10
  }[profile.groove] || (isTriad ? 0.24 : 0.14);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, tickTime);
  gain.gain.linearRampToValueAtTime(volumeByGroove, tickTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, tickTime + sustainByGroove);
  gain.connect(audioCtx.destination);

  let voicedFreqs = [...freqs];

  // spread + inversion
  if (isTriad) {
    const [root, third, fifth] = freqs;

    if (profile.groove === "triumphant" || profile.groove === "uplift") {
      // brighter but still funky (add 7th feel via omission + spacing)
      voicedFreqs = [third, fifth, root * 2]; // omit root in bass range
      } 
    else if (profile.groove === "driving") {
      // tight funk comping
      voicedFreqs = [third, fifth, root * 1.5];
    }
    else if (profile.groove === "warm" || profile.groove === "soft") {
      // smooth spread
      voicedFreqs = [third / 2, fifth / 2, root];
    } 
    else if (profile.groove === "tense" || profile.groove === "mysterious") {
      // tighter, clustered, more dissonant feel
      voicedFreqs = [third / 2, fifth / 2, root * 0.95];
    } 
    else if (profile.groove === "dark" || profile.groove === "brooding") {
      // low, moody cluster
      voicedFreqs = [third / 2, fifth / 2];
    } 
    else {
      // default funk voicing
      voicedFreqs = [third, fifth, root];
    }
  } else {
    const [root, partner] = freqs;

    if (profile.groove === "warm" || profile.groove === "soft") {
      voicedFreqs = [partner / 2, root];
    } 
    else if (profile.groove === "dark" || profile.groove === "brooding") {
      voicedFreqs = [root / 2, partner / 2];
    } 
    else {
      // funk-style dyad
      voicedFreqs = [partner, root * 1.5];
    }
  }

  voicedFreqs.forEach((freq, i) => {
  const osc = audioCtx.createOscillator();

  if (profile.groove === "dark" || profile.groove === "brooding") {
    osc.type = i === voicedFreqs.length - 1 ? "triangle" : "sawtooth";
  } else if (profile.groove === "triumphant" || profile.groove === "uplift") {
    osc.type = i === voicedFreqs.length - 1 ? "sine" : "triangle";
  } else if (profile.groove === "tense") {
    osc.type = "square";
  } else if (profile.groove === "warm" || profile.groove === "soft") {
    osc.type = "sine";
  } else {
    osc.type = i === voicedFreqs.length - 1 ? "sine" : "triangle";
  }

  osc.frequency.value = freq;
  if (profile.groove === "warm" || profile.groove === "soft" || profile.groove === "brooding") {
    osc.detune.value = i === 0 ? -4 : i === 1 ? 3 : 6;
  } else if (profile.groove === "mysterious") {
    osc.detune.value = i === 0 ? -2 : i === 1 ? 5 : -7;
  } else if (profile.groove === "triumphant" || profile.groove === "uplift") {
    osc.detune.value = i === 0 ? -1 : i === 1 ? 2 : 4;
  }
  osc.connect(gain);

  const staggerByGroove = {
    uplift: 0.012,
    driving: 0.008,
    triumphant: 0.015,
    tense: 0.004,
    dark: 0.020,
    brooding: 0.024,
    mysterious: 0.018,
    warm: 0.028,
    soft: 0.022
  };

  const stagger = (staggerByGroove[profile.groove] || 0.01) * i;
  let push = 0;

  if (profile.groove === "uplift" || profile.groove === "warm") {
    push = -0.012; // slightly early
  }

  const startTime = tickTime + stagger + push;
  const stopTime = startTime + sustainByGroove;

  osc.start(startTime);
  osc.stop(stopTime);
});
if (
  (profile.groove === "uplift" || profile.groove === "warm") &&
  Math.random() < 0.35
) {
  const echoDelay = 0.08;

  voicedFreqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();

    osc.type = "triangle";
    osc.frequency.value = freq;

    const echoGain = audioCtx.createGain();
    echoGain.gain.setValueAtTime(0.0001, tickTime);
    echoGain.gain.linearRampToValueAtTime(0.12, tickTime + echoDelay);
    echoGain.gain.exponentialRampToValueAtTime(
      0.001,
      tickTime + echoDelay + 0.18
    );

    osc.connect(echoGain);
    echoGain.connect(audioCtx.destination);

    osc.start(tickTime + echoDelay);
    osc.stop(tickTime + echoDelay + 0.18);
  });
}
}

function playSpaceTone(step) {
  const profile = getActiveEmotionProfile();
  if (!profile) return;

  // only these grooves get space
  if (!["dark", "brooding", "mysterious", "warm"].includes(profile.groove)) return;

  // only on phrase anchors
  if (![0, 4].includes(step)) return;

  // not every time
  const chanceByGroove = {
    dark: 0.45,
    brooding: 0.55,
    mysterious: 0.40,
    warm: 0.35
  };

  if (Math.random() > (chanceByGroove[profile.groove] || 0.4)) return;

  const freqs = selectedEmotions
    .map(id => emotionFreqs[id])
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (freqs.length === 0) return;

  // Newton-consistent: root + fifth (+ octave implication)
  const root = freqs[0] / 2;
  const fifth = root * 1.5;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc1.type = "sine";
  osc2.type = profile.groove === "mysterious" ? "triangle" : "sine";

  osc1.frequency.value = root;
  osc2.frequency.value = fifth;

  filter.type = "lowpass";
  filter.frequency.value = profile.groove === "dark" ? 240 : 380;
  filter.Q.value = 0.8;

  const durationByGroove = {
    dark: 3.0,
    brooding: 3.0,
    mysterious: 2.5,
    warm: 2.3
  };

  const volumeByGroove = {
    dark: 0.1,
    brooding: 0.055,
    mysterious: 0.1,
    warm: 0.055
  };

  const duration = durationByGroove[profile.groove] || 2.5;
  const volume = volumeByGroove[profile.groove] || 0.1;

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start();
  osc2.start();

  osc1.stop(audioCtx.currentTime + duration);
  osc2.stop(audioCtx.currentTime + duration);
}

// ======================
// CONTROL (BRIDGE)
// ======================

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
      showDyadResult();
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
    showDyadResult();
  } else if (selectedEmotions.length === 3) {
    showTriadResult();
  }
}

//==================== */
// END CORE ENGINE
//==================== */

// ======================
// UI DATA
// ======================
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


// ======================
// DOM REFERENCES
// ======================
const buttonsContainer = document.getElementById("emotion-buttons");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const resetButton = document.getElementById("reset-button");

// ======================
// UI RENDERING
// ======================
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

function getEmotionLabel(emotionId) {
  const emotion = emotions.find((e) => e.id === emotionId);
  return emotion ? emotion.label : emotionId;
}

// ======================
// STEP VISUALS
// ======================
const TOTAL_STEPS = 8;

// ======================
// STATUS / RESULT DISPLAY
// ======================
function updateStatus() {
  if (selectedEmotions.length === 0) {
    statusEl.textContent = "Select up to 3 primary emotions";
  } else if (selectedEmotions.length === 1) {
    const firstLabel = getEmotionLabel(selectedEmotions[0]);
    statusEl.textContent = `Selected: ${firstLabel} — add up to 2 more.`;
  } else if (selectedEmotions.length === 2) {
    const labels = selectedEmotions.map(getEmotionLabel).join(" + ");
    statusEl.textContent = `Selected: ${labels} — add 1 more if you'd like.`;
  } else {
    const labels = selectedEmotions.map(getEmotionLabel).join(" + ");
    statusEl.textContent = `Selected: ${labels}`;
  }
}

function showDyadResult() {
  const [a, b] = selectedEmotions;
  const key = makeDyadKey(a, b);
  const dyad = dyads[key];

  if (!dyad) {
    resultEl.innerHTML = `
      <div class="dyad-name">Unknown</div>
      <div class="dyad-meta">${getEmotionLabel(a)} + ${getEmotionLabel(b)}</div>
      <div class="dyad-description">No dyad mapping exists yet for this combination.</div>
    `;
    resultEl.style.background = "rgba(255,255,255,0.06)";
    animateResult();
    return;
  }

  resultEl.innerHTML = `
    <div class="dyad-name">${dyad.name}</div>
    <div class="dyad-meta">${dyad.primaries.join(" + ")}</div>
    <div class="dyad-description">${dyad.description}</div>
  `;

  if (dyad.colors) {
    resultEl.style.background = `linear-gradient(135deg, ${dyad.colors[0]}, ${dyad.colors[1]})`;
  } else {
    resultEl.style.background = "rgba(255,255,255,0.06)";
  }

  animateResult();
}

function showTriadResult() {
  const key = makeTriadKey(selectedEmotions);
  const triad = triads[key];

  if (!triad) {
    resultEl.innerHTML = `
      <div class="dyad-name">Unknown Triad</div>
      <div class="dyad-meta">${selectedEmotions.map(getEmotionLabel).join(" + ")}</div>
      <div class="dyad-description">No triad mapping exists yet for this combination.</div>
    `;
    resultEl.style.background = "rgba(255,255,255,0.06)";
    animateResult();
    return;
  }

  const ids = key.split("|");
  const colors = getTriadColors(ids);

  resultEl.innerHTML = `
    <div class="dyad-name">${triad.name}</div>
    <div class="dyad-meta">${ids.map(getEmotionLabel).join(" + ")}</div>
    <div class="dyad-description">${triad.description || ""}</div>
  `;

  resultEl.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
  animateResult();
}

function resetResult() {
  resultEl.innerHTML = `
    <div class="dyad-name"></div>
    <div class="dyad-meta">Select emotions to generate a blend</div>
    <div class="dyad-description"></div>
  `;
  resultEl.style.background = "rgba(255,255,255,0.06)";
}

function animateResult() {
  resultEl.classList.remove("result-pop");
  void resultEl.offsetWidth;
  resultEl.classList.add("result-pop");
}


// ======================
// UI STATE HELPERS
// ======================
function updateButtonStates() {
  document.querySelectorAll(".emotion-btn").forEach(btn => {
    btn.classList.remove("dimmed");
  });
}

function resetApp() {
  selectedEmotions = [];

  if (grooveInterval) {
    clearTimeout(grooveInterval);
  }

  updateStatus();
  resetResult();

  document.querySelectorAll(".emotion-btn").forEach(btn => {
    btn.classList.remove("selected");
    btn.style.background = "";
    btn.style.color = "";
  });

  updateButtonStates();
}


// ======================
// APP INIT / EVENT WIRING
// ======================
if (resetButton) {
  resetButton.addEventListener("click", resetApp);
}

renderEmotionButtons();
updateStatus();
resetResult();

const waveSvg = document.getElementById("emotion-waves");

const primaryWavePresets = {
  power: {
    color: "#FF5A5F",
    amplitude: 58,
    wavelength: 280,
    speed: 0.085
  },
  anticipation: {
    color: "#FF9F1C",
    amplitude: 42,
    wavelength: 180,
    speed: 0.095
  },
  joy: {
    color: "#FFD84D",
    amplitude: 50,
    wavelength: 240,
    speed: 0.08
  },
  trust: {
    color: "#4ADE80",
    amplitude: 34,
    wavelength: 300,
    speed: 0.045
  },
  fear: {
    color: "#38BDF8",
    amplitude: 24,
    wavelength: 135,
    speed: 0.11
  },
  surprise: {
    color: "#A78BFA",
    amplitude: 46,
    wavelength: 145,
    speed: 0.12
  },
  sadness: {
    color: "#5B6CFF",
    amplitude: 18,
    wavelength: 340,
    speed: 0.025
  },
  disgust: {
    color: "#8B5CF6",
    amplitude: 30,
    wavelength: 165,
    speed: 0.055
  }
};

const emotionalRelationships = {
  power:       { joy: 0.85, trust: 0.7, anticipation: 0.65, surprise: 0.35, fear: 0.2, sadness: 0.15, disgust: 0.1 },
  anticipation:{ joy: 0.7, trust: 0.55, power: 0.65, surprise: 0.6, fear: 0.45, sadness: 0.2, disgust: 0.25 },
  joy:         { power: 0.85, trust: 0.9, anticipation: 0.7, surprise: 0.65, fear: 0.15, sadness: 0.1, disgust: 0.1 },
  trust:       { joy: 0.9, power: 0.7, anticipation: 0.55, surprise: 0.35, fear: 0.2, sadness: 0.45, disgust: 0.15 },
  fear:        { surprise: 0.7, sadness: 0.55, anticipation: 0.45, disgust: 0.35, joy: 0.15, trust: 0.2, power: 0.2 },
  surprise:    { fear: 0.7, anticipation: 0.6, joy: 0.65, power: 0.35, trust: 0.35, sadness: 0.25, disgust: 0.3 },
  sadness:     { fear: 0.55, trust: 0.45, disgust: 0.4, joy: 0.1, power: 0.15, anticipation: 0.2, surprise: 0.25 },
  disgust:     { sadness: 0.4, fear: 0.35, surprise: 0.3, anticipation: 0.25, joy: 0.1, trust: 0.15, power: 0.1 }
};

function getWaveRelationshipFactor(emotion, emotions) {
  const others = emotions.filter(e => e !== emotion);

  if (!others.length) return 1;

  let total = 0;
  let count = 0;

  others.forEach(other => {
    const score =
      emotionalRelationships[emotion]?.[other] ??
      emotionalRelationships[other]?.[emotion] ??
      0.4;

    total += score;
    count += 1;
  });

  return count ? total / count : 1;
}

if (waveSvg) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  waveSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  function getCurrentWavePreset() {
  const activeEmotions = selectedEmotions.length
    ? [...selectedEmotions]
    : ["joy"];

  const presets = activeEmotions
    .map(emotion => primaryWavePresets[emotion])
    .filter(Boolean);

  if (!presets.length) {
    return primaryWavePresets.joy;
  }

  const count = presets.length;

  const blended = presets.reduce(
    (acc, preset) => {
      acc.amplitude += preset.amplitude;
      acc.wavelength += preset.wavelength;
      acc.speed += preset.speed;
      return acc;
    },
    { amplitude: 0, wavelength: 0, speed: 0 }
  );

  return {
    color: presets[0].color,
    amplitude: (blended.amplitude / count) + ((count - 1) * 8),
    wavelength: (blended.wavelength / count) * 1.2,
    speed: (blended.speed / count) + ((count - 1) * 0.01)
  };
}

  function getActiveWaveEmotions() {
    return selectedEmotions.length ? [...selectedEmotions] : ["joy"];
  }

  function buildWavePathForEmotion(emotion, index, emotions, time) {
    const relationship = getWaveRelationshipFactor(emotion, emotions);
    const dissonance = 1 - relationship;
    const preset = primaryWavePresets[emotion] || primaryWavePresets.joy;
    const wavelength = preset.wavelength;

    const baseline =
      height * 0.22 +
      Math.sin(time * (0.18 + dissonance * 0.06) + index * (0.25 + dissonance * 0.8)) * (8 + dissonance * 8);

    const points = [];

    for (let x = 0; x <= width; x += 24) {
      const breath =
        1 + Math.sin(time * (0.3 + dissonance * 0.12) + index * (0.2 + dissonance * 0.9)) * (0.14 + dissonance * 0.08);
      const amplitude = preset.amplitude * 0.9 * breath;

      const mainWave =
        Math.sin(
          (x / (wavelength * (1 - dissonance * 0.08))) * Math.PI * 2 +
          time * (1 + dissonance * 0.08) +
          index * (0.12 + dissonance * 0.9)
        ) * amplitude;

      const y = baseline + mainWave;

      points.push({ x, y });
    }

  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

  const wavePaths = [];

  waveSvg.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("opacity", "0");

    waveSvg.appendChild(path);
    wavePaths.push(path);
  }

  let time = 0;

  function animate() {
  time += 0.05;

  const emotions = getActiveWaveEmotions();
  const count = emotions.length;

  wavePaths.forEach((path, index) => {
    const emotion = emotions[index];

    if (!emotion) {
      path.setAttribute("opacity", "0");
      return;
    }

    const preset = primaryWavePresets[emotion] || primaryWavePresets.joy;

    path.setAttribute("opacity", "0.5");
    path.setAttribute("stroke", preset.color);
    path.setAttribute("d", buildWavePathForEmotion(emotion, index, emotions, time));
  });

  requestAnimationFrame(animate);
}

  animate();
}
