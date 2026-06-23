/* ============================================================================
   Parlor game engine — pure (state, action) => state.

   This module is shared by the React client and the PartyKit server. Keep it
   free of React, the DOM, and any Node/Next.js APIs. Date.now() and Math.random()
   are intentionally used; both work the same in browsers and Cloudflare Workers.
   ========================================================================== */

/* ---- TUNABLES ------------------------------------------------------------ */
export const TOTAL_ROUNDS = 5;
export const POINTS_PER_VOTE = 100;
export const WRITING_SECONDS = 60;
export const VOTING_SECONDS = 30;

// Trivia
export const TRIVIA_ANSWER_SECONDS = 20;
export const TRIVIA_REVEAL_SECONDS = 6;
export const TRIVIA_BASE_POINTS = 100;
export const TRIVIA_SPEED_BONUS_MAX = 50;

// Picture Reveal
export const PICTURE_GUESS_SECONDS = 30;
export const PICTURE_BASE_POINTS = 150;

// Wheel of Fortune
export const WHEEL_GUESS_SECONDS = 60;
export const WHEEL_SOLVE_BONUS = 200;
export const WHEEL_LETTER_BUDGET = 3; // letters each player may reveal per round

// Family Feud
export const FEUD_GUESS_SECONDS = 30;
export const FEUD_TOP_BONUS = 50;

export const PROMPTS = [
  "The worst possible name for a new cargo ship",
  "A rejected slogan for this year's family vacation",
  "Something you should never say to your GPS",
  "The real reason the Wi-Fi went down",
  "A terrible name for a worship band",
  "A bad theme for a kid's birthday party",
  "The worst superpower to be stuck with",
  "A rejected flavor of ice cream",
  "What the dog would say if it could talk for ten seconds",
  "A genuinely terrible motivational poster",
  "The least useful thing to pack for camping",
  "What's actually in the mystery container at the back of the fridge",
  "A rejected ride at the county fair",
  "The worst advice to give a brand-new driver",
  "What the cat is quietly plotting",
  "A bad name for a houseplant",
  "A children's book title that should never have been published",
  "The most awkward thing to find in your old yearbook",
  "What the GPS lady is really thinking",
  "A rejected name for a new crayon color",
  "The worst possible birthday gift from a distant relative",
  "A terrible piece of advice from a fortune cookie",
  "The hidden talent grandma is keeping secret",
  "A rejected feature for the next iPhone",
  "Why dad really took so long in the hardware store",
  "The actual reason traffic is stopped on the highway",
  "A bad name for a peewee soccer team",
  "What the dishwasher is plotting late at night",
  "A rejected slogan for the local DMV",
  "The strangest thing you've found in a hotel room",
  "What the smoke alarm has been brooding about",
  "A rejected name for a new bug spray",
  "The worst possible thing to whisper at a funeral",
  "A genuinely cursed sandwich",
  "What the Roomba is muttering under its breath",
  "A rejected name for a hurricane",
  "The most unhelpful thing on a job interview résumé",
  "A bad password your uncle insists is secure",
  "What's playing on the radio in the elevator to hell"
];

export const COLORS = [
  "#FFC15E", "#FF5E78", "#5BD1B7", "#8E9BFF",
  "#FF9447", "#C0E84B", "#FF82D6", "#57C7FF"
];

/* ---- CONTENT: TRIVIA ----------------------------------------------------- */
export type TriviaQuestion = {
  id: string;
  category: string;
  text: string;
  choices: string[];
  correctIndex: number;
};

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { id: "t1", category: "Geography", text: "What is the longest river in the world?", choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctIndex: 1 },
  { id: "t2", category: "Science", text: "Which planet has the most moons?", choices: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctIndex: 1 },
  { id: "t3", category: "History", text: "In what year did the Berlin Wall fall?", choices: ["1987", "1989", "1991", "1993"], correctIndex: 1 },
  { id: "t4", category: "Pop Culture", text: "Who painted the Mona Lisa?", choices: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correctIndex: 2 },
  { id: "t5", category: "Sports", text: "How many players are on a soccer team on the field?", choices: ["9", "10", "11", "12"], correctIndex: 2 },
  { id: "t6", category: "Music", text: "Which Beatles album features 'Here Comes the Sun'?", choices: ["Abbey Road", "Let It Be", "Revolver", "Rubber Soul"], correctIndex: 0 },
  { id: "t7", category: "Movies", text: "Who directed Pulp Fiction?", choices: ["Martin Scorsese", "Quentin Tarantino", "Steven Spielberg", "Christopher Nolan"], correctIndex: 1 },
  { id: "t8", category: "Food", text: "Sushi originated in which country?", choices: ["China", "Korea", "Japan", "Vietnam"], correctIndex: 2 },
  { id: "t9", category: "Animals", text: "What is the fastest land animal?", choices: ["Lion", "Cheetah", "Gazelle", "Pronghorn"], correctIndex: 1 },
  { id: "t10", category: "Tech", text: "What does 'HTTP' stand for?", choices: ["HyperText Transfer Protocol", "High Tech Protocol", "Home Transfer Page", "Hyper Transit Protocol"], correctIndex: 0 },
  { id: "t11", category: "Geography", text: "Which country has the most natural lakes?", choices: ["Russia", "USA", "Canada", "Finland"], correctIndex: 2 },
  { id: "t12", category: "Science", text: "What is the chemical symbol for gold?", choices: ["Go", "Gd", "Au", "Ag"], correctIndex: 2 },
  { id: "t13", category: "History", text: "Who was the first US president?", choices: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"], correctIndex: 1 },
  { id: "t14", category: "Pop Culture", text: "What is the name of the wizard school in Harry Potter?", choices: ["Hogwarts", "Beauxbatons", "Durmstrang", "Ilvermorny"], correctIndex: 0 },
  { id: "t15", category: "Sports", text: "What sport is played at Wimbledon?", choices: ["Cricket", "Tennis", "Golf", "Rugby"], correctIndex: 1 },
  { id: "t16", category: "Music", text: "Who is known as the 'King of Pop'?", choices: ["Elvis Presley", "Michael Jackson", "Prince", "Justin Bieber"], correctIndex: 1 },
  { id: "t17", category: "Movies", text: "What's the highest-grossing film of all time (unadjusted)?", choices: ["Titanic", "Avatar", "Avengers: Endgame", "Star Wars: The Force Awakens"], correctIndex: 1 },
  { id: "t18", category: "Food", text: "Which spice is the most expensive by weight?", choices: ["Vanilla", "Saffron", "Cardamom", "Truffle"], correctIndex: 1 },
  { id: "t19", category: "Animals", text: "How many hearts does an octopus have?", choices: ["1", "2", "3", "4"], correctIndex: 2 },
  { id: "t20", category: "Tech", text: "Who founded Microsoft alongside Bill Gates?", choices: ["Steve Jobs", "Paul Allen", "Steve Ballmer", "Mark Zuckerberg"], correctIndex: 1 },
  { id: "t21", category: "Geography", text: "Mount Everest is on the border of Nepal and which other country?", choices: ["India", "China", "Bhutan", "Pakistan"], correctIndex: 1 },
  { id: "t22", category: "Science", text: "Light from the Sun takes about how long to reach Earth?", choices: ["8 seconds", "8 minutes", "8 hours", "8 days"], correctIndex: 1 },
  { id: "t23", category: "History", text: "The Great Wall of China was primarily built to defend against which group?", choices: ["Mongols", "Russians", "Japanese", "Persians"], correctIndex: 0 },
  { id: "t24", category: "Pop Culture", text: "What is the name of Spongebob's pet snail?", choices: ["Patrick", "Gary", "Squidward", "Sandy"], correctIndex: 1 },
  { id: "t25", category: "Tech", text: "What does 'CPU' stand for?", choices: ["Central Power Unit", "Central Processing Unit", "Computer Processing Unit", "Core Processing Unit"], correctIndex: 1 },
  { id: "t26", category: "Geography", text: "Which African country has the most pyramids?", choices: ["Egypt", "Sudan", "Libya", "Ethiopia"], correctIndex: 1 },
  { id: "t27", category: "Geography", text: "Which is the only US state with a one-syllable name?", choices: ["Maine", "Texas", "Utah", "Florida"], correctIndex: 0 },
  { id: "t28", category: "Geography", text: "What is the smallest country in the world?", choices: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correctIndex: 2 },
  { id: "t29", category: "Geography", text: "Which ocean is the largest?", choices: ["Atlantic", "Indian", "Pacific", "Arctic"], correctIndex: 2 },
  { id: "t30", category: "Geography", text: "Istanbul straddles which two continents?", choices: ["Europe & Africa", "Europe & Asia", "Asia & Africa", "Europe & Middle East"], correctIndex: 1 },
  { id: "t31", category: "Science", text: "How many bones does an adult human have?", choices: ["186", "206", "246", "306"], correctIndex: 1 },
  { id: "t32", category: "Science", text: "What's the hardest natural substance on Earth?", choices: ["Quartz", "Steel", "Diamond", "Granite"], correctIndex: 2 },
  { id: "t33", category: "Science", text: "Water boils at what temperature in Fahrenheit at sea level?", choices: ["180°", "200°", "212°", "220°"], correctIndex: 2 },
  { id: "t34", category: "Science", text: "Which gas do plants absorb from the atmosphere?", choices: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"], correctIndex: 3 },
  { id: "t35", category: "Science", text: "What is the largest organ in the human body?", choices: ["Liver", "Skin", "Brain", "Lungs"], correctIndex: 1 },
  { id: "t36", category: "History", text: "In what year did World War II end?", choices: ["1943", "1944", "1945", "1946"], correctIndex: 2 },
  { id: "t37", category: "History", text: "Who was the first woman to win a Nobel Prize?", choices: ["Marie Curie", "Rosalind Franklin", "Ada Lovelace", "Florence Nightingale"], correctIndex: 0 },
  { id: "t38", category: "History", text: "Which empire built Machu Picchu?", choices: ["Aztec", "Maya", "Inca", "Olmec"], correctIndex: 2 },
  { id: "t39", category: "History", text: "Who wrote 'The Communist Manifesto'?", choices: ["Lenin", "Marx & Engels", "Stalin", "Trotsky"], correctIndex: 1 },
  { id: "t40", category: "History", text: "The Renaissance began in which country?", choices: ["France", "Spain", "Italy", "Germany"], correctIndex: 2 },
  { id: "t41", category: "Pop Culture", text: "Who is Wall-E's love interest?", choices: ["EVE", "WALL-A", "GOLIATH", "M-O"], correctIndex: 0 },
  { id: "t42", category: "Pop Culture", text: "In Friends, what does Chandler do for work?", choices: ["Lawyer", "Doctor", "Statistical analysis and data reconfiguration", "Actor"], correctIndex: 2 },
  { id: "t43", category: "Pop Culture", text: "Which Pixar film features the character Buzz Lightyear?", choices: ["Cars", "Toy Story", "Up", "Monsters Inc"], correctIndex: 1 },
  { id: "t44", category: "Pop Culture", text: "Who plays Captain Jack Sparrow?", choices: ["Orlando Bloom", "Johnny Depp", "Geoffrey Rush", "Keira Knightley"], correctIndex: 1 },
  { id: "t45", category: "Pop Culture", text: "What's the name of the dog in 'The Wizard of Oz'?", choices: ["Buddy", "Toto", "Rex", "Spot"], correctIndex: 1 },
  { id: "t46", category: "Sports", text: "How often are the Summer Olympics held?", choices: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], correctIndex: 2 },
  { id: "t47", category: "Sports", text: "In basketball, how many points is a free throw worth?", choices: ["1", "2", "3", "4"], correctIndex: 0 },
  { id: "t48", category: "Sports", text: "Which country invented table tennis?", choices: ["China", "Japan", "England", "France"], correctIndex: 2 },
  { id: "t49", category: "Sports", text: "How many holes are on a standard golf course?", choices: ["9", "12", "18", "21"], correctIndex: 2 },
  { id: "t50", category: "Sports", text: "Usain Bolt is from which country?", choices: ["USA", "Trinidad", "Jamaica", "Kenya"], correctIndex: 2 },
  { id: "t51", category: "Music", text: "How many strings does a standard violin have?", choices: ["4", "5", "6", "7"], correctIndex: 0 },
  { id: "t52", category: "Music", text: "Who composed 'Für Elise'?", choices: ["Mozart", "Bach", "Beethoven", "Chopin"], correctIndex: 2 },
  { id: "t53", category: "Music", text: "Which band released 'Hotel California'?", choices: ["Eagles", "Fleetwood Mac", "The Who", "Led Zeppelin"], correctIndex: 0 },
  { id: "t54", category: "Music", text: "What's Taylor Swift's first hit single?", choices: ["Love Story", "Tim McGraw", "Shake It Off", "You Belong with Me"], correctIndex: 1 },
  { id: "t55", category: "Movies", text: "What's the highest-grossing animated film?", choices: ["Frozen II", "The Lion King (2019)", "Inside Out 2", "Frozen"], correctIndex: 2 },
  { id: "t56", category: "Movies", text: "Who directed Jaws?", choices: ["Francis Ford Coppola", "George Lucas", "Steven Spielberg", "Brian De Palma"], correctIndex: 2 },
  { id: "t57", category: "Movies", text: "What's the name of the wizard in Lord of the Rings?", choices: ["Saruman", "Gandalf", "Radagast", "Sauron"], correctIndex: 1 },
  { id: "t58", category: "Movies", text: "Which film won Best Picture in 2020?", choices: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"], correctIndex: 2 },
  { id: "t59", category: "Food", text: "What pasta shape literally means 'little ears'?", choices: ["Farfalle", "Orecchiette", "Cavatappi", "Conchiglie"], correctIndex: 1 },
  { id: "t60", category: "Food", text: "Where does the cocoa bean originate from?", choices: ["Africa", "South America", "Asia", "Australia"], correctIndex: 1 },
  { id: "t61", category: "Food", text: "What's the main ingredient in guacamole?", choices: ["Tomato", "Pepper", "Onion", "Avocado"], correctIndex: 3 },
  { id: "t62", category: "Food", text: "Which country is the largest producer of coffee?", choices: ["Vietnam", "Colombia", "Brazil", "Ethiopia"], correctIndex: 2 },
  { id: "t63", category: "Animals", text: "Which bird can fly backwards?", choices: ["Swallow", "Hummingbird", "Sparrow", "Finch"], correctIndex: 1 },
  { id: "t64", category: "Animals", text: "What is a baby kangaroo called?", choices: ["Calf", "Joey", "Cub", "Pup"], correctIndex: 1 },
  { id: "t65", category: "Animals", text: "What's the largest mammal on Earth?", choices: ["African Elephant", "Sperm Whale", "Blue Whale", "Giraffe"], correctIndex: 2 },
  { id: "t66", category: "Animals", text: "How many legs does a spider have?", choices: ["6", "8", "10", "12"], correctIndex: 1 },
  { id: "t67", category: "Tech", text: "What year was the iPhone first released?", choices: ["2005", "2006", "2007", "2008"], correctIndex: 2 },
  { id: "t68", category: "Tech", text: "What does 'AI' stand for?", choices: ["Auto Intelligence", "Artificial Intelligence", "Advanced Internet", "Algorithmic Index"], correctIndex: 1 },
  { id: "t69", category: "Tech", text: "Who is the founder of SpaceX?", choices: ["Jeff Bezos", "Bill Gates", "Elon Musk", "Larry Page"], correctIndex: 2 },
  { id: "t70", category: "Tech", text: "What does 'URL' stand for?", choices: ["Uniform Resource Locator", "Universal Resource Link", "Unique Resource Locator", "Unified Resource Line"], correctIndex: 0 },
  { id: "t71", category: "Geography", text: "What's the capital of Australia?", choices: ["Sydney", "Melbourne", "Canberra", "Perth"], correctIndex: 2 },
  { id: "t72", category: "Science", text: "What's the speed of light (approximately)?", choices: ["186,000 mi/s", "300,000 ft/s", "100,000 mi/s", "50,000 mi/s"], correctIndex: 0 },
  { id: "t73", category: "Movies", text: "Which actor voices Shrek?", choices: ["Eddie Murphy", "Mike Myers", "Antonio Banderas", "Cameron Diaz"], correctIndex: 1 },
  { id: "t74", category: "Pop Culture", text: "In Monopoly, how much do you collect for passing GO?", choices: ["$100", "$150", "$200", "$500"], correctIndex: 2 },
  { id: "t75", category: "Music", text: "What instrument does Yo-Yo Ma famously play?", choices: ["Violin", "Cello", "Piano", "Flute"], correctIndex: 1 }
];

/* ---- CONTENT: PICTURE REVEAL --------------------------------------------- */
// Picture rounds can use AI-generated art. `answer` is what we match against;
// aliases let us be lenient about typing.
export type PictureItem = {
  id: string;
  src?: string;
  generatedSrc?: string;
  imagePrompt?: string;
  imageStatus?: "idle" | "generating" | "ready" | "error";
  imageError?: string;
  answer: string;
  aliases?: string[];
  hint?: string;
};

export const PICTURE_ITEMS: PictureItem[] = [
  {
    id: "p1",
    answer: "elephant",
    hint: "Big ears",
    imagePrompt: "A cinematic studio photograph of an elephant, full body, warm theatrical lighting, uncluttered background, no text."
  },
  {
    id: "p2",
    answer: "eiffel tower",
    aliases: ["eiffel", "tour eiffel"],
    hint: "Paris landmark",
    imagePrompt: "A polished travel-poster photograph of the Eiffel Tower at golden hour, recognizable silhouette, no words or signs."
  },
  {
    id: "p3",
    answer: "pizza",
    hint: "Italian food",
    imagePrompt: "A mouthwatering overhead food photograph of a whole pizza on a dark table, dramatic party-game lighting, no text."
  },
  {
    id: "p4",
    answer: "guitar",
    hint: "Musical instrument",
    imagePrompt: "A glossy product photograph of an acoustic guitar on a small stage, spotlit, rich detail, no text."
  },
  {
    id: "p5",
    answer: "giraffe",
    hint: "Long neck",
    imagePrompt: "A crisp editorial wildlife photograph of a giraffe standing against a clean savanna backdrop, no text."
  }
];

/* ---- CONTENT: WHEEL OF FORTUNE ------------------------------------------- */
export type WheelPuzzle = {
  id: string;
  category: string;
  text: string; // letters and spaces only; we render unrevealed letters as blanks
};

export const WHEEL_PUZZLES: WheelPuzzle[] = [
  { id: "w1", category: "Phrase", text: "BREAK A LEG" },
  { id: "w2", category: "Movie", text: "THE GODFATHER" },
  { id: "w3", category: "Place", text: "NEW YORK CITY" },
  { id: "w4", category: "Thing", text: "PEANUT BUTTER AND JELLY" },
  { id: "w5", category: "Person", text: "ALBERT EINSTEIN" },
  { id: "w6", category: "Phrase", text: "EASY AS PIE" },
  { id: "w7", category: "Song", text: "BOHEMIAN RHAPSODY" },
  { id: "w8", category: "Book", text: "TO KILL A MOCKINGBIRD" }
];

/* ---- CONTENT: FAMILY FEUD ------------------------------------------------ */
export type FeudAnswer = { text: string; points: number; aliases?: string[] };
export type FeudQuestion = {
  id: string;
  prompt: string;
  answers: FeudAnswer[]; // sorted by points desc
};

export const FEUD_QUESTIONS: FeudQuestion[] = [
  {
    id: "f1",
    prompt: "Name something you find in a kitchen",
    answers: [
      { text: "Fridge", points: 32, aliases: ["refrigerator"] },
      { text: "Stove", points: 24, aliases: ["oven"] },
      { text: "Sink", points: 18 },
      { text: "Microwave", points: 12 },
      { text: "Dishwasher", points: 8 }
    ]
  },
  {
    id: "f2",
    prompt: "Name a popular pizza topping",
    answers: [
      { text: "Pepperoni", points: 35 },
      { text: "Cheese", points: 22 },
      { text: "Mushroom", points: 16, aliases: ["mushrooms"] },
      { text: "Sausage", points: 12 },
      { text: "Pineapple", points: 9 }
    ]
  },
  {
    id: "f3",
    prompt: "Name something people do when they can't sleep",
    answers: [
      { text: "Read a book", points: 28, aliases: ["read"] },
      { text: "Watch TV", points: 22, aliases: ["tv", "television", "watch tv"] },
      { text: "Drink milk", points: 14, aliases: ["milk", "warm milk"] },
      { text: "Scroll phone", points: 18, aliases: ["phone", "scroll"] },
      { text: "Count sheep", points: 10, aliases: ["sheep"] }
    ]
  },
  {
    id: "f4",
    prompt: "Name a reason you'd be late to work",
    answers: [
      { text: "Traffic", points: 38 },
      { text: "Overslept", points: 22, aliases: ["alarm", "slept in"] },
      { text: "Car trouble", points: 14, aliases: ["car broke", "flat tire"] },
      { text: "Kids", points: 12, aliases: ["kid", "children"] },
      { text: "Weather", points: 8 }
    ]
  },
  {
    id: "f5",
    prompt: "Name something you take to the beach",
    answers: [
      { text: "Towel", points: 30 },
      { text: "Sunscreen", points: 24, aliases: ["sun block"] },
      { text: "Cooler", points: 14 },
      { text: "Umbrella", points: 12 },
      { text: "Sunglasses", points: 10, aliases: ["shades"] }
    ]
  }
];

/* ---- TYPES --------------------------------------------------------------- */
export type Phase = "lobby" | "writing" | "voting" | "reveal" | "scoreboard" | "gameover";
export type Mode = "classic" | "quiplash" | "trivia" | "picture" | "wheel" | "feud";

export const ALL_MODES: Mode[] = ["classic", "quiplash", "trivia", "picture", "wheel", "feud"];

export type QuipPrompt = {
  id: string;
  text: string;
  writers: [string, string];
  answers: Record<string, string>;
};

export type Player = {
  id: string;
  name: string;
  color: string;
  score: number;
};

// Per-round Trivia state. One question per round; index = state.round - 1.
export type TriviaState = {
  questions: TriviaQuestion[]; // length = totalRounds
  answers: Record<string, { choice: number; at: number }>; // playerId -> answer for current question
};

// Per-round Picture Reveal state. One image per round; index = state.round - 1.
export type PictureState = {
  items: PictureItem[]; // length = totalRounds
  guesses: Record<string, { text: string; at: number; correct: boolean }>;
};

// Per-round Wheel of Fortune state. One puzzle per round.
// Each guessed letter is stamped with the player AND the wedge value they rolled.
export type WheelLetterHit = { playerId: string; value: number };
export const WHEEL_WEDGE_VALUES = [50, 100, 100, 200, 200, 300, 500] as const;
export type WheelState = {
  puzzles: WheelPuzzle[]; // length = totalRounds
  guessedLetters: Record<string, WheelLetterHit>; // letter -> { player, wedge value }
  solved: boolean;
  solverId: string | null;
};

// Per-round Family Feud state. One survey per round.
export type FeudGuessEntry = { text: string; at: number; matchIndex: number | null };
export type FeudState = {
  questions: FeudQuestion[]; // length = totalRounds
  guesses: Record<string, FeudGuessEntry[]>; // playerId -> all attempts this round
};

export type State = {
  phase: Phase;
  roomCode: string;
  players: Record<string, Player>;
  round: number;
  totalRounds: number;
  prompt: string | null;
  usedPrompts: string[];
  answers: Record<string, string>;
  votes: Record<string, string>;
  revealOrder: string[];
  revealIndex: number;
  lastPoints: Record<string, number>;
  phaseDeadline: number | null;
  typing: Record<string, number>;
  mode: Mode;
  quipPrompts: QuipPrompt[];
  quipIndex: number;
  quipVotes: Record<string, Record<string, string>>;
  trivia: TriviaState;
  picture: PictureState;
  wheel: WheelState;
  feud: FeudState;
  _counts?: Record<string, number>;
};

export type Action =
  | { type: "JOIN"; id: string; name: string }
  | { type: "START_GAME" }
  | { type: "SUBMIT_ANSWER"; playerId: string; text: string }
  | { type: "FORCE_VOTING" }
  | { type: "VOTE"; voterId: string; ownerId: string }
  | { type: "FORCE_REVEAL" }
  | { type: "NEXT_REVEAL" }
  | { type: "NEXT_ROUND" }
  | { type: "PLAY_AGAIN" }
  | { type: "RESET" }
  | { type: "TYPING"; playerId: string; at: number }
  | { type: "TOGGLE_MODE" }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SUBMIT_QUIP"; promptId: string; playerId: string; text: string }
  | { type: "VOTE_QUIP"; promptId: string; voterId: string; ownerId: string }
  | { type: "NEXT_QUIP" }
  | { type: "SUBMIT_TRIVIA"; playerId: string; choice: number; at: number }
  | { type: "REQUEST_PICTURE_IMAGE"; itemId: string }
  | { type: "SET_PICTURE_IMAGE"; itemId: string; src: string; revisedPrompt?: string }
  | { type: "SET_PICTURE_IMAGE_ERROR"; itemId: string; error: string }
  | { type: "SUBMIT_PICTURE"; playerId: string; text: string; at: number }
  | { type: "GUESS_LETTER"; playerId: string; letter: string }
  | { type: "SOLVE_WHEEL"; playerId: string; text: string }
  | { type: "SUBMIT_FEUD"; playerId: string; text: string; at: number };

/* ---- HELPERS ------------------------------------------------------------- */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeRoomCode = () =>
  Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

export function pickPrompt(used: string[]): string {
  const pool = PROMPTS.filter((p) => !used.includes(p));
  const src = pool.length ? pool : PROMPTS;
  return src[Math.floor(Math.random() * src.length)];
}

export function pickPrompts(used: string[], n: number): string[] {
  const picked: string[] = [];
  const usedSet = new Set(used);
  const pool = PROMPTS.filter((p) => !usedSet.has(p));
  while (picked.length < n) {
    const src = pool.length ? pool : PROMPTS;
    const choice = src[Math.floor(Math.random() * src.length)];
    if (!picked.includes(choice)) picked.push(choice);
    if (picked.length === PROMPTS.length) break;
  }
  return picked;
}

export function buildQuipPrompts(playerIds: string[], used: string[]): QuipPrompt[] {
  const n = playerIds.length;
  if (n < 3) return [];
  const texts = pickPrompts(used, n);
  return texts.map((text, i) => {
    const a = playerIds[i % n];
    const b = playerIds[(i + 1) % n];
    return {
      id: `q${i}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      writers: [a, b] as [string, string],
      answers: {}
    };
  });
}

export const joinedIds = (s: State) => Object.keys(s.players);
export const deadline = (seconds: number) => Date.now() + seconds * 1000;

export function pickN<T extends { id: string }>(pool: T[], n: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

export function normalizeGuess(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "");
}

export function matchesAnswer(guess: string, answer: string, aliases: string[] = []): boolean {
  const g = normalizeGuess(guess);
  if (!g) return false;
  const targets = [answer, ...aliases].map(normalizeGuess);
  return targets.some((t) => t === g);
}

export function feudMatchIndex(guess: string, q: FeudQuestion): number | null {
  const g = normalizeGuess(guess);
  if (!g) return null;
  for (let i = 0; i < q.answers.length; i++) {
    const a = q.answers[i];
    const targets = [a.text, ...(a.aliases ?? [])].map(normalizeGuess);
    if (targets.some((t) => t === g || t.includes(g) || g.includes(t))) return i;
  }
  return null;
}

export function wheelLettersSpent(state: State, playerId: string): number {
  return Object.values(state.wheel.guessedLetters).filter((h) => h.playerId === playerId).length;
}

export function wheelDisplay(text: string, revealed: Set<string>): string {
  return text
    .split("")
    .map((ch) => (ch === " " || revealed.has(ch.toUpperCase()) || !/[A-Z]/i.test(ch) ? ch : "_"))
    .join("");
}

/* ---- INITIAL STATE ------------------------------------------------------- */
function emptyTrivia(): TriviaState {
  return { questions: [], answers: {} };
}
function emptyPicture(): PictureState {
  return { items: [], guesses: {} };
}
function emptyWheel(): WheelState {
  return { puzzles: [], guessedLetters: {}, solved: false, solverId: null };
}
function emptyFeud(): FeudState {
  return { questions: [], guesses: {} };
}

export function makeInitialState(): State {
  return {
    phase: "lobby",
    roomCode: makeRoomCode(),
    players: {},
    round: 0,
    totalRounds: TOTAL_ROUNDS,
    prompt: null,
    usedPrompts: [],
    answers: {},
    votes: {},
    revealOrder: [],
    revealIndex: 0,
    lastPoints: {},
    phaseDeadline: null,
    typing: {},
    mode: "classic",
    quipPrompts: [],
    quipIndex: 0,
    quipVotes: {},
    trivia: emptyTrivia(),
    picture: emptyPicture(),
    wheel: emptyWheel(),
    feud: emptyFeud()
  };
}

function minPlayers(mode: Mode): number {
  return mode === "quiplash" ? 3 : 2;
}

// Build the writing-phase state for a fresh round of any mode.
function startRound(state: State, roundNum: number): State {
  const ids = joinedIds(state);
  const base = {
    ...state,
    phase: "writing" as Phase,
    round: roundNum,
    answers: {},
    votes: {},
    revealOrder: [],
    revealIndex: 0,
    lastPoints: {},
    typing: {}
  };
  switch (state.mode) {
    case "classic": {
      const prompt = pickPrompt(state.usedPrompts);
      return {
        ...base,
        prompt,
        usedPrompts: [...state.usedPrompts, prompt],
        phaseDeadline: deadline(WRITING_SECONDS)
      };
    }
    case "quiplash": {
      const quipPrompts = buildQuipPrompts(ids, state.usedPrompts);
      return {
        ...base,
        prompt: null,
        usedPrompts: [...state.usedPrompts, ...quipPrompts.map((q) => q.text)],
        phaseDeadline: deadline(WRITING_SECONDS),
        quipPrompts,
        quipIndex: 0,
        quipVotes: {}
      };
    }
    case "trivia": {
      // Pre-pick all questions on round 1; reuse the existing list on later rounds.
      const questions = roundNum === 1
        ? pickN(TRIVIA_QUESTIONS, state.totalRounds)
        : state.trivia.questions;
      return {
        ...base,
        prompt: null,
        phaseDeadline: deadline(TRIVIA_ANSWER_SECONDS),
        trivia: { questions, answers: {} }
      };
    }
    case "picture": {
      const items = roundNum === 1
        ? pickN(PICTURE_ITEMS, state.totalRounds)
        : state.picture.items;
      return {
        ...base,
        prompt: null,
        phaseDeadline: deadline(PICTURE_GUESS_SECONDS),
        picture: { items, guesses: {} }
      };
    }
    case "wheel": {
      const puzzles = roundNum === 1
        ? pickN(WHEEL_PUZZLES, state.totalRounds)
        : state.wheel.puzzles;
      return {
        ...base,
        prompt: null,
        phaseDeadline: deadline(WHEEL_GUESS_SECONDS),
        wheel: { puzzles, guessedLetters: {}, solved: false, solverId: null }
      };
    }
    case "feud": {
      const questions = roundNum === 1
        ? pickN(FEUD_QUESTIONS, state.totalRounds)
        : state.feud.questions;
      return {
        ...base,
        prompt: null,
        phaseDeadline: deadline(FEUD_GUESS_SECONDS),
        feud: { questions, guesses: {} }
      };
    }
  }
}

/* ---- REDUCER ------------------------------------------------------------- */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "JOIN": {
      if (state.phase !== "lobby") return state;
      if (state.players[action.id]) return state;
      const color = COLORS[Object.keys(state.players).length % COLORS.length];
      return {
        ...state,
        players: {
          ...state.players,
          [action.id]: { id: action.id, name: action.name.trim() || "Player", color, score: 0 }
        }
      };
    }

    case "TOGGLE_MODE": {
      if (state.phase !== "lobby") return state;
      return { ...state, mode: state.mode === "classic" ? "quiplash" : "classic" };
    }

    case "SET_MODE": {
      if (state.phase !== "lobby") return state;
      if (!ALL_MODES.includes(action.mode)) return state;
      return { ...state, mode: action.mode };
    }

    case "START_GAME": {
      const ids = joinedIds(state);
      if (ids.length < minPlayers(state.mode)) return state;
      return startRound(state, 1);
    }

    case "SUBMIT_ANSWER": {
      if (state.phase !== "writing") return state;
      if (!state.players[action.playerId]) return state;
      const answers = { ...state.answers, [action.playerId]: action.text.trim() || "(blank)" };
      if (Object.keys(answers).length >= joinedIds(state).length) {
        return { ...state, answers, phase: "voting", votes: {}, phaseDeadline: deadline(VOTING_SECONDS) };
      }
      return { ...state, answers };
    }

    case "FORCE_VOTING": {
      if (state.phase !== "writing") return state;
      if (state.mode === "quiplash") {
        const quipPrompts = state.quipPrompts.map((q) => {
          const answers = { ...q.answers };
          q.writers.forEach((w) => {
            if (!answers[w]) answers[w] = "(no answer)";
          });
          return { ...q, answers };
        });
        return {
          ...state,
          quipPrompts,
          phase: "voting",
          quipIndex: 0,
          quipVotes: {},
          phaseDeadline: deadline(VOTING_SECONDS)
        };
      }
      if (state.mode === "trivia") return tallyTrivia(state);
      if (state.mode === "picture") return tallyPicture(state);
      if (state.mode === "wheel") return tallyWheel(state);
      if (state.mode === "feud") return tallyFeud(state);
      const answers = { ...state.answers };
      joinedIds(state).forEach((id) => {
        if (!answers[id]) answers[id] = "(no answer)";
      });
      return { ...state, answers, phase: "voting", votes: {}, phaseDeadline: deadline(VOTING_SECONDS) };
    }

    case "VOTE": {
      if (state.phase !== "voting") return state;
      if (action.voterId === action.ownerId) return state;
      const votes = { ...state.votes, [action.voterId]: action.ownerId };
      if (Object.keys(votes).length >= joinedIds(state).length) {
        return tally({ ...state, votes });
      }
      return { ...state, votes };
    }

    case "FORCE_REVEAL": {
      if (state.phase !== "voting") return state;
      if (state.mode === "quiplash") return tallyQuip(state);
      return tally(state);
    }

    case "NEXT_REVEAL": {
      if (state.phase !== "reveal") return state;
      const next = state.revealIndex + 1;
      if (next >= state.revealOrder.length) return { ...state, phase: "scoreboard" };
      return { ...state, revealIndex: next };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "scoreboard") return state;
      if (state.round >= state.totalRounds) return { ...state, phase: "gameover", phaseDeadline: null };
      return startRound(state, state.round + 1);
    }

    case "PLAY_AGAIN": {
      const players: Record<string, Player> = {};
      Object.values(state.players).forEach((p) => (players[p.id] = { ...p, score: 0 }));
      return { ...makeInitialState(), roomCode: state.roomCode, players };
    }

    case "RESET":
      return makeInitialState();

    case "TYPING": {
      if (state.phase !== "writing") return state;
      if (!state.players[action.playerId]) return state;
      return { ...state, typing: { ...state.typing, [action.playerId]: action.at } };
    }

    case "SUBMIT_QUIP": {
      if (state.phase !== "writing" || state.mode !== "quiplash") return state;
      const quipPrompts = state.quipPrompts.map((q) => {
        if (q.id !== action.promptId) return q;
        if (!q.writers.includes(action.playerId)) return q;
        return { ...q, answers: { ...q.answers, [action.playerId]: action.text.trim() || "(blank)" } };
      });
      const allLocked = quipPrompts.every((q) => q.writers.every((w) => q.answers[w] != null));
      if (allLocked) {
        return {
          ...state,
          quipPrompts,
          phase: "voting",
          quipIndex: 0,
          quipVotes: {},
          phaseDeadline: deadline(VOTING_SECONDS)
        };
      }
      return { ...state, quipPrompts };
    }

    case "VOTE_QUIP": {
      if (state.phase !== "voting" || state.mode !== "quiplash") return state;
      const prompt = state.quipPrompts[state.quipIndex];
      if (!prompt || prompt.id !== action.promptId) return state;
      if (prompt.writers.includes(action.voterId)) return state;
      if (!prompt.writers.includes(action.ownerId)) return state;
      const promptVotes = { ...(state.quipVotes[prompt.id] ?? {}), [action.voterId]: action.ownerId };
      const quipVotes = { ...state.quipVotes, [prompt.id]: promptVotes };
      const eligible = joinedIds(state).filter((id) => !prompt.writers.includes(id));
      const allVoted = eligible.every((id) => promptVotes[id] != null);
      if (!allVoted) return { ...state, quipVotes };
      const nextIdx = state.quipIndex + 1;
      if (nextIdx < state.quipPrompts.length) {
        return {
          ...state,
          quipVotes,
          quipIndex: nextIdx,
          phaseDeadline: deadline(VOTING_SECONDS)
        };
      }
      return tallyQuip({ ...state, quipVotes });
    }

    case "NEXT_QUIP": {
      if (state.mode !== "quiplash") return state;
      if (state.phase === "voting") {
        const nextIdx = state.quipIndex + 1;
        if (nextIdx < state.quipPrompts.length) {
          return { ...state, quipIndex: nextIdx, phaseDeadline: deadline(VOTING_SECONDS) };
        }
        return tallyQuip(state);
      }
      if (state.phase === "reveal") {
        const nextIdx = state.quipIndex + 1;
        if (nextIdx < state.quipPrompts.length) {
          return { ...state, quipIndex: nextIdx };
        }
        return { ...state, phase: "scoreboard" };
      }
      return state;
    }

    case "SUBMIT_TRIVIA": {
      if (state.phase !== "writing" || state.mode !== "trivia") return state;
      if (!state.players[action.playerId]) return state;
      if (state.trivia.answers[action.playerId]) return state;
      const answers = {
        ...state.trivia.answers,
        [action.playerId]: { choice: action.choice, at: action.at }
      };
      const next = { ...state, trivia: { ...state.trivia, answers } };
      if (Object.keys(answers).length >= joinedIds(state).length) {
        return tallyTrivia(next);
      }
      return next;
    }

    case "REQUEST_PICTURE_IMAGE": {
      if (state.phase !== "writing" || state.mode !== "picture") return state;
      const index = state.round - 1;
      const item = state.picture.items[index];
      if (!item || item.id !== action.itemId) return state;
      if (item.generatedSrc || item.imageStatus === "generating" || item.imageStatus === "ready") return state;
      const items = state.picture.items.map((pic, i) =>
        i === index ? { ...pic, imageStatus: "generating" as const, imageError: undefined } : pic
      );
      return { ...state, picture: { ...state.picture, items } };
    }

    case "SET_PICTURE_IMAGE": {
      if (state.mode !== "picture") return state;
      const index = state.round - 1;
      const item = state.picture.items[index];
      if (!item || item.id !== action.itemId) return state;
      const items = state.picture.items.map((pic, i) =>
        i === index
          ? {
              ...pic,
              generatedSrc: action.src,
              imageStatus: "ready" as const,
              imageError: undefined,
              imagePrompt: action.revisedPrompt ?? pic.imagePrompt
            }
          : pic
      );
      return { ...state, picture: { ...state.picture, items } };
    }

    case "SET_PICTURE_IMAGE_ERROR": {
      if (state.mode !== "picture") return state;
      const index = state.round - 1;
      const item = state.picture.items[index];
      if (!item || item.id !== action.itemId) return state;
      const items = state.picture.items.map((pic, i) =>
        i === index
          ? {
              ...pic,
              imageStatus: "error" as const,
              imageError: action.error.slice(0, 160)
            }
          : pic
      );
      return { ...state, picture: { ...state.picture, items } };
    }

    case "SUBMIT_PICTURE": {
      if (state.phase !== "writing" || state.mode !== "picture") return state;
      if (!state.players[action.playerId]) return state;
      if (state.picture.guesses[action.playerId]?.correct) return state;
      const item = state.picture.items[state.round - 1];
      if (!item) return state;
      const correct = matchesAnswer(action.text, item.answer, item.aliases);
      const guesses = {
        ...state.picture.guesses,
        [action.playerId]: { text: action.text.trim(), at: action.at, correct }
      };
      const next = { ...state, picture: { ...state.picture, guesses } };
      const allCorrect = joinedIds(state).every((id) => guesses[id]?.correct);
      if (allCorrect) return tallyPicture(next);
      return next;
    }

    case "GUESS_LETTER": {
      if (state.phase !== "writing" || state.mode !== "wheel") return state;
      if (!state.players[action.playerId]) return state;
      if (state.wheel.solved) return state;
      const letter = (action.letter || "").toUpperCase().slice(0, 1);
      if (!letter || !/[A-Z]/.test(letter)) return state;
      if (state.wheel.guessedLetters[letter]) return state;
      // Enforce per-player letter budget so the early-game can't be over in 5 taps.
      const spent = Object.values(state.wheel.guessedLetters).filter(
        (h) => h.playerId === action.playerId
      ).length;
      if (spent >= WHEEL_LETTER_BUDGET) return state;
      const value = WHEEL_WEDGE_VALUES[Math.floor(Math.random() * WHEEL_WEDGE_VALUES.length)];
      const guessedLetters = {
        ...state.wheel.guessedLetters,
        [letter]: { playerId: action.playerId, value }
      };
      return { ...state, wheel: { ...state.wheel, guessedLetters } };
    }

    case "SOLVE_WHEEL": {
      if (state.phase !== "writing" || state.mode !== "wheel") return state;
      if (!state.players[action.playerId]) return state;
      if (state.wheel.solved) return state;
      const puzzle = state.wheel.puzzles[state.round - 1];
      if (!puzzle) return state;
      if (normalizeGuess(action.text) !== normalizeGuess(puzzle.text)) return state;
      const next = {
        ...state,
        wheel: { ...state.wheel, solved: true, solverId: action.playerId }
      };
      return tallyWheel(next);
    }

    case "SUBMIT_FEUD": {
      if (state.phase !== "writing" || state.mode !== "feud") return state;
      if (!state.players[action.playerId]) return state;
      const q = state.feud.questions[state.round - 1];
      if (!q) return state;
      const normalized = normalizeGuess(action.text);
      if (!normalized) return state;
      const myPrior = state.feud.guesses[action.playerId] ?? [];
      // Block the exact same guess being submitted twice by the same player.
      if (myPrior.some((g) => normalizeGuess(g.text) === normalized)) return state;
      const matchIndex = feudMatchIndex(action.text, q);
      const entry: FeudGuessEntry = { text: action.text.trim(), at: action.at, matchIndex };
      const guesses = { ...state.feud.guesses, [action.playerId]: [...myPrior, entry] };
      const next = { ...state, feud: { ...state.feud, guesses } };
      // End the round early once every survey answer has been hit by someone.
      const hitSet = new Set<number>();
      Object.values(guesses).forEach((arr) =>
        arr.forEach((g) => {
          if (g.matchIndex != null) hitSet.add(g.matchIndex);
        })
      );
      if (hitSet.size >= q.answers.length) return tallyFeud(next);
      return next;
    }

    default:
      return state;
  }
}

function tallyQuip(state: State): State {
  const counts: Record<string, number> = {};
  joinedIds(state).forEach((id) => (counts[id] = 0));
  state.quipPrompts.forEach((q) => {
    const promptVotes = state.quipVotes[q.id] ?? {};
    Object.values(promptVotes).forEach((ownerId) => {
      if (counts[ownerId] != null) counts[ownerId] += 1;
    });
  });
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    const pts = counts[p.id] * POINTS_PER_VOTE;
    lastPoints[p.id] = pts;
    players[p.id] = { ...p, score: p.score + pts };
  });
  return {
    ...state,
    players,
    lastPoints,
    phase: "reveal",
    quipIndex: 0,
    phaseDeadline: null,
    _counts: counts
  };
}

function tally(state: State): State {
  const counts: Record<string, number> = {};
  joinedIds(state).forEach((id) => (counts[id] = 0));
  Object.values(state.votes).forEach((ownerId) => {
    if (counts[ownerId] != null) counts[ownerId] += 1;
  });
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    const pts = counts[p.id] * POINTS_PER_VOTE;
    lastPoints[p.id] = pts;
    players[p.id] = { ...p, score: p.score + pts };
  });
  const order = Object.keys(state.answers).sort((a, b) => counts[a] - counts[b]);
  return {
    ...state,
    players,
    lastPoints,
    revealOrder: order,
    revealIndex: 0,
    phase: "reveal",
    phaseDeadline: null,
    _counts: counts
  };
}

function tallyTrivia(state: State): State {
  const q = state.trivia.questions[state.round - 1];
  if (!q) return { ...state, phase: "reveal", phaseDeadline: null };
  const startedAt = (state.phaseDeadline ?? Date.now()) - TRIVIA_ANSWER_SECONDS * 1000;
  const totalMs = TRIVIA_ANSWER_SECONDS * 1000;
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    const a = state.trivia.answers[p.id];
    let pts = 0;
    if (a && a.choice === q.correctIndex) {
      const elapsed = Math.max(0, Math.min(totalMs, a.at - startedAt));
      const speedFrac = 1 - elapsed / totalMs;
      pts = TRIVIA_BASE_POINTS + Math.round(TRIVIA_SPEED_BONUS_MAX * speedFrac);
    }
    lastPoints[p.id] = pts;
    players[p.id] = { ...p, score: p.score + pts };
  });
  return {
    ...state,
    players,
    lastPoints,
    phase: "reveal",
    phaseDeadline: null
  };
}

function tallyPicture(state: State): State {
  const item = state.picture.items[state.round - 1];
  if (!item) return { ...state, phase: "reveal", phaseDeadline: null };
  // Earlier correct guesses get more points; rank correct guessers by `at`.
  const correctEntries = Object.entries(state.picture.guesses)
    .filter(([, g]) => g.correct)
    .sort((a, b) => a[1].at - b[1].at);
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => (lastPoints[p.id] = 0));
  correctEntries.forEach(([pid], rank) => {
    const pts = Math.max(50, PICTURE_BASE_POINTS - rank * 30);
    lastPoints[pid] = pts;
  });
  Object.values(state.players).forEach((p) => {
    players[p.id] = { ...p, score: p.score + (lastPoints[p.id] ?? 0) };
  });
  return {
    ...state,
    players,
    lastPoints,
    phase: "reveal",
    phaseDeadline: null
  };
}

function tallyWheel(state: State): State {
  const puzzle = state.wheel.puzzles[state.round - 1];
  if (!puzzle) return { ...state, phase: "reveal", phaseDeadline: null };
  // Count, per player, how many letters in the puzzle that player revealed,
  // each scored by the wedge value they rolled when guessing it.
  const letterCounts: Record<string, number> = {};
  for (const ch of puzzle.text.toUpperCase()) {
    if (/[A-Z]/.test(ch)) letterCounts[ch] = (letterCounts[ch] ?? 0) + 1;
  }
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => (lastPoints[p.id] = 0));
  Object.entries(state.wheel.guessedLetters).forEach(([letter, hit]) => {
    const occurrences = letterCounts[letter] ?? 0;
    if (occurrences > 0 && lastPoints[hit.playerId] != null) {
      lastPoints[hit.playerId] += occurrences * hit.value;
    }
  });
  if (state.wheel.solverId && lastPoints[state.wheel.solverId] != null) {
    lastPoints[state.wheel.solverId] += WHEEL_SOLVE_BONUS;
  }
  Object.values(state.players).forEach((p) => {
    players[p.id] = { ...p, score: p.score + (lastPoints[p.id] ?? 0) };
  });
  return {
    ...state,
    players,
    lastPoints,
    phase: "reveal",
    phaseDeadline: null
  };
}

function tallyFeud(state: State): State {
  const q = state.feud.questions[state.round - 1];
  if (!q) return { ...state, phase: "reveal", phaseDeadline: null };
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    const myGuesses = state.feud.guesses[p.id] ?? [];
    const matched = new Set<number>();
    myGuesses.forEach((g) => {
      if (g.matchIndex != null) matched.add(g.matchIndex);
    });
    let pts = 0;
    matched.forEach((idx) => {
      pts += q.answers[idx].points;
      if (idx === 0) pts += FEUD_TOP_BONUS;
    });
    lastPoints[p.id] = pts;
    players[p.id] = { ...p, score: p.score + pts };
  });
  return {
    ...state,
    players,
    lastPoints,
    phase: "reveal",
    phaseDeadline: null
  };
}
