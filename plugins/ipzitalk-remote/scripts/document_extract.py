#!/usr/bin/env python3
"""공식 모집공고문 PDF/HWP/HWPX를 제한된 자원으로 텍스트화한다."""

from __future__ import annotations

import argparse
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path, PurePosixPath

try:
    import resource
except ImportError:  # pragma: no cover - Windows fallback
    resource = None

MAX_INPUT_BYTES = 50 * 1024 * 1024
MAX_OUTPUT_BYTES = 20 * 1024 * 1024
MAX_PDF_PAGES = 500
MAX_ZIP_ENTRIES = 256
MAX_ZIP_ENTRY_BYTES = 20 * 1024 * 1024
MAX_ZIP_UNCOMPRESSED_BYTES = 100 * 1024 * 1024
MAX_COMPRESSION_RATIO = 100
EXTRACT_TIMEOUT_SECONDS = 60


class DocumentSecurityError(RuntimeError):
    pass


def _validate_input(path: Path) -> str:
    try:
        info = path.lstat()
    except OSError as error:
        raise DocumentSecurityError(f"input unavailable: {error}") from error
    if stat.S_ISLNK(info.st_mode):
        raise DocumentSecurityError("symbolic link input is not allowed")
    if not stat.S_ISREG(info.st_mode):
        raise DocumentSecurityError("input must be a regular file")
    if info.st_size > MAX_INPUT_BYTES:
        raise DocumentSecurityError("input size limit exceeded")
    suffix = path.suffix.lower()
    if suffix not in {".pdf", ".hwp", ".hwpx"}:
        raise DocumentSecurityError("only PDF, HWP, and HWPX inputs are supported")
    return suffix


def _validate_output(input_path: Path, output_path: Path) -> None:
    if input_path.absolute() == output_path.absolute():
        raise DocumentSecurityError("output must differ from input")
    if output_path.is_symlink():
        raise DocumentSecurityError("symbolic link output is not allowed")
    if output_path.exists() and os.path.samefile(input_path, output_path):
        raise DocumentSecurityError("output must differ from input")
    if not output_path.parent.is_dir():
        raise DocumentSecurityError("output directory does not exist")


def _run(command: list[str], *, stdout=None) -> subprocess.CompletedProcess:
    def apply_limits():
        if resource is not None:
            resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_OUTPUT_BYTES, MAX_OUTPUT_BYTES))
            resource.setrlimit(resource.RLIMIT_CPU, (EXTRACT_TIMEOUT_SECONDS, EXTRACT_TIMEOUT_SECONDS))

    try:
        return subprocess.run(
            command,
            check=True,
            stdin=subprocess.DEVNULL,
            stdout=stdout if stdout is not None else subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=EXTRACT_TIMEOUT_SECONDS,
            preexec_fn=apply_limits if os.name == "posix" else None,
        )
    except subprocess.TimeoutExpired as error:
        raise DocumentSecurityError("extraction timeout exceeded") from error
    except subprocess.CalledProcessError as error:
        detail = (error.stderr or b"")[:2048].decode("utf-8", errors="replace").strip()
        raise DocumentSecurityError(f"extractor failed: {detail or error.returncode}") from error


def _pdf_pages(path: Path) -> int:
    executable = shutil.which("pdfinfo")
    if not executable:
        raise DocumentSecurityError("pdfinfo is required for bounded PDF extraction")
    result = _run([executable, str(path)])
    match = re.search(rb"^Pages:\s+(\d+)\s*$", result.stdout, re.MULTILINE)
    if not match:
        raise DocumentSecurityError("unable to determine PDF page count")
    pages = int(match.group(1))
    if pages < 1 or pages > MAX_PDF_PAGES:
        raise DocumentSecurityError("PDF page limit exceeded")
    return pages


def _extract_with_tool(command: list[str], temporary: Path) -> None:
    with temporary.open("wb") as stream:
        _run(command, stdout=stream)
    if temporary.stat().st_size > MAX_OUTPUT_BYTES:
        raise DocumentSecurityError("text output size limit exceeded")


def _extract_pdf(path: Path, temporary: Path) -> None:
    pages = _pdf_pages(path)
    executable = shutil.which("pdftotext")
    if not executable:
        raise DocumentSecurityError("pdftotext is required for PDF extraction")
    _run([executable, "-layout", "-enc", "UTF-8", "-f", "1", "-l", str(pages), str(path), str(temporary)])
    if not temporary.exists() or temporary.stat().st_size > MAX_OUTPUT_BYTES:
        raise DocumentSecurityError("text output size limit exceeded")


def _extract_hwp(path: Path, temporary: Path) -> None:
    executable = shutil.which("hwp5txt")
    if not executable:
        raise DocumentSecurityError("hwp5txt is required for legacy HWP extraction")
    _extract_with_tool([executable, str(path)], temporary)


def _safe_zip_name(name: str) -> bool:
    candidate = PurePosixPath(name)
    return not candidate.is_absolute() and ".." not in candidate.parts and "\\" not in name


def _validate_zip(infos: list[zipfile.ZipInfo]) -> None:
    if len(infos) > MAX_ZIP_ENTRIES:
        raise DocumentSecurityError("ZIP entry limit exceeded")
    total = 0
    names: set[str] = set()
    for info in infos:
        if not _safe_zip_name(info.filename):
            raise DocumentSecurityError("unsafe ZIP entry path")
        if info.filename in names:
            raise DocumentSecurityError("duplicate ZIP entry")
        names.add(info.filename)
        if info.flag_bits & 0x1:
            raise DocumentSecurityError("encrypted ZIP entries are not supported")
        if info.file_size > MAX_ZIP_ENTRY_BYTES:
            raise DocumentSecurityError("ZIP entry size limit exceeded")
        total += info.file_size
        if total > MAX_ZIP_UNCOMPRESSED_BYTES:
            raise DocumentSecurityError("ZIP uncompressed size limit exceeded")
        if info.file_size >= 1024 and info.file_size / max(info.compress_size, 1) > MAX_COMPRESSION_RATIO:
            raise DocumentSecurityError("ZIP compression ratio limit exceeded")


def _extract_hwpx(path: Path, temporary: Path) -> None:
    try:
        with zipfile.ZipFile(path) as archive:
            infos = archive.infolist()
            _validate_zip(infos)
            section_infos = sorted(
                (info for info in infos if re.fullmatch(r"Contents/section\d+\.xml", info.filename)),
                key=lambda info: int(re.search(r"\d+", info.filename).group()),
            )
            if not section_infos:
                raise DocumentSecurityError("HWPX section XML is missing")
            parts: list[str] = []
            output_bytes = 0
            for info in section_infos:
                root = ET.fromstring(archive.read(info))
                for element in root.iter():
                    if element.text and element.text.strip():
                        text = element.text.strip()
                        output_bytes += len(text.encode("utf-8")) + 1
                        if output_bytes > MAX_OUTPUT_BYTES:
                            raise DocumentSecurityError("text output size limit exceeded")
                        parts.append(text)
    except (zipfile.BadZipFile, ET.ParseError) as error:
        raise DocumentSecurityError(f"invalid HWPX document: {error}") from error
    temporary.write_text("\n".join(parts) + "\n", encoding="utf-8")


def _has_non_whitespace_output(path: Path) -> bool:
    with path.open("rb") as stream:
        while chunk := stream.read(64 * 1024):
            if chunk.strip():
                return True
    return False


def extract_document(input_path: Path, output_path: Path) -> None:
    suffix = _validate_input(input_path)
    _validate_output(input_path, output_path)
    descriptor, temporary_name = tempfile.mkstemp(prefix=".ipzitalk-extract-", dir=output_path.parent)
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        if suffix == ".pdf":
            _extract_pdf(input_path, temporary)
        elif suffix == ".hwp":
            _extract_hwp(input_path, temporary)
        else:
            _extract_hwpx(input_path, temporary)
        if temporary.stat().st_size > MAX_OUTPUT_BYTES:
            raise DocumentSecurityError("text output size limit exceeded")
        if not _has_non_whitespace_output(temporary):
            raise DocumentSecurityError("text output is empty")
        os.replace(temporary, output_path)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        extract_document(args.input, args.output)
    except DocumentSecurityError as error:
        print(f"document_extract.py: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
