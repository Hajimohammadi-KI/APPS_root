import { grammarUnits as en } from "../Apps/English/English-Automaticity/packages/content/src/index";
import { grammarUnits as de } from "../Apps/Deutsch-Automaticity/packages/content/src/index";
for (const [language, units] of [["en", en], ["de", de]] as const) {
  console.log(language);
  units.forEach((unit,index)=>console.log(`${index+1}\t${unit.level}\t${unit.title}`));
}
