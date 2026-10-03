"use client";
import {useEffect,useRef} from "react";
import {mountEvidenceOverview} from "@automaticity/learning-core/automaticity";
export function AutomaticityEvidenceSummary(){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{if(ref.current)return mountEvidenceOverview(ref.current,"en");},[]);
 return <section ref={ref} data-automaticity-overview />;
}
