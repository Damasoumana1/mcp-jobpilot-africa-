"""Continental coverage, using the African Union's 55-member regional grouping.

Source: https://au.int/en/member_states/countryprofiles2
Names and aliases are identifiers for discovery, not eligibility guarantees.
"""
from __future__ import annotations

import re
import unicodedata


REGIONS = [
    {"id": "north", "fr": "Afrique du Nord", "en": "Northern Africa"},
    {"id": "west", "fr": "Afrique de l’Ouest", "en": "Western Africa"},
    {"id": "central", "fr": "Afrique centrale", "en": "Central Africa"},
    {"id": "east", "fr": "Afrique de l’Est", "en": "Eastern Africa"},
    {"id": "southern", "fr": "Afrique australe", "en": "Southern Africa"},
]

_DATA = """DZ|Algérie|Algeria|north
EG|Égypte|Egypt|north
LY|Libye|Libya|north
MR|Mauritanie|Mauritania|north
MA|Maroc|Morocco|north
EH|République arabe sahraouie démocratique|Sahrawi Arab Democratic Republic|north|Western Sahara;Sahara occidental;RASD
TN|Tunisie|Tunisia|north
BJ|Bénin|Benin|west
BF|Burkina Faso|Burkina Faso|west
CV|Cabo Verde|Cabo Verde|west|Cape Verde;Cap-Vert;Cap Vert
CI|Côte d’Ivoire|Côte d'Ivoire|west|Ivory Coast
GM|Gambie|Gambia|west|The Gambia
GH|Ghana|Ghana|west
GN|Guinée|Guinea|west|Guinea Conakry;Guinée-Conakry
GW|Guinée-Bissau|Guinea-Bissau|west
LR|Liberia|Liberia|west
ML|Mali|Mali|west
NE|Niger|Niger|west
NG|Nigéria|Nigeria|west
SN|Sénégal|Senegal|west
SL|Sierra Leone|Sierra Leone|west
TG|Togo|Togo|west
BI|Burundi|Burundi|central
CM|Cameroun|Cameroon|central
CF|République centrafricaine|Central African Republic|central|Centrafrique
TD|Tchad|Chad|central
CG|République du Congo|Republic of the Congo|central|Congo;Congo Republic;Congo-Brazzaville
CD|République démocratique du Congo|Democratic Republic of the Congo|central|DR Congo;DRC;RDC;Congo-Kinshasa
GQ|Guinée équatoriale|Equatorial Guinea|central
GA|Gabon|Gabon|central
ST|Sao Tomé-et-Principe|São Tomé and Príncipe|central|Sao Tome and Principe;São Tomé-et-Príncipe
KM|Comores|Comoros|east
DJ|Djibouti|Djibouti|east
ER|Érythrée|Eritrea|east
ET|Éthiopie|Ethiopia|east
KE|Kenya|Kenya|east
MG|Madagascar|Madagascar|east
MU|Maurice|Mauritius|east
RW|Rwanda|Rwanda|east
SC|Seychelles|Seychelles|east
SO|Somalie|Somalia|east
SS|Soudan du Sud|South Sudan|east
SD|Soudan|Sudan|east
TZ|Tanzanie|Tanzania|east|United Republic of Tanzania
UG|Ouganda|Uganda|east
AO|Angola|Angola|southern
BW|Botswana|Botswana|southern
SZ|Eswatini|Eswatini|southern|Swaziland
LS|Lesotho|Lesotho|southern
MW|Malawi|Malawi|southern
MZ|Mozambique|Mozambique|southern
NA|Namibie|Namibia|southern
ZA|Afrique du Sud|South Africa|southern
ZM|Zambie|Zambia|southern
ZW|Zimbabwe|Zimbabwe|southern"""

COUNTRIES = []
for _line in _DATA.splitlines():
    _code, _fr, _en, _region, *_extra = _line.split("|")
    COUNTRIES.append({"code": _code, "fr": _fr, "en": _en, "region": _region,
                      "aliases": _extra[0].split(";") if _extra else []})


def normalize_country_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"[^\w]+", " ", value).strip()


_LOOKUP = {normalize_country_text(name): country for country in COUNTRIES
           for name in [country["code"], country["fr"], country["en"], *country["aliases"]]}


def resolve_country(value: str | None) -> dict | None:
    return _LOOKUP.get(normalize_country_text(value)) if value else None


def country_key(value: str | None) -> str:
    country = resolve_country(value)
    return country["code"] if country else normalize_country_text(value or "")


def detect_country(text: str) -> str | None:
    """Detect full names/aliases, longest first, avoiding short code false matches."""
    normalized = normalize_country_text(text)
    names = [(normalize_country_text(name), country) for country in COUNTRIES
             for name in [country["fr"], country["en"], *country["aliases"]]]
    for name, country in sorted(names, key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"(?<!\w){re.escape(name)}(?!\w)", normalized):
            return country["fr"]
    return None
