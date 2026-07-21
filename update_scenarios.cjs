const fs = require('fs');

const scenariosPath = 'src/lib/scenarios.ts';
let content = fs.readFileSync(scenariosPath, 'utf8');

// Find the index of the first IELTS mock we added recently
const ieltsStartIdx = content.indexOf('{', content.indexOf('id: "ielts1"'));
const arrayEndIdx = content.lastIndexOf(']');

if (ieltsStartIdx !== -1 && arrayEndIdx !== -1) {
  content = content.substring(0, content.lastIndexOf('{', ieltsStartIdx));
} else {
  content = content.substring(0, arrayEndIdx);
}

const tests = [
  { id: '15_1', p1: 'Emails', p2: 'a hotel that you know', p3: 'Staying in hotels & Working in a hotel' },
  { id: '15_2', p1: 'Languages', p2: 'a website that you bought something from', p3: 'Shopping online & The culture of consumerism' },
  { id: '15_3', p1: 'Swimming', p2: 'a famous business person that you know about', p3: 'Famous people today & Advantages of being famous' },
  { id: '15_4', p1: 'Jewellery', p2: 'an interesting TV programme you watched about a science topic', p3: 'Science and the public & Scientific discoveries' },
  { id: '14_1', p1: 'Future', p2: 'a book that you enjoyed reading because you had to think a lot', p3: 'Children and reading & Electronic books' },
  { id: '14_2', p1: 'Social media', p2: 'something you liked very much which you bought for your home', p3: 'Creating a nice home & Different types of home' },
  { id: '14_3', p1: 'Neighbors', p2: 'a very difficult task that you succeeded in doing as part of your work or studies', p3: 'Difficult jobs & Personal and career success' },
  { id: '14_4', p1: 'Your neighbourhood', p2: 'a website you have bought something from', p3: 'Shopping online & Online retail businesses' },
  { id: '13_1', p1: 'Television programmes', p2: 'someone you know who has started a business', p3: 'Choosing work & Work-Life balance' },
  { id: '13_2', p1: 'Age', p2: 'a time when you started using a new technological device', p3: 'Technology and education & Technology and society' },
  { id: '13_3', p1: 'Money', p2: 'an interesting discussion you had as part of your work or studies', p3: 'Discussing problems with others & Communication skills at work' },
  { id: '13_4', p1: 'Animals', p2: 'a website you use that helps you a lot in your work or studies', p3: 'The internet & Social media websites' },
  { id: '12_1', p1: 'Health', p2: 'an occasion when you had to wait a long time for someone or something to arrive', p3: 'Arriving early & Being patient' },
  { id: '12_2', p1: 'Songs and singing', p2: 'a film/movie actor from your own county who is very popular', p3: 'Watching films/movies & Theatre' },
  { id: '12_3', p1: 'Clothes', p2: 'an interesting discussion you had about how you spend your money', p3: 'Money and young people & Money and society' },
  { id: '12_4', p1: 'Art', p2: 'a time when you visited a friend or family member at their workplace', p3: 'Different kinds of workplaces & The importance of work' },
  { id: '11_1', p1: 'Food and cooking', p2: 'a house/apartment someone you know lives in', p3: 'Different types of home & Finding a place to live' },
  { id: '11_2', p1: 'Friends', p2: 'a writer you would like to meet', p3: 'Reading and children & Reading for different purposes' },
  { id: '11_3', p1: 'Photographs', p2: 'a day when you thought the weather was perfect', p3: 'Types of weather & Weather forecast' },
  { id: '11_4', p1: 'Names', p2: 'a TV documentary you watched that was particularly interesting', p3: 'Different types of TV programs & TV advertising' },
];

let newScenarios = '';

tests.forEach((t, i) => {
  newScenarios += `  {
    id: "ielts_${t.id}",
    category: "IELTS Preparation",
    title: "IELTS Mock: ${t.p1} & ${t.p2.split(' ')[1] || 'Topic'}",
    level: "B1-B2",
    role: "default",
    topic: "You are an official IELTS Speaking Examiner conducting a full mock test.",
    icebreaker: "Hello. Let's start with Part 1. Let's talk about ${t.p1.toLowerCase()}. What can you tell me about that?",
    vocabulary: ["IELTS", "Speaking", "Fluency", "Vocabulary", "Grammar"],
    studentBriefing: "Full IELTS Mock Test. Part 1: ${t.p1}. Part 2: Describe ${t.p2}. Part 3: ${t.p3}.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
Conduct a full IELTS Speaking test step-by-step.
- Part 1 (${t.p1}): Ask 2-3 questions one by one. Wait for answers.
- Part 2 (Cue Card): "Now I will give you a topic. Describe ${t.p2}." Wait for the user's full response.
- Part 3 (${t.p3}): Ask 2-3 deep, abstract questions related to the topic.
- Conclude the test and give detailed feedback and an estimated band score.\`
  }${i === tests.length - 1 ? '' : ','}\n`;
});

content += newScenarios + '];\n';
fs.writeFileSync(scenariosPath, content);
console.log('Successfully updated scenarios');
