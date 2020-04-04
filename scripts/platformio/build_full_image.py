#!/usr/bin/python3

from pathlib import Path

Import("env")

SOURCE_START_LOCATION = 0x10000


def create_full_bin(source, target, env):
    firmware_file = target[0].get_abspath()
    full_image_filename = env.subst("$BUILD_DIR/${PROGNAME}-full.bin")
    parts = []

    # Will contain 3 parts outside of the main firmware image:
    #   * Bootloader
    #   * Compiled partition table
    #   * App loader
    for part in env.get("FLASH_EXTRA_IMAGES", []):
        start, filename = part

        # Parse hext string
        if isinstance(start, str):
            start = int(start, 16)

        filename = env.subst(filename)

        parts.append((start, filename))

    # End with the main firmware image
    parts.append((SOURCE_START_LOCATION, firmware_file))

    # Start at location of earliest image (don't start at 0x0)
    ix = parts[0][0]

    with open(full_image_filename, "wb") as f:
        while len(parts) > 0:
            part_ix, part_filename = parts.pop(0)
            part_filesize = Path(part_filename).stat().st_size
            padding = part_ix - ix

            for _ in range(padding):
                f.write(b"\x00")

            with open(part_filename, "rb") as part_file:
                f.write(part_file.read())

            ix = part_ix + part_filesize


env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", create_full_bin)
