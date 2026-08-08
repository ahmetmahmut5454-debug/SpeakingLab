const fs = require('fs');
const path = require('path');

const newTopics = [
  {
    id: "ielts_pdf_new_1",
    p1: "Learning new things",
    p2_short: "Describe a skill you want to learn",
    p2_cue_card: "Describe a skill you want to learn.\nYou should say:\n- What was it?\n- How would you learn it?\n- Where can you learn it?\n- And explain why you want to learn it.",
    p3: "Skills and learning"
  },
  {
    id: "ielts_pdf_new_2",
    p1: "Role models",
    p2_short: "Describe a person you admire",
    p2_cue_card: "Describe a person you admire.\nYou should say:\n- Who is he or she?\n- What does he or she do for a living?\n- What characteristics does this person have?\n- Explain why you admire this person?",
    p3: "Success and admiration"
  },
  {
    id: "ielts_pdf_new_3",
    p1: "Reading habits",
    p2_short: "Describe a book you recently read",
    p2_cue_card: "Describe a book you recently read.\nYou should say:\n- What type of book do you like?\n- What book is it?\n- What the book is about\n- Why do you like the book",
    p3: "Books and reading culture"
  },
  {
    id: "ielts_pdf_new_4",
    p1: "Weather and climate",
    p2_short: "Describe your favourite season",
    p2_cue_card: "Describe your favourite season.\nYou should say:\n- What season it is?\n- How that season is different from other seasons?\n- What the weather is like at that time of year\n- Explain how you feel about that season.",
    p3: "Seasons and lifestyle"
  },
  {
    id: "ielts_pdf_new_5",
    p1: "Getting advice",
    p2_short: "Describe a piece of advice you recently received",
    p2_cue_card: "Describe a piece of advice you recently received.\nYou should say:\n- What was the situation?\n- Who gave you the advice?\n- Why do you think this person is very open?\n- What the advice was and explain how useful you think the advice was?",
    p3: "Advice and decision making"
  },
  {
    id: "ielts_pdf_new_6",
    p1: "Friendship",
    p2_short: "Describe a friend who is a good leader",
    p2_cue_card: "Describe a friend who is a good leader.\nYou should say:\n- Who is this person?\n- How you know this person?\n- What he does?\n- How this person behaves?\n- Why do you think he is a good leader?",
    p3: "Leadership qualities"
  },
  {
    id: "ielts_pdf_new_7",
    p1: "Festivals",
    p2_short: "Describe a tradition in your country",
    p2_cue_card: "Describe a tradition in your country.\nYou should say:\n- What is it?\n- Who takes part in it?\n- What activities are there?\n- And explain how you feel about it?",
    p3: "Culture and traditions"
  },
  {
    id: "ielts_pdf_new_8",
    p1: "New year",
    p2_short: "Describe a resolution you made in the new year",
    p2_cue_card: "Describe a resolution you made in the new year.\nYou should say:\n- What is the resolution?\n- How will you complete it?\n- How do you feel about it?\n- Why did you make this resolution?",
    p3: "Goals and self-improvement"
  },
  {
    id: "ielts_pdf_new_9",
    p1: "Competitions",
    p2_short: "Talk about a prize you want to win",
    p2_cue_card: "Talk about a prize you want to win.\nYou should say:\n- What prize is it?\n- How do you know about it?\n- What will you do to win it?\n- Why do you want to win?",
    p3: "Prizes and achievements"
  },
  {
    id: "ielts_pdf_new_10",
    p1: "Daily routines",
    p2_short: "Describe an occasion when you got up extremely early",
    p2_cue_card: "Describe an occasion when you got up extremely early.\nYou should say:\n- When did you get up early?\n- Why you get up early?\n- What did you do?\n- How did you feel about it?",
    p3: "Sleep and productivity"
  },
  {
    id: "ielts_pdf_new_11",
    p1: "Taking risks",
    p2_short: "Describe a risk you have taken",
    p2_cue_card: "Describe a risk you have taken.\nYou should say:\n- What it was?\n- Why you took it?\n- What the result was?\n- How you felt about it?",
    p3: "Risks and consequences"
  },
  {
    id: "ielts_pdf_new_12",
    p1: "Happiness",
    p2_short: "Describe a special day that made you happy",
    p2_cue_card: "Describe a special day that made you happy.\nYou should say:\n- When was it?\n- What was the occasion about?\n- Why did it make you happy?",
    p3: "Happiness and celebrations"
  },
  {
    id: "ielts_pdf_new_13",
    p1: "Work and careers",
    p2_short: "Describe a job that you consider highly important",
    p2_cue_card: "Describe a job that you consider highly important.\nYou should say:\n- What the job is\n- What the job involves\n- Why it is important\n- And explain if people who do this job are appreciated enough by society",
    p3: "Careers and society"
  }
];

let generatedContent = '';
for (const topic of newTopics) {
  const scenarioStr = `  {
    id: "${topic.id}",
    category: "IELTS Preparation",
    title: "IELTS Mock: ${topic.p1} & ${topic.p2_short}",
    level: "B1-B2",
    role: "default",
    topic: "You are an official, highly strict IELTS Speaking Examiner conducting a full mock test. Be highly critical and objective in your evaluation.",
    icebreaker: "Hello. Let's start with Part 1. Let's talk about ${topic.p1.toLowerCase()}. What can you tell me about that?",
    vocabulary: ["IELTS", "Speaking", "Fluency", "Vocabulary", "Grammar"],
    studentBriefing: "Full IELTS Mock Test. Part 1: ${topic.p1}. Part 2: ${topic.p2_short}. Part 3: ${topic.p3}.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
Conduct a full IELTS Speaking test step-by-step.
- Part 1 (${topic.p1}): Ask 2-3 questions one by one. Wait for answers.
- Part 2 (Cue Card): FIRST call the showCueCard tool to display the cue card on the user's screen. Then say "Now I will give you a topic. ${topic.p2_short}." Wait for the user's full response.
- Part 3 (${topic.p3}): Ask 2-3 deep, abstract questions related to the topic.
- Conclude the test with a polite farewell. Do not give any band scores during this conversation, they will be calculated in the final report.\`
  },
`;
  generatedContent += scenarioStr;
}

const filepath = path.join(__dirname, 'src', 'lib', 'generated_scenarios.ts');
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace('];\n', generatedContent + '];\n');
fs.writeFileSync(filepath, content);
console.log('Successfully updated generated_scenarios.ts');
