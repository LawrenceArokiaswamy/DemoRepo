import type { CourseDraft, ConceptPack } from "./schemas";

// A complete, hand-written course used when no AI key is configured, and in
// tests. It exercises every engine feature: a prerequisite graph, misconceptions
// rooted in earlier concepts, and all three item kinds.

export const DEMO_TOPIC = "Statistics & probability foundations";

export const demoCourse: CourseDraft = {
  title: DEMO_TOPIC,
  description:
    "Go from averages to expected value. By the end you can summarise data honestly and reason about chance in everyday decisions.",
  concepts: [
    {
      id: "percent",
      title: "Fractions, decimals & percentages",
      summary: "The same proportion can be written as 3/4, 0.75 or 75%, and you can move between them.",
      prerequisites: [],
      misconceptions: [
        { id: "percent-of-100", description: "A percentage is always out of the whole group's count, not out of 100", rootConceptId: null },
      ],
    },
    {
      id: "mean",
      title: "The mean",
      summary: "The mean is the total shared out equally: add the values and divide by how many there are.",
      prerequisites: [],
      misconceptions: [
        { id: "mean-divide-wrong", description: "Divide the total by the largest value (or by anything other than the count)", rootConceptId: null },
        { id: "mean-ignore-zero", description: "Zeros don't count toward the number of values", rootConceptId: null },
      ],
    },
    {
      id: "median",
      title: "The median",
      summary: "The median is the middle value once the data is sorted.",
      prerequisites: [],
      misconceptions: [{ id: "median-unsorted", description: "The median is the middle of the list as written, without sorting", rootConceptId: null }],
    },
    {
      id: "outliers",
      title: "Outliers & choosing an average",
      summary: "One extreme value drags the mean but barely moves the median, so the median describes skewed data better.",
      prerequisites: ["mean", "median"],
      misconceptions: [
        { id: "outlier-moves-median", description: "An extreme value moves the median as much as the mean", rootConceptId: "median" },
        { id: "mean-always-best", description: "The mean is always the best 'typical' value", rootConceptId: null },
      ],
    },
    {
      id: "probability",
      title: "Probability of an event",
      summary: "With equally likely outcomes, P(event) = favourable outcomes ÷ total outcomes, a number from 0 to 1.",
      prerequisites: ["percent"],
      misconceptions: [
        { id: "prob-over-one", description: "Probabilities can be bigger than 1", rootConceptId: "percent" },
        { id: "prob-gamblers", description: "After a run of one outcome, the other becomes 'due' (gambler's fallacy)", rootConceptId: null },
      ],
    },
    {
      id: "complement",
      title: "The complement rule",
      summary: "P(not A) = 1 − P(A): the chance something doesn't happen is everything left over.",
      prerequisites: ["probability"],
      misconceptions: [{ id: "complement-same", description: "P(not A) equals P(A)", rootConceptId: null }],
    },
    {
      id: "independent",
      title: "Independent events (AND)",
      summary: "For independent events, P(A and B) = P(A) × P(B), which is smaller than either.",
      prerequisites: ["probability"],
      misconceptions: [
        { id: "and-add", description: "To get P(A and B), add the probabilities", rootConceptId: null },
        { id: "and-fraction-multiply", description: "Multiplying fractions: multiply tops, add bottoms", rootConceptId: "percent" },
      ],
    },
    {
      id: "expected-value",
      title: "Expected value",
      summary: "Expected value is the long-run average: each outcome's value × its probability, added up.",
      prerequisites: ["mean", "probability"],
      misconceptions: [
        { id: "ev-most-likely", description: "Expected value is the single most likely outcome", rootConceptId: null },
        { id: "ev-plain-average", description: "Expected value is the plain average of the outcomes, ignoring probabilities", rootConceptId: "mean" },
      ],
    },
  ],
};

type Opt = ConceptPack["items"][number]["options"][number];
const opt = (text: string, correct: boolean, feedback: string, misconceptionId: string | null = null): Opt => ({
  text,
  correct,
  feedback,
  misconceptionId,
});
const numeric = (difficulty: number, prompt: string, answer: number, solution: string, tolerance: number | null = null) => ({
  kind: "numeric" as const,
  difficulty,
  prompt,
  options: [],
  answer,
  tolerance,
  rubric: [],
  solution,
});
const mcq = (difficulty: number, prompt: string, options: Opt[], solution: string) => ({
  kind: "mcq" as const,
  difficulty,
  prompt,
  options,
  answer: null,
  tolerance: null,
  rubric: [],
  solution,
});
/** Offline grading of "explain" items matches these keyword groups (any word in a group counts). */
const explain = (difficulty: number, prompt: string, rubric: string[], solution: string) => ({
  kind: "explain" as const,
  difficulty,
  prompt,
  options: [],
  answer: null,
  tolerance: null,
  rubric,
  solution,
});

export const demoPacks: Record<string, ConceptPack> = {
  percent: {
    lesson: {
      hook: "A shop says “25% off” and another says “¼ off”. Which is the better deal?",
      steps: [
        { heading: "A proportion is a part of a whole", body: "If 3 of 4 slices are eaten, the eaten part is **3 out of 4**: the fraction **3/4**." },
        { heading: "Decimals are fractions out of 10, 100, 1000…", body: "3/4 = 75/100 = **0.75**. To convert any fraction, divide the top by the bottom: 3 ÷ 4 = 0.75." },
        { heading: "Percent means “out of 100”", body: "0.75 = 75/100 = **75%**. Multiply a decimal by 100 to get the percentage." },
      ],
      workedExample: "Write 2/5 as a decimal and a percentage.\n\n1. Divide: 2 ÷ 5 = **0.4**\n2. Multiply by 100: 0.4 × 100 = **40%**\n\nSo 2/5 = 0.4 = 40%. (And “25% off” and “¼ off” are the same deal.)",
      keyIdea: "Fraction, decimal and percentage are three spellings of the same proportion.",
    },
    items: [
      numeric(1, "Write **1/4** as a decimal.", 0.25, "1 ÷ 4 = 0.25."),
      mcq(1, "What is **0.6** as a percentage?", [
        opt("60%", true, "Right: 0.6 × 100 = 60."),
        opt("6%", false, "6% is 0.06. Multiply the decimal by 100: 0.6 × 100 = 60%."),
        opt("0.6%", false, "0.6% is 0.006. To turn a decimal into a percent, multiply by 100."),
        opt("600%", false, "600% would be 6. 0.6 × 100 = 60%."),
      ], "Percent means out of 100: 0.6 = 60/100 = 60%."),
      mcq(2, "In a class of 20, 5 students walk to school. What percentage walk?", [
        opt("25%", true, "Yes: 5/20 = 0.25 = 25%."),
        opt("5%", false, "5 is the count, not the percentage. 5 out of 20 is 5/20 = 0.25 = 25%.", "percent-of-100"),
        opt("20%", false, "20 is the class size. The proportion is 5/20 = 25%.", "percent-of-100"),
        opt("4%", false, "That's 20 ÷ 5 upside down and not scaled. 5 ÷ 20 = 0.25 = 25%."),
      ], "Proportion = part ÷ whole = 5 ÷ 20 = 0.25 → 25%."),
      numeric(2, "A jacket costs $80 and is 15% off. How many dollars do you save?", 12, "15% = 0.15. 0.15 × 80 = $12."),
      numeric(3, "A test has 40 questions. You need at least 70% to pass. What is the smallest number of correct answers that passes?", 28, "0.70 × 40 = 28 questions."),
      explain(3, "Your friend says “3/8 is bigger than 1/3 because 8 is bigger than 3.” Explain whether they are right and how you know.", ["0.375|37.5|375", "0.33|33|333|third", "divide|decimal|convert|common|denominator|24"], "Convert both: 3/8 = 0.375 and 1/3 ≈ 0.333, so 3/8 is bigger — but not because 8 > 3. The size of a fraction depends on top ÷ bottom, not on the bottom alone."),
    ],
  },
  mean: {
    lesson: {
      hook: "Three friends have $2, $5 and $11. If they pooled it and split it evenly, how much would each get?",
      steps: [
        { heading: "Pool everything", body: "Add all the values: 2 + 5 + 11 = **18**." },
        { heading: "Share it out equally", body: "Divide by **how many values there are**: 18 ÷ 3 = **6**. Each friend gets $6." },
        { heading: "That's the mean", body: "**Mean = total ÷ count.** Every value counts toward the count — including zeros." },
      ],
      workedExample: "Find the mean of 4, 0, 7, 9.\n\n1. Total: 4 + 0 + 7 + 9 = 20\n2. Count: there are **4** values (the 0 counts!)\n3. Mean: 20 ÷ 4 = **5**",
      keyIdea: "The mean is what everyone would get if the total were shared out equally.",
    },
    items: [
      numeric(1, "Find the mean of **3, 5, 7**.", 5, "Total 15, count 3, mean 15 ÷ 3 = 5."),
      mcq(1, "To find the mean of 10, 20 and 30, you add them to get 60 and then…", [
        opt("divide by 3", true, "Yes — divide by how many values there are."),
        opt("divide by 30", false, "30 is the largest value. Divide by the count of values: 60 ÷ 3 = 20.", "mean-divide-wrong"),
        opt("divide by 2", false, "There are 3 values, so divide by 3."),
        opt("stop: 60 is the mean", false, "60 is the total. Share it among the 3 values: 20."),
      ], "Mean = total ÷ count = 60 ÷ 3 = 20."),
      numeric(2, "A shop sold 0, 4, 6 and 10 umbrellas on four days. What was the mean number sold per day?", 5, "Total 20, count **4** (the zero day counts), mean 5."),
      mcq(2, "The mean of four numbers is 6. What is their total?", [
        opt("24", true, "Right: total = mean × count = 6 × 4."),
        opt("10", false, "That's 6 + 4. Total = mean × count = 24."),
        opt("1.5", false, "That's 6 ÷ 4. Undo the division instead: 6 × 4 = 24."),
        opt("6", false, "6 is the mean; the total is 6 × 4 = 24."),
      ], "mean = total ÷ count, so total = mean × count = 24."),
      numeric(3, "Your quiz scores are 7, 8 and 6. What do you need on the 4th quiz for a mean of 8?", 11, "For a mean of 8 over 4 quizzes you need a total of 32. You have 21, so you need 11."),
      explain(3, "A team's mean score is 50. A new player joins who scores exactly 50. Does the mean change? Explain why.", ["no|not|same|stay|unchanged", "total|sum|add|equal|share|balance"], "No. The new total is 50 more and the count is 1 more, so the share per person stays 50. Adding a value equal to the mean never changes the mean."),
    ],
  },
  median: {
    lesson: {
      hook: "Five people line up by height. Who is the “middle” person?",
      steps: [
        { heading: "Sort first", body: "Put the values in order, smallest to largest. **Always** sort before you look for the middle." },
        { heading: "Odd count: take the middle one", body: "For 3, 9, 4, 1, 7 → sorted 1, 3, **4**, 7, 9. The median is **4**." },
        { heading: "Even count: average the middle two", body: "For 2, 8, 4, 6 → sorted 2, **4, 6**, 8. Median = (4 + 6) ÷ 2 = **5**." },
      ],
      workedExample: "Find the median of 12, 3, 8, 5, 20, 1.\n\n1. Sort: 1, 3, 5, 8, 12, 20\n2. Six values, so the middle two are 5 and 8\n3. Median = (5 + 8) ÷ 2 = **6.5**",
      keyIdea: "The median is the middle value once the data is sorted.",
    },
    items: [
      numeric(1, "Find the median of **2, 9, 5**.", 5, "Sorted: 2, 5, 9. Middle value 5."),
      mcq(1, "What is the median of **8, 1, 6, 3, 4**?", [
        opt("4", true, "Yes: sorted 1, 3, 4, 6, 8 — the middle is 4."),
        opt("6", false, "6 is in the middle of the list *as written*. Sort first: 1, 3, 4, 6, 8 → 4.", "median-unsorted"),
        opt("4.4", false, "4.4 is the mean. The median is the middle sorted value: 4."),
        opt("3", false, "Sorted it's 1, 3, 4, 6, 8; the middle (3rd) value is 4."),
      ], "Sort: 1, 3, 4, 6, 8 → median 4."),
      numeric(2, "Find the median of **10, 2, 7, 4**.", 5.5, "Sorted 2, 4, 7, 10. Middle two 4 and 7 → (4 + 7) ÷ 2 = 5.5."),
      numeric(2, "Seven houses on a street sold for (in $1000s): 210, 180, 950, 200, 190, 220, 205. What is the median price in $1000s?", 205, "Sorted: 180, 190, 200, **205**, 210, 220, 950 → 205."),
      explain(3, "Why do you have to sort the data before finding the median? Give a small example where not sorting gives the wrong answer.", ["order|sort|rank|smallest|largest", "middle|half|centre|center"], "The median is the value with half the data below it and half above, which only makes sense in order. Example: 9, 1, 5 — the middle as written is 1, but sorted (1, 5, 9) the median is 5."),
      numeric(3, "A data set has 9 values. Its median is 30. You add two new values: 5 and 100. What is the new median?", 30, "One value is added below 30 and one above, so 30 stays in the middle (now the 6th of 11)."),
    ],
  },
  outliers: {
    lesson: {
      hook: "Nine people in a café earn about $40k each. A billionaire walks in. What happened to the “average” income?",
      steps: [
        { heading: "The mean feels every value", body: "The mean shares the total equally, so one huge value raises everyone's share. The café's mean income jumps to **over $100 million**." },
        { heading: "The median only cares about position", body: "The billionaire is just one more value at the top of the sorted list. The middle person still earns about **$40k**." },
        { heading: "Choose the average that tells the truth", body: "When data has **outliers** or is skewed (incomes, house prices), the **median** is the better ‘typical’ value. When data is symmetric, mean and median agree." },
      ],
      workedExample: "Data: 3, 4, 4, 5, 34.\n\n- Mean = 50 ÷ 5 = **10** (no value is near 10!)\n- Median = **4**\n\nThe outlier 34 dragged the mean far from the typical value; the median stayed put.",
      keyIdea: "One extreme value drags the mean but barely moves the median.",
    },
    items: [
      mcq(1, "A data set has one very large outlier. Which is pulled more by it?", [
        opt("The mean", true, "Yes — the outlier is part of the total that gets shared out."),
        opt("The median", false, "The median only depends on which value is in the middle; one extreme value barely shifts it.", "outlier-moves-median"),
        opt("Both equally", false, "The mean uses every value's size; the median only its position.", "outlier-moves-median"),
        opt("Neither", false, "The mean is pulled strongly, because the outlier enters the total."),
      ], "The mean includes the outlier's size; the median only its rank."),
      numeric(2, "Data: 2, 3, 3, 4, 48. By how much is the mean bigger than the median?", 9, "Mean = 60 ÷ 5 = 12. Median = 3. Difference = 9."),
      mcq(2, "Which is the better ‘typical’ value for house prices in a city with a few mansions?", [
        opt("The median", true, "Right — the few mansions would drag the mean upward."),
        opt("The mean", false, "The mansions inflate the mean so it describes almost nobody's house.", "mean-always-best"),
        opt("The largest price", false, "That describes the mansions, not a typical house."),
        opt("They are always the same", false, "Only for symmetric data. Skewed data separates them."),
      ], "Skewed data → median."),
      numeric(2, "The median of 1, 2, 3, 4, 5 is 3. If 5 is changed to 500, what is the new median?", 3, "Sorted: 1, 2, **3**, 4, 500. The middle value doesn't change."),
      explain(3, "A news story says “the average salary at our company is $250,000”. Most staff earn about $50,000. How can both be true, and what would you ask?", ["mean|average", "outlier|ceo|executive|few|extreme|skew", "median|middle|typical"], "If a few executives earn millions, they pull the mean far above what most staff earn. Ask for the median, which reflects the typical employee."),
      mcq(3, "Adding one new value makes the mean go up by a lot but leaves the median the same. What does that tell you about the new value?", [
        opt("It is far above the other values", true, "Yes — it raised the total a lot but only took a place at the end of the sorted list."),
        opt("It equals the median", false, "Then the mean would barely move."),
        opt("It is far below the other values", false, "That would pull the mean down, not up."),
        opt("It replaced the middle value", false, "Adding a value can't replace one; and it would move the median."),
      ], "A big jump in the mean with a stable median is the signature of a high outlier."),
    ],
  },
  probability: {
    lesson: {
      hook: "You roll a normal die. How likely is it to show a number greater than 4?",
      steps: [
        { heading: "List what can happen", body: "A die has **6 equally likely outcomes**: 1, 2, 3, 4, 5, 6." },
        { heading: "Count the ones you want", body: "Greater than 4 means **5 or 6**: 2 favourable outcomes." },
        { heading: "Probability = favourable ÷ total", body: "P(>4) = 2/6 = **1/3 ≈ 0.33**. Probabilities run from **0** (impossible) to **1** (certain) — never above 1." },
      ],
      workedExample: "A bag has 3 red and 5 blue marbles. P(red)?\n\n1. Total outcomes: 3 + 5 = 8\n2. Favourable: 3 red\n3. P(red) = 3/8 = **0.375**, or 37.5%",
      keyIdea: "With equally likely outcomes, probability is favourable ÷ total, between 0 and 1.",
    },
    items: [
      numeric(1, "A fair coin is flipped. What is the probability of heads? (as a decimal)", 0.5, "1 favourable out of 2 → 0.5."),
      mcq(1, "Which of these **cannot** be a probability?", [
        opt("1.2", true, "Right — probabilities can't exceed 1 (certain)."),
        opt("0", false, "0 is a valid probability: an impossible event.", "prob-over-one"),
        opt("1", false, "1 is a valid probability: a certain event.", "prob-over-one"),
        opt("0.999", false, "That's between 0 and 1, so it's valid.", "prob-over-one"),
      ], "Probabilities live between 0 and 1."),
      numeric(2, "A bag has 2 green, 3 yellow and 5 red sweets. You pick one at random. What is P(yellow)? (decimal)", 0.3, "3 yellow out of 10 total → 0.3."),
      mcq(2, "A fair coin lands heads 5 times in a row. What is the probability the next flip is tails?", [
        opt("0.5", true, "Yes — the coin has no memory. Each flip is still 1/2."),
        opt("More than 0.5 — tails is due", false, "This is the gambler's fallacy. Past flips don't change the coin.", "prob-gamblers"),
        opt("Less than 0.5 — heads is on a streak", false, "Streaks don't change a fair coin. Still 0.5."),
        opt("1", false, "Nothing forces tails. It's 0.5."),
      ], "Independent flips: always 0.5."),
      numeric(3, "A spinner has 8 equal sections numbered 1–8. What is the probability of landing on a prime number? (decimal)", 0.5, "Primes from 1–8: 2, 3, 5, 7 → 4 of 8 = 0.5. (1 is not prime.)"),
      explain(3, "A weather app says “70% chance of rain”. It doesn't rain. Was the app wrong? Explain.", ["not|no|necessarily|wrong", "30|0.3|chance|likely|sometimes|out of|long"], "Not necessarily. 70% means on days like this, it rains about 7 times out of 10 — so about 3 in 10 stay dry. One dry day is consistent with the forecast; you'd judge it over many days."),
    ],
  },
  complement: {
    lesson: {
      hook: "There's a 0.15 chance your train is late. What's the chance it's on time?",
      steps: [
        { heading: "Something always happens", body: "Either the train is late or it isn't. Together those cover **every** possibility, so their probabilities add to **1**." },
        { heading: "So the rest is the complement", body: "P(not late) = 1 − P(late) = 1 − 0.15 = **0.85**." },
        { heading: "Use it when ‘not’ is easier", body: "“At least one” questions are often easiest as 1 − P(none)." },
      ],
      workedExample: "P(rolling a 6) = 1/6. What is P(not a 6)?\n\nP(not 6) = 1 − 1/6 = **5/6 ≈ 0.83**",
      keyIdea: "P(not A) = 1 − P(A).",
    },
    items: [
      numeric(1, "P(A) = 0.3. What is P(not A)?", 0.7, "1 − 0.3 = 0.7."),
      mcq(1, "The chance of snow tomorrow is 0.2. What is the chance of no snow?", [
        opt("0.8", true, "Right: 1 − 0.2."),
        opt("0.2", false, "That's the chance of snow. No snow is everything else: 1 − 0.2 = 0.8.", "complement-same"),
        opt("−0.2", false, "Probabilities can't be negative. 1 − 0.2 = 0.8."),
        opt("1.2", false, "That's 1 + 0.2. Subtract: 0.8."),
      ], "Complement: 1 − 0.2 = 0.8."),
      numeric(2, "A bag has 4 red and 6 other marbles. What is P(not red)? (decimal)", 0.6, "P(red) = 0.4, so P(not red) = 0.6."),
      numeric(2, "A component fails with probability 0.02. What is the probability it works? (decimal)", 0.98, "1 − 0.02 = 0.98."),
      numeric(3, "You flip a fair coin 3 times. What is the probability of getting **at least one** head? (decimal)", 0.875, "P(no heads) = 0.5³ = 0.125, so P(at least one) = 1 − 0.125 = 0.875.", 0.001),
      explain(3, "Explain why P(A) + P(not A) must equal 1.", ["every|all|always|either|cover|possib", "1|one|certain|whole|100"], "Every outcome is either in A or not in A, never both. Together they cover all outcomes, and the probability that *something* happens is 1."),
    ],
  },
  independent: {
    lesson: {
      hook: "You flip a coin and roll a die. What is the chance of heads **and** a 6?",
      steps: [
        { heading: "Independent means no influence", body: "The coin doesn't affect the die. Events like that are **independent**." },
        { heading: "A fraction of a fraction", body: "Half the time you get heads. Of *those* times, 1/6 also show a 6. So it's 1/6 **of** 1/2." },
        { heading: "‘Of’ means multiply", body: "P(heads and 6) = 1/2 × 1/6 = **1/12**. Multiply tops and bottoms. The result is **smaller** than either probability — both things must happen." },
      ],
      workedExample: "P(rain Monday) = 0.3 and P(rain Tuesday) = 0.4, independently. P(rain both days)?\n\n0.3 × 0.4 = **0.12**",
      keyIdea: "For independent events, P(A and B) = P(A) × P(B).",
    },
    items: [
      numeric(1, "Two fair coins are flipped. What is P(both heads)? (decimal)", 0.25, "0.5 × 0.5 = 0.25."),
      mcq(1, "P(A) = 0.5 and P(B) = 0.4, independent. What is P(A and B)?", [
        opt("0.2", true, "Yes: 0.5 × 0.4 = 0.2."),
        opt("0.9", false, "Adding gives 0.9 — but ‘both’ must be *less* likely than either alone. Multiply: 0.2.", "and-add"),
        opt("0.45", false, "That's the average. Multiply: 0.5 × 0.4 = 0.2."),
        opt("0.1", false, "That's 0.5 − 0.4. Multiply: 0.2."),
      ], "AND for independent events → multiply."),
      mcq(2, "What is 1/2 × 1/3?", [
        opt("1/6", true, "Right: multiply the tops (1×1) and the bottoms (2×3)."),
        opt("1/5", false, "You added the bottoms. Multiply them: 2 × 3 = 6 → 1/6.", "and-fraction-multiply"),
        opt("2/5", false, "That adds tops and bottoms. Multiply: 1/6.", "and-fraction-multiply"),
        opt("5/6", false, "That's 1/2 + 1/3. For ‘of’, multiply: 1/6."),
      ], "1/2 × 1/3 = 1/6."),
      numeric(2, "You roll two dice. What is P(both show 6)? (decimal, 3 places)", 0.028, "1/6 × 1/6 = 1/36 ≈ 0.028.", 0.001),
      numeric(3, "A password needs a lucky guess of a 3-digit code (000–999) **and** a coin flip of heads. What is the probability of both? (decimal)", 0.0005, "1/1000 × 1/2 = 1/2000 = 0.0005.", 0.00001),
      explain(3, "Why is P(A and B) never bigger than P(A) for independent events?", ["multiply|times|fraction|of", "less|smaller|at most|≤|1|both"], "Because P(A and B) = P(A) × P(B), and P(B) is at most 1. Multiplying by a number ≤ 1 can't make P(A) bigger. Needing both to happen is at least as hard as needing one."),
    ],
  },
  "expected-value": {
    lesson: {
      hook: "A game costs $1. Roll a die: a 6 wins $5, anything else wins nothing. Should you play?",
      steps: [
        { heading: "Imagine playing many times", body: "Over 600 games, you'd expect about **100 sixes** (1/6 of the time)." },
        { heading: "Total winnings, shared per game", body: "100 × $5 = $500 over 600 games, which is **$500 ÷ 600 ≈ $0.83 per game** — that's a mean!" },
        { heading: "The shortcut", body: "**EV = Σ value × probability** = $5 × 1/6 + $0 × 5/6 ≈ **$0.83**. It costs $1, so on average you lose about 17¢ a game." },
      ],
      workedExample: "A raffle ticket: 1% chance of $200, otherwise $0.\n\nEV = 200 × 0.01 + 0 × 0.99 = **$2**. A $5 ticket is a bad deal on average.",
      keyIdea: "Expected value is the long-run average: each value times its probability, added up.",
    },
    items: [
      numeric(1, "A game pays $10 with probability 0.5 and $0 otherwise. What is the expected value in dollars?", 5, "10 × 0.5 + 0 × 0.5 = 5."),
      mcq(1, "A bet: 0.9 chance of $0, 0.1 chance of $100. Which is the expected value?", [
        opt("$10", true, "Right: 100 × 0.1 + 0 × 0.9."),
        opt("$0 — that's what usually happens", false, "That's the most likely outcome. EV weights every outcome by its probability: $10.", "ev-most-likely"),
        opt("$50", false, "That's the plain average of $0 and $100, ignoring that $100 is rare.", "ev-plain-average"),
        opt("$100", false, "You only win $100 one time in ten. EV = $10."),
      ], "EV = Σ value × probability = $10."),
      numeric(2, "A die game pays $6 for a 6, $3 for a 5, and $0 otherwise. What is the expected payout in dollars?", 1.5, "6 × 1/6 + 3 × 1/6 = 1 + 0.5 = 1.5."),
      mcq(2, "Insurance costs $50 a year. There's a 2% chance of a $2,000 claim. From the insurer's side, what is the expected profit per policy?", [
        opt("$10", true, "Yes: they expect to pay 0.02 × 2000 = $40, and collect $50."),
        opt("$50", false, "That ignores expected payouts of 0.02 × $2,000 = $40."),
        opt("−$1,950", false, "That's the worst single case, not the long-run average."),
        opt("$1,025", false, "That's a plain average of outcomes ignoring probabilities.", "ev-plain-average"),
      ], "Expected payout = $40, premium $50 → expected profit $10."),
      numeric(3, "You can take $40 for sure, or flip a coin: heads $100, tails $0. By how many dollars does the coin flip's expected value beat the sure thing?", 10, "EV(flip) = 0.5 × 100 = $50; 50 − 40 = $10."),
      explain(3, "A lottery ticket's expected value is $0.45 and it costs $2. Your friend says “someone has to win, so it's worth it.” Explain what expected value tells you here.", ["average|long|many|repeated|run", "lose|loss|less|1.55|negative|cost"], "Expected value is what you'd average per ticket over many plays: $0.45 back for every $2 — a loss of about $1.55 per ticket. Someone wins, but the average player loses."),
    ],
  },
};
