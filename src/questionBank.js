// Supplemental compositional grammar drills. Not a reviewed official STEP question bank.
const phrases =
  `prepare dinner|clean the kitchen|watch a documentary|study English|visit a museum|paint a picture|repair a bicycle|organize a meeting|practice the piano|finish a report|answer the phone|open a window|close a door|check an email|review a lesson|help a neighbor|call a friend|wash the dishes|water the plants|walk to school|listen to a podcast|work on a project|play a game|cook a meal|bake a cake|order a sandwich|deliver a package|collect the tickets|print a document|save a file|charge a phone|decorate a room|arrange the chairs|plant a tree|photograph a building|design a poster|record a message|edit a video|translate a sentence|describe a place|explain a rule|discuss a book|compare two answers|measure a table|count the boxes|sort the cards|pack a suitcase|unpack a bag|book a room|reserve a table|confirm a booking|cancel a reservation|invite a colleague|welcome a visitor|thank a teacher|offer some advice|share an idea|support a team|join a club|attend a class|complete a task|start a course|continue a story|follow the instructions|remember a word|repeat a phrase|pronounce a word|spell a name|label a diagram|circle an answer|underline a phrase|highlight a sentence|copy a paragraph|type a message|post a letter|mail a package|return a book|borrow a pen|lend a hand|change a password|update a calendar|download a file|upload a photo|install an app|remove a label|replace a battery|test a microphone|inspect a machine|assemble a shelf|polish a mirror|dust a desk|fold a shirt|iron a jacket|brush a coat|mop the floor|sweep the floor|greet a customer|train a colleague|coach a student|guide a visitor|manage a shop|plan a journey|serve a guest|taste the soup|mix the ingredients|improve a draft|develop an idea|solve a problem|notice a detail|identify a pattern`
    .split("|")
    .slice(0, 100);
const irregular = {
  lend: ["lent", "lent", "lending"],
  sweep: ["swept", "swept", "sweeping"],
  plan: ["planned", "planned", "planning"],
  mop: ["mopped", "mopped", "mopping"],
};
const subjects = [
  ["I", false],
  ["You", false],
  ["We", false],
  ["They", false],
  ["She", true],
  ["He", true],
  ["The teacher", true],
  ["The student", true],
  ["The engineer", true],
  ["The manager", true],
  ["The nurse", true],
  ["The guide", true],
  ["The students", false],
  ["The teachers", false],
  ["My friends", false],
  ["My parents", false],
];
export const bankTopics = [
  ["present", "المضارع البسيط", "Present simple", "easy"],
  ["continuous", "المضارع المستمر", "Present continuous", "easy"],
  ["past", "الماضي البسيط", "Past simple", "easy"],
  ["past-negative", "نفي الماضي", "Past negatives", "medium"],
  ["future", "المستقبل", "Future with will", "medium"],
  ["perfect", "المضارع التام", "Present perfect", "medium"],
  ["past-perfect", "الماضي التام", "Past perfect", "hard"],
  ["modal-perfect", "الاستنتاج عن الماضي", "Past deduction", "hard"],
];
const times = [
  [
    "Every morning",
    "Every evening",
    "On weekdays",
    "Every Sunday",
    "Twice a week",
    "After every class",
    "Before breakfast each day",
    "Regularly",
  ],
  [
    "Right now",
    "At this moment",
    "Look",
    "Listen",
    "Today at this very moment",
    "At the moment",
    "Now",
    "Currently",
  ],
  [
    "Yesterday",
    "Last Monday",
    "Last week",
    "Two days ago",
    "Last night",
    "Yesterday afternoon",
    "Three days ago",
    "Last Friday",
  ],
  [
    "Yesterday",
    "Last Monday",
    "Last week",
    "Two days ago",
    "Last night",
    "Yesterday afternoon",
    "Three days ago",
    "Last Friday",
  ],
  [
    "Tomorrow",
    "Next Monday",
    "Next week",
    "In two days",
    "Tomorrow evening",
    "Next month",
    "Next Friday",
    "This time next week",
  ],
  [
    "Recently",
    "So far today",
    "Since Monday",
    "Over the past week",
    "This week so far",
    "In the last few days",
    "Since last Friday",
    "So far this month",
  ],
  [
    "Before the meeting started",
    "Before the guests arrived",
    "By the time the class began",
    "Before the rain started",
    "Before the bus arrived",
    "By the time the shop opened",
    "Before the sun rose",
    "Before the event ended",
  ],
  [
    "Based on the evidence yesterday",
    "Judging by the results last night",
    "Given the evidence last week",
    "Based on what we saw yesterday",
    "Judging from the evidence on Monday",
    "Given the results on Friday",
    "Based on the evidence last month",
    "Judging by what happened last week",
  ],
];
export const BANK_SIZE = 100000;
function forms(phrase) {
  const [verb, ...rest] = phrase.split(" ");
  const past =
    irregular[verb]?.[0] ||
    (verb.endsWith("e")
      ? verb + "d"
      : /[^aeiou]y$/.test(verb)
        ? verb.slice(0, -1) + "ied"
        : verb + "ed");
  const ing =
    irregular[verb]?.[2] ||
    (verb.endsWith("e") ? verb.slice(0, -1) + "ing" : verb + "ing");
  const third = /[^aeiou]y$/.test(verb)
    ? verb.slice(0, -1) + "ies"
    : /(s|x|z|ch|sh|o)$/.test(verb)
      ? verb + "es"
      : verb + "s";
  return {
    verb,
    rest: rest.join(" "),
    past,
    pp: irregular[verb]?.[1] || past,
    ing,
    third,
  };
}
export function bankQuestion(id) {
  if (!Number.isInteger(id) || id < 0 || id >= BANK_SIZE)
    throw new RangeError("Question ID out of range");
  const phrase = phrases[id % 100],
    subject = subjects[Math.floor(id / 100) % 16],
    family = Math.floor(id / 1600) % 8,
    time = Math.floor(id / 12800);
  const [name, singular] = subject;
  const f = forms(phrase);
  const correct = [
    singular ? f.third : f.verb,
    `${name === "I" ? "am" : singular ? "is" : "are"} ${f.ing}`,
    f.past,
    `did not ${f.verb}`,
    `will ${f.verb}`,
    `${singular ? "has" : "have"} ${f.pp}`,
    `had ${f.pp}`,
    `must have ${f.pp}`,
  ][family];
  const candidates = [
    f.verb,
    f.third,
    f.past,
    `is ${f.ing}`,
    `have ${f.verb}`,
    `did ${f.past}`,
    `will ${f.past}`,
  ];
  let options = [
    correct,
    ...new Set(candidates.filter((v) => v !== correct)),
  ].slice(0, 4);
  const rotate = id % 4;
  options = [...options.slice(rotate), ...options.slice(0, rotate)];
  const topic = bankTopics[family];
  return {
    id: `generated-${id}`,
    skill: "القواعد",
    difficulty: topic[3],
    topic: topic[0],
    prompt: `Use ${topic[2].toLowerCase()}: ${times[family][time]}, ${name === "I" ? "I" : name[0].toLowerCase() + name.slice(1)} _____ ${f.rest}. (Base verb: ${f.verb})`,
    options,
    answer: options.indexOf(correct),
    explanation: `هذا تدريب تركيبي على ${topic[1]}. الصيغة المناسبة للفاعل والزمن هي: ${correct}. الاسم أو السياق وحده لا يغير قاعدة التصريف.`,
    explanationEn: `This is a compositional drill on ${topic[2].toLowerCase()}. For this subject and requested tense, the correct verb phrase is “${correct}”.`,
  };
}
export function bankSession(level = "all", topic = "all", size = 10) {
  const eligible = [];
  for (let id = 0; id < BANK_SIZE; id++) {
    const family = bankTopics[Math.floor(id / 1600) % 8];
    if (
      (level === "all" || level === family[3]) &&
      (topic === "all" || topic === family[0])
    )
      eligible.push(id);
  }
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  return eligible.slice(0, size).map(bankQuestion);
}
