export type HeroMode = "jobs" | "people" | "campus"

export const heroTiles: { id: HeroMode; label: string }[] = [
  { id: "jobs", label: "Candidate" },
  { id: "people", label: "Recruiter" },
  { id: "campus", label: "University" },
]

export const heroCopy: Record<HeroMode, { a: string; b: string; lede: string }> = {
  jobs: {
    a: "Swipe the jobs",
    b: "you’d actually take.",
    lede: "swypejobs is a hiring platform for students and early-career talent. Pay, city and team are on every card. A swipe is your application, and chat opens only if the recruiter swipes back.",
  },
  people: {
    a: "Swipe the students",
    b: "who already want it.",
    lede: "Every student in your deck already swiped your role. Swipe back to open a thread tied to that job. No cold outreach and no inbox full of résumés.",
  },
  campus: {
    a: "A better way to get",
    b: "your students hired.",
    lede: "swypejobs sits beside career services. Students opt in, employers talk to them only after a mutual match, and your office sees aggregate outcomes where consent allows.",
  },
}

export const howCopy: Record<HeroMode, { title: string; lede: string }> = {
  jobs: {
    title: "Two swipes. One conversation.",
    lede: "Follow a role from the day it is posted to the day someone is hired — you only chat after both sides say yes.",
  },
  people: {
    title: "From a listing to a shortlist that wants it.",
    lede: "Post the role. Students who want it raise a hand. You swipe back, then hire in one thread.",
  },
  campus: {
    title: "A pilot your office can actually run.",
    lede: "No registrar dump. Students join themselves. You see opt-in and match activity in aggregate.",
  },
}

export const campusSteps = [
  { k: "Brief", d: "A short session with career services. Pick the faculties or class years for a pilot." },
  { k: "Students join", d: "They create their own accounts at a co-branded session. You never upload a directory." },
  { k: "Employers hire", d: "Reviewed recruiters post roles. Chat opens only after a mutual match." },
  { k: "You see outcomes", d: "Opt-in volume, interest by role type and matches — where policy and consent allow." },
]

export const principlesByMode: Record<HeroMode, { v: string; l: string; d: string }[]> = {
  jobs: [
    { v: "0", l: "cold messages", d: "Nobody can message you first." },
    { v: "2", l: "yeses to unlock chat", d: "You and the recruiter both opt in." },
    { v: "1", l: "thread per role", d: "Every conversation is tied to a job." },
    { v: "Pay", l: "on every card", d: "City, team and band before you swipe." },
  ],
  people: [
    { v: "0", l: "cold outreach", d: "You never message people who did not raise a hand." },
    { v: "1", l: "reviewed account", d: "Jobs go live after we look at the company." },
    { v: "1", l: "thread per role", d: "Notes, chat and stage sit on the match." },
    { v: "4", l: "pipeline stages", d: "Chatting, interview, offer, hired." },
  ],
  campus: [
    { v: "0", l: "data dumps", d: "Students create their own accounts." },
    { v: "1", l: "office, not a portal", d: "It sits beside advising, fairs and workshops." },
    { v: "Agg.", l: "reporting only", d: "No student-level lists without consent." },
    { v: "2", l: "sides before chat", d: "Employers cannot spam your cohort." },
  ],
}

export const compareByMode: Record<HeroMode, { cols: string[]; rows: { k: string; v: [string, string, string] }[] }> = {
  jobs: {
    cols: ["Job boards", "Cold DMs and email", "swypejobs"],
    rows: [
      { k: "Who can message first", v: ["The candidate applies, then waits", "Whoever hits send", "Nobody, until both swipe yes"] },
      { k: "Signal of intent", v: ["A click on Apply", "None", "A swipe on one specific role"] },
      { k: "Pay and city up front", v: ["Sometimes", "Rarely", "On every card"] },
      { k: "Where the conversation lives", v: ["Email", "Scattered DMs", "One thread per role"] },
    ],
  },
  people: {
    cols: ["Job boards", "LinkedIn InMail", "swypejobs"],
    rows: [
      { k: "Who is in your deck", v: ["Anyone who clicked Apply", "Whoever you search", "Only students who swiped your role"] },
      { k: "Time to first conversation", v: ["Screen a pile of CVs", "Write a cold note", "Swipe back, chat opens"] },
      { k: "Pay transparency", v: ["Optional", "Rare", "Required on the card"] },
      { k: "Pipeline", v: ["ATS, maybe", "A spreadsheet", "Chatting → interview → offer → hired"] },
    ],
  },
  campus: {
    cols: ["Career portal", "Fairs only", "swypejobs"],
    rows: [
      { k: "Student data", v: ["Often a SIS export", "None", "Students opt in themselves"] },
      { k: "Employer contact", v: ["Open apply", "Booth conversations", "Mutual match before chat"] },
      { k: "What the office sees", v: ["Applications, sometimes", "Headcount at the door", "Aggregate interest and matches"] },
      { k: "Fits beside advising", v: ["Replaces the portal", "A calendar event", "Yes — workshops, fairs, 1:1s stay"] },
    ],
  },
}

export const faqsByMode: Record<HeroMode, { q: string; a: string }[]> = {
  jobs: [
    {
      q: "How does swypejobs work for students?",
      a: "You browse roles with pay band, location and team context. Swipe to pass or show interest. If the recruiter swipes back, it is a mutual match and you can message in-app, tied to that job.",
    },
    {
      q: "Why mutual match before chat?",
      a: "So neither side burns time on one-way outreach. You are not buried in recruiter spam, and recruiters focus on people who actually want that role.",
    },
    {
      q: "Is it only for internships?",
      a: "The focus is early-career and campus-heavy hiring: internships and new-grad roles. Other full-time roles may appear as we grow.",
    },
    {
      q: "When does early access open?",
      a: "We are onboarding in waves. Join the waitlist and we will email you once when your wave opens.",
    },
  ],
  people: [
    {
      q: "Where do candidates come from?",
      a: "Your Discover feed is students who swiped your listing. It is not a public résumé database and nobody is pushed at you.",
    },
    {
      q: "How does the pipeline work?",
      a: "Each match moves through chatting, interview, offer and hired. Notes stay on the match, so the process is readable at a glance.",
    },
    {
      q: "Who can post roles?",
      a: "Recruiter accounts are reviewed before jobs go live. We are onboarding in waves, starting with teams that hire from campus.",
    },
    {
      q: "Can I message people who have not matched?",
      a: "No, and that is the point. You can swipe, save and wait for a mutual match, which keeps the student side free of spam.",
    },
  ],
  campus: [
    {
      q: "Do we have to upload student data?",
      a: "No. Students create their own accounts and opt in. We never ask for a registrar dump or a directory.",
    },
    {
      q: "Does it replace our career portal?",
      a: "No. It sits beside your office and the systems you already run, and works around fairs, workshops and advising.",
    },
    {
      q: "What can the office see?",
      a: "Where policy and consent allow: opt-in volume, interest by role type and match activity in aggregate. Never a list of every student.",
    },
    {
      q: "What does a partnership look like?",
      a: "A short briefing, a pilot scoped to the schools or faculties you choose, then a co-branded campus session. Students still join themselves.",
    },
  ],
}

export const ctaCopy: Record<HeroMode, { title: string; lede: string }> = {
  jobs: {
    title: "Get in line for the first wave.",
    lede: "Students are joining in cohorts. One email when your wave opens.",
  },
  people: {
    title: "Hire the next campus cohort.",
    lede: "Tell us your volume and target schools. We will share early-access timing.",
  },
  campus: {
    title: "Put a briefing on the calendar.",
    lede: "Career offices start with a short call, then a scoped pilot. No data upload required.",
  },
}

export const builtForCopy: Record<HeroMode, string> = {
  jobs: "Built for students at the schools you already know.",
  people: "Hire from the campuses your team already visits.",
  campus: "Built to sit beside the offices at these campuses.",
}

export const platformCopy: Record<HeroMode, string> = {
  jobs: "Swipe, match, and chat — without the inbox.",
  people: "A shortlist of students who already want the role.",
  campus: "What a career office actually gets from a pilot.",
}

export const audienceHash: Record<HeroMode, string> = {
  jobs: "#candidates",
  people: "#recruiters",
  campus: "#universities",
}

export const modeFromHash: Record<string, HeroMode> = {
  "#candidates": "jobs",
  "#recruiters": "people",
  "#universities": "campus",
}

export const bentoByMode: Record<HeroMode, number[]> = {
  jobs: [0, 1, 2, 3],
  people: [0, 3, 5, 1],
  campus: [4, 5, 1, 0],
}

export const personaId: Record<HeroMode, "candidate" | "recruiter" | "university"> = {
  jobs: "candidate",
  people: "recruiter",
  campus: "university",
}
