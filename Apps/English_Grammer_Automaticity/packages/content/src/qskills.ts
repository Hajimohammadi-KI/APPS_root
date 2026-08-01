export type QSkillsResourceKind = "pdf" | "audio" | "video" | "archive";

export interface QSkillsResource {
  title: string;
  kind: QSkillsResourceKind;
  url: string;
}

export interface QSkillsUnit {
  number: number;
  domain: string;
  question: string;
  readingWritingQuestion: string;
  listeningSkill: string;
  speakingSkill: string;
  speakingAssignment: string;
  readingSkill: string;
  writingSkill: string;
  writingAssignment: string;
}

export interface QSkillsLevel {
  level: number;
  units: QSkillsUnit[];
  resources: QSkillsResource[];
}

const driveFile = (id: string) => `https://drive.google.com/file/d/${id}/view`;

const rawLevels = [
  {
    "level": 1,
    "units": [
      {
        "number": 1,
        "domain": "Business",
        "question": "What are employers looking for?",
        "listeningSkill": "Listening for key words and phrases",
        "speakingSkill": "Asking for repetition and clarification",
        "speakingAssignment": "Role-play a job interview",
        "readingSkill": "Previewing",
        "writingSkill": "Writing a main idea and supporting sentences",
        "writingAssignment": "Write about a job that’s right for you",
        "readingWritingQuestion": "What is a good job?"
      },
      {
        "number": 2,
        "domain": "Cognitive Science",
        "question": "Can we change our brains?",
        "listeningSkill": "Listening for main ideas and details",
        "speakingSkill": "Presenting information from notes",
        "speakingAssignment": "Give a presentation",
        "readingSkill": "Skimming",
        "writingSkill": "Writing sentences with but and so",
        "writingAssignment": "Write about how you study",
        "readingWritingQuestion": "What is the best way to study?"
      },
      {
        "number": 3,
        "domain": "Sociology",
        "question": "What is the best kind of vacation?",
        "listeningSkill": "Understanding numbers and dates",
        "speakingSkill": "Introducing topics in a presentation",
        "speakingAssignment": "Plan and present a travel tour",
        "readingSkill": "Reading charts, graphs, and tables",
        "writingSkill": "Using correct paragraph structure",
        "writingAssignment": "Write a paragraph about the best way to relax",
        "readingWritingQuestion": "Is vacation the best way to relax?"
      },
      {
        "number": 4,
        "domain": "Physiology",
        "question": "Does body language tell the truth?",
        "listeningSkill": "Listening for specific information",
        "speakingSkill": "Using eye contact, facial expressions, and body language",
        "speakingAssignment": "Tell a personal story or describe a scene",
        "readingSkill": "Identifying the topic sentence in a paragraph",
        "writingSkill": "Writing a topic sentence",
        "writingAssignment": "Write a paragraph about one way laughter is good for you",
        "readingWritingQuestion": "What makes you laugh?"
      },
      {
        "number": 5,
        "domain": "Psychology",
        "question": "Why do we enjoy sports?",
        "listeningSkill": "Listening for signal words and phrases",
        "speakingSkill": "Asking for and giving opinions",
        "speakingAssignment": "Interview a group about sports preferences",
        "readingSkill": "Identifying supporting sentences and details",
        "writingSkill": "Writing supporting sentences and details",
        "writingAssignment": "Write a paragraph about your favorite sport",
        "readingWritingQuestion": "What is a sport?"
      },
      {
        "number": 6,
        "domain": "Marketing",
        "question": "How do we make decisions?",
        "listeningSkill": "Making inferences",
        "speakingSkill": "Sourcing information",
        "speakingAssignment": "Report on a class survey",
        "readingSkill": "Identifying pronoun referents",
        "writingSkill": "Writing concluding sentences",
        "writingAssignment": "Write an opinion paragraph",
        "readingWritingQuestion": "Is choice always a good thing?"
      },
      {
        "number": 7,
        "domain": "Behavioral Science",
        "question": "Can young people change the world?",
        "listeningSkill": "Listening for different opinions",
        "speakingSkill": "Checking for listeners’ understanding",
        "speakingAssignment": "Give instructions",
        "readingSkill": "Marking the margins",
        "writingSkill": "Making a timeline to plan your writing",
        "writingAssignment": "Write a paragraph about important changes in your life",
        "readingWritingQuestion": "Is the world changing too fast?"
      },
      {
        "number": 8,
        "domain": "Psychology",
        "question": "When is it good to be afraid?",
        "listeningSkill": "Listening for examples",
        "speakingSkill": "Expressing emotion",
        "speakingAssignment": "Tell a personal story",
        "readingSkill": "Identifying facts and opinions",
        "writingSkill": "Contrasting ideas with however",
        "writingAssignment": "Write one or more paragraphs about a common fear",
        "readingWritingQuestion": "What are you afraid of?"
      }
    ],
    "resources": [
      [
        "Student Book",
        "pdf",
        "11cCbx3C9aM9mHQvGbb35JcnSA3z20wAI"
      ],
      [
        "Teacher Handbook",
        "pdf",
        "1fTSoGoPMdB069ZUNO5mtC1kOjO9ii_TV"
      ],
      [
        "Audio collection",
        "audio",
        "1Ypubi3_Gip0L4HvpVShvL4ZVSVVuserG"
      ],
      [
        "Source collection",
        "archive",
        "1JQe9DVjbGs_PHSF5nTQ-tLgxpbdvMHXM"
      ],
      [
        "Video collection",
        "video",
        "12dqo8yZw2Qi5YIZ1WtWo3qro7QOeOJhl"
      ]
    ]
  },
  {
    "level": 2,
    "units": [
      {
        "number": 1,
        "domain": "Business and Marketing",
        "question": "How important is it to keep up with current trends?",
        "listeningSkill": "Listening for main ideas",
        "speakingSkill": "Drawing attention to main ideas",
        "speakingAssignment": "An experiment with trend spotting",
        "readingSkill": "Identifying the main idea of a paragraph",
        "writingSkill": "Writing a descriptive paragraph",
        "writingAssignment": "Write a descriptive paragraph",
        "readingWritingQuestion": "Why does something become popular?"
      },
      {
        "number": 2,
        "domain": "Psychology",
        "question": "How can colors be useful?",
        "listeningSkill": "Understanding cause and effect",
        "speakingSkill": "Asking for and giving examples",
        "speakingAssignment": "Present a building design",
        "readingSkill": "Getting meaning from context",
        "writingSkill": "Brainstorming",
        "writingAssignment": "Write a proposal for a business",
        "readingWritingQuestion": "How do colors affect our behavior?"
      },
      {
        "number": 3,
        "domain": "Social Psychology",
        "question": "Why are social skills important?",
        "listeningSkill": "Predicting",
        "speakingSkill": "Giving advice and making recommendations",
        "speakingAssignment": "Give a presentation on manners",
        "readingSkill": "Identifying supporting details",
        "writingSkill": "Supporting your main idea with examples",
        "writingAssignment": "Write a paragraph with supporting examples",
        "readingWritingQuestion": "What does it mean to be polite?"
      },
      {
        "number": 4,
        "domain": "Technology",
        "question": "How does technology affect our relationships?",
        "listeningSkill": "Listening for specific information",
        "speakingSkill": "Asking for and giving clarification",
        "speakingAssignment": "Have a panel discussion about social media",
        "readingSkill": "Taking notes",
        "writingSkill": "Writing an opinion paragraph",
        "writingAssignment": "Write an opinion paragraph",
        "readingWritingQuestion": "How can technology improve performance?"
      },
      {
        "number": 5,
        "domain": "Sociology",
        "question": "What does it mean to be part of a family?",
        "listeningSkill": "Listening for reasons and explanations",
        "speakingSkill": "Expressing opinions",
        "speakingAssignment": "Give a short speech",
        "readingSkill": "Skimming",
        "writingSkill": "Unity in a paragraph",
        "writingAssignment": "Write a plan for a family business",
        "readingWritingQuestion": "What makes a family business successful?"
      },
      {
        "number": 6,
        "domain": "Behavioral Science",
        "question": "How can playing games be good for you?",
        "listeningSkill": "Listening for dates and other numbers",
        "speakingSkill": "Giving instructions",
        "speakingAssignment": "Develop and present an idea for a new game",
        "readingSkill": "Identifying the author’s purpose",
        "writingSkill": "Describing a process",
        "writingAssignment": "Write a paragraph describing a process",
        "readingWritingQuestion": "How can you learn faster and better?"
      },
      {
        "number": 7,
        "domain": "Environmental Science",
        "question": "How do people survive in extreme environments?",
        "listeningSkill": "Recognizing a speaker’s attitude",
        "speakingSkill": "Summarizing",
        "speakingAssignment": "Role-play an interview",
        "readingSkill": "Identifying claims and support",
        "writingSkill": "Using sentence variety",
        "writingAssignment": "Write an opinion paragraph",
        "readingWritingQuestion": "Do cities need nature?"
      },
      {
        "number": 8,
        "domain": "Public Health",
        "question": "How important is cleanliness?",
        "listeningSkill": "Recognizing facts and opinions",
        "speakingSkill": "Participating in a group discussion",
        "speakingAssignment": "Give a persuasive presentation",
        "readingSkill": "Synthesizing information",
        "writingSkill": "Writing an explanatory paragraph",
        "writingAssignment": "Write an explanatory paragraph about an illness",
        "readingWritingQuestion": "How can we prevent diseases?"
      }
    ],
    "resources": [
      [
        "Student Book",
        "pdf",
        "1_kNsi8dZCYWLqq8qSHASkHBiE5PNm_fy"
      ],
      [
        "Teacher Handbook",
        "pdf",
        "1F0hW5JFi17f1ucYyzz05qhfo60uL1Xdz"
      ],
      [
        "Audio collection",
        "audio",
        "1qrhhj80b2c3k9V9fOd1hB7RN0_q0W8Gf"
      ],
      [
        "Source collection",
        "archive",
        "15pYRDgltwEmBGwjNd9cpxz0QZ0DcIvOr"
      ],
      [
        "Video collection",
        "video",
        "1QPEotgIqGbom6g-iakvnmoPlSGFjLvh8"
      ]
    ]
  },
  {
    "level": 3,
    "units": [
      {
        "number": 1,
        "domain": "Sociology",
        "question": "Are first impressions accurate?",
        "listeningSkill": "Making inferences",
        "speakingSkill": "Taking conversational turns",
        "speakingAssignment": "Give a short talk",
        "readingSkill": "Identifying main ideas and supporting details",
        "writingSkill": "Organizing and developing a paragraph",
        "writingAssignment": "Write a “how to” paragraph",
        "readingWritingQuestion": "How do you make a good first impression?"
      },
      {
        "number": 2,
        "domain": "Nutritional Science",
        "question": "Why do we change the foods we eat?",
        "listeningSkill": "Listening for causes and effects",
        "speakingSkill": "Giving advice",
        "speakingAssignment": "Conduct a class survey",
        "readingSkill": "Previewing a text",
        "writingSkill": "Using descriptive adjectives",
        "writingAssignment": "Write a descriptive paragraph",
        "readingWritingQuestion": "What makes food attractive?"
      },
      {
        "number": 3,
        "domain": "Psychology",
        "question": "In what ways is change good or bad?",
        "listeningSkill": "Listening for time markers",
        "speakingSkill": "Asking for and giving reasons",
        "speakingAssignment": "Take part in a group discussion",
        "readingSkill": "Taking notes",
        "writingSkill": "Writing a summary and a personal response",
        "writingAssignment": "Write a summary and a personal response paragraph",
        "readingWritingQuestion": "How has technology affected our lives?"
      },
      {
        "number": 4,
        "domain": "Marketing",
        "question": "How does advertising affect our behavior?",
        "listeningSkill": "Identifying fact and opinion",
        "speakingSkill": "Giving and supporting your opinions",
        "speakingAssignment": "Take part in a group discussion",
        "readingSkill": "Distinguishing facts from opinions",
        "writingSkill": "Writing an opinion essay",
        "writingAssignment": "Write an opinion essay",
        "readingWritingQuestion": "Does advertising help or harm us?"
      },
      {
        "number": 5,
        "domain": "Behavioral Science",
        "question": "Does taking risks change our lives?",
        "listeningSkill": "Listening for different kinds of numbers",
        "speakingSkill": "Giving a short presentation",
        "speakingAssignment": "Give a short presentation",
        "readingSkill": "Using referents to understand contrast",
        "writingSkill": "Writing a narrative essay",
        "writingAssignment": "Write a narrative essay",
        "readingWritingQuestion": "How do people overcome obstacles?"
      },
      {
        "number": 6,
        "domain": "Neurology",
        "question": "Will artificial intelligence ever be as smart as humans?",
        "listeningSkill": "Inferring a speaker’s attitude",
        "speakingSkill": "Leading a group discussion",
        "speakingAssignment": "Take part in a group discussion",
        "readingSkill": "Using a graphic organizer",
        "writingSkill": "Stating reasons and giving examples",
        "writingAssignment": "Write an analysis essay with reasons and examples",
        "readingWritingQuestion": "Are you a good decision maker?"
      },
      {
        "number": 7,
        "domain": "Economics",
        "question": "Can money buy happiness?",
        "listeningSkill": "Listening for signposts",
        "speakingSkill": "Agreeing and disagreeing",
        "speakingAssignment": "Take part in a group discussion",
        "readingSkill": "Using a timeline",
        "writingSkill": "Writing a cause/effect essay",
        "writingAssignment": "Write a cause/effect essay",
        "readingWritingQuestion": "Can a business earn money while making a difference?"
      },
      {
        "number": 8,
        "domain": "Behavioral Science",
        "question": "What can we learn from success and failure?",
        "listeningSkill": "Listening for examples",
        "speakingSkill": "Asking for and giving clarification",
        "speakingAssignment": "Take part in a pair discussion",
        "readingSkill": "Scanning a text",
        "writingSkill": "Writing an argumentative essay",
        "writingAssignment": "Write an argumentative essay",
        "readingWritingQuestion": "What does it take to be successful?"
      }
    ],
    "resources": [
      [
        "Student Book",
        "pdf",
        "1l_LUCA8ZE90rbHjx16Le6TbAb1Hq2twO"
      ],
      [
        "Teacher Handbook",
        "pdf",
        "14LqaAbkrw6OXla6ctAVxPTc9IY9EI7Eg"
      ],
      [
        "Audio collection",
        "audio",
        "1Z-URSO_O_s_jBmEm4RdYIcVkng-7y4Md"
      ],
      [
        "Source collection",
        "archive",
        "17LDGLnnX1wDs5tkFvkBRktOKS3rQE5Xw"
      ],
      [
        "Video collection",
        "video",
        "1wZx0-brJNFFW-Gsf1UHfsQvudiYdD7zv"
      ]
    ]
  },
  {
    "level": 4,
    "units": [
      {
        "number": 1,
        "domain": "Business",
        "question": "What makes a good leader?",
        "listeningSkill": "Listening for main ideas",
        "speakingSkill": "Checking for understanding",
        "speakingAssignment": "Give a presentation on how to be an effective leader",
        "readingSkill": "Previewing and predicting",
        "writingSkill": "Organizing and developing an essay",
        "writingAssignment": "Write an analysis essay",
        "readingWritingQuestion": "What makes someone admirable?"
      },
      {
        "number": 2,
        "domain": "Behavioral Science",
        "question": "How does appearance affect our success?",
        "listeningSkill": "Identifying details",
        "speakingSkill": "Confirming understanding",
        "speakingAssignment": "Role-play a conversation",
        "readingSkill": "Highlighting and annotating",
        "writingSkill": "Writing a descriptive essay",
        "writingAssignment": "Write a descriptive essay",
        "readingWritingQuestion": "How do marketers get our attention?"
      },
      {
        "number": 3,
        "domain": "Developmental Psychology",
        "question": "What skills make someone an adult?",
        "listeningSkill": "Making predictions",
        "speakingSkill": "Giving a presentation",
        "speakingAssignment": "Give a presentation to a group",
        "readingSkill": "Making inferences",
        "writingSkill": "Writing a narrative essay and varying sentence patterns",
        "writingAssignment": "Write a narrative essay",
        "readingWritingQuestion": "What important lessons do we learn as young people?"
      },
      {
        "number": 4,
        "domain": "Science",
        "question": "How do the laws of science affect our lives?",
        "listeningSkill": "Making inferences",
        "speakingSkill": "Avoiding answering questions",
        "speakingAssignment": "Present a business plan",
        "readingSkill": "Understanding comparisons and contrasts",
        "writingSkill": "Writing a compare and contrast essay",
        "writingAssignment": "Write a compare and contrast essay",
        "readingWritingQuestion": "How can science improve lives?"
      },
      {
        "number": 5,
        "domain": "Nutritional Science",
        "question": "How has science changed the food we eat?",
        "listeningSkill": "Understanding bias in a presentation",
        "speakingSkill": "Expressing interest during a conversation",
        "speakingAssignment": "Take part in a debate",
        "readingSkill": "Recognizing bias",
        "writingSkill": "Writing a cause and effect essay",
        "writingAssignment": "Write a cause and effect essay",
        "readingWritingQuestion": "Should science influence what we eat?"
      },
      {
        "number": 6,
        "domain": "Education",
        "question": "Is one road to success better than another?",
        "listeningSkill": "Listening for contrasting ideas",
        "speakingSkill": "Changing the topic",
        "speakingAssignment": "Reach a group decision",
        "readingSkill": "Using an outline",
        "writingSkill": "Writing a summary",
        "writingAssignment": "Write a summary",
        "readingWritingQuestion": "Does school prepare you for work?"
      },
      {
        "number": 7,
        "domain": "Anthropology",
        "question": "How can accidental discoveries affect our lives?",
        "listeningSkill": "Listening for signal words and phrases",
        "speakingSkill": "Using questions to maintain listener interest",
        "speakingAssignment": "Tell a story",
        "readingSkill": "Recognizing facts and opinions",
        "writingSkill": "Writing an opinion essay",
        "writingAssignment": "Write an opinion essay",
        "readingWritingQuestion": "Is discovery always a good thing?"
      },
      {
        "number": 8,
        "domain": "Engineering",
        "question": "What are the consequences of progress?",
        "listeningSkill": "Listening for causes and effects",
        "speakingSkill": "Adding to another speaker’s comments",
        "speakingAssignment": "Share opinions about the consequences of progress",
        "readingSkill": "Identifying counterarguments and refutations",
        "writingSkill": "Writing a persuasive essay",
        "writingAssignment": "Write a persuasive essay",
        "readingWritingQuestion": "Can failure lead to success?"
      }
    ],
    "resources": [
      [
        "Student Book",
        "pdf",
        "1LEp5nGVVqvEX5LFKc1PagSZNscATKhSM"
      ],
      [
        "Teacher Handbook",
        "pdf",
        "1GSm_D0SWquErzOx1Y0uqpE7eHO3TurHP"
      ],
      [
        "Audio collection",
        "audio",
        "1x0izHsqRzz5LOC1Wws2wzsIQw2gKvBBI"
      ],
      [
        "Source collection",
        "archive",
        "1FKCvn759bo6wZfRb5Z7LzAXaY_rH3Q8B"
      ],
      [
        "Video collection",
        "video",
        "1K5pAmzELu4t-cLB2dt2DUia_YWEgkLpm"
      ]
    ]
  },
  {
    "level": 5,
    "units": [
      {
        "number": 1,
        "domain": "Linguistics",
        "question": "How does language affect who we are?",
        "listeningSkill": "Making inferences",
        "speakingSkill": "Using figurative language",
        "speakingAssignment": "Narrate a personal experience",
        "readingSkill": "Distinguishing main ideas from details",
        "writingSkill": "Writing an effective email",
        "writingAssignment": "Write a persuasive email",
        "readingWritingQuestion": "What is the value of learning a new language?"
      },
      {
        "number": 2,
        "domain": "Behavioral Science",
        "question": "What is the tipping point between work and fun?",
        "listeningSkill": "Listening for examples",
        "speakingSkill": "Discussing preferences and alternatives",
        "speakingAssignment": "Present the work and fun aspects of an activity",
        "readingSkill": "Identifying contrasting ideas",
        "writingSkill": "Using evidence to support an argument",
        "writingAssignment": "Write a persuasive newsletter article",
        "readingWritingQuestion": "How is work changing?"
      },
      {
        "number": 3,
        "domain": "Psychology",
        "question": "How can the eyes deceive the mind?",
        "listeningSkill": "Recognizing appositives that explain",
        "speakingSkill": "Clarifying information",
        "speakingAssignment": "Give a group presentation on the uses of visual deception",
        "readingSkill": "Previewing a text",
        "writingSkill": "Writing with unity",
        "writingAssignment": "Write a proposal",
        "readingWritingQuestion": "How well does a picture illustrate the truth?"
      },
      {
        "number": 4,
        "domain": "International Relations",
        "question": "How can we achieve global sustainability?",
        "listeningSkill": "Listening for facts and figures",
        "speakingSkill": "Citing sources",
        "speakingAssignment": "Report on a global problem",
        "readingSkill": "Making inferences",
        "writingSkill": "Organizing supporting ideas",
        "writingAssignment": "Write an essay",
        "readingWritingQuestion": "Why is global cooperation important?"
      },
      {
        "number": 5,
        "domain": "Urban Planning",
        "question": "What should the modern city look like?",
        "listeningSkill": "Recognizing organizational cues",
        "speakingSkill": "Giving advice",
        "speakingAssignment": "Role-play a podcast on life in a city or town",
        "readingSkill": "Following ideas",
        "writingSkill": "Connecting information",
        "writingAssignment": "Write an analysis",
        "readingWritingQuestion": "What makes a public place appealing?"
      },
      {
        "number": 6,
        "domain": "Marketing",
        "question": "What inspires innovation?",
        "listeningSkill": "Distinguishing between facts and opinions",
        "speakingSkill": "Using formal and informal language",
        "speakingAssignment": "Market a new idea",
        "readingSkill": "Anticipating content through questions",
        "writingSkill": "Paraphrasing",
        "writingAssignment": "Write a business plan",
        "readingWritingQuestion": "How can we turn trash into treasure?"
      },
      {
        "number": 7,
        "domain": "Cultural Studies",
        "question": "How do people react to change?",
        "listeningSkill": "Recognizing attitudes",
        "speakingSkill": "Paraphrasing",
        "speakingAssignment": "Conduct a personal interview",
        "readingSkill": "Identifying the author’s intent",
        "writingSkill": "Summarizing",
        "writingAssignment": "Write a summary and response essay",
        "readingWritingQuestion": "How do new discoveries and inventions change the world?"
      },
      {
        "number": 8,
        "domain": "Environmental Studies",
        "question": "Where should the world’s energy come from?",
        "listeningSkill": "Listening for cause and effect",
        "speakingSkill": "Debating opinions",
        "speakingAssignment": "Debate the future of energy",
        "readingSkill": "Organizing notes and annotations in a chart",
        "writingSkill": "Writing a cause and effect essay",
        "writingAssignment": "Write a cause and effect essay",
        "readingWritingQuestion": "What affects people's energy levels?"
      }
    ],
    "resources": [
      [
        "Student Book",
        "pdf",
        "191QdtpY22cvAPU88y8fkNgWHVEZpxTle"
      ],
      [
        "Teacher Handbook",
        "pdf",
        "13m9Uhy_cenG-_Mo4dFqmFtl7gdTgE0Ut"
      ],
      [
        "Audio collection",
        "audio",
        "11FMXfTx_LSoJf2p_dXO8kVsXTTRElkbg"
      ],
      [
        "Source collection",
        "archive",
        "1QicB-hR0JAmfL3X2qJl90QVvPTLQuuEj"
      ],
      [
        "Video collection",
        "video",
        "11OZFA4enlJ97ueALvKiDG5b7YT_1XxVu"
      ]
    ]
  }
] as const;
const rawIntroResources = [
  [
    "Intro Student Book",
    "pdf",
    "1z8ryw1_mZtRIVxtdoYF9K_yAv6CYS-MF"
  ],
  [
    "Intro Audio collection",
    "audio",
    "1hlQxi9rOpCImLdNFBYfyy8DPgyYi5NuF"
  ],
  [
    "Intro Source collection",
    "archive",
    "1AfrcRljoSB_lMjTXemk3r0tEVA1hqub0"
  ],
  [
    "Intro Video collection",
    "video",
    "1k_uEYhBOnFfOib-cKGyBNQFkY8TirRKr"
  ]
] as const;

export const qSkillsLevels: QSkillsLevel[] = rawLevels.map((level) => ({
  level: level.level,
  units: level.units.map((unit) => ({ ...unit })),
  resources: level.resources.map(([title, kind, id]) => ({
    title,
    kind,
    url: driveFile(id),
  })),
}));

export const qSkillsIntroResources: QSkillsResource[] = rawIntroResources.map(
  ([title, kind, id]) => ({ title, kind, url: driveFile(id) }),
);

export const qSkillsSourceFolder =
  "https://drive.google.com/drive/folders/1Xv7e77H3oRmtUSRzSNzzat5gJ-PK3Qvy";
