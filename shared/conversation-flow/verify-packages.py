"""Verify embedded public assets and production chunks against the completed builds."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import hashlib
import json

root = Path(__file__).resolve().parents[2]
report = []
for language, relative, product in [
    ("de", "Apps/Deutsch-Automaticity", "DeutschFlow"),
    ("en", "Apps/English/English-Automaticity", "EnglishGrammar"),
]:
    app = root / relative
    version = json.loads((app / "distribution/windows-modern/setup.config.json").read_text(encoding="utf-8-sig"))["version"]
    payload = app / f"artifacts/windows-installer/{product}-Setup-v{version}.payload.zip"
    with ZipFile(payload) as archive:
        data = archive.read("resources/local-app/web.zip")
        digest = archive.read("resources/local-app/web.sha256").decode("utf-8-sig").strip().split()[0].lower()
    assert hashlib.sha256(data).hexdigest() == digest
    public = app / "apps/web/public"
    paths = [public / "editorial.css", public / f"replacements/{language}/{'heute' if language=='de' else 'daily'}.html"]
    paths += [public / f"learning-core/{name}" for name in ["automaticity-v2.js", "overview.js", "practice.js"]]
    chunks = list((app / "apps/web/.next/static").rglob("*.js")) + list((app / "apps/web/.next/static").rglob("*.css"))
    assert chunks and any(path.suffix == ".css" for path in chunks), f"Missing completed production build for {language}"
    checked = []
    with ZipFile(BytesIO(data)) as web:
        for source in paths + chunks:
            suffix = "public/" + source.relative_to(public).as_posix() if source in paths else ".next/static/" + source.relative_to(app / "apps/web/.next/static").as_posix()
            matches = [name for name in web.namelist() if name == suffix or name.endswith("/" + suffix)]
            assert len(matches) == 1, (language, suffix, matches)
            sha = hashlib.sha256(web.read(matches[0])).hexdigest()
            assert sha == hashlib.sha256(source.read_bytes()).hexdigest(), f"Stale {language} payload: {suffix}"
            checked.append({"path": suffix, "sha256": sha})
    report.append({"language": language, "version": version, "payload": str(payload), "status": "PASS", "webSha256": digest, "assets": checked})
output = root / "artifacts/conversation-flow/package-verification.json"
output.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps([{k:v for k,v in row.items() if k!="assets"} | {"files":len(row["assets"])} for row in report],indent=2))
