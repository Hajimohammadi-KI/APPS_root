const ONLINE_RESOURCE_GROUPS = [
  {skill:"Writing",level:"A1",provider:"Test-English",title:"A1 Writing Exercises and Tests",url:"https://test-english.com/writing/a1/"},
  {skill:"Writing",level:"A2",provider:"Test-English",title:"A2 Writing Exercises and Tests",url:"https://test-english.com/writing/a2/"},
  {skill:"Writing",level:"B1",provider:"Test-English",title:"B1 Writing Exercises and Tests",url:"https://test-english.com/writing/b1/"},
  {skill:"Writing",level:"B1+",provider:"Test-English",title:"B1+ Writing Exercises and Tests",url:"https://test-english.com/writing/b1-b2/"},
  {skill:"Writing",level:"B2",provider:"Test-English",title:"B2 Writing Exercises and Tests",url:"https://test-english.com/writing/b2/"},
  {skill:"Writing",level:"C1",provider:"Test-English",title:"C1 Writing Exercises and Tests",url:"https://test-english.com/writing/c1/"},
  {skill:"Writing",level:"A1",provider:"British Council",title:"A1 writing lessons",url:"https://learnenglish.britishcouncil.org/skills/writing/a1-writing"},
  {skill:"Writing",level:"A2",provider:"British Council",title:"A2 writing lessons",url:"https://learnenglish.britishcouncil.org/skills/writing/a2-writing"},
  {skill:"Writing",level:"B1",provider:"British Council",title:"B1 writing lessons",url:"https://learnenglish.britishcouncil.org/skills/writing/b1-writing"},
  {skill:"Writing",level:"B2",provider:"British Council",title:"B2 writing lessons",url:"https://learnenglish.britishcouncil.org/skills/writing/b2-writing"},
  {skill:"Writing",level:"C1",provider:"British Council",title:"C1 writing lessons",url:"https://learnenglish.britishcouncil.org/skills/writing/c1-writing"},

  {skill:"Vocabulary",level:"A1",provider:"Test-English",title:"A1 Vocabulary Lessons",url:"https://test-english.com/vocabulary/a1/"},
  {skill:"Vocabulary",level:"A2",provider:"Test-English",title:"A2 Vocabulary Lessons",url:"https://test-english.com/vocabulary/a2/"},
  {skill:"Vocabulary",level:"B1",provider:"Test-English",title:"B1 Vocabulary Lessons",url:"https://test-english.com/vocabulary/b1/"},
  {skill:"Vocabulary",level:"B1+",provider:"Test-English",title:"B1+ Vocabulary Lessons",url:"https://test-english.com/vocabulary/b1-b2/"},
  {skill:"Vocabulary",level:"B2",provider:"Test-English",title:"B2 Vocabulary Lessons",url:"https://test-english.com/vocabulary/b2/"},
  {skill:"Vocabulary",level:"C1",provider:"Test-English",title:"C1 Vocabulary Lessons",url:"https://test-english.com/vocabulary/c1/"},
  {skill:"Vocabulary",level:"A1–A2",provider:"British Council",title:"A1–A2 vocabulary lessons",url:"https://learnenglish.britishcouncil.org/vocabulary/a1-a2-vocabulary"},
  {skill:"Vocabulary",level:"B1–B2",provider:"British Council",title:"B1–B2 vocabulary lessons",url:"https://learnenglish.britishcouncil.org/vocabulary/b1-b2-vocabulary"},
  {skill:"Vocabulary",level:"C1",provider:"British Council",title:"C1 vocabulary lessons",url:"https://learnenglish.britishcouncil.org/vocabulary/c1-vocabulary"},

  {skill:"Listening",level:"A1",provider:"Test-English",title:"A1 Listening Tests",url:"https://test-english.com/listening/a1/"},
  {skill:"Listening",level:"A2",provider:"Test-English",title:"A2 Listening Tests",url:"https://test-english.com/listening/a2/"},
  {skill:"Listening",level:"B1",provider:"Test-English",title:"B1 Listening Tests",url:"https://test-english.com/listening/b1/"},
  {skill:"Listening",level:"B1+",provider:"Test-English",title:"B1+ Listening Tests",url:"https://test-english.com/listening/b1-b2/"},
  {skill:"Listening",level:"B2",provider:"Test-English",title:"B2 Listening Tests",url:"https://test-english.com/listening/b2/"},
  {skill:"Listening",level:"C1",provider:"Test-English",title:"C1 Listening Tests",url:"https://test-english.com/listening/c1/"},
  {skill:"Listening",level:"A1",provider:"British Council",title:"A1 listening lessons",url:"https://learnenglish.britishcouncil.org/skills/listening/a1-listening"},
  {skill:"Listening",level:"A2",provider:"British Council",title:"A2 listening lessons",url:"https://learnenglish.britishcouncil.org/skills/listening/a2-listening"},
  {skill:"Listening",level:"B1",provider:"British Council",title:"B1 listening lessons",url:"https://learnenglish.britishcouncil.org/skills/listening/b1-listening"},
  {skill:"Listening",level:"B2",provider:"British Council",title:"B2 listening lessons",url:"https://learnenglish.britishcouncil.org/skills/listening/b2-listening"},
  {skill:"Listening",level:"C1",provider:"British Council",title:"C1 listening lessons",url:"https://learnenglish.britishcouncil.org/skills/listening/c1-listening"},

  {skill:"Use of English",level:"A1",provider:"Test-English",title:"A1 Use of English Tests",url:"https://test-english.com/use-of-english/a1/"},
  {skill:"Use of English",level:"A2",provider:"Test-English",title:"A2 Use of English Tests",url:"https://test-english.com/use-of-english/a2/"},
  {skill:"Use of English",level:"B1",provider:"Test-English",title:"B1 Use of English Tests",url:"https://test-english.com/use-of-english/b1/"},
  {skill:"Use of English",level:"B1+",provider:"Test-English",title:"B1+ Use of English Tests",url:"https://test-english.com/use-of-english/b1-b2/"},
  {skill:"Use of English",level:"B2",provider:"Test-English",title:"B2 Use of English Tests",url:"https://test-english.com/use-of-english/b2/"},
  {skill:"Grammar",level:"A1–A2",provider:"British Council",title:"A1–A2 grammar lessons and exercises",url:"https://learnenglish.britishcouncil.org/grammar/a1-a2-grammar"},
  {skill:"Grammar",level:"B1–B2",provider:"British Council",title:"B1–B2 grammar lessons and exercises",url:"https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar"},
  {skill:"Grammar",level:"C1",provider:"British Council",title:"C1 grammar lessons and exercises",url:"https://learnenglish.britishcouncil.org/grammar/c1-grammar"},

  {skill:"IELTS",level:"IELTS",provider:"Test-English",title:"IELTS Exam 1 – Listening",url:"https://test-english.com/exams/ielts/ielts-exam-1-listening/"},
  {skill:"IELTS",level:"IELTS",provider:"Test-English",title:"IELTS Exam 1 – General Training Reading",url:"https://test-english.com/exams/ielts/ielts-exam-1-general-training-reading/"},
  {skill:"IELTS",level:"IELTS",provider:"Test-English",title:"IELTS Exam 1 – General Training Writing",url:"https://test-english.com/exams/ielts/ielts-exam-1-general-training-writing/"},
  {skill:"IELTS",level:"IELTS",provider:"Test-English",title:"IELTS Exam 1 – Speaking",url:"https://test-english.com/exams/ielts/ielts-exam-1-speaking/"}
];

function initOnlineResources(){
  const skill=document.getElementById("resourceSkill"),level=document.getElementById("resourceLevel");
  if(!skill||!level)return;
  const unique=a=>[...new Set(a)];
  const option=(v)=>`<option value="${v}">${v}</option>`;
  skill.innerHTML=["All",...unique(ONLINE_RESOURCE_GROUPS.map(x=>x.skill))].map(option).join("");
  level.innerHTML=["All",...unique(ONLINE_RESOURCE_GROUPS.map(x=>x.level))].map(option).join("");
  const render=()=>{
    const rows=ONLINE_RESOURCE_GROUPS.filter(x=>(skill.value==="All"||x.skill===skill.value)&&(level.value==="All"||x.level===level.value));
    document.getElementById("resourceCount").textContent=`${rows.length} verified direct collections/tests`;
    document.getElementById("resourceGrid").innerHTML=rows.map(x=>`<article class="learningCard"><h3>${x.title}</h3><div class="learningMeta"><span class="providerBadge ${x.provider==="Test-English"?"testenglish":"britishcouncil"}">${x.provider}</span><span class="levelBadge">${x.level}</span><span class="levelBadge">${x.skill}</span></div><a class="btn primary resourceOpen" href="${x.url}" target="_blank" rel="noopener">Open exact resource →</a></article>`).join("");
  };
  skill.onchange=render;level.onchange=render;render();
}
document.addEventListener("DOMContentLoaded",initOnlineResources);
