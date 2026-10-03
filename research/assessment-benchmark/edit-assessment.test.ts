import {expect,test} from "bun:test";
import {parseEditAssessment,combineEditReviews} from "./edit-assessment";
const fix={original:"likes",replacement:"like",kind:"grammar",reason:"Use the base verb after I."};
test("edits reconstruct only grounded changes and preserve the rest",()=>{
  const result=parseEditAssessment({status:"complete",edits:[fix]},"I likes tea.");
  expect(result.correction).toBe("I like tea."); expect(result.verdict).toBe("incorrect");
  expect(parseEditAssessment({status:"complete",edits:[]},"I like tea.").verdict).toBe("correct");
  expect(parseEditAssessment({status:"uncertain",edits:[]},"She saw her.").verdict).toBe("uncertain");
});
test("invalid, invented, overlapping and cosmetic evidence cannot become correct",()=>{
  for(const edits of [[{...fix,replacement:" likes "}],[{...fix,original:"dislikes"}],[fix,fix],[{...fix,original:"I likes tea.",replacement:""}]])
    expect(()=>parseEditAssessment({status:"complete",edits},"I likes tea.")).toThrow();
  expect(()=>parseEditAssessment({status:"complete",edits:[fix]},"likes likes")).toThrow();
  expect(()=>parseEditAssessment({status:"uncertain",edits:[fix]},"I likes tea.")).toThrow();
  expect(()=>parseEditAssessment({status:"complete",edits:[],approved:true},"I like tea.")).toThrow();
  expect(()=>parseEditAssessment({status:["complete"],edits:[]},"I like tea.")).toThrow();
  expect(()=>parseEditAssessment({status:"complete",edits:[{...fix,kind:["grammar"]}]},"I likes tea.")).toThrow();
});
test("review veto or parser failure abstains rather than approving the original",()=>{
  const repair=parseEditAssessment({status:"complete",edits:[fix]},"I likes tea.");
  const pass=parseEditAssessment({status:"complete",edits:[]},"I likes tea.");
  expect(combineEditReviews(repair,pass).verdict).toBe("uncertain");
  expect(combineEditReviews(pass,null).verdict).toBe("uncertain");
  expect(combineEditReviews(repair,repair)).toEqual(repair);
  expect(combineEditReviews(pass,pass)).toEqual(pass);
  expect(combineEditReviews(repair,{...repair,correction:"I Like tea."}).verdict).toBe("uncertain");
});
test("multiple replacements, insertion and deletion use original offsets",()=>{
  const edit=(original:string,replacement:string)=>({...fix,original,replacement});
  expect(parseEditAssessment({status:"complete",edits:[edit("likes","like"),edit("and very","and")]},"I likes tea and very often drink it.").correction).toBe("I like tea and often drink it.");
  expect(parseEditAssessment({status:"complete",edits:[edit("like tea","would like tea")]},"I like tea.").correction).toBe("I would like tea.");
  expect(parseEditAssessment({status:"complete",edits:[edit("very ","")]},"It is very unique.").correction).toBe("It is unique.");
  expect(parseEditAssessment({status:"complete",edits:[edit("tee","Tee")]},"Ich trinke tee.").correction).toBe("Ich trinke Tee.");
  expect(()=>parseEditAssessment({status:"complete",edits:[fix,edit("missing","found")]},"I likes tea.")).toThrow();
});
