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
export const PICTURE_GUESS_SECONDS = 40;
export const PICTURE_BASE_POINTS = 150;

// Wheel of Fortune
export const WHEEL_GUESS_SECONDS = 65;
export const WHEEL_SOLVE_BONUS = 200;
export const WHEEL_LETTER_BUDGET = 3; // letters each player may reveal per round

// Family Feud
export const FEUD_GUESS_SECONDS = 75;

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
  "What's playing on the radio in the elevator to hell",
  "The least convincing thing to say when caught sneaking around",
  "A terrible alias for a jewel thief",
  "The worst place to hide a secret map",
  "What the detective found in the suspect's glove box",
  "A rejected slogan for a very suspicious locksmith",
  "The fake excuse that absolutely no one believed",
  "What was really inside the mysterious envelope",
  "The oddest thing to find taped under a table",
  "A password only a terrible spy would use",
  "What the lookout whispered into the walkie-talkie",
  "The most suspicious thing to bring to a dinner party",
  "A clue that would ruin the whole mystery immediately",
  "What the villain wrote in their diary by accident",
  "A bad name for a neighborhood watch group",
  "The weirdest thing on the security camera footage",
  "A disguise that fooled exactly nobody",
  "The real reason someone wore sunglasses indoors",
  "What the getaway driver forgot to do",
  "A phrase you should never say in an interrogation room",
  "The least intimidating secret society password",
  "A ridiculous item in a spy's emergency kit",
  "The worst possible code name for a mission",
  "What the suspect claims is totally normal to keep in a freezer",
  "The most suspicious thing to label 'not evidence'",
  "A bad place to stash stolen snacks",
  "What the witness was too embarrassed to admit",
  "A rejected title for a true crime podcast",
  "The object that somehow became Exhibit A",
  "What the butler was doing when nobody was looking",
  "A clue found in the office fridge",
  "A terrible way to blend into a crowd",
  "What the villain practiced saying in the mirror",
  "The worst thing to accidentally text the group chat",
  "A strange rule at detective summer camp",
  "The secret hidden in grandma's cookie tin",
  "A suspiciously specific thing to say at breakfast",
  "What the safe combination probably should not be",
  "The strangest thing found in a coat pocket",
  "A bad excuse for having glitter on your shoes",
  "What the mysterious note said after autocorrect ruined it",
  "A terrible hiding place during a stakeout",
  "The clue everyone ignored because it was too obvious",
  "A new app designed only for suspicious people",
  "What the rival detective keeps in their desk drawer",
  "The worst possible thing to shout during a quiet mission",
  "A fake job title for someone clearly up to something",
  "The secret ingredient in a very suspicious casserole",
  "A reason the case board has too much string",
  "What the decoy briefcase actually contained",
  "A thing no innocent person would say twice"
];

export const COLORS = [
  "#C89B5A", "#7FA16B", "#B46A4C", "#6F8F87",
  "#A88B55", "#8B6F47", "#7D8F5B", "#A76D64"
];
export const DEFAULT_PLAYER_AVATAR = "01-victoria";
export function normalizeAvatarId(avatar?: string | null): string {
  const cleaned = avatar
    ?.trim()
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/\.(webp|png|jpg|jpeg)$/i, "")
    .slice(0, 32);
  return cleaned || DEFAULT_PLAYER_AVATAR;
}

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
  { id: "t75", category: "Music", text: "What instrument does Yo-Yo Ma famously play?", choices: ["Violin", "Cello", "Piano", "Flute"], correctIndex: 1 },
  { id: "t76", category: "Mystery", text: "What is the name for a false clue meant to mislead readers?", choices: ["Cold open", "Red herring", "Plot armor", "MacGuffin"], correctIndex: 1 },
  { id: "t77", category: "Mystery", text: "In detective stories, what does an alibi prove?", choices: ["Motive", "Opportunity", "Someone was elsewhere", "The case is closed"], correctIndex: 2 },
  { id: "t78", category: "Mystery", text: "What is a 'whodunit'?", choices: ["A mystery about who committed the crime", "A courtroom transcript", "A spy gadget", "A police radio code"], correctIndex: 0 },
  { id: "t79", category: "Spycraft", text: "What does a decoy do?", choices: ["Locks a vault", "Distracts or misleads", "Records fingerprints", "Counts money"], correctIndex: 1 },
  { id: "t80", category: "Spycraft", text: "What is invisible ink traditionally used for?", choices: ["Secret messages", "Fake money", "Fingerprinting", "Lock picking"], correctIndex: 0 },
  { id: "t81", category: "Crime Terms", text: "What is a person who helps commit a crime called?", choices: ["Archivist", "Accomplice", "Bailiff", "Curator"], correctIndex: 1 },
  { id: "t82", category: "Crime Terms", text: "What does 'motive' mean in an investigation?", choices: ["A getaway car", "A reason for doing it", "A signed confession", "A witness statement"], correctIndex: 1 },
  { id: "t83", category: "Crime Terms", text: "What does 'surveillance' mean?", choices: ["Watching or monitoring", "Burning evidence", "Making a disguise", "Writing a ransom note"], correctIndex: 0 },
  { id: "t84", category: "Mystery", text: "Which board game asks players to solve a murder using rooms, weapons, and suspects?", choices: ["Risk", "Clue", "Sorry", "Trouble"], correctIndex: 1 },
  { id: "t85", category: "Heists", text: "What is a vault mainly designed to protect?", choices: ["Valuables", "Pets", "Plants", "Rainwater"], correctIndex: 0 },
  { id: "t86", category: "Heists", text: "What is another word for a getaway route?", choices: ["Escape route", "Table read", "Sound check", "Receipt"], correctIndex: 0 },
  { id: "t87", category: "Mystery", text: "What does a detective usually collect at a scene?", choices: ["Evidence", "Souvenirs", "Coupons", "Wallpaper"], correctIndex: 0 },
  { id: "t88", category: "Spycraft", text: "What is a code phrase?", choices: ["A secret agreed-upon message", "A typo", "A public headline", "A parking ticket"], correctIndex: 0 },
  { id: "t89", category: "Disguises", text: "Which item is most commonly used as a quick disguise in cartoons?", choices: ["Fake mustache", "Waffle iron", "Tennis racket", "Garden hose"], correctIndex: 0 },
  { id: "t90", category: "Crime Terms", text: "What is a witness?", choices: ["Someone who saw or heard something", "A locked safe", "A fake ID", "A police car"], correctIndex: 0 },
  { id: "t91", category: "Mystery", text: "What does 'case closed' mean?", choices: ["The mystery is solved", "The door is locked", "The suspect escaped", "The clues were lost"], correctIndex: 0 },
  { id: "t92", category: "Heists", text: "In a heist story, what is the 'score'?", choices: ["The target prize", "The soundtrack", "The lunch order", "The weather"], correctIndex: 0 },
  { id: "t93", category: "Spycraft", text: "What is a safe house?", choices: ["A secret protected location", "A bank lobby", "A house made of steel", "A courtroom"], correctIndex: 0 },
  { id: "t94", category: "Mystery", text: "What is a clue?", choices: ["Information that helps solve something", "A costume", "A trophy", "A random guess"], correctIndex: 0 },
  { id: "t95", category: "Crime Terms", text: "What does 'interrogate' mean?", choices: ["Question someone closely", "Hide a wallet", "Draw a map", "Unlock a phone"], correctIndex: 0 },
  { id: "t96", category: "Disguises", text: "What accessory is often used to hide someone's face?", choices: ["Mask", "Apron", "Scarf ring", "Belt"], correctIndex: 0 },
  { id: "t97", category: "Spycraft", text: "What is a cipher used for?", choices: ["Encoding messages", "Cooking soup", "Measuring shoes", "Printing photos"], correctIndex: 0 },
  { id: "t98", category: "Mystery", text: "What is the final reveal in many mysteries called?", choices: ["The solution", "The warm-up", "The receipt", "The rehearsal"], correctIndex: 0 },
  { id: "t99", category: "Heists", text: "What role watches for trouble during a sneaky plan?", choices: ["Lookout", "Decorator", "Referee", "Barista"], correctIndex: 0 },
  { id: "t100", category: "Crime Terms", text: "What does 'evidence' help prove?", choices: ["What happened", "Who is tallest", "The price of gas", "The weather forecast"], correctIndex: 0 },
  { id: "t101", category: "Mystery", text: "What is a suspect?", choices: ["Someone thought to be involved", "A judge's desk", "A type of map", "A locked drawer"], correctIndex: 0 },
  { id: "t102", category: "Spycraft", text: "What is a dead drop?", choices: ["A secret place to leave items", "A broken elevator", "A dance move", "A weather report"], correctIndex: 0 },
  { id: "t103", category: "Heists", text: "Which tool is used to see tiny details?", choices: ["Magnifying glass", "Hammer", "Compass", "Ladle"], correctIndex: 0 },
  { id: "t104", category: "Disguises", text: "What does it mean to go undercover?", choices: ["Hide your real identity", "Take a nap", "Stand under a blanket", "Lose a game"], correctIndex: 0 },
  { id: "t105", category: "Mystery", text: "Which phrase means someone is not telling the truth?", choices: ["Lying", "Bookmarking", "Polishing", "Forecasting"], correctIndex: 0 },
  { id: "t106", category: "Crime Terms", text: "What is a confession?", choices: ["Admitting what happened", "A secret door", "A fake mustache", "A police badge"], correctIndex: 0 },
  { id: "t107", category: "Spycraft", text: "What does a wiretap listen to?", choices: ["Conversations", "Footprints", "Fingerprints", "Paint colors"], correctIndex: 0 },
  { id: "t108", category: "Mystery", text: "What is the person solving a mystery often called?", choices: ["Detective", "Goalkeeper", "Pilot", "Chef"], correctIndex: 0 },
  { id: "t109", category: "Heists", text: "What is a getaway car used for?", choices: ["Escaping quickly", "Delivering mail", "Teaching math", "Selling popcorn"], correctIndex: 0 },
  { id: "t110", category: "Crime Terms", text: "What is a fingerprint?", choices: ["A unique mark from a finger", "A secret password", "A kind of trophy", "A map symbol"], correctIndex: 0 }
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
  },
  {
    id: "p6",
    answer: "hamburger",
    aliases: ["burger", "cheeseburger"],
    hint: "Cookout food",
    imagePrompt: "A dramatic close-up food photograph of a juicy hamburger on a dark plate, sharp centered subject, no text."
  },
  {
    id: "p7",
    answer: "basketball",
    aliases: ["basket ball"],
    hint: "Orange game ball",
    imagePrompt: "A polished sports photograph of a basketball on a hardwood court under arena lights, no logos, no text."
  },
  {
    id: "p8",
    answer: "fire truck",
    aliases: ["firetruck", "fire engine"],
    hint: "Emergency vehicle",
    imagePrompt: "A clean cinematic photograph of a red fire truck parked outside a station, recognizable shape, no words or markings."
  },
  {
    id: "p9",
    answer: "snowman",
    aliases: ["snow man"],
    hint: "Winter friend",
    imagePrompt: "A charming winter photograph of a snowman in fresh snow with a simple scarf, centered, no text."
  },
  {
    id: "p10",
    answer: "dinosaur",
    aliases: ["t rex", "trex", "tyrannosaurus"],
    hint: "Ancient creature",
    imagePrompt: "A cinematic museum-style image of a dinosaur silhouette in misty jungle light, recognizable, no text."
  },
  {
    id: "p11",
    answer: "cupcake",
    aliases: ["cup cake"],
    hint: "Small dessert",
    imagePrompt: "A bright bakery photograph of a frosted cupcake with sprinkles on a simple counter, no text."
  },
  {
    id: "p12",
    answer: "roller coaster",
    aliases: ["rollercoaster"],
    hint: "Theme park ride",
    imagePrompt: "A vivid amusement park photograph of a roller coaster track with a car cresting a hill, no signs or text."
  },
  {
    id: "p13",
    answer: "pineapple",
    hint: "Tropical fruit",
    imagePrompt: "A sharp studio photograph of a whole pineapple on a colorful table, high contrast, no text."
  },
  {
    id: "p14",
    answer: "submarine",
    hint: "Underwater vehicle",
    imagePrompt: "A cinematic underwater scene with a yellow submarine clearly visible in blue water, no text."
  },
  {
    id: "p15",
    answer: "taco",
    hint: "Folded food",
    imagePrompt: "A mouthwatering food photograph of a taco with colorful toppings on a dark table, centered, no text."
  },
  {
    id: "p16",
    answer: "magnifying glass",
    aliases: ["magnifier"],
    hint: "Detective tool",
    imagePrompt: "A cinematic close-up photograph of a brass magnifying glass on a dark wooden desk with moody detective lighting, no text."
  },
  {
    id: "p17",
    answer: "fingerprint",
    aliases: ["finger print"],
    hint: "Tiny identity clue",
    imagePrompt: "A dramatic forensic photograph of a large visible fingerprint dusted in powder on black glass, centered, no text."
  },
  {
    id: "p18",
    answer: "mask",
    aliases: ["disguise mask"],
    hint: "Face cover",
    imagePrompt: "A glossy theatrical disguise mask on a velvet table under a spotlight, mysterious but clear, no text."
  },
  {
    id: "p19",
    answer: "vault",
    aliases: ["safe", "bank vault"],
    hint: "Locked treasure room",
    imagePrompt: "A cinematic photograph of a heavy round bank vault door slightly open, dramatic gold and green lighting, no text."
  },
  {
    id: "p20",
    answer: "envelope",
    aliases: ["sealed envelope", "letter"],
    hint: "Secret message",
    imagePrompt: "A sealed cream envelope with a wax seal on a dark desk, moody mystery lighting, no writing or text."
  },
  {
    id: "p21",
    answer: "flashlight",
    aliases: ["torch"],
    hint: "Beam in the dark",
    imagePrompt: "A flashlight shining a bright cone of light across a dark evidence room, object clearly visible, no text."
  },
  {
    id: "p22",
    answer: "briefcase",
    aliases: ["case"],
    hint: "Carry the score",
    imagePrompt: "A black leather briefcase on a table with dramatic shadows and golden rim light, no logos, no text."
  },
  {
    id: "p23",
    answer: "walkie talkie",
    aliases: ["radio", "walkie-talkie"],
    hint: "Lookout tool",
    imagePrompt: "A realistic walkie talkie radio lying on a dark desk beside scattered clue photos, no visible words."
  },
  {
    id: "p24",
    answer: "key",
    aliases: ["gold key", "skeleton key"],
    hint: "Unlocks trouble",
    imagePrompt: "A vintage brass key on a dark green felt surface under a small spotlight, sharp centered object, no text."
  },
  {
    id: "p25",
    answer: "footprint",
    aliases: ["shoe print", "shoeprint"],
    hint: "Trail on the floor",
    imagePrompt: "A muddy shoe footprint on a polished floor photographed like forensic evidence, clear shape, no text."
  },
  {
    id: "p26",
    answer: "camera",
    aliases: ["security camera"],
    hint: "Caught on film",
    imagePrompt: "A security camera mounted in a dim hallway with cinematic lighting, recognizable object, no text."
  },
  {
    id: "p27",
    answer: "dice",
    aliases: ["pair of dice"],
    hint: "Risky roll",
    imagePrompt: "Two white dice on a dark game table with dramatic green and gold lighting, no text."
  },
  {
    id: "p28",
    answer: "lock",
    aliases: ["padlock"],
    hint: "Needs a key",
    imagePrompt: "A heavy brass padlock on an old wooden box with dramatic detective lighting, centered, no text."
  },
  {
    id: "p29",
    answer: "rope",
    aliases: ["string", "cord"],
    hint: "Tied clue",
    imagePrompt: "A coil of rope on a dark table with evidence-board style lighting, clean centered subject, no text."
  },
  {
    id: "p30",
    answer: "gemstone",
    aliases: ["jewel", "diamond", "gem"],
    hint: "Shiny target",
    imagePrompt: "A sparkling gemstone on black velvet under a spotlight, luxury heist style, no text."
  },
  {
    id: "p31",
    answer: "getaway car",
    aliases: ["car"],
    hint: "Fast escape",
    imagePrompt: "A sleek car parked in a rainy alley under dramatic streetlight, cinematic heist mood, no license text."
  },
  {
    id: "p32",
    answer: "newspaper",
    aliases: ["paper"],
    hint: "Morning headline",
    imagePrompt: "A folded old newspaper on a detective desk with visible columns but no readable text, moody lighting."
  },
  {
    id: "p33",
    answer: "compass",
    hint: "Find the route",
    imagePrompt: "A brass compass on an old map-style background with no readable labels, adventure mystery lighting."
  },
  {
    id: "p34",
    answer: "binoculars",
    aliases: ["field glasses"],
    hint: "Stakeout view",
    imagePrompt: "A pair of black binoculars on a rooftop ledge at night, clear centered object, no text."
  },
  {
    id: "p35",
    answer: "crowbar",
    aliases: ["pry bar"],
    hint: "Forceful tool",
    imagePrompt: "A metal crowbar on a concrete floor under a single harsh spotlight, clear object, no text."
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
  { id: "w8", category: "Book", text: "TO KILL A MOCKINGBIRD" },
  { id: "w9", category: "Phrase", text: "BITE THE BULLET" },
  { id: "w10", category: "Food", text: "CHICKEN AND WAFFLES" },
  { id: "w11", category: "Place", text: "GRAND CANYON" },
  { id: "w12", category: "Thing", text: "REMOTE CONTROL" },
  { id: "w13", category: "Person", text: "TAYLOR SWIFT" },
  { id: "w14", category: "Phrase", text: "HIT THE ROAD" },
  { id: "w15", category: "Movie", text: "JURASSIC PARK" },
  { id: "w16", category: "Thing", text: "BIRTHDAY CAKE" },
  { id: "w17", category: "Place", text: "LAS VEGAS" },
  { id: "w18", category: "Phrase", text: "UNDER PRESSURE" },
  { id: "w19", category: "Food", text: "MACARONI AND CHEESE" },
  { id: "w20", category: "Thing", text: "SUNGLASSES" },
  { id: "w21", category: "Hoodwinked", text: "TRUST NO ONE" },
  { id: "w22", category: "Hoodwinked", text: "FOLLOW THE CLUES" },
  { id: "w23", category: "Hoodwinked", text: "THE PLOT THICKENS" },
  { id: "w24", category: "Hoodwinked", text: "CAUGHT RED HANDED" },
  { id: "w25", category: "Hoodwinked", text: "UNDERCOVER OPERATION" },
  { id: "w26", category: "Hoodwinked", text: "THE GETAWAY CAR" },
  { id: "w27", category: "Hoodwinked", text: "SECRET PASSAGE" },
  { id: "w28", category: "Hoodwinked", text: "HIDDEN IN PLAIN SIGHT" },
  { id: "w29", category: "Hoodwinked", text: "THE PERFECT ALIBI" },
  { id: "w30", category: "Hoodwinked", text: "A CASE OF MISTAKEN IDENTITY" },
  { id: "w31", category: "Hoodwinked", text: "SMOKE AND MIRRORS" },
  { id: "w32", category: "Hoodwinked", text: "THE INSIDE JOB" },
  { id: "w33", category: "Hoodwinked", text: "ONE LAST CLUE" },
  { id: "w34", category: "Hoodwinked", text: "THE SECRET CODE" },
  { id: "w35", category: "Hoodwinked", text: "BEHIND THE MASK" },
  { id: "w36", category: "Hoodwinked", text: "NO LOOSE ENDS" },
  { id: "w37", category: "Hoodwinked", text: "QUESTION EVERYTHING" },
  { id: "w38", category: "Hoodwinked", text: "THE FALSE LEAD" },
  { id: "w39", category: "Hoodwinked", text: "THE FINAL REVEAL" },
  { id: "w40", category: "Hoodwinked", text: "CASE CLOSED" },
  { id: "w41", category: "Hoodwinked", text: "WATCH YOUR BACK" },
  { id: "w42", category: "Hoodwinked", text: "THE MISSING PIECE" },
  { id: "w43", category: "Hoodwinked", text: "KEEP A STRAIGHT FACE" },
  { id: "w44", category: "Hoodwinked", text: "READ THE ROOM" },
  { id: "w45", category: "Hoodwinked", text: "THE LOOKOUT" },
  { id: "w46", category: "Hoodwinked", text: "A SUSPICIOUS PACKAGE" },
  { id: "w47", category: "Hoodwinked", text: "THE MASTER PLAN" },
  { id: "w48", category: "Hoodwinked", text: "THE DECOY" },
  { id: "w49", category: "Hoodwinked", text: "SLIP THROUGH THE CRACKS" },
  { id: "w50", category: "Hoodwinked", text: "FOOL THE ROOM" }
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
  },
  {
    id: "f6",
    prompt: "Name something people forget when leaving the house",
    answers: [
      { text: "Keys", points: 34, aliases: ["car keys", "house keys"] },
      { text: "Phone", points: 28, aliases: ["cell phone"] },
      { text: "Wallet", points: 18, aliases: ["purse"] },
      { text: "Lunch", points: 10 },
      { text: "Glasses", points: 8, aliases: ["sunglasses"] }
    ]
  },
  {
    id: "f7",
    prompt: "Name something you do at a wedding",
    answers: [
      { text: "Dance", points: 30 },
      { text: "Eat", points: 24, aliases: ["dinner", "meal"] },
      { text: "Take pictures", points: 18, aliases: ["photos", "pictures"] },
      { text: "Cry", points: 12 },
      { text: "Toast", points: 9, aliases: ["speech"] }
    ]
  },
  {
    id: "f8",
    prompt: "Name something kids hide from their parents",
    answers: [
      { text: "Bad grades", points: 30, aliases: ["grades", "report card"] },
      { text: "Candy", points: 22, aliases: ["sweets"] },
      { text: "Broken things", points: 18, aliases: ["broken vase", "mess"] },
      { text: "Phone", points: 12 },
      { text: "Money", points: 8 }
    ]
  },
  {
    id: "f9",
    prompt: "Name something you hear at a baseball game",
    answers: [
      { text: "Cheering", points: 30, aliases: ["cheers", "crowd"] },
      { text: "Crack of the bat", points: 22, aliases: ["bat", "hit"] },
      { text: "Umpire", points: 18, aliases: ["you're out", "out"] },
      { text: "Organ music", points: 12, aliases: ["music"] },
      { text: "Hot dog vendor", points: 8, aliases: ["vendor"] }
    ]
  },
  {
    id: "f10",
    prompt: "Name something that makes people scream",
    answers: [
      { text: "Spider", points: 28, aliases: ["bug"] },
      { text: "Scary movie", points: 24, aliases: ["horror movie"] },
      { text: "Roller coaster", points: 20 },
      { text: "Surprise", points: 14 },
      { text: "Mouse", points: 8 }
    ]
  },
  {
    id: "f11",
    prompt: "Name something you put on a hot dog",
    answers: [
      { text: "Ketchup", points: 30, aliases: ["catsup"] },
      { text: "Mustard", points: 28 },
      { text: "Relish", points: 14 },
      { text: "Onions", points: 12, aliases: ["onion"] },
      { text: "Chili", points: 10 }
    ]
  },
  {
    id: "f12",
    prompt: "Name something people do on New Year's Eve",
    answers: [
      { text: "Watch fireworks", points: 30, aliases: ["fireworks"] },
      { text: "Kiss", points: 22 },
      { text: "Count down", points: 20, aliases: ["countdown"] },
      { text: "Party", points: 16 },
      { text: "Make resolutions", points: 8, aliases: ["resolution"] }
    ]
  },
  {
    id: "f13",
    prompt: "Name a place people fall asleep by accident",
    answers: [
      { text: "Couch", points: 32, aliases: ["sofa"] },
      { text: "Car", points: 20 },
      { text: "Class", points: 16, aliases: ["school"] },
      { text: "Movie theater", points: 12, aliases: ["movies"] },
      { text: "Church", points: 8 }
    ]
  },
  {
    id: "f14",
    prompt: "Name something you do when your phone battery is low",
    answers: [
      { text: "Charge it", points: 40, aliases: ["plug it in", "charger"] },
      { text: "Turn on low power mode", points: 18, aliases: ["battery saver"] },
      { text: "Close apps", points: 14 },
      { text: "Panic", points: 12 },
      { text: "Borrow a charger", points: 8 }
    ]
  },
  {
    id: "f15",
    prompt: "Name something you might find in a junk drawer",
    answers: [
      { text: "Batteries", points: 28, aliases: ["battery"] },
      { text: "Rubber bands", points: 20, aliases: ["rubber band"] },
      { text: "Pens", points: 18, aliases: ["pen", "pencil"] },
      { text: "Keys", points: 14 },
      { text: "Tape", points: 10 }
    ]
  },
  {
    id: "f16",
    prompt: "Name something people do while waiting in line",
    answers: [
      { text: "Check phone", points: 36, aliases: ["phone", "scroll"] },
      { text: "Talk", points: 18, aliases: ["chat"] },
      { text: "Complain", points: 16 },
      { text: "People watch", points: 12 },
      { text: "Read", points: 8 }
    ]
  },
  {
    id: "f17",
    prompt: "Name a smell that makes people hungry",
    answers: [
      { text: "Bacon", points: 30 },
      { text: "Popcorn", points: 22 },
      { text: "Fresh bread", points: 20, aliases: ["bread"] },
      { text: "Pizza", points: 14 },
      { text: "Barbecue", points: 10, aliases: ["bbq"] }
    ]
  },
  {
    id: "f18",
    prompt: "Name something people decorate",
    answers: [
      { text: "Christmas tree", points: 30, aliases: ["tree"] },
      { text: "House", points: 22, aliases: ["home"] },
      { text: "Cake", points: 18 },
      { text: "Bedroom", points: 12, aliases: ["room"] },
      { text: "Car", points: 8 }
    ]
  },
  {
    id: "f19",
    prompt: "Name something that ruins a picnic",
    answers: [
      { text: "Rain", points: 34, aliases: ["storm"] },
      { text: "Bugs", points: 24, aliases: ["ants", "mosquitoes"] },
      { text: "Wind", points: 14 },
      { text: "Forgotten food", points: 10, aliases: ["no food"] },
      { text: "Heat", points: 8 }
    ]
  },
  {
    id: "f20",
    prompt: "Name something you might hear in an airport",
    answers: [
      { text: "Flight announcement", points: 32, aliases: ["announcement"] },
      { text: "Boarding call", points: 22, aliases: ["boarding"] },
      { text: "Crying baby", points: 16, aliases: ["baby"] },
      { text: "Rolling luggage", points: 12, aliases: ["suitcase"] },
      { text: "Security alert", points: 8, aliases: ["security"] }
    ]
  },
  {
    id: "f21",
    prompt: "Name something a guilty person might do",
    answers: [
      { text: "Sweat", points: 30, aliases: ["sweating"] },
      { text: "Avoid eye contact", points: 24, aliases: ["look away"] },
      { text: "Talk too much", points: 18, aliases: ["ramble"] },
      { text: "Blame someone else", points: 14, aliases: ["blame others"] },
      { text: "Run away", points: 10, aliases: ["flee"] }
    ]
  },
  {
    id: "f22",
    prompt: "Name something you would find on a detective's desk",
    answers: [
      { text: "Case files", points: 30, aliases: ["files", "folder"] },
      { text: "Magnifying glass", points: 24, aliases: ["magnifier"] },
      { text: "Coffee", points: 18 },
      { text: "Photos", points: 14, aliases: ["pictures"] },
      { text: "Notebook", points: 10, aliases: ["notes"] }
    ]
  },
  {
    id: "f23",
    prompt: "Name a bad hiding place for a secret",
    answers: [
      { text: "Under the bed", points: 30, aliases: ["bed"] },
      { text: "Sock drawer", points: 22, aliases: ["drawer"] },
      { text: "Cookie jar", points: 18 },
      { text: "Phone notes", points: 14, aliases: ["phone"] },
      { text: "Back pocket", points: 10, aliases: ["pocket"] }
    ]
  },
  {
    id: "f24",
    prompt: "Name something people lie about",
    answers: [
      { text: "Age", points: 28 },
      { text: "Being fine", points: 24, aliases: ["feelings", "how they feel"] },
      { text: "Money", points: 18 },
      { text: "Where they were", points: 16, aliases: ["location"] },
      { text: "Weight", points: 10 }
    ]
  },
  {
    id: "f25",
    prompt: "Name something you would bring on a stakeout",
    answers: [
      { text: "Binoculars", points: 30 },
      { text: "Coffee", points: 24 },
      { text: "Snacks", points: 20, aliases: ["food"] },
      { text: "Camera", points: 14 },
      { text: "Notebook", points: 8, aliases: ["notes"] }
    ]
  },
  {
    id: "f26",
    prompt: "Name something that makes a person look suspicious",
    answers: [
      { text: "Sneaking around", points: 30, aliases: ["sneaking"] },
      { text: "Wearing a mask", points: 22, aliases: ["mask"] },
      { text: "Whispering", points: 18 },
      { text: "Carrying a bag", points: 14, aliases: ["bag"] },
      { text: "Looking nervous", points: 10, aliases: ["nervous"] }
    ]
  },
  {
    id: "f27",
    prompt: "Name something you might see on a case board",
    answers: [
      { text: "Photos", points: 30, aliases: ["pictures"] },
      { text: "String", points: 24, aliases: ["red string"] },
      { text: "Map", points: 18 },
      { text: "Notes", points: 14 },
      { text: "Push pins", points: 10, aliases: ["pins"] }
    ]
  },
  {
    id: "f28",
    prompt: "Name a classic disguise item",
    answers: [
      { text: "Fake mustache", points: 32, aliases: ["mustache", "moustache"] },
      { text: "Sunglasses", points: 22, aliases: ["shades"] },
      { text: "Hat", points: 18 },
      { text: "Wig", points: 14 },
      { text: "Mask", points: 10 }
    ]
  },
  {
    id: "f29",
    prompt: "Name something a thief might try to steal",
    answers: [
      { text: "Money", points: 30, aliases: ["cash"] },
      { text: "Jewelry", points: 24, aliases: ["jewels"] },
      { text: "Car", points: 18 },
      { text: "Painting", points: 14, aliases: ["art"] },
      { text: "Phone", points: 10 }
    ]
  },
  {
    id: "f30",
    prompt: "Name something that could leave evidence behind",
    answers: [
      { text: "Fingerprints", points: 32, aliases: ["fingerprint"] },
      { text: "Footprints", points: 24, aliases: ["shoe print"] },
      { text: "Hair", points: 16 },
      { text: "Mud", points: 12 },
      { text: "Glitter", points: 8 }
    ]
  },
  {
    id: "f31",
    prompt: "Name somewhere a secret meeting might happen",
    answers: [
      { text: "Alley", points: 28 },
      { text: "Parking garage", points: 24, aliases: ["garage"] },
      { text: "Basement", points: 18 },
      { text: "Restaurant", points: 14 },
      { text: "Warehouse", points: 10 }
    ]
  },
  {
    id: "f32",
    prompt: "Name something you might use to open a locked door",
    answers: [
      { text: "Key", points: 34 },
      { text: "Lock pick", points: 22, aliases: ["pick"] },
      { text: "Crowbar", points: 18, aliases: ["pry bar"] },
      { text: "Code", points: 14, aliases: ["keypad"] },
      { text: "Credit card", points: 8, aliases: ["card"] }
    ]
  },
  {
    id: "f33",
    prompt: "Name something people do to cover their tracks",
    answers: [
      { text: "Delete messages", points: 30, aliases: ["delete texts"] },
      { text: "Clean up", points: 24, aliases: ["clean"] },
      { text: "Lie", points: 18 },
      { text: "Change clothes", points: 14 },
      { text: "Use an alias", points: 10, aliases: ["fake name"] }
    ]
  },
  {
    id: "f34",
    prompt: "Name something a lookout might say",
    answers: [
      { text: "Someone's coming", points: 34, aliases: ["someone is coming"] },
      { text: "Run", points: 22 },
      { text: "All clear", points: 18 },
      { text: "Hurry up", points: 14, aliases: ["hurry"] },
      { text: "Hide", points: 8 }
    ]
  },
  {
    id: "f35",
    prompt: "Name something hidden in a secret room",
    answers: [
      { text: "Money", points: 28, aliases: ["cash"] },
      { text: "Treasure", points: 24 },
      { text: "Documents", points: 18, aliases: ["papers"] },
      { text: "Safe", points: 14, aliases: ["vault"] },
      { text: "Skeleton", points: 8 }
    ]
  },
  {
    id: "f36",
    prompt: "Name something that happens in a mystery movie",
    answers: [
      { text: "Someone disappears", points: 28, aliases: ["disappearance"] },
      { text: "A clue is found", points: 24, aliases: ["clue"] },
      { text: "A chase", points: 18 },
      { text: "A twist ending", points: 14, aliases: ["twist"] },
      { text: "A confession", points: 10 }
    ]
  },
  {
    id: "f37",
    prompt: "Name something a spy might carry",
    answers: [
      { text: "Camera", points: 28 },
      { text: "Fake passport", points: 22, aliases: ["passport"] },
      { text: "Gadget", points: 18 },
      { text: "Radio", points: 14, aliases: ["walkie talkie"] },
      { text: "Hidden microphone", points: 10, aliases: ["microphone", "mic"] }
    ]
  },
  {
    id: "f38",
    prompt: "Name something you might inspect with a magnifying glass",
    answers: [
      { text: "Fingerprint", points: 30, aliases: ["fingerprints"] },
      { text: "Footprint", points: 22, aliases: ["shoe print"] },
      { text: "Tiny writing", points: 18, aliases: ["small print"] },
      { text: "Hair", points: 14 },
      { text: "Map", points: 10 }
    ]
  },
  {
    id: "f39",
    prompt: "Name a place someone might stash a key",
    answers: [
      { text: "Under a mat", points: 32, aliases: ["doormat"] },
      { text: "Flower pot", points: 24, aliases: ["plant"] },
      { text: "Mailbox", points: 16 },
      { text: "Rock", points: 12, aliases: ["fake rock"] },
      { text: "Drawer", points: 8 }
    ]
  },
  {
    id: "f40",
    prompt: "Name something a room full of players might argue about",
    answers: [
      { text: "Who lied", points: 28, aliases: ["liar"] },
      { text: "The rules", points: 24 },
      { text: "The answer", points: 18 },
      { text: "Who won", points: 14, aliases: ["winner"] },
      { text: "The score", points: 10 }
    ]
  }
];

export function feudAnswerPoints(question: FeudQuestion, index: number): number {
  const rawTotal = question.answers.reduce((sum, answer) => sum + answer.points, 0);
  if (!rawTotal) return 0;
  const exact = question.answers.map((answer) => (answer.points / rawTotal) * 100);
  const floored = exact.map(Math.floor);
  const remainder = 100 - floored.reduce((sum, points) => sum + points, 0);
  return floored[index] + (index < remainder ? 1 : 0);
}

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
  avatar: string;
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
export type WheelGuessFeedback = { playerId: string; letter: string; correct: boolean; at: number };
export const WHEEL_WEDGE_VALUES = [50, 100, 100, 200, 200, 300, 500] as const;
export type WheelState = {
  puzzles: WheelPuzzle[]; // length = totalRounds
  guessedLetters: Record<string, WheelLetterHit>; // letter -> { player, wedge value }
  solved: boolean;
  solverId: string | null;
  currentPickerId: string | null;
  pickedThisCycle: string[];
  turnReadyAt: number;
  lastGuess: WheelGuessFeedback | null;
};

// Per-round Family Feud state. One survey per round.
export type FeudGuessEntry = { text: string; at: number; matchIndex: number | null };
export type FeudState = {
  questions: FeudQuestion[]; // length = totalRounds
  guesses: Record<string, FeudGuessEntry[]>; // playerId -> all attempts this round
};

export type ContentDeck = {
  prompts?: string[];
  triviaIds?: string[];
  pictureIds?: string[];
  wheelIds?: string[];
  feudIds?: string[];
  trivia?: TriviaQuestion[];
  picture?: PictureItem[];
  wheel?: WheelPuzzle[];
  feud?: FeudQuestion[];
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
  giveUps: Record<string, boolean>;
  nextReady: Record<string, boolean>;
  mode: Mode;
  modeSelected: boolean;
  quipPrompts: QuipPrompt[];
  quipIndex: number;
  quipVotes: Record<string, Record<string, string>>;
  trivia: TriviaState;
  picture: PictureState;
  wheel: WheelState;
  feud: FeudState;
  contentDeck: ContentDeck;
  _counts?: Record<string, number>;
};

export type Action =
  | { type: "JOIN"; id: string; name: string; avatar?: string }
  | { type: "START_GAME"; allowSinglePlayer?: boolean; contentDeck?: ContentDeck }
  | { type: "SUBMIT_ANSWER"; playerId: string; text: string }
  | { type: "FORCE_VOTING" }
  | { type: "VOTE"; voterId: string; ownerId: string }
  | { type: "FORCE_REVEAL" }
  | { type: "NEXT_REVEAL" }
  | { type: "NEXT_ROUND" }
  | { type: "PLAY_AGAIN" }
  | { type: "RESET" }
  | { type: "TYPING"; playerId: string; at: number }
  | { type: "GIVE_UP"; playerId: string }
  | { type: "READY_NEXT"; playerId: string }
  | { type: "START_FEUD_COUNTDOWN" }
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
  Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

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
  return buildQuipPromptsFromTexts(playerIds, texts);
}

export function buildQuipPromptsFromTexts(playerIds: string[], texts: string[]): QuipPrompt[] {
  const n = playerIds.length;
  if (n < 3) return [];
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

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickN<T extends { id: string }>(pool: T[], n: number): T[] {
  return shuffled(pool).slice(0, Math.min(n, pool.length));
}

function pickByIds<T extends { id: string }>(pool: T[], ids: string[] | undefined, n: number): T[] {
  if (!ids?.length) return pickN(pool, n);
  const byId = new Map(pool.map((item) => [item.id, item]));
  const picked = ids
    .map((id) => byId.get(id))
    .filter((item): item is T => !!item)
    .slice(0, n);
  return picked.length >= Math.min(n, pool.length) ? picked : pickN(pool, n);
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

function wheelLetterIsCorrect(puzzle: WheelPuzzle | undefined, letter: string): boolean {
  return !!puzzle && puzzle.text.toUpperCase().includes(letter);
}

export function wheelCanGuessLetter(state: State, playerId: string, now = Date.now()): boolean {
  if (state.phase !== "writing" || state.mode !== "wheel") return false;
  if (!state.players[playerId]) return false;
  if (state.wheel.solved) return false;
  if ((state.wheel.turnReadyAt ?? 0) > now) return false;
  const currentPickerId = state.wheel.currentPickerId;
  const currentPickerActive =
    !!currentPickerId &&
    !!state.players[currentPickerId] &&
    !state.giveUps[currentPickerId] &&
    wheelLettersSpent(state, currentPickerId) < WHEEL_LETTER_BUDGET;
  if (currentPickerActive && currentPickerId !== playerId) return false;
  return wheelLettersSpent(state, playerId) < WHEEL_LETTER_BUDGET;
}

function nextWheelTurnState(
  state: State,
  playerId: string,
  correct: boolean,
  spentAfterGuess: number
): Pick<WheelState, "currentPickerId" | "pickedThisCycle" | "turnReadyAt"> {
  if (correct && spentAfterGuess < WHEEL_LETTER_BUDGET) {
    return {
      currentPickerId: playerId,
      pickedThisCycle: state.wheel.pickedThisCycle ?? [],
      turnReadyAt: 0
    };
  }

  const endedCycle = Array.from(new Set([...(state.wheel.pickedThisCycle ?? []), playerId]));
  const ids = joinedIds(state).filter((id) => !state.giveUps[id] && wheelLettersSpent(state, id) < WHEEL_LETTER_BUDGET);
  const playerIndex = Math.max(0, ids.indexOf(playerId));
  const ordered = [...ids.slice(playerIndex + 1), ...ids.slice(0, playerIndex)];
  const next = ordered.find((id) => !endedCycle.includes(id)) ?? null;

  return {
    currentPickerId: next,
    pickedThisCycle: next ? endedCycle : [],
    turnReadyAt: 0
  };
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
  return { puzzles: [], guessedLetters: {}, solved: false, solverId: null, currentPickerId: null, pickedThisCycle: [], turnReadyAt: 0, lastGuess: null };
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
    giveUps: {},
    nextReady: {},
    mode: "classic",
    modeSelected: true,
    quipPrompts: [],
    quipIndex: 0,
    quipVotes: {},
    trivia: emptyTrivia(),
    picture: emptyPicture(),
    wheel: emptyWheel(),
    feud: emptyFeud(),
    contentDeck: {}
  };
}

function minPlayers(mode: Mode): number {
  return mode === "quiplash" ? 3 : 2;
}

function canStartWithOnePlayer(mode: Mode): boolean {
  return mode !== "quiplash";
}

export function requiredPlayersForMode(mode: Mode, allowSinglePlayer = false): number {
  return allowSinglePlayer && canStartWithOnePlayer(mode) ? 1 : minPlayers(mode);
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
    typing: {},
    giveUps: {},
    nextReady: {}
  };
  switch (state.mode) {
    case "classic": {
      const prompt = state.contentDeck.prompts?.[roundNum - 1] ?? pickPrompt(state.usedPrompts);
      return {
        ...base,
        prompt,
        usedPrompts: [...state.usedPrompts, prompt],
        phaseDeadline: deadline(WRITING_SECONDS)
      };
    }
    case "quiplash": {
      const deckStart = state.usedPrompts.length;
      const deckTexts = state.contentDeck.prompts?.slice(deckStart, deckStart + ids.length) ?? [];
      const quipPrompts = deckTexts.length >= ids.length
        ? buildQuipPromptsFromTexts(ids, deckTexts)
        : buildQuipPrompts(ids, state.usedPrompts);
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
        ? state.contentDeck.trivia?.slice(0, state.totalRounds) ?? pickByIds(TRIVIA_QUESTIONS, state.contentDeck.triviaIds, state.totalRounds)
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
        ? state.contentDeck.picture?.slice(0, state.totalRounds) ?? pickByIds(PICTURE_ITEMS, state.contentDeck.pictureIds, state.totalRounds)
        : state.picture.items;
      const item = items[roundNum - 1];
      return {
        ...base,
        prompt: null,
        phaseDeadline: item?.src ? deadline(PICTURE_GUESS_SECONDS) : null,
        picture: { items, guesses: {} }
      };
    }
    case "wheel": {
      const puzzles = roundNum === 1
        ? state.contentDeck.wheel?.slice(0, state.totalRounds) ?? pickByIds(WHEEL_PUZZLES, state.contentDeck.wheelIds, state.totalRounds)
        : state.wheel.puzzles;
      return {
        ...base,
        prompt: null,
        phaseDeadline: deadline(WHEEL_GUESS_SECONDS),
        wheel: { puzzles, guessedLetters: {}, solved: false, solverId: null, currentPickerId: null, pickedThisCycle: [], turnReadyAt: 0, lastGuess: null }
      };
    }
    case "feud": {
      const questions = roundNum === 1
        ? state.contentDeck.feud?.slice(0, state.totalRounds) ?? pickByIds(FEUD_QUESTIONS, state.contentDeck.feudIds, state.totalRounds)
        : state.feud.questions;
      return {
        ...base,
        prompt: null,
        phaseDeadline: null,
        feud: { questions, guesses: {} }
      };
    }
  }
}

/* ---- REDUCER ------------------------------------------------------------- */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "JOIN": {
      if (state.phase === "gameover") return state;
      const existing = state.players[action.id];
      const trimmedName = action.name.trim() || "Player";
      const trimmedAvatar = normalizeAvatarId(action.avatar || existing?.avatar);
      if (existing) {
        // Re-JOIN with the same device — let the player update their name and
        // avatar while preserving color and score. Without this, an avatar
        // picked AFTER the first JOIN never propagates to the room.
        if (existing.name === trimmedName && existing.avatar === trimmedAvatar) return state;
        return {
          ...state,
          players: {
            ...state.players,
            [action.id]: {
              ...existing,
              name: trimmedName,
              avatar: trimmedAvatar
            }
          }
        };
      }
      const color = COLORS[Object.keys(state.players).length % COLORS.length];
      return {
        ...state,
        players: {
          ...state.players,
          [action.id]: {
            id: action.id,
            name: trimmedName,
            avatar: trimmedAvatar,
            color,
            score: 0
          }
        }
      };
    }

    case "TOGGLE_MODE": {
      if (state.phase !== "lobby") return state;
      return { ...state, mode: state.mode === "classic" ? "quiplash" : "classic", modeSelected: true };
    }

    case "SET_MODE": {
      if (state.phase !== "lobby") return state;
      if (!ALL_MODES.includes(action.mode)) return state;
      return { ...state, mode: action.mode, modeSelected: true };
    }

    case "START_GAME": {
      const ids = joinedIds(state);
      if (ids.length < requiredPlayersForMode(state.mode, action.allowSinglePlayer)) return state;
      return startRound({ ...state, contentDeck: action.contentDeck ?? {} }, 1);
    }

    case "START_FEUD_COUNTDOWN": {
      if (state.phase !== "writing" || state.mode !== "feud") return state;
      if (state.phaseDeadline) return state;
      return { ...state, phaseDeadline: deadline(FEUD_GUESS_SECONDS) };
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
      if (next >= state.revealOrder.length) return { ...state, phase: "scoreboard", nextReady: {} };
      return { ...state, revealIndex: next };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "scoreboard") return state;
      if (state.round >= state.totalRounds) return { ...state, phase: "gameover", phaseDeadline: null, nextReady: {} };
      return startRound(state, state.round + 1);
    }

    case "READY_NEXT": {
      if (state.phase !== "scoreboard" && state.phase !== "gameover") return state;
      if (!state.players[action.playerId]) return state;
      const nextReady = { ...(state.nextReady ?? {}), [action.playerId]: true };
      const allReady = joinedIds(state).every((id) => nextReady[id]);
      if (!allReady) return { ...state, nextReady };
      if (state.phase === "scoreboard") {
        if (state.round >= state.totalRounds) return { ...state, phase: "gameover", phaseDeadline: null, nextReady: {} };
        return startRound({ ...state, nextReady }, state.round + 1);
      }
      const players: Record<string, Player> = {};
      Object.values(state.players).forEach((p) => (players[p.id] = { ...p, score: 0 }));
      return { ...makeInitialState(), roomCode: state.roomCode, players };
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

    case "GIVE_UP": {
      if (state.phase !== "writing") return state;
      if (!state.players[action.playerId]) return state;
      const giveUps = { ...state.giveUps, [action.playerId]: true };

      if (state.mode === "classic") {
        const answers = { ...state.answers };
        if (!answers[action.playerId]) answers[action.playerId] = "(gave up)";
        const done = joinedIds(state).every((id) => answers[id] != null || giveUps[id]);
        if (done) {
          joinedIds(state).forEach((id) => {
            if (!answers[id]) answers[id] = "(gave up)";
          });
          return { ...state, giveUps, answers, phase: "voting", votes: {}, phaseDeadline: deadline(VOTING_SECONDS) };
        }
        return { ...state, giveUps, answers };
      }

      if (state.mode === "quiplash") {
        const quipPrompts = state.quipPrompts.map((q) => {
          if (!q.writers.includes(action.playerId) || q.answers[action.playerId] != null) return q;
          return { ...q, answers: { ...q.answers, [action.playerId]: "(gave up)" } };
        });
        const allLocked = quipPrompts.every((q) => q.writers.every((w) => q.answers[w] != null));
        if (allLocked) {
          return {
            ...state,
            giveUps,
            quipPrompts,
            phase: "voting",
            quipIndex: 0,
            quipVotes: {},
            phaseDeadline: deadline(VOTING_SECONDS)
          };
        }
        return { ...state, giveUps, quipPrompts };
      }

      const next = { ...state, giveUps };
      if (state.mode === "trivia" && joinedIds(state).every((id) => next.trivia.answers[id] || giveUps[id])) {
        return tallyTrivia(next);
      }
      if (state.mode === "picture" && joinedIds(state).every((id) => next.picture.guesses[id]?.correct || giveUps[id])) {
        return tallyPicture(next);
      }
      if (state.mode === "wheel" && joinedIds(state).every((id) => giveUps[id])) {
        return tallyWheel(next);
      }
      if (state.mode === "feud" && joinedIds(state).every((id) => giveUps[id])) {
        return tallyFeud(next);
      }
      return next;
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
        return { ...state, phase: "scoreboard", nextReady: {} };
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
      if (joinedIds(state).every((id) => answers[id] != null || state.giveUps[id])) {
        return tallyTrivia(next);
      }
      return next;
    }

    case "REQUEST_PICTURE_IMAGE": {
      if (state.phase !== "writing" || state.mode !== "picture") return state;
      const index = state.round - 1;
      const item = state.picture.items[index];
      if (!item || item.id !== action.itemId) return state;
      if (item.src) return {
        ...state,
        phaseDeadline: state.phaseDeadline ?? deadline(PICTURE_GUESS_SECONDS)
      };
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
      return {
        ...state,
        phaseDeadline:
          state.phase === "writing" && !state.phaseDeadline
            ? deadline(PICTURE_GUESS_SECONDS)
            : state.phaseDeadline,
        picture: { ...state.picture, items }
      };
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
      return {
        ...state,
        phaseDeadline:
          state.phase === "writing" && !state.phaseDeadline
            ? deadline(PICTURE_GUESS_SECONDS)
            : state.phaseDeadline,
        picture: { ...state.picture, items }
      };
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
      const allCorrect = joinedIds(state).every((id) => guesses[id]?.correct || state.giveUps[id]);
      if (allCorrect) return tallyPicture(next);
      return next;
    }

    case "GUESS_LETTER": {
      if (state.phase !== "writing" || state.mode !== "wheel") return state;
      if (!state.players[action.playerId]) return state;
      if (state.wheel.solved) return state;
      if (!wheelCanGuessLetter(state, action.playerId)) return state;
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
      const puzzle = state.wheel.puzzles[state.round - 1];
      const correct = wheelLetterIsCorrect(puzzle, letter);
      const now = Date.now();
      const turn = nextWheelTurnState(state, action.playerId, correct, spent + 1);
      return {
        ...state,
        wheel: {
          ...state.wheel,
          guessedLetters,
          ...turn,
          lastGuess: { playerId: action.playerId, letter, correct, at: now }
        }
      };
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
  const firstHits: Record<number, string> = {};
  const allMatches: { pid: string; at: number; idx: number }[] = [];
  Object.entries(state.feud.guesses).forEach(([pid, arr]) => {
    arr.forEach((g) => {
      if (g.matchIndex != null) allMatches.push({ pid, at: g.at, idx: g.matchIndex });
    });
  });
  allMatches.sort((a, b) => a.at - b.at);
  allMatches.forEach((m) => {
    if (firstHits[m.idx] == null) firstHits[m.idx] = m.pid;
  });
  const players: Record<string, Player> = {};
  const lastPoints: Record<string, number> = {};
  Object.values(state.players).forEach((p) => {
    let pts = 0;
    Object.entries(firstHits).forEach(([rawIdx, pid]) => {
      if (pid !== p.id) return;
      const idx = Number(rawIdx);
      pts += feudAnswerPoints(q, idx);
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
