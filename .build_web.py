from shutil import copyfile
from subprocess import check_output, CalledProcessError
import sys
import os
import platform
import subprocess

Import("env")

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

build_web()
