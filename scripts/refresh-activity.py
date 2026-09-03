#!/usr/bin/env python3
"""Build a compact update digest by comparing today's data with the live snapshot."""

from __future__ import annotations

import argparse
import json
import math
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "smb1ecl-activity-refresh/1.0"


def text(value) -> str:
    return str(value or "").strip()


def number(value) -> float:
    try:
        result = float(value or 0)
        return result if math.isfinite(result) else 0.0
    except (TypeError, ValueError):
        return 0.0


def runner_key(player: dict) -> str:
    return text(player.get("Player Key") or player.get("playerKey") or player.get("Runner") or player.get("runner")).casefold()


def run_key(run: dict) -> str:
    return f"{text(run.get('id'))}|{text(run.get('playerKey')).casefold()}"


def fetch_json(url: str, timeout: int = 20):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Cache-Control": "no-cache"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_live_payload(base_url: str):
    manifest_url = urllib.parse.urljoin(base_url.rstrip("/") + "/", "data/site-data-manifest.json")
    manifest = fetch_json(manifest_url)
    part_urls = [urllib.parse.urljoin(manifest_url, part) for part in manifest.get("parts", [])]
    if not part_urls:
        raise RuntimeError("Live site data manifest has no parts")
    with ThreadPoolExecutor(max_workers=8) as executor:
        parts = list(executor.map(fetch_json_text, part_urls))
    return json.loads("".join(parts))


def fetch_json_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Cache-Control": "no-cache"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8")


def build_snapshot(payload: dict) -> dict:
    players = []
    for player in payload.get("combined", []):
        players.append({
            "key": runner_key(player),
            "runner": text(player.get("Runner")),
            "rank": int(number(player.get("Rank"))),
            "totalScore": number(player.get("Total Score")),
            "performanceScore": number(player.get("Performance Score")),
            "runs": int(number(player.get("Prolific Score"))),
            "boards": int(number(player.get("Unique Boards"))),
            "wrs": number(player.get("WRs")),
            "country": player.get("Country"),
        })
    return {
        "generatedAt": text(payload.get("generatedAt")),
        "players": players,
        "runKeys": [run_key(run) for run in payload.get("runs", []) if run.get("included") is not False],
    }


def current_player(player: dict) -> dict:
    return {
        "key": runner_key(player),
        "runner": text(player.get("Runner")),
        "rank": int(number(player.get("Rank"))),
        "totalScore": number(player.get("Total Score")),
        "performanceScore": number(player.get("Performance Score")),
        "runs": int(number(player.get("Prolific Score"))),
        "boards": int(number(player.get("Unique Boards"))),
        "wrs": number(player.get("WRs")),
        "country": player.get("Country"),
    }


def compact_run(run: dict) -> dict:
    return {
        "id": text(run.get("id")),
        "runner": text(run.get("runner")),
        "playerKey": text(run.get("playerKey")),
        "gameAbbr": text(run.get("gameAbbr")),
        "category": text(run.get("category")),
        "level": run.get("level"),
        "subcategory": run.get("subcategory"),
        "place": int(number(run.get("place"))),
        "time": text(run.get("time")),
        "verifiedAt": run.get("verifiedAt"),
        "runDate": run.get("runDate"),
        "runLink": run.get("runLink"),
        "performancePoints": number(run.get("performancePoints")),
        "wrCredit": number(run.get("wrCredit")),
    }


def build_activity(current: dict, previous: dict | None) -> dict:
    previous = previous or {"generatedAt": None, "players": [], "runKeys": []}
    old_players = {text(player.get("key")): player for player in previous.get("players", []) if player.get("key")}
    players = [current_player(player) for player in current.get("combined", [])]
    new_runners = [player for player in players if player["key"] not in old_players]
    old_run_keys = set(previous.get("runKeys", []))
    new_runs = [compact_run(run) for run in current.get("runs", []) if run.get("included") is not False and run_key(run) not in old_run_keys]
    active_runner_keys = {text(run.get("playerKey")).casefold() for run in new_runs}
    active_runner_names = {text(run.get("runner")).casefold() for run in new_runs}
    rank_movers = []
    score_gains = []
    for player in players:
        old = old_players.get(player["key"])
        if not old:
            continue
        rank_delta = int(number(old.get("rank"))) - player["rank"]
        score_delta = player["totalScore"] - number(old.get("totalScore"))
        run_delta = player["runs"] - int(number(old.get("runs")))
        wr_delta = player["wrs"] - number(old.get("wrs"))
        item = {**player, "previousRank": int(number(old.get("rank"))), "rankDelta": rank_delta, "scoreDelta": score_delta, "runDelta": run_delta, "wrDelta": wr_delta}
        is_active = player["key"] in active_runner_keys or player["runner"].casefold() in active_runner_names
        if rank_delta and is_active:
            rank_movers.append(item)
        if score_delta > 0.004 and is_active:
            score_gains.append(item)

    new_runs.sort(key=lambda run: (text(run.get("verifiedAt")), number(run.get("performancePoints"))), reverse=True)
    new_wrs = [run for run in new_runs if number(run.get("wrCredit")) > 0 or int(number(run.get("place"))) == 1]
    rank_movers.sort(key=lambda player: (player["rankDelta"], player["scoreDelta"]), reverse=True)
    score_gains.sort(key=lambda player: (player["scoreDelta"], player["rankDelta"]), reverse=True)
    new_runners.sort(key=lambda player: player["rank"])

    return {
        "status": "ready" if previous.get("generatedAt") else "baseline",
        "fromGeneratedAt": previous.get("generatedAt"),
        "toGeneratedAt": current.get("generatedAt"),
        "checkedAt": current.get("generatedAt"),
        "unchanged": False,
        "summary": {
            "newRuns": len(new_runs),
            "newRunners": len(new_runners),
            "rankMovers": len(rank_movers),
            "scoreGainers": len(score_gains),
            "newWrs": len(new_wrs),
        },
        "newRuns": new_runs[:120],
        "newWrs": new_wrs[:60],
        "newRunners": new_runners[:60],
        "rankMovers": rank_movers[:100],
        "scoreGains": score_gains[:100],
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description="Create the website's latest-update digest")
    parser.add_argument("--current", type=Path, default=ROOT / "public" / "site-data.json")
    parser.add_argument("--output", type=Path, default=ROOT / "public" / "activity.json")
    parser.add_argument("--snapshot", type=Path, default=ROOT / "public" / "activity-snapshot.json")
    parser.add_argument("--live-base", default="https://smb1ecl.loopie.fr/")
    parser.add_argument("--no-live", action="store_true")
    args = parser.parse_args()

    current = json.loads(args.current.read_text(encoding="utf-8"))
    previous = None
    prior_activity = None
    if not args.no_live:
        try:
            previous = fetch_json(urllib.parse.urljoin(args.live_base.rstrip("/") + "/", "activity-snapshot.json"))
            prior_activity = fetch_json(urllib.parse.urljoin(args.live_base.rstrip("/") + "/", "activity.json"))
            print("Loaded the previous compact snapshot from the live site")
        except Exception as error:
            print(f"Compact live snapshot unavailable ({error}); trying the published site data")
            try:
                previous = build_snapshot(fetch_live_payload(args.live_base))
                print("Built the previous snapshot from the live site data")
            except Exception as live_error:
                print(f"Live comparison unavailable ({live_error}); using the checked-in snapshot")
    if previous is None and args.snapshot.exists():
        previous = json.loads(args.snapshot.read_text(encoding="utf-8"))

    activity = build_activity(current, previous)
    change_count = sum(activity["summary"].values())
    if change_count == 0 and prior_activity and prior_activity.get("status") == "ready" and sum(prior_activity.get("summary", {}).values()) > 0:
        activity = prior_activity
        activity["checkedAt"] = current.get("generatedAt")
        activity["unchanged"] = True

    write_json(args.output, activity)
    write_json(args.snapshot, build_snapshot(current))
    print(json.dumps({"summary": activity["summary"], "unchanged": activity.get("unchanged", False)}, indent=2))


if __name__ == "__main__":
    main()
