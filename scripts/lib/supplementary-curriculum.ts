import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {supplementaryGrammar} from "../../shared/learning-core/content/supplementary-grammar";
import {rows, specification, hash} from "./grammar-scope";
import type {Language, Stage} from "../../shared/learning-core/src/automaticity/contracts";
import type {ConstructionUnit, FamilyId, PracticeTask} from "../../shared/learning-core/src/automaticity/curriculum";

export async function buildSupplementaryUnits(root: string, language: Language, version: string): Promise<ConstructionUnit[]> {
  const targets = rows(await readFile(resolve(root,"docs/grammar-scope/additions.psv"),"utf8"),9);
  const references = JSON.parse(await readFile(resolve(root,"docs/grammar-scope/references.json"),"utf8")) as {sources:{id:string;title:string;url:string}[]};
  const audits = rows(await readFile(resolve(root,"docs/grammar-scope/family-audit.psv"),"utf8"),5);
  if (supplementaryGrammar.length !== targets.length || new Set(supplementaryGrammar.map(row=>row.id)).size !== targets.length) throw new Error("Supplementary grammar inventory is incomplete or duplicated");
  return targets.filter(row=>row[0]!.startsWith(language+".")).map(([id,family,title,_related,...fields])=>{
    const draft=supplementaryGrammar.find(row=>row.id===id); if(!draft) throw new Error(`Missing authored target ${id}`);
    const spec=specification([id!,...fields]);
    const en=language==="en";
    const tasks:PracticeTask[]=[];
    const definitions: {stage:Stage;prompt:string;answers:string[];kind:PracticeTask["responseKind"]}[]=[
      {stage:"notice",prompt:en?`Read the example, then explain the distinction: ${spec.contrast}`:`Lies das Beispiel und erkläre den Unterschied: ${spec.contrast}`,answers:[],kind:"reflection"},
      {stage:"retrieve",...draft.retrieve,kind:"free_output"},
      {stage:"vary",...draft.vary,kind:"transformation"},
      {stage:"produce",prompt:draft.produce,answers:[],kind:"free_output"},
      {stage:"repair",...draft.repair,kind:"correction"},
      {stage:"transfer",prompt:draft.transfer,answers:[],kind:"free_output"},
      {stage:"retain",prompt:draft.retain,answers:[],kind:"free_output"},
    ];
    for(const definition of definitions){
      if(!definition.prompt.trim() || definition.answers.some(answer=>!answer.trim()))throw new Error(`Empty supplementary task ${id}`);
      for(const modality of ["writing","speaking"] as const){
        if(modality==="speaking" && ["en.c.124","de.c.156"].includes(id!))continue;
        const closed=modality==="writing" && definition.answers.length>0;
        tasks.push({
          id:`${id}.${definition.stage}.supplement.${modality}`,version,constructionId:id!,familyId:family as FamilyId,
          itemFamily:`${id}.supplement.${definition.stage}.${hash(definition.prompt)}`,contextId:`${id}.supplement-context.${definition.stage}`,
          rubricVersion:closed?"closed-nfc-case-v1":"open-review-v1",stage:definition.stage,modality,partition:definition.stage==="notice"?"teaching":"practice",
          transferCondition:definition.stage==="transfer"?"elicited":"none",contentReview:"authored",
          prompt:(modality==="speaking"?(en?"Record your spoken response. ":"Nimm deine gesprochene Antwort auf. "):"")+definition.prompt,
          answerPolicy:closed?"closed":definition.stage==="notice"?"reflection":"open",responseKind:definition.kind,
          acceptedAnswers:closed?[...definition.answers]:[],hints:[spec.form,spec.contrast],solution:definition.answers[0]??(definition.stage==="notice"?draft.example:null),
          normalisation:{nfc:true,whitespace:true,terminalFullStop:true,preserveCase:true},sourceId:`${language}:original-supplement:${id}`,
        });
      }
    }
    const referenceIds=audits.find(row=>row[0]===language&&row[1]===family)?.[2]?.split(",")??[];
    return {id:id!,language,title:title!,level:draft.placement,familyIds:[family as FamilyId],prerequisites:[],lessonAlias:`supplement::${id}`,lessonAliases:[`supplement::${id}`],
      rule:`${spec.form}. ${spec.meaning}. ${spec.use}`,examples:[draft.example],commonError:spec.contrast,review:"authored",tasks,
      sources:referenceIds.map(key=>references.sources.find(row=>row.id===key)).filter((row):row is {id:string;title:string;url:string}=>!!row).map(({title,url})=>({title,url})),
    };
  });
}
