const fs = require('fs');

const topics = [
  { p1: "Work", p2: "favorite season of the year", p3: "Climate and weather changes" },
  { p1: "Study", p2: "public place that you think needs improvements", p3: "Public facilities and parks" },
  { p1: "Hometown", p2: "city or country you want to live the most in the future", p3: "Living abroad vs living in your hometown" },
  { p1: "Home", p2: "something you learned in a place or from a person", p3: "Education and learning methods" },
  { p1: "Art", p2: "occasion where you received a good service from a company or shop", p3: "Customer service and business" },
  { p1: "Birthdays", p2: "toy that you received when you were a child", p3: "Toys and child development" },
  { p1: "Clothes", p2: "famous person that you are interested in", p3: "Celebrities and their influence" },
  { p1: "Daily Routine", p2: "photo you have taken", p3: "Photography and social media" },
  { p1: "Dictionaries", p2: "interesting event in your school", p3: "School events and education" },
  { p1: "Evenings", p2: "situation where you have to be polite", p3: "Politeness and manners in society" },
  { p1: "Family & Friends", p2: "visitor in your home", p3: "Hospitality and guests" },
  { p1: "Food", p2: "place in your city you want to go to", p3: "Tourism and city attractions" },
  { p1: "Hobbies", p2: "important river/lake in your country", p3: "Water resources and activities" },
  { p1: "Internet", p2: "person you know", p3: "Friendship and relationships" },
  { p1: "Leisure Time", p2: "impressive story you heard from other people", p3: "Storytelling and reading" },
  { p1: "Music", p2: "recent development in your city", p3: "City development and infrastructure" },
  { p1: "Neighbours & Neighbourhood", p2: "unforgettable dinner", p3: "Eating habits and restaurants" },
  { p1: "Newspapers", p2: "historical era you are interested in", p3: "History and its importance" },
  { p1: "Pets", p2: "special day out", p3: "Saving money and free time" },
  { p1: "Reading", p2: "sports person you admire", p3: "Sports and physical education" },
  { p1: "Shopping", p2: "experience where you were late for an event", p3: "Punctuality and time management" },
  { p1: "Sport", p2: "piece of technology you like using except computers", p3: "Technology and its impact" },
  { p1: "TV", p2: "something special that you saved money to buy", p3: "Saving money and shopping" },
  { p1: "Transport", p2: "holiday you would like to take in the future", p3: "Tourism and holidays" },
  { p1: "Weather", p2: "someone who is a good parent", p3: "Parenting and family" },
  { p1: "Work", p2: "rule at your school that you agree or disagree with", p3: "School rules and education" },
  { p1: "Study", p2: "achievement that you are proud of", p3: "Success and goals" },
  { p1: "Hometown", p2: "car journey you went on", p3: "Traveling by car and transport" },
  { p1: "Home", p2: "something you bought recently that made you happy", p3: "Shopping and happiness" },
  { p1: "Art", p2: "dream house or apartment you want to live in", p3: "Housing and accommodation" },
  { p1: "Birthdays", p2: "activity you do to keep fit", p3: "Health and fitness" },
  { p1: "Clothes", p2: "science subject you learned in your school", p3: "Science and education" },
  { p1: "Daily Routine", p2: "difficult decision that you once made", p3: "Decision making and choices" },
  { p1: "Dictionaries", p2: "garden/park you have visited", p3: "Parks and public spaces" },
  { p1: "Evenings", p2: "occasion where somebody gave you positive suggestions", p3: "Advice and suggestions" },
  { p1: "Family & Friends", p2: "occasion when you helped a person", p3: "Helping others and volunteering" },
  { p1: "Food", p2: "traditional product in your country", p3: "Traditions and culture" },
  { p1: "Hobbies", p2: "leisure facility you would like to have in your home town", p3: "Leisure facilities and free time" },
  { p1: "Internet", p2: "place people can listen to music", p3: "Music and entertainment" },
  { p1: "Leisure Time", p2: "piece of furniture you like", p3: "Furniture and home decoration" },
  { p1: "Music", p2: "important letter you received", p3: "Letters and communication" },
  { p1: "Neighbours & Neighbourhood", p2: "exciting book you have read", p3: "Reading and literature" },
  { p1: "Newspapers", p2: "interesting person from another country", p3: "Foreigners and culture" },
  { p1: "Pets", p2: "businessman that you admire", p3: "Business and success" },
  { p1: "Reading", p2: "experience that you taught a friend or a relative", p3: "Teaching and learning" },
  { p1: "Shopping", p2: "interesting place that few tourists visit", p3: "Tourism and travel" },
  { p1: "Sport", p2: "something you bought according to an advertisement", p3: "Advertising and consumerism" },
  { p1: "TV", p2: "time you felt happy that you used your cellphone", p3: "Cellphones and communication" },
  { p1: "Transport", p2: "person who knows a lot", p3: "Knowledge and learning" },
  { p1: "Weather", p2: "advertisement you have seen recently", p3: "Advertising and media" },
  { p1: "Work", p2: "TV program", p3: "Television and media" },
  { p1: "Study", p2: "something you enjoy doing with an old person in your family", p3: "Elderly people and family" },
  { p1: "Hometown", p2: "unusual dinner that you had", p3: "Food and dining" },
  { p1: "Home", p2: "important event that you celebrated", p3: "Celebrations and events" },
  { p1: "Art", p2: "important skill which cannot be learned at school", p3: "Skills and education" },
  { p1: "Birthdays", p2: "couple you know who have a happy marriage", p3: "Marriage and relationships" },
  { p1: "Clothes", p2: "helpful person at work or school", p3: "Helping others and teamwork" },
  { p1: "Daily Routine", p2: "new friend you've made recently", p3: "Friendship and socializing" },
  { p1: "Dictionaries", p2: "polite person you met", p3: "Politeness and manners" },
  { p1: "Evenings", p2: "family member who has had an important influence on you", p3: "Family and influence" },
  { p1: "Family & Friends", p2: "invention that changed people's lives", p3: "Inventions and technology" },
  { p1: "Food", p2: "favourite piece of clothing", p3: "Clothes and fashion" },
  { p1: "Hobbies", p2: "city or town you have been to", p3: "Cities and travel" },
  { p1: "Internet", p2: "place you visited", p3: "Travel and tourism" },
  { p1: "Leisure Time", p2: "cafe you like or dislike", p3: "Cafes and restaurants" },
  { p1: "Music", p2: "lesson that you enjoyed", p3: "Education and learning" },
  { p1: "Neighbours & Neighbourhood", p2: "leisure activity near or on the sea", p3: "Water activities and free time" },
  { p1: "Newspapers", p2: "service from a company or shop", p3: "Customer service and business" },
  { p1: "Pets", p2: "interesting conversation you had with someone", p3: "Communication and socializing" },
  { p1: "Reading", p2: "change in your life", p3: "Life changes and personal growth" },
  { p1: "Shopping", p2: "time when you worked in a team", p3: "Teamwork and collaboration" },
  { p1: "Sport", p2: "piece of good news you heard", p3: "Good news and communication" },
  { p1: "TV", p2: "trip you took by bike", p3: "Bicycles and transport" },
  { p1: "Transport", p2: "decision that you disagreed with", p3: "Decisions and opinions" },
  { p1: "Weather", p2: "enjoyable experience you had in the countryside", p3: "Countryside and nature" },
  { p1: "Work", p2: "type of weather you like", p3: "Weather and climate" },
  { p1: "Study", p2: "interesting talk or speech you heard", p3: "Public speaking and communication" },
  { p1: "Hometown", p2: "experience when you spent time with a child", p3: "Children and parenting" },
  { p1: "Home", p2: "piece of artwork that you have seen before", p3: "Art and creativity" },
  { p1: "Art", p2: "useful website that you often visit", p3: "Internet and technology" }
];

let content = `import { Scenario } from './scenarios';\n\nexport const generatedIeltsScenarios: Scenario[] = [\n`;

topics.forEach((t, i) => {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  content += `  {
    id: "ielts_gen_${i + 1}",
    category: "IELTS Preparation",
    title: "IELTS Mock: ${t.p1} & ${cap(t.p2)}",
    level: "B1-B2",
    role: "default",
    topic: "You are an official, strict IELTS Speaking Examiner conducting a full mock test.",
    icebreaker: "Hello. Let's start with Part 1. Let's talk about ${t.p1.toLowerCase()}. What can you tell me about that?",
    vocabulary: ["IELTS", "Speaking", "Fluency", "Vocabulary", "Grammar"],
    studentBriefing: "Full IELTS Mock Test. Part 1: ${t.p1}. Part 2: Describe a ${t.p2}. Part 3: ${t.p3}.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
Conduct a full IELTS Speaking test step-by-step.
- Part 1 (${t.p1}): Ask 2-3 questions one by one. Wait for answers.
- Part 2 (Cue Card): "Now I will give you a topic. Describe a ${t.p2}. You should say what it is, when it was, and explain why it is important to you." Wait for the user's full response.
- Part 3 (${t.p3}): Ask 2-3 deep, abstract questions related to the topic.
- Conclude the test and give a highly critical, strictly objective estimated band score. Do not inflate scores.\`
  },\n`;
});

content += `];\n`;

fs.writeFileSync('src/lib/generated_scenarios.ts', content);
console.log('Generated ' + topics.length + ' scenarios.');
