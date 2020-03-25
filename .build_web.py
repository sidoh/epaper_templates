#!/usr/bin/python3
from shutil import copyfile
from subprocess import check_output, CalledProcessError
import sys
import os
import platform
import subprocess
from pathlib import Path

def is_tool(name):
    cmd = "where" if platform.system() == "Windows" else "which"
    try:
        check_output([cmd, name])
        return True
    except:
        return False

def build_web():
    if is_tool("npm"):
        os.chdir("web")
        print("Attempting to build webpage...")
        try:
            if platform.system() == "Windows":
                print(check_output(["npm.cmd", "install", "--only=dev"]))
                print(check_output(["npm.cmd", "run", "build"]))
            else:
                print(check_output(["npm", "install"]))
                print(check_output(["npm", "run", "build"]))

            if not os.path.exists("../dist"):
                os.mkdir("../dist")

            copyfile("build/web_assets.h", "../dist/web_assets.h")
                
        except BaseException as e:
            raise BaseException("Error building web assets: " + e)
        finally:
            os.chdir("..")
    else:
        print("""
        [ERROR] Could not build web assets.

        npm is not installed.  Please follow these instructions to install it:

        https://nodejs.org/en/download/package-manager/
        """.strip())

        raise BaseException("Could not build web assets.  Please install nodejs.")

def is_ignored(filename):
    ignored_paths = ["build/", ".cache/", "dist/"]
    if os.path.basename(filename).startswith(".") or os.path.isdir(filename):
        return True
    for check_path in ignored_paths:
        if check_path in filename:
            return True
    return False

def should_build():
    asset_path = "dist/web_assets.h"
    directory = "web/"
    if not os.path.exists(asset_path):
        return True
    else:
        timestamp = os.stat(asset_path).st_mtime

        for file in Path(directory).glob('**/*'):
            filename = str(file)
            if is_ignored(filename):
                continue
            if os.stat(filename).st_mtime > timestamp:
                print(filename+" was modified.")
                return True
        return False

if should_build():
    build_web()
else:
    print("No need to rebuild web assets.")
