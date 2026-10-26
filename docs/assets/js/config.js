/* ==========================================================================
   Sandeep ♥ Priyanka — site content
   Everything a family member might want to change lives in this file.
   ========================================================================== */
window.W = window.W || {};

W.config = {
  /* Preview mode fills the site with sample crowd activity so it feels alive
     before real guests arrive. Set to false once the shared backend is live. */
  demoMode: true,

  couple: {
    groom: { short: "Sandeep", full: "G. Sandeep Raaj", prefix: "Chi.", tamil: "சந்தீப்", key: "S" },
    bride: { short: "Priyanka", full: "K. Priyanka", prefix: "Sow.", tamil: "பிரியங்கா", key: "P" },
    hashtag: "#SandyWedsPriya",
  },

  /* All times are India Standard Time (+05:30). */
  dates: {
    reception: "2027-01-27T18:00:00+05:30",
    // Muhurtham time not announced yet. Games lock at this moment.
    wedding: "2027-01-28T07:00:00+05:30",
    weddingTimeAnnounced: false,
    reveal: "2027-01-29T00:00:00+05:30",
  },

  venue: {
    name: "Shelter Beach Resorts",
    address: "No.275, East Coast Road, Mahabalipuram, Vadanemmeli, Chennai",
    maps: "https://www.google.com/maps/search/?api=1&query=Shelter+Beach+Resorts+East+Coast+Road+Vadanemmeli+Chennai",
  },

  /* Passcode for the couple's private portal (#couple).
     This only keeps casual visitors out. Real protection comes with the backend. */
  couplePasscode: "2801",

  /* ---- Scratch-card invitation: what can be hidden under the foil ---- */
  perks: [
    { tier: "common",    weight: 34, icon: "coins",    title: "+150 Love Coins",          text: "A little extra to trade on the Love Stock Market.", coins: 150, xp: 40 },
    { tier: "common",    weight: 26, icon: "sparkles", title: "Jasmine Charm",            text: "Your daily mystery boxes give +10% XP until the wedding.", xp: 60 },
    { tier: "rare",      weight: 18, icon: "music",    title: "Dance Floor Starter",      text: "Title unlocked. Everyone will know who to blame.", xp: 120, title_: "Dance Floor Starter" },
    { tier: "rare",      weight: 12, icon: "camera",   title: "Official Selfie Ambassador", text: "Title unlocked. Your job at the reception is now very clear.", xp: 120, title_: "Selfie Ambassador" },
    { tier: "epic",      weight: 7,  icon: "crown",    title: "Inner Circle Pass",         text: "+400 Love Coins and the Inner Circle badge.", coins: 400, xp: 200 },
    { tier: "legendary", weight: 3,  icon: "star",     title: "Golden Jasmine",           text: "The rarest pull. +800 Love Coins and a legendary badge on your reveal card.", coins: 800, xp: 400 },
  ],

  /* ---- He Said / She Said: guests guess who each partner will name ---- */
  hssQuestions: [
    { id: "q1",  q: "Who said “I love you” first?" },
    { id: "q2",  q: "Who is the better cook?" },
    { id: "q3",  q: "Who takes longer to get ready?" },
    { id: "q4",  q: "Who says sorry first after a fight?" },
    { id: "q5",  q: "Who is more likely to forget an anniversary?" },
    { id: "q6",  q: "Who controls the TV remote?" },
    { id: "q7",  q: "Who is the bigger foodie?" },
    { id: "q8",  q: "Who will cry first at the wedding?" },
    { id: "q9",  q: "Who plans the holidays?" },
    { id: "q10", q: "Who wakes up earlier?" },
  ],

  /* ---- Love Stock Market: play-money predictions about the big days ---- */
  markets: [
    { id: "m1", q: "Sandeep tears up when the thali is tied",            tag: "Wedding",   seed: 0.58 },
    { id: "m2", q: "The reception dance floor opens with an A.R. Rahman song", tag: "Reception", seed: 0.47 },
    { id: "m3", q: "The reception party goes past 11:00 PM",              tag: "Reception", seed: 0.66 },
    { id: "m4", q: "Sandeep hits the dance floor before Priyanka",        tag: "Reception", seed: 0.39 },
    { id: "m5", q: "Priyanka wears 3 or more outfits across both days",   tag: "Style",     seed: 0.71 },
    { id: "m6", q: "The first couple photo goes online before noon on Jan 28", tag: "Wedding", seed: 0.44 },
    { id: "m7", q: "It rains in Mahabalipuram on the wedding morning",    tag: "Wild card", seed: 0.12 },
    { id: "m8", q: "Someone from Team Groom dozes off during the muhurtham", tag: "Wild card", seed: 0.33 },
  ],
  startingCoins: 1000,

  /* ---- Daily Mystery Box rewards (cycles one per day) ----
     type: coins | xp | trivia | fact | stat
     Add personal photo or story drops here once the family has them. */
  mysteryBoxes: [
    { type: "coins", title: "Coin shower", text: "Love Coins for your portfolio.", amount: 120, tier: "common" },
    { type: "trivia", title: "Wedding trivia", q: "In the Kasi Yatra ritual, what does the groom pretend to do?",
      options: ["Leave for Kashi to become an ascetic", "Run away with the wedding feast", "Hide the bride's sandals"], answer: 0, xp: 60, tier: "rare" },
    { type: "fact", title: "Venue lore", text: "The Shore Temple at Mahabalipuram, a few kilometres from the venue, was built in the early 8th century under the Pallava king Narasimhavarman II. It has faced the sea for about 1,300 years.", xp: 40, tier: "common" },
    { type: "stat", title: "Sealed teaser", stat: "hssLean", xp: 50, tier: "rare" },
    { type: "trivia", title: "Wedding trivia", q: "How many steps do the couple take together in the Saptapadi?",
      options: ["Three", "Five", "Seven"], answer: 2, xp: 60, tier: "rare" },
    { type: "xp", title: "XP surge", text: "A burst of experience points.", amount: 90, tier: "common" },
    { type: "fact", title: "Tradition", text: "In the Oonjal ceremony the couple sit on a decorated swing while relatives sing and circle them with coloured rice balls to ward off the evil eye.", xp: 40, tier: "common" },
    { type: "trivia", title: "Venue trivia", q: "Since which year has the Group of Monuments at Mahabalipuram been a UNESCO World Heritage Site?",
      options: ["1964", "1984", "2004"], answer: 1, xp: 70, tier: "rare" },
    { type: "stat", title: "Market whisper", stat: "hotMarket", xp: 50, tier: "rare" },
    { type: "coins", title: "Jackpot", text: "The box was heavier than it looked.", amount: 400, tier: "epic" },
    { type: "fact", title: "Tradition", text: "After the thali is tied, the couple are shown the star Arundhati, a symbol of a devoted and lasting marriage.", xp: 40, tier: "common" },
    { type: "trivia", title: "Wedding trivia", q: "What are Nalangu games?",
      options: ["Playful games the couple play after the wedding", "A cricket match between the two families", "A cooking contest for the in-laws"], answer: 0, xp: 60, tier: "rare" },
  ],

  /* Names used for the sample crowd in preview mode only. */
  demoNames: ["Karthik", "Divya", "Arun", "Meena", "Vignesh", "Lakshmi", "Rahul", "Anitha", "Suresh", "Keerthana",
    "Pradeep", "Nithya", "Harish", "Swathi", "Ganesh", "Revathi", "Ajay", "Deepa", "Manoj", "Kavya"],
  demoCities: ["Chennai", "Coimbatore", "Madurai", "Bengaluru", "Trichy", "Dubai", "Singapore", "London", "Hyderabad", "Pondicherry"],
};
