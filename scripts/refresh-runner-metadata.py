import argparse
import json
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE_DATA = ROOT / "public" / "site-data.json"
OUTPUT = ROOT / "public" / "runner-metadata.json"
REGION_DATA = ROOT / "public" / "world-region-centroids.json"
API_ROOT = "https://www.speedrun.com/api/v1/users/"
USER_AGENT = "SMB1ECL/1.0 (https://smb1ecl.loopie.fr)"


def safe_asset(value):
    if not value:
        return None
    try:
        url = str(value)
        if url.startswith("https://www.speedrun.com/"):
            return url
    except Exception:
        pass
    return None


def localized_name(value):
    if not isinstance(value, dict):
        return None
    names = value.get("names") or {}
    return names.get("international") or value.get("code")


def normalize(value):
    return "".join(character for character in str(value or "").casefold() if character.isalnum())


def load_region_index():
    regions = json.loads(REGION_DATA.read_text(encoding="utf-8")).get("regions", [])
    index = {}
    for region in regions:
        country_code = str(region.get("countryCode") or "").split("/")[0].casefold()
        for candidate in (region.get("code"), region.get("name"), region.get("postal")):
            if candidate:
                index[(country_code, normalize(candidate))] = region
    return index


def coarsen_region(country_code, region_code, region_name, region_index):
    base_country = str(country_code or "").split("/")[0].casefold()
    code_parts = str(region_code or "").replace("-", "/").split("/")
    candidates = ["/".join(code_parts[:2]), str(region_name or "").split(",")[0], region_name]
    match = next((region_index.get((base_country, normalize(candidate))) for candidate in candidates if candidate), None)
    return (match.get("code"), match.get("name")) if match else (None, None)


def fetch_user(target, region_index, max_attempts=5, timeout=25):
    player_key, runner, fallback_country = target
    user_id = player_key.removeprefix("user:")
    request = urllib.request.Request(API_ROOT + user_id, headers={"User-Agent": USER_AGENT})
    for attempt in range(max_attempts):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                user = json.load(response).get("data") or {}
            location = user.get("location") or {}
            country = location.get("country") or {}
            region = location.get("region") or {}
            assets = user.get("assets") or {}
            region_code, region_name = coarsen_region(country.get("code"), region.get("code"), localized_name(region), region_index)
            return {
                "playerKey": player_key,
                "runner": (user.get("names") or {}).get("international") or runner,
                "countryCode": country.get("code"),
                "country": localized_name(country) or fallback_country,
                "regionCode": region_code,
                "region": region_name,
                "icon": safe_asset((assets.get("icon") or {}).get("uri")),
                "image": safe_asset((assets.get("image") or {}).get("uri")),
                "profile": safe_asset(user.get("weblink")),
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            }
        except urllib.error.HTTPError as error:
            if error.code == 404:
                break
            if error.code not in (420, 429, 500, 502, 503, 504) or attempt == max_attempts - 1:
                raise
            time.sleep(2 ** attempt)
        except (TimeoutError, urllib.error.URLError):
            if attempt == max_attempts - 1:
                raise
            time.sleep(2 ** attempt)
    return {
        "playerKey": player_key,
        "runner": runner,
        "countryCode": None,
        "country": fallback_country,
        "regionCode": None,
        "region": None,
        "icon": None,
        "image": None,
        "profile": None,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def current_targets(payload):
    players_by_name = {str(player.get("Runner") or ""): player for player in payload.get("combined", [])}
    keys_by_name = {}
    for run in payload.get("runs", []):
        runner = str(run.get("runner") or "")
        player_key = str(run.get("playerKey") or "")
        if runner and player_key.startswith("user:"):
            keys_by_name.setdefault(runner, player_key)
    targets = []
    for runner, player in players_by_name.items():
        player_key = keys_by_name.get(runner)
        if player_key:
            targets.append((player_key, runner, player.get("Country")))
    return targets


def main():
    parser = argparse.ArgumentParser(description="Cache public Speedrun.com runner regions and profile assets")
    parser.add_argument("--full", action="store_true", help="Refresh every current registered runner")
    parser.add_argument("--max-new", type=int, default=200, help="Maximum uncached runners to request in an incremental build")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    payload = json.loads(SITE_DATA.read_text(encoding="utf-8"))
    cached_payload = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {"players": []}
    cached = {item.get("playerKey"): item for item in cached_payload.get("players", []) if item.get("playerKey")}
    region_index = load_region_index()
    for item in cached.values():
        item["regionCode"], item["region"] = coarsen_region(item.get("countryCode"), item.get("regionCode"), item.get("region"), region_index)
    targets = current_targets(payload)
    current_keys = {target[0] for target in targets}
    cached = {key: value for key, value in cached.items() if key in current_keys}
    pending = targets if args.full else [target for target in targets if target[0] not in cached][:max(0, args.max_new)]

    failures = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        max_attempts = 5 if args.full else 2
        timeout = 25 if args.full else 12
        futures = {executor.submit(fetch_user, target, region_index, max_attempts, timeout): target for target in pending}
        for future in as_completed(futures):
            target = futures[future]
            try:
                item = future.result()
                cached[item["playerKey"]] = item
            except Exception as error:
                failures.append(f"{target[1]} ({target[0]}): {error}")

    result = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Public Speedrun.com user profiles",
        "players": sorted(cached.values(), key=lambda item: str(item.get("runner") or "").casefold()),
    }
    temporary = OUTPUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(OUTPUT)
    print(json.dumps({"currentRegisteredRunners": len(targets), "cached": len(result["players"]), "requested": len(pending), "failures": len(failures)}, indent=2))
    for failure in failures:
        print("Metadata warning: " + failure)


if __name__ == "__main__":
    main()
