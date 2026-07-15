const fs = require('fs');

let content = fs.readFileSync('src/lib/scenarios.ts', 'utf-8');

// add category to Scenario interface
content = content.replace(
  "export interface Scenario {",
  "export interface Scenario {\n  category?: 'General' | 'Academic English' | 'Erasmus Preparation';"
);

// We need to add the new scenarios to predefinedScenarios array
const newScenarios = `  // --- Academic English ---
  {
    id: "acad1",
    category: "Academic English",
    imageUrl: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=500&q=80",
    title: "Conference Q&A: Defending Methodology",
    level: "C1",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: C1. Use formal academic register.",
    icebreaker: "Thank you for the presentation. I do have a question about your methodology...",
    vocabulary: ["Limitation", "Sample size", "Address", "Future work", "Methodology"],
    studentBriefing: "You've just given a conference talk. An audience member challenges your sample size or methodology. Justify your choice, concede real limitations, and propose how future work could address it without sounding defensive.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Play an audience member who challenges the sample size or methodology.
- Push back at least once even if the learner's first answer is reasonable.
- Only back off once they offer a genuine limitation plus a way to address it.
- Closing: "I see, that makes sense. Thank you for clarifying."\`
  },
  {
    id: "acad2",
    category: "Academic English",
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&q=80",
    title: "Conference Coffee Break",
    level: "B1-B2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B2. Use conversational academic register.",
    icebreaker: "Great venue, isn't it? Did you travel far to get here?",
    vocabulary: ["Presentation", "Research", "Fascinating", "Focus", "Colleague"],
    studentBriefing: "Coffee break at a conference. You don't know anyone here. Someone makes small talk. Handle the small talk, then give a two-minute, jargon-light pitch of your research.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Open with small talk (the venue, the travel, the last session).
- Then ask what the learner's paper is about.
- Show real interest and ask one follow-up question.
- End the scenario once they have given a concise, jargon-free pitch of their research.
- Closing: "That sounds fascinating! Do you have a business card? I'd love to read your paper."\`
  },
  {
    id: "acad3",
    category: "Academic English",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80",
    title: "Skeptical Discussant",
    level: "C1",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: C1. Use academic discussion register.",
    icebreaker: "I read your paper, but I have a fundamentally different interpretation of your data.",
    vocabulary: ["Interpretation", "Evidence", "Contradict", "Variable", "Alternative"],
    studentBriefing: "A reading group or workshop. A colleague disagrees with your interpretation of your own data. Take the counter-argument seriously, defend your interpretation, and try to reach an agreement.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Offer a competing reading of the data.
- Hold that position through at least two exchanges regardless of pushback.
- Give ground only if the user provides strong evidentiary reasoning.
- End by agreeing to disagree or finding common ground.
- Closing: "I suppose that is a valid way to look at it. We can agree to disagree for now."\`
  },
  {
    id: "acad4",
    category: "Academic English",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
    title: "Office Hours: Critical Feedback",
    level: "B1-B2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B2/C1. Play a student who receives poor grades.",
    icebreaker: "Hi Professor, you wanted to see me about my essay?",
    vocabulary: ["Rubric", "Constructive", "Revision", "Improve", "Feedback"],
    studentBriefing: "A student has submitted noticeably weak work. Deliver criticism constructively, keep the student motivated, and leave with a concrete revision plan.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Play the student.
- Get mildly defensive at the first piece of criticism: "But I followed the rubric."
- Wait for the user to de-escalate and provide a constructive way to improve.
- End when a concrete revision plan is agreed upon.
- Closing: "Okay, I think I understand what you want now. I'll rewrite the second section by Friday."\`
  },
  {
    id: "acad5",
    category: "Academic English",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&q=80",
    title: "Explaining Research to Journalist",
    level: "B1-B2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B2. Play a journalist.",
    icebreaker: "So, I'm doing a piece for the daily news. Can you explain what your research is actually about?",
    vocabulary: ["Simply put", "Oversimplify", "Crucial", "Accurate", "Headline"],
    studentBriefing: "A journalist asks about your work for a general audience. Explain the research without jargon, and correct their oversimplification without sounding condescending.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Ask a naive but genuine question.
- After the user answers, make a follow-up that risks a headline-worthy oversimplification (e.g., "So basically, your research cures the disease?").
- The user must correct you tactfully.
- Closing: "Ah, I see the nuance now. That will make a great article. Thanks!"\`
  },
  {
    id: "acad6",
    category: "Academic English",
    imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&q=80",
    title: "Job Talk: Tough Panel Question",
    level: "C1",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: C1. Play a skeptical hiring panel member.",
    icebreaker: "That was an interesting talk. However, why does this research direction deserve funding?",
    vocabulary: ["Significance", "Direction", "Funding", "Impact", "Candidate"],
    studentBriefing: "You're interviewing for a lectureship. A skeptical panel member asks why your research deserves funding or a permanent position. Make a persuasive case.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Play a skeptical panel member.
- Press specifically on why this research direction deserves funding or a permanent position.
- Don't accept a vague answer. Demand specifics about future impact.
- Closing: "Very well articulated. We will let you know our decision next week."\`
  },

  // --- Erasmus Preparation ---
  {
    id: "eras1",
    category: "Erasmus Preparation",
    imageUrl: "https://images.unsplash.com/photo-1554774853-a50f7b12d4ca?w=500&q=80",
    title: "Enrollment Office: Missing Document",
    level: "A2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B1/B2. Play a rule-bound admin officer.",
    icebreaker: "Next please. Let me see your enrollment forms.",
    vocabulary: ["Form", "Missing", "Alternative", "Deadline", "Process"],
    studentBriefing: "You're finishing enrollment, but a document is missing or incorrect. The admin officer is unhelpful. Explain the situation clearly and get the officer to tell you an alternative path.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Play a rule-bound admin officer. State the rule plainly (e.g., "You are missing the original stamp").
- Do not offer solutions unless asked directly.
- The user must politely persist and ask for alternative options.
- Closing: "Fine, if you fill out this waiver form today, I can accept a digital copy until tomorrow."\`
  },
  {
    id: "eras2",
    category: "Erasmus Preparation",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80",
    title: "Apartment Viewing: Negotiating",
    level: "B1-B2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B2. Play a landlord.",
    icebreaker: "So, this is the room. Very sunny, very close to the university. What do you think?",
    vocabulary: ["Damp", "Noise", "Negotiate", "Fix", "Rent"],
    studentBriefing: "You like a room, but notice a damp patch or street noise. Raise the concern diplomatically and negotiate the price or a fix before agreeing.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Play a landlord who's mildly evasive about a problem in the room.
- Don't lower the price unless pushed with a specific reason.
- The user must negotiate diplomatically.
- Closing: "Alright, if you sign today, I will have the wall repainted and lower the rent by 50 euros."\`
  },
  {
    id: "eras3",
    category: "Erasmus Preparation",
    imageUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&q=80",
    title: "Doctor's Visit",
    level: "A2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B1. Play a local doctor or pharmacist.",
    icebreaker: "Hello. What seems to be the problem today?",
    vocabulary: ["Symptom", "Dosage", "Prescription", "Pain", "Clarify"],
    studentBriefing: "You feel unwell. Describe your symptoms. The doctor will give instructions that include an unfamiliar term. Ask for clarification until you understand.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Ask follow-up questions about the symptoms.
- Give instructions that include one unfamiliar term (e.g., "take ibuprofen PRN" or "sublingual administration") without explaining it.
- Wait for the user to ask for clarification.
- Closing: "Exactly. Just follow those instructions and you should feel better in a few days."\`
  },
  {
    id: "eras4",
    category: "Erasmus Preparation",
    imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&q=80",
    title: "Meeting People: The Invitation",
    level: "A2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: A2/B1. Play another exchange student.",
    icebreaker: "Hey, are you new here too? Where are you from?",
    vocabulary: ["Invite", "Inconvenient", "Alternative", "Plan", "Join"],
    studentBriefing: "Orientation week. Keep the small talk going, then respond to an invitation that has an inconvenient detail (like bad timing or high cost).",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Open with small talk.
- Invite them somewhere, with one inconvenient detail (e.g., a very expensive club, or meeting at 6 AM).
- The user must handle the invitation (accept, propose alternative, or politely decline).
- Closing: "No worries! We'll figure out another time to hang out."\`
  },
  {
    id: "eras5",
    category: "Erasmus Preparation",
    imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80",
    title: "Unfamiliar Grading System",
    level: "B1-B2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: B2. Play a university professor.",
    icebreaker: "Hello, come in. You had questions about the assessment format?",
    vocabulary: ["Assessment", "Format", "Resit", "Extension", "System"],
    studentBriefing: "The assessment format is completely different from your home university. Ask clarifying questions to understand the system and edge cases.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Give a brief, fairly technical explanation of the local grading system.
- Don't volunteer info on edge cases (resits, extensions) unless asked.
- The user must advocate for themselves and ask clarifying questions.
- Closing: "I hope that clears things up. The syllabus also has these details. See you in class."\`
  },
  {
    id: "eras6",
    category: "Erasmus Preparation",
    imageUrl: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=500&q=80",
    title: "Opening a Bank Account",
    level: "A2",
    role: "default",
    topic: "You are an English language assessment agent. Target CEFR: A2/B1. Play a bank employee.",
    icebreaker: "Welcome to the branch. How can I help you?",
    vocabulary: ["Account", "Requirement", "Deposit", "Fee", "Document"],
    studentBriefing: "You need a local account. Provide information, and navigate an unexpected extra requirement (like proof of address) mentioned halfway through.",
    objective: \`STRICT SCENARIO INSTRUCTIONS:
- Play a bank employee asking for info step-by-step.
- Midway through, mention one extra requirement (e.g., "I also need a utility bill for proof of address").
- The user must provide the info and ask clarifying questions about fees or card delivery.
- Closing: "Perfect, everything is signed. Your card will arrive in the mail in 3-5 business days."\`
  }
];`;

content = content.replace(/];[\s\S]*$/, ',\n' + newScenarios);

fs.writeFileSync('src/lib/scenarios.ts', content);
