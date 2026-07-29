"""Binding allowlist / denylist for personal garage corpus."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

DocFamily = Literal[
    "service_manual", "owners_manual", "wiring", "connectors"
]


@dataclass(frozen=True)
class ManualSpec:
    """One included PDF source."""

    filename: str
    doc_family: DocFamily
    drive_remote: str  # rclone remote path (file)


@dataclass(frozen=True)
class VehicleSpec:
    vehicle_id: str
    bronze_dirname: str
    gold_dirname: str
    year: int
    make: str
    model: str
    engine: str
    trim: str | None
    manuals: tuple[ManualSpec, ...]
    exclude_filenames: tuple[str, ...] = ()


DENY_NAME_SUBSTR = (
    "registration",
    "carfax",
    "txdmv",
    "permit",
    ".crdownload",
    "friend_readme",
    "completeness_ledger",
    "drive_gold_manifest",
    "victron",
)

YXZ_EXCLUDE = (
    "YXZ1000R 2016_service manual.pdf",
    "YXZ1000R 2018_service manual.pdf",
    "YXZ1000R NON Paddle Shift 2017_service manual.pdf",
    "YXZ1000R Paddle Shift 2017_service manual.pdf",
    "YXZ1000R 2024_service manual.pdf",
    "yamaha yxz1000r ss_owners manual 2024.pdf",
)

VEHICLES: dict[str, VehicleSpec] = {
    "cat:2015-triumph-street-triple": VehicleSpec(
        vehicle_id="cat:2015-triumph-street-triple",
        bronze_dirname="2015-triumph-street-triple",
        gold_dirname="cat_2015-triumph-street-triple",
        year=2015,
        make="Triumph",
        model="Street Triple",
        engine="675",
        trim=None,
        manuals=(
            ManualSpec(
                "Triumph Street Triple 675 - Service Manual_2013.pdf",
                "service_manual",
                "gdrive:Vehicle Docs/2015 Triumph Street Triple/"
                "Triumph Street Triple 675 - Service Manual_2013.pdf",
            ),
            ManualSpec(
                "Triumph Street Triple 675 - Owners Handbook_2014.pdf",
                "owners_manual",
                "gdrive:Vehicle Docs/2015 Triumph Street Triple/"
                "Triumph Street Triple 675 - Owners Handbook_2014.pdf",
            ),
            ManualSpec(
                "Triumph Street Triple 675 - Owners Handbook_2019.pdf",
                "owners_manual",
                "gdrive:Vehicle Docs/2015 Triumph Street Triple/"
                "Triumph Street Triple 675 - Owners Handbook_2019.pdf",
            ),
        ),
        exclude_filenames=(
            "2023 Vehicle Registration Renewal_2015 Triumph Street Triple_Motorcycle.pdf",
        ),
    ),
    "cat:2003-honda-s2000": VehicleSpec(
        vehicle_id="cat:2003-honda-s2000",
        bronze_dirname="2003-honda-s2000",
        gold_dirname="cat_2003-honda-s2000",
        year=2003,
        make="Honda",
        model="S2000",
        engine="unknown",
        trim=None,
        manuals=(
            ManualSpec(
                "Honda S2000 - Service Manual_2000 - 2008.pdf",
                "service_manual",
                "gdrive:Vehicle Docs/2003 Honda S2000/"
                "Honda S2000 - Service Manual_2000 - 2008.pdf",
            ),
            ManualSpec(
                "Honda S2000 - Owners Manual_2001.pdf",
                "owners_manual",
                "gdrive:Vehicle Docs/2003 Honda S2000/"
                "Honda S2000 - Owners Manual_2001.pdf",
            ),
            ManualSpec(
                "Honda S2000 - Wiring Diagram 2008.pdf",
                "wiring",
                "gdrive:Vehicle Docs/2003 Honda S2000/"
                "Honda S2000 - Wiring Diagram 2008.pdf",
            ),
        ),
        exclude_filenames=(
            "2000-08 Honda S2000 Service Manual.pdf",  # byte-identical twin
            "Honda S2000 - Service Manual_2000 - 2003.pdf.crdownload",
        ),
    ),
    "cat:2021-yamaha-yxz1000r-ss-se": VehicleSpec(
        vehicle_id="cat:2021-yamaha-yxz1000r-ss-se",
        bronze_dirname="2021-yamaha-yxz1000r-ss-se",
        gold_dirname="cat_2021-yamaha-yxz1000r-ss-se",
        year=2021,
        make="Yamaha",
        model="YXZ1000R SS SE",
        engine="unknown",
        trim="SS SE",
        manuals=(
            ManualSpec(
                "YXZ1000R 2019_service manual.pdf",
                "service_manual",
                "gdrive:Vehicle Docs/2021 Yamama YXZ1000R SS SE/"
                "YXZ1000R 2019_service manual.pdf",
            ),
            ManualSpec(
                "YXZ1000R 2020-2023_service manual.pdf",
                "service_manual",
                "gdrive:Vehicle Docs/2021 Yamama YXZ1000R SS SE/"
                "YXZ1000R 2020-2023_service manual.pdf",
            ),
            ManualSpec(
                "yamaha yxz1000et 2019_owners manual.pdf",
                "owners_manual",
                "gdrive:Vehicle Docs/2021 Yamama YXZ1000R SS SE/"
                "yamaha yxz1000et 2019_owners manual.pdf",
            ),
        ),
        exclude_filenames=YXZ_EXCLUDE,
    ),
    "cat:2016-ford-transit-350": VehicleSpec(
        vehicle_id="cat:2016-ford-transit-350",
        bronze_dirname="2016-ford-transit-350",
        gold_dirname="cat_2016-ford-transit-350",
        year=2016,
        make="Ford",
        model="Transit",
        engine="unknown",
        trim="350",
        manuals=(
            ManualSpec(
                "service_manual.pdf",
                "service_manual",
                "gdrive:Vehicle Service Manuals/Ford PTS - PDF manuals/"
                "2016-transit/service_manual.pdf",
            ),
            ManualSpec(
                "wiring.pdf",
                "wiring",
                "gdrive:Vehicle Service Manuals/Ford PTS - PDF manuals/"
                "2016-transit/wiring.pdf",
            ),
            ManualSpec(
                "connectors.pdf",
                "connectors",
                "gdrive:Vehicle Service Manuals/Ford PTS - PDF manuals/"
                "2016-transit/connectors.pdf",
            ),
            ManualSpec(
                "Ford Transit van - Owners Manual_2016.pdf",
                "owners_manual",
                "gdrive:Vehicle Docs/2016 Ford Transit 350/"
                "Ford Transit van - Owners Manual_2016.pdf",
            ),
        ),
        exclude_filenames=(),
    ),
}

EMIT_ORDER = (
    "cat:2015-triumph-street-triple",
    "cat:2003-honda-s2000",
    "cat:2021-yamaha-yxz1000r-ss-se",
    "cat:2016-ford-transit-350",
)


def is_denied_name(name: str) -> bool:
    lower = name.lower()
    return any(token in lower for token in DENY_NAME_SUBSTR)


def require_vehicle(vehicle_id: str) -> VehicleSpec:
    if vehicle_id not in VEHICLES:
        raise KeyError(f"unknown vehicle_id: {vehicle_id}")
    return VEHICLES[vehicle_id]
