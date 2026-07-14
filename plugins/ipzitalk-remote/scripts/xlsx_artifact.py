#!/usr/bin/env python3
"""Create and validate small XLSX backdata files with the Python standard library."""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
XML_NS = "http://www.w3.org/XML/1998/namespace"
INVALID_SHEET_CHARS = re.compile(r"[\\/*?:\[\]]")
MAX_SHEETS = 64
MAX_ROWS = 100_000
MAX_COLUMNS = 256

ET.register_namespace("", MAIN_NS)
ET.register_namespace("r", REL_NS)


def xml_bytes(element: ET.Element) -> bytes:
    return ET.tostring(element, encoding="utf-8", xml_declaration=True)


def column_name(index: int) -> str:
    value = index + 1
    result = ""
    while value:
        value, remainder = divmod(value - 1, 26)
        result = chr(65 + remainder) + result
    return result


def validate_workbook(payload: object) -> list[dict[str, object]]:
    if not isinstance(payload, dict) or not isinstance(payload.get("sheets"), list):
        raise ValueError("input must contain a sheets array")
    sheets = payload["sheets"]
    if not sheets or len(sheets) > MAX_SHEETS:
        raise ValueError(f"sheet count must be between 1 and {MAX_SHEETS}")

    names: set[str] = set()
    validated: list[dict[str, object]] = []
    for sheet in sheets:
        if not isinstance(sheet, dict):
            raise ValueError("each sheet must be an object")
        name = sheet.get("name")
        columns = sheet.get("columns")
        rows = sheet.get("rows")
        if not isinstance(name, str) or not name or len(name) > 31 or INVALID_SHEET_CHARS.search(name):
            raise ValueError(f"unsafe worksheet name: {name!r}")
        folded = name.casefold()
        if folded in names:
            raise ValueError(f"duplicate worksheet name: {name}")
        names.add(folded)
        if not isinstance(columns, list) or not all(isinstance(value, str) for value in columns):
            raise ValueError(f"{name}: columns must be an array of strings")
        if len(columns) > MAX_COLUMNS:
            raise ValueError(f"{name}: too many columns")
        if not isinstance(rows, list) or len(rows) > MAX_ROWS:
            raise ValueError(f"{name}: rows must be an array with at most {MAX_ROWS} entries")
        for row in rows:
            if not isinstance(row, list) or len(row) > MAX_COLUMNS:
                raise ValueError(f"{name}: each row must be an array with at most {MAX_COLUMNS} cells")
            for value in row:
                if value is not None and not isinstance(value, (str, int, float, bool)):
                    raise ValueError(f"{name}: cells must be JSON scalar values")
                if isinstance(value, float) and not math.isfinite(value):
                    raise ValueError(f"{name}: non-finite numbers are not supported")
        validated.append({"name": name, "columns": columns, "rows": rows})
    return validated


def cell_element(reference: str, value: object) -> ET.Element:
    cell = ET.Element(f"{{{MAIN_NS}}}c", {"r": reference})
    if value is None:
        return cell
    if isinstance(value, bool):
        cell.set("t", "b")
        ET.SubElement(cell, f"{{{MAIN_NS}}}v").text = "1" if value else "0"
    elif isinstance(value, (int, float)):
        ET.SubElement(cell, f"{{{MAIN_NS}}}v").text = str(value)
    else:
        cell.set("t", "inlineStr")
        inline = ET.SubElement(cell, f"{{{MAIN_NS}}}is")
        text = ET.SubElement(inline, f"{{{MAIN_NS}}}t")
        text.set(f"{{{XML_NS}}}space", "preserve")
        text.text = value
    return cell


def worksheet_bytes(columns: list[str], rows: list[list[object]]) -> bytes:
    root = ET.Element(f"{{{MAIN_NS}}}worksheet")
    sheet_data = ET.SubElement(root, f"{{{MAIN_NS}}}sheetData")
    all_rows = [columns, *rows]
    for row_index, values in enumerate(all_rows, start=1):
        row = ET.SubElement(sheet_data, f"{{{MAIN_NS}}}row", {"r": str(row_index)})
        for column_index, value in enumerate(values):
            row.append(cell_element(f"{column_name(column_index)}{row_index}", value))
    return xml_bytes(root)


def workbook_parts(sheets: list[dict[str, object]]) -> dict[str, bytes]:
    types = ET.Element("Types", {"xmlns": "http://schemas.openxmlformats.org/package/2006/content-types"})
    ET.SubElement(types, "Default", {"Extension": "rels", "ContentType": "application/vnd.openxmlformats-package.relationships+xml"})
    ET.SubElement(types, "Default", {"Extension": "xml", "ContentType": "application/xml"})
    ET.SubElement(types, "Override", {"PartName": "/xl/workbook.xml", "ContentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"})
    ET.SubElement(types, "Override", {"PartName": "/xl/styles.xml", "ContentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"})

    root_rels = ET.Element("Relationships", {"xmlns": PKG_REL_NS})
    ET.SubElement(root_rels, "Relationship", {"Id": "rId1", "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", "Target": "xl/workbook.xml"})

    workbook = ET.Element(f"{{{MAIN_NS}}}workbook")
    sheet_list = ET.SubElement(workbook, f"{{{MAIN_NS}}}sheets")
    workbook_rels = ET.Element("Relationships", {"xmlns": PKG_REL_NS})
    parts: dict[str, bytes] = {}
    for index, sheet in enumerate(sheets, start=1):
        ET.SubElement(types, "Override", {"PartName": f"/xl/worksheets/sheet{index}.xml", "ContentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"})
        ET.SubElement(sheet_list, f"{{{MAIN_NS}}}sheet", {"name": str(sheet["name"]), "sheetId": str(index), f"{{{REL_NS}}}id": f"rId{index}"})
        ET.SubElement(workbook_rels, "Relationship", {"Id": f"rId{index}", "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet", "Target": f"worksheets/sheet{index}.xml"})
        parts[f"xl/worksheets/sheet{index}.xml"] = worksheet_bytes(sheet["columns"], sheet["rows"])
    style_id = len(sheets) + 1
    ET.SubElement(workbook_rels, "Relationship", {"Id": f"rId{style_id}", "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles", "Target": "styles.xml"})

    styles = ET.fromstring(f'''<styleSheet xmlns="{MAIN_NS}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>''')
    parts.update({
        "[Content_Types].xml": xml_bytes(types),
        "_rels/.rels": xml_bytes(root_rels),
        "xl/workbook.xml": xml_bytes(workbook),
        "xl/_rels/workbook.xml.rels": xml_bytes(workbook_rels),
        "xl/styles.xml": xml_bytes(styles),
    })
    return parts


def create_xlsx(input_path: Path, output_path: Path) -> int:
    with input_path.open(encoding="utf-8") as source:
        sheets = validate_workbook(json.load(source))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_name(f".{output_path.name}.tmp-{os.getpid()}")
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, content in workbook_parts(sheets).items():
                archive.writestr(name, content)
        os.replace(temporary, output_path)
    finally:
        temporary.unlink(missing_ok=True)
    return len(sheets)


def check_xlsx(path: Path, required_sheets: list[str]) -> int:
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError("XLSX ZIP integrity check failed")
        names = set(archive.namelist())
        required_parts = {"[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml"}
        missing_parts = required_parts - names
        if missing_parts:
            raise ValueError(f"missing XLSX parts: {', '.join(sorted(missing_parts))}")
        root = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet_names = [node.attrib["name"] for node in root.findall(f".//{{{MAIN_NS}}}sheet")]
        missing_sheets = [name for name in required_sheets if name not in sheet_names]
        if missing_sheets:
            raise ValueError(f"missing required sheets: {', '.join(missing_sheets)}")
        for index in range(1, len(sheet_names) + 1):
            if f"xl/worksheets/sheet{index}.xml" not in names:
                raise ValueError(f"missing worksheet part: sheet{index}.xml")
    return len(sheet_names)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--input", type=Path, help="JSON workbook input")
    mode.add_argument("--check", type=Path, help="existing XLSX to validate")
    parser.add_argument("--output", type=Path, help="XLSX output path")
    parser.add_argument("--require-sheet", action="append", default=[])
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.input:
            if args.output is None:
                raise ValueError("--output is required with --input")
            count = create_xlsx(args.input, args.output)
            print(f"created {args.output} ({count} sheets)")
        else:
            count = check_xlsx(args.check, args.require_sheet)
            print(f"valid XLSX: {args.check} ({count} sheets)")
        return 0
    except (OSError, ValueError, json.JSONDecodeError, zipfile.BadZipFile, ET.ParseError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
