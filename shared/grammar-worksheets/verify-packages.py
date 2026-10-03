"""Check that each install/update/repair payload contains the exact worksheet sources."""
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
    config = json.loads((app / "distribution/windows-modern/setup.config.json").read_text(encoding="utf-8-sig"))
    version = config["version"]
    package = app / f"artifacts/windows-installer/{product}-Setup-v{version}.payload.zip"
    with ZipFile(package) as archive:
        web_bytes = archive.read("resources/local-app/web.zip")
        recorded = archive.read("resources/local-app/web.sha256").decode("utf-8-sig").strip().split()[0].lower()
    assert hashlib.sha256(web_bytes).hexdigest() == recorded, f"{language}: embedded web checksum mismatch"
    public = app / "apps/web/public"
    sources = [public / "sw.js"] + list((public / f"replacements/{language}").glob("grammar-worksheet*"))
    sources += list((public / f"replacements/{language}/worksheet-icons").iterdir())
    sources += [public / f"replacements/{language}/{'grammatik.html' if language == 'de' else 'grammar.html'}"]
    checked = []
    with ZipFile(BytesIO(web_bytes)) as web:
        for source in sources:
            suffix = "public/" + source.relative_to(public).as_posix()
            matches = [name for name in web.namelist() if name == suffix or name.endswith("/" + suffix)]
            assert len(matches) == 1, f"{language}: expected one packaged {suffix}, found {matches}"
            expected = hashlib.sha256(source.read_bytes()).hexdigest()
            actual = hashlib.sha256(web.read(matches[0])).hexdigest()
            assert expected == actual, f"{language}: stale packaged asset {suffix}"
            checked.append({"file": suffix, "sha256": actual})
    report.append({"language": language, "version": version, "payload": str(package), "webSha256": recorded, "assets": checked, "status": "passed"})
output = root / "artifacts/grammar-worksheets/package-verification.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps([{key: value for key, value in item.items() if key != "assets"} | {"assetsChecked": len(item["assets"])} for item in report], indent=2))
