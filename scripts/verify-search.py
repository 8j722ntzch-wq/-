"""Check the release's public HTML, preferred URLs, crawler rules and sitemap."""
import argparse
import os
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen
from xml.etree import ElementTree

ORIGIN = "https://baltmotors.by"
INDEXABLE = os.environ.get("SITE_INDEXABLE") == "true"


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.robots = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "link" and "canonical" in attrs.get("rel", "").split():
            self.canonicals.append(attrs.get("href"))
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots.append(attrs.get("content"))


def verify_page(html, url):
    meta = Metadata()
    meta.feed(html)
    assert meta.canonicals == ([url] if url else []), (url, meta.canonicals)
    expected = "index, follow" if url and INDEXABLE else "noindex, nofollow"
    assert meta.robots == [expected], (url, meta.robots)


def verify_sitemap(xml, expected):
    root = ElementTree.fromstring(xml)
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    assert root.tag == ns + "urlset"
    urls = [node.text for node in root.findall(ns + "url/" + ns + "loc")]
    assert len(urls) == len(expected) and set(urls) == expected, urls


def live(path):
    with urlopen(ORIGIN + path, timeout=20) as response:
        assert response.geturl() == ORIGIN + path, response.geturl()
        return response.read().decode()


def main():
    args = argparse.ArgumentParser()
    args.add_argument("build", type=Path)
    args.add_argument("--live", action="store_true")
    options = args.parse_args()
    expected = set()
    for page in options.build.rglob("*.html"):
        path = page.relative_to(options.build).as_posix()
        if path in {"404.html", "preview-login/index.html"}:
            verify_page(page.read_text(), None)
            continue
        assert path.endswith("index.html"), path
        url = urljoin(ORIGIN, "/" + path.removesuffix("index.html"))
        verify_page(page.read_text(), url)
        expected.add(url)
        if options.live:
            verify_page(live(urlsplit(url).path), url)
    assert ORIGIN + "/" in expected
    verify_sitemap((options.build / "sitemap.xml").read_text(), expected)
    robots = (options.build / "robots.txt").read_text()
    assert "Disallow: /" not in robots.splitlines()
    assert ("Sitemap: " + ORIGIN + "/sitemap.xml" in robots.splitlines()) == INDEXABLE
    if options.live:
        verify_sitemap(live("/sitemap.xml"), expected)
        assert live("/robots.txt") == robots
        verify_page(live("/portfolio/?utm_source=release-check"), ORIGIN + "/portfolio/")
        for image in (options.build / "_astro").iterdir():
            if image.suffix not in {".avif", ".webp"}:
                continue
            with urlopen(ORIGIN + "/_astro/" + image.name, timeout=20) as response:
                assert response.headers.get_content_type() == "image/" + image.suffix[1:], image.name
                assert response.read() == image.read_bytes(), image.name
    print(f"Verified {len(expected)} canonical URLs; indexing enabled: {INDEXABLE}")


if __name__ == "__main__":
    main()
