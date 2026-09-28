"""Render every logo in logos.html to a 1000x1000 PNG plus a contact sheet."""
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
IDS = ["stamp", "hourglass", "mascot", "masthead", "ticket", "sticker", "bubble", "scroll"]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 2200, "height": 1200}, device_scale_factor=2)
    pg.goto((HERE / "logos.html").as_uri())
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(500)
    for i in IDS:
        pg.locator(f"#{i}").screenshot(path=str(HERE / f"historypros-{i}.png"))
    pg.screenshot(path=str(HERE / "sheet.png"), full_page=True)
    b.close()
