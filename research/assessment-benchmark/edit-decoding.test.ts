import { expect, test } from "bun:test";
import { completionDiagnostics, editDecodingProfile } from "./edit-decoding";

test("bounded reasoning is explicit, reproducible, and never a silent default", () => {
  expect(editDecodingProfile("reasoning")).toEqual({ decodingProfile:"reasoning",mode:"thinking",temperature:1,top_p:.95,top_k:20,min_p:0,presence_penalty:1.5,repeat_penalty:1,seed:61,max_tokens:1800,chat_template_kwargs:{enable_thinking:true} });
  const greedy = editDecodingProfile("greedy");
  expect(greedy.chat_template_kwargs.enable_thinking).toBe(false);
  expect(greedy.temperature).toBe(0);
  expect(greedy.max_tokens).toBe(900);
  expect(() => editDecodingProfile("typo")).toThrow();
});

test("completion diagnostics preserve truncation, deadlines and missing usage without leaking text", () => {
  const rows = [
    {raw:{choices:[{finish_reason:"stop",message:{content:'{}',reasoning_content:'private'}}],usage:{prompt_tokens:5,completion_tokens:8}},failure:null,requestStarted:true},
    {raw:{choices:[{finish_reason:"length",message:{content:'{',reasoning_content:''}}],usage:{prompt_tokens:-1,completion_tokens:3}},failure:"Incomplete",requestStarted:true},
    {raw:null,failure:"The operation timed out",requestStarted:false},
  ];
  const result = completionDiagnostics(rows);
  expect(result).toEqual({finishReasons:{stop:1,length:1,"no-finish-reason":1},reasoningResponses:1,reasoningCharacters:7,finalCharacters:3,responsesWithUsage:1,promptTokens:5,completionTokens:8,requestsNotStarted:1,timeoutFailures:1});
  expect(JSON.stringify(result)).not.toContain("private");
});
