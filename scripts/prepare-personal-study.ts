import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import {
  PERSONAL_STUDY_PHASES,
  personalStudyReadiness,
  freezePersonalStudy,
  personalStudyStatus,
  currentPersonalStudyStatus,
  deliverPersonalStudyForm,
  writeFrozenPersonalStudy,
  withdrawPersonalStudy,
  writePersonalStudyDelivery,
  type PersonalStudyPhase,
} from "./lib/personal-study-setup";

const root = resolve(import.meta.dir, "..");
const args = Bun.argv.slice(2);
const now = new Date().toISOString();
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const json = async (path: string): Promise<unknown> => {
  const bytes = await readFile(resolve(root, path), "utf8");
  if (bytes.length > 100_000_000)
    throw Error("Private study input is too large");
  return JSON.parse(bytes);
};
const actions = [
  "--empty",
  "--freeze",
  "--status",
  "--deliver",
  "--withdraw",
].filter((action) => args.includes(action));
if (actions.length !== 1)
  throw Error(
    "Choose one preparation action: --empty, --freeze <draft.json> --catalog <private-catalog.json>, --status <frozen.json>, --deliver <frozen.json> --catalog <private-catalog.json> --phase pre|post|day7|day30 --context <current-consent-and-timeline.json>, or --withdraw <frozen.json>.",
  );
const action = actions[0]!;
if (action === "--empty")
  console.log(JSON.stringify(personalStudyReadiness(), null, 2));
else {
  const path = option(action);
  if (!path || path.startsWith("--"))
    throw Error("An explicit private input file is required");
  const input = await json(path);
  if (action === "--status")
    console.log(
      JSON.stringify(await currentPersonalStudyStatus(root, input), null, 2),
    );
  else if (action === "--withdraw")
    console.log(
      JSON.stringify({
        status: "consent_withdrawn",
        path: await withdrawPersonalStudy(root, input, now),
        automaticMasteryGranted: false,
        causalBenefitEstablished: false,
      }),
    );
  else {
    const catalogPath = option("--catalog");
    if (!catalogPath || catalogPath.startsWith("--"))
      throw Error(
        "A private independently reviewed catalog is required; --empty reports missing preparation without creating a plan",
      );
    const catalog = await json(catalogPath);
    const { packs } = await loadRepresentativeRuntime(root);
    if (action === "--freeze") {
      const frozen = await freezePersonalStudy(
        root,
        input,
        catalog,
        packs,
        now,
      );
      console.log(
        JSON.stringify(
          {
            path: await writeFrozenPersonalStudy(root, frozen),
            status: personalStudyStatus(frozen),
          },
          null,
          2,
        ),
      );
    } else {
      const phase = option("--phase");
      const contextPath = option("--context");
      if (
        !PERSONAL_STUDY_PHASES.includes(phase as PersonalStudyPhase) ||
        !contextPath ||
        contextPath.startsWith("--")
      )
        throw Error(
          "Due delivery requires its exact phase plus fresh current consent and a teacher-verified timeline context file",
        );
      const context = await json(contextPath);
      const delivery = await deliverPersonalStudyForm(
        root,
        input,
        catalog,
        packs,
        phase as PersonalStudyPhase,
        now,
        context as Parameters<typeof deliverPersonalStudyForm>[6],
      );
      console.log(
        JSON.stringify({
          status: "due_teacher_form_written_privately",
          path: await writePersonalStudyDelivery(root, input, delivery),
          evaluationPerformed: false,
          automaticMasteryGranted: false,
          causalBenefitEstablished: false,
        }),
      );
    }
  }
}
