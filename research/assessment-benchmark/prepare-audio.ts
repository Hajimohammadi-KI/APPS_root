import {mkdir} from "node:fs/promises";
import {resolve,relative} from "node:path";
import {hash} from "./core";
const root=resolve(import.meta.dir,"data/speech/speechocean762"), out=resolve(import.meta.dir,"runs/audio-hubert-v1");await mkdir(out,{recursive:true});
if(await Bun.file(resolve(out,"cases.jsonl")).exists())throw Error("Frozen audio cases already exist; create a new versioned directory");
type Scores={accuracy:number;fluency:number;prosodic:number;total:number;completeness:number;text:string};
const scores=await Bun.file(resolve(root,"resource/scores.json")).json() as Record<string,Scores>;
const detail=await Bun.file(resolve(root,"resource/scores-detail.json")).json() as Record<string,Record<string,unknown>>;
async function table(split:string,file:string){return new Map((await Bun.file(resolve(root,split,file)).text()).trim().split(/\r?\n/).map(line=>{const fields=line.split(/\s+/);return [fields[0]!,fields.slice(1).join(" ")];}));}
const rows=[];const speakers:Record<string,Set<string>>={train:new Set(),test:new Set()};const seenHash=new Map<string,string>();let duplicateAudio=0;
for(const split of ["train","test"]){const paths=await table(split,"wav.scp"),groups=await table(split,"utt2spk"),ages=await table(split,"spk2age"),genders=await table(split,"spk2gender");
for(const [id,wavePath] of paths){if(!/^WAVE\/SPEAKER\d+\/\d+\.WAV$/.test(wavePath))throw Error("Unsafe corpus path");
 const speaker=groups.get(id);if(!speaker)throw Error("Missing speaker");speakers[split]!.add(speaker);
 const score=scores[id];if(!score)throw Error("Missing score");
 for(const key of ["accuracy","fluency","prosodic","total"] as const){if(!Number.isFinite(score[key])||score[key]<0||score[key]>10)throw Error("Invalid score scale");const ratings=detail[id]?.[key];if(!Array.isArray(ratings)||ratings.length!==5||ratings.some(x=>typeof x!=="number"||x<0||x>10))throw Error("Missing independent ratings");}
 const file=resolve(root,wavePath),bytes=Buffer.from(await Bun.file(file).arrayBuffer());
 if(bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WAVE")throw Error("Not WAV");
 let offset=12,sampleRate=0,channels=0,bits=0,format=0,dataBytes=0;
 while(offset+8<=bytes.length){const name=bytes.toString("ascii",offset,offset+4),length=bytes.readUInt32LE(offset+4);if(offset+8+length>bytes.length)throw Error("Truncated WAV");if(name==="fmt "){if(length<16)throw Error("Invalid format");format=bytes.readUInt16LE(offset+8);channels=bytes.readUInt16LE(offset+10);sampleRate=bytes.readUInt32LE(offset+12);bits=bytes.readUInt16LE(offset+22);}if(name==="data")dataBytes+=length;offset+=8+length+(length%2);}
 if(format!==1||sampleRate!==16000||channels!==1||bits!==16||dataBytes<=0)throw Error("Unsupported waveform");
 const duration=dataBytes/(sampleRate*channels*bits/8),digest=hash(bytes);
 if(seenHash.has(digest)){duplicateAudio++;if(seenHash.get(digest)!==split)throw Error("Audio duplicate across train/test");}seenHash.set(digest,split);
 rows.push({id,split,speaker,age:ages.get(speaker),gender:genders.get(speaker),path:relative(import.meta.dir,file).replaceAll("\\","/"),audioSha256:digest,sampleRate,channels,bits,duration,scores:score,independentRatings:detail[id]});
}}
const overlap=[...speakers.train!].filter(x=>speakers.test!.has(x));if(overlap.length)throw Error("Speaker leakage");
const all=rows.map(x=>JSON.stringify(x)).join("\n")+"\n";
await Bun.write(resolve(out,"cases.jsonl"),all);
const report={schemaVersion:1,createdAt:new Date().toISOString(),corpus:"SpeechOcean762 / OpenSLR 101 original release",source:"https://openslr.org/101/",license:"CC-BY-4.0",casesSha256:hash(all),recordings:rows.length,train:rows.filter(x=>x.split==="train").length,test:rows.filter(x=>x.split==="test").length,trainSpeakers:speakers.train!.size,testSpeakers:speakers.test!.size,overlappingSpeakers:overlap.length,duplicateAudio,allWavDecodedHeaders:true,totalHours:rows.reduce((a,b)=>a+b.duration,0)/3600,durationSeconds:{min:Math.min(...rows.map(x=>x.duration)),max:Math.max(...rows.map(x=>x.duration))},ratingsPerUtterance:5,scales:{accuracy:"0–10",fluency:"0–10",prosodic:"0–10",total:"0–10",completeness:"aggregate 0–10; individual binary 0/1; not used by candidate"},modelScope:"English read speech, native Mandarin learners, children and adults",qualifiesGerman:false,qualifiesSpontaneousSpeech:false,qualifiesGrammar:false};
await Bun.write(resolve(out,"manifest.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
